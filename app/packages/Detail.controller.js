sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter", "sap/m/TextArea", "sap/m/Text", "sap/m/ObjectStatus",
    "sap/ui/core/BusyIndicator", "sap/m/MessageToast", "sap/m/MessageBox",
    "/sap/ui/layout/form/FormContainer", "/sap/ui/layout/form/FormElement"
], function (PageController, JSONModel, Fragment, Filter, TextArea, Text, ObjectStatus, BusyIndicator, MessageToast, MessageBox, FormContainer, FormElement) {
    "use strict";

    var promisedFetch = (url) => new Promise((resolve, reject) => {
        return fetch(url).then(res => res.ok ? res.json() : Promise.reject(res.status)).then(resolve).catch(reject)
    })

    var containerRefs // dirty magic for now

    return PageController.extend("packages.Detail", {

        onInit: function () {
            PageController.prototype.onInit.apply(this)
            this.getAppComponent().getRouter().getRoute("IntegrationPackagesDetailsRoute").attachMatched(this.onRouteMatched, this) // like in good old days )
            this.getView().setModel(new JSONModel(), "pkg")
            this.getView().setModel(new JSONModel({
                filter: { // calculated properties enriched by enrichData
                    IsDeployedLocal: false,
                    IsDeployed: false,
                    HasDraft: false,
                    Type: ''
                },
                typeFilters: { // also acts as mapping
                    Integration: { key: 'INTEGRATION_FLOW', val: 'Integration' },
                    ScriptCollection: { key: 'SCRIPT_COLLECTION', val: 'ScriptCollection' },
                    ValueMapping: { key: 'VALUE_MAPPING', val: 'ValueMapping' },
                    MessageMapping: { key: 'MESSAGE_MAPPING', val: 'MessageMapping' },
                },
                search: ['Id', 'Name']
            }), "ui")

            this.actionsPromise = Fragment.load({ name: "packages.Actions", controller: this }).then(function (act) {
                this.getView().addDependent(act)
                return act
            }.bind(this))

            this.runtimeDetailsPromise = Fragment.load({ name: "packages.RuntimeDetails", controller: this }).then(function (dlg) {
                this.getView().addDependent(dlg)
                dlg.setModel(new JSONModel(), "cpi")
                dlg.getEndButton().attachPress(function () {
                    dlg.close()
                })
                return dlg
            }.bind(this))

            this.transportPackagePromise = Fragment.load({ name: "packages.TransportPackage", controller: this }).then(function (dlg) {
                this.getView().addDependent(dlg)
                dlg.setModel(new JSONModel(), "cas")
                dlg.getEndButton().attachPress(function () {
                    dlg.close()
                })
                return dlg
            }.bind(this))
        },

        onRouteMatched: function (e) {
            var pars = e.getParameter("arguments")
            var serviceUrl = this.getView().getModel().getServiceUrl()
            var packageUrl = `/IntegrationPackages(${pars.key})`
            BusyIndicator.show(50)
            this.fetchModelDataFor(serviceUrl, packageUrl).then(function (res) {
                this.getView().getModel("pkg").setData(res)
                BusyIndicator.hide()
            }.bind(this)).catch(function (err) {
                BusyIndicator.hide()
                console.log(err)
            })
        },

        fetchModelDataFor: function (serviceUrl, pkgUrl) {
            var TYPE_MAPPING = this.getView().getModel("ui").getProperty("/typeFilters")
            return Promise.all([
                promisedFetch(serviceUrl + pkgUrl),
                promisedFetch(serviceUrl + pkgUrl + '/IntegrationDesigntimeArtifacts'),
                promisedFetch(serviceUrl + pkgUrl + '/ScriptCollectionDesigntimeArtifacts'),
                promisedFetch(serviceUrl + pkgUrl + '/ValueMappingDesigntimeArtifacts'),
                promisedFetch(serviceUrl + pkgUrl + '/MessageMappingDesigntimeArtifacts'),
                promisedFetch(serviceUrl + 'IntegrationRuntimeArtifacts'),
                promisedFetch(serviceUrl + 'DeployedArtifacts')
            ]).then(function (res) {

                var data = res.shift() // header
                data["DesigntimeArtifacts"] = []


                var localArts = res.pop().value.reduce((prev, cur) => Object.assign(prev, { [cur.Id]: true }), {})

                var rtArts = res.pop().value // all stuff, cuz osgi bundles have idea of packages
                data["RuntimeArtifacts"] = rtArts // for stuff in second table (see "Claimed" flag below and in xml)

                var deployed = rtArts.reduce((prev, cur) => Object.assign(prev, { [cur.Id]: cur }), {})

                res.forEach(artifactType => {

                    artifactType.value.forEach(a => {

                        Object.assign(a, { Runtime: deployed[a.Id] || {} })
                        if (a.Runtime["Id"]) deployed[a.Id]["Claimed"] = true // to filter out others

                        a["IsDeployedLocal"] = !!localArts[a.Id]
                        a["IsDeployed"] = !!a.Runtime["Version"]
                        a["HasDraft"] = a.Runtime["Id"] && a["Version"] != a.Runtime["Version"]
                        var dtType = artifactType["@odata.context"].match(/.*#(\w+)Design/)[1] // because I can )
                        a["Type"] = TYPE_MAPPING[dtType].key // to map to runtime name

                    })
                    data["DesigntimeArtifacts"].push(...artifactType.value)
                })
                rtArts.forEach(r => r.Claimed = !!r.Claimed) // filter fn is not called for undefined (
                data["DesigntimeArtifactsCount"] = data["DesigntimeArtifacts"].length
                return data
            })
        },

        filterClaimed: function (claimed) {
            return !claimed // not used for now
        },

        gotoPackage: function (e) {
            var url = e.getSource().getBindingContext("pkg").getProperty("PackageURL")
            sap.m.URLHelper.redirect(url, true)
        },

        gotoLogs: function (e) {
            sap.ushell.Container.getService('CrossApplicationNavigation').toExternal({
                target: { semanticObject: 'mpl', action: 'browse' },
                params: { PackageId: e.getSource().getBindingContext().getProperty('Id') }
            })
        },

        gotoMonitoring: function (e) {
            var pkgUrl = e.getSource().getBindingContext("pkg").getProperty("PackageURL")
            var url = pkgUrl.split('shell')[0] + 'shell/monitoring/Artifacts'
            sap.m.URLHelper.redirect(url, true)
        },

        navtoDTArtifacts: function (e) {
            var ctx = e.getSource().getBindingContext("pkg").getObject()
            // var fakePath = `/IntegrationPackages('${ctx.PackageId}')/FakeDesigntimeArtifacts(Id='${ctx.Id}',Type='${ctx.Type}')`
            // var fakeCtx = this.getView().getModel().bindContext(fakePath)
            // this.routing.navigate(fakeCtx)
            this.routing.navigateToRoute("FakeDesigntimeArtifactsRoute", {
                key: `'${ctx.PackageId}'`,
                key2: `Id='${ctx.Id}',Type='${ctx.Type}'`
            })
        },

        openActions: function (e) {
            var ctx = e.getSource().getBindingContext("pkg")
            this.actionsPromise.then(act => {
                act.setBindingContext(ctx, "pkg")
                act.openBy(e.getSource())
            })
        },

        getParams: function (e) {
            var pkgOdataCtx = this.getView().getBindingContext()
            var ctx = e.getSource().getBindingContext("pkg")
            var dt = ctx.getObject()
            var url = `${pkgOdataCtx.getModel().getServiceUrl()}IntegrationDesigntimeArtifacts(Id='${dt.Id}',Version='${dt.Version}')/Configurations`
            sap.m.URLHelper.redirect(url, true)
        },

        gotoOperations: function (e) {
            var pkgOdataCtx = this.getView().getBindingContext()
            var ctx = e.getSource().getBindingContext("pkg")
            var rt = ctx.getProperty("Runtime") || ctx.getObject()
            if (!rt.Id) return MessageToast.show('NOT_DEPLOYED')

            var url = `${pkgOdataCtx.getModel().getServiceUrl()}IntegrationRuntimeArtifacts('${rt.Id}')`
            BusyIndicator.show(50)
            promisedFetch(url).then(function (res) {
                BusyIndicator.hide()
                sap.m.URLHelper.redirect(res.DeployURL, true)
            }).catch(function (err) {
                BusyIndicator.hide()
                MessageToast.show('ERROR')
            })
        },

        syncGit: function (e) {
            var pkgOdataCtx = this.getView().getBindingContext()
            var ctx = e.getSource().getBindingContext("pkg")
            var rt = ctx.getProperty("Runtime") || ctx.getObject()
            if (!rt.Id) return MessageToast.show('NOT_DEPLOYED')

            var rtOdataCtx = pkgOdataCtx.getModel().bindContext(`/IntegrationRuntimeArtifacts('${rt.Id}')`)
            this.editFlow.invokeAction('CpiLocalService.syncGitToPackage', {
                contexts: rtOdataCtx,
                parameterValues: [
                    { name: "pckgId", value: pkgOdataCtx.getProperty("Id") },
                    // { name: "xmlString", value: res },
                    { name: "version", value: rt.Version }
                ],
                skipParameterDialog: false
            }).then(function (res) {
                // BusyIndicator.hide()
                MessageBox.show(res.getObject().value)
            }).catch(function (err) {
                // BusyIndicator.hide()
                console.log(err)
                // MessageToast.show('ERROR')
            })
        },

        deployCPI: function (e) {
            var ctx = e.getSource().getBindingContext("pkg")
            this.editFlow.invokeAction('/deployArtifactToCpi', {
                model: this.getView().getModel(),
                parameterValues: [
                    { name: "bundleId", value: ctx.getProperty("Id") },
                    { name: "version", value: ctx.getProperty("Version") },
                    { name: "objType", value: ctx.getProperty("Type") }
                ],
                skipParameterDialog: true
            }).then(function (res) {
                MessageToast.show(res.value)
            }).catch(function (err) {
                console.log(err)
                MessageToast.show('ERROR')
            })
        },

        deployKaraf: function (e) {
            var pkgOdataCtx = this.getView().getBindingContext()
            var ctx = e.getSource().getBindingContext("pkg")
            var rt = ctx.getProperty("Runtime") || ctx.getObject()
            if (!rt.Id) return MessageToast.show('NOT_DEPLOYED')

            var rtOdataCtx = pkgOdataCtx.getModel().bindContext(`/IntegrationRuntimeArtifacts('${rt.Id}')`)
            this.editFlow.invokeAction('CpiLocalService.deployKarafFromPackage', {
                contexts: rtOdataCtx,
                parameterValues: [
                    { name: "pckgId", value: pkgOdataCtx.getProperty("Id") }
                ],
                skipParameterDialog: true
            }).then(function (res) {
                MessageToast.show(res.getObject().value)
            }).catch(function (err) {
                console.log(err)
                MessageToast.show('ERROR')
            })
        },

        filterDTArtifacts: function (e) {
            var filterData = this.getView().getModel("ui").getProperty("/filter")
            var filters = Object.entries(filterData).filter(([_, v]) => !!v).map(([k, v]) => {
                return new Filter({ path: k, operator: "EQ", value1: v })
            })
            e.getSource().getParent().getParent().getBinding("items").filter(new Filter(filters, true), 'Application')
        },

        filterArtifacts: function (e) {
            var selectedDtType = e.getParameter("value")
            var filters = []
            if (selectedDtType) {
                var rtType = this.getView().getModel("ui").getProperty("/typeFilters/" + selectedDtType)
                filters.push(new Filter({ path: 'Type', operator: "EQ", value1: rtType.key }))
            }
            this.getView().byId("rtTable").getBinding("items").filter(filters, 'Control')
            this.filterDTArtifacts(e)
        },

        searchArtifacts: function (e) {
            var fields = this.getView().getModel("ui").getProperty("/search")
            var filters = []
            var search = e.getParameter("newValue")
            if (search) {
                filters.push(new Filter(fields.map(function (f) {
                    return new Filter({ path: f, operator: "Contains", value1: search, caseSensitive: false })
                }), false)) // OR-ed
            }
            e.getSource().getParent().getParent().getBinding("items").filter(filters, 'Control')
        },

        formatVersion: function (rtVer, dtVer) {
            if (!rtVer) return dtVer
            return rtVer == dtVer ? rtVer : rtVer + '*'
        },

        formatVersionStatus: function (rtVer, dtVer) {
            if (!rtVer || !dtVer) return 'None'
            return rtVer == dtVer ? 'Success' : 'Warning'
        },

        showRuntimeDetails: function (e) {
            var ctx = e.getSource().getBindingContext("pkg")
            var rt = ctx.getProperty("Runtime") || ctx.getObject()

            if (!rt.ArtifactId) {
                MessageToast.show('NOT_DEPLOYED')
                return
            }

            var resolvedDlg
            this.runtimeDetailsPromise.then(function (dlg) {
                resolvedDlg = dlg
                BusyIndicator.show(50)
                return this.editFlow.invokeAction('/getRuntimeDetails', {
                    model: this.getView().getModel(),
                    parameterValues: [{ name: "artifactId", value: rt.ArtifactId }],
                    skipParameterDialog: true
                })
            }.bind(this)).then(function (res) {
                BusyIndicator.hide()
                resolvedDlg.getModel("cpi").setData(res.value)
                resolvedDlg.open()
            }).catch(function (err) {
                BusyIndicator.hide()
                console.log(err)
                MessageToast.show('ERROR')
            })
        },

        getUserInput: function () {
            return new Promise(function (resolve, reject) {
                var textArea = new TextArea({
                    width: '100%',
                    rows: 5,
                    growing: true,
                    placeholder: 'Headers-Part: Like this\nContent-Type: application/json\n\nHere goes body\n...'
                })
                MessageBox.show(textArea, {
                    icon: MessageBox.Icon.INFORMATION,
                    title: "POST",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: function (act) {
                        return act == MessageBox.Action.OK ? resolve(textArea.getValue()) : reject()
                    }
                })
            })
        },

        testEndpoint: function (e) {
            var endpoint = e.getSource().getBindingContext("cpi").getProperty("endpointUrl")
            this.getUserInput().then(function (payloadAndHeaders) {
                BusyIndicator.show(100)
                return this.editFlow.invokeAction('/testIflowEndpoint', {
                    model: this.getView().getModel(),
                    parameterValues: [
                        { name: "endpoint", value: endpoint },
                        { name: "text", value: payloadAndHeaders },
                    ],
                    skipParameterDialog: true
                })
            }.bind(this)).then(function (res) {
                BusyIndicator.hide()
                MessageBox.show(typeof res.value == 'object' ? JSON.stringify(res.value) : res.value) // json or not
            }).catch(function (err) {
                BusyIndicator.hide()
                if (err) {
                    console.log(err)
                    MessageToast.show('ERROR')
                }
            })
        },

        transportPackage: function (e) {
            var ctx = e.getSource().getBindingContext("pkg")
            var dt = ctx.getObject()
            var serviceUrl = this.getView().getModel().getServiceUrl()

            var resolvedDlg
            this.transportPackagePromise.then(function (dlg) {
                resolvedDlg = dlg
                BusyIndicator.show(50)
                return promisedFetch(`${serviceUrl}/getCasPropFiles(pkgId='${dt.Id}')`)
            }).then(function (res) {
                BusyIndicator.hide()
                containerRefs = []
                resolvedDlg.getModel("cas").setData({
                    version: dt.Version,
                    id: dt.Id,
                    resourceID: dt.ResourceId,
                    props: res.value,
                    components: dt.DesigntimeArtifacts.map(function (a) {
                        return { id: a.Id, version: a.Version, type: a.Type }
                    })
                })
                resolvedDlg.open()
            }).catch(function (err) {
                BusyIndicator.hide()
                MessageToast.show('NO_CAS')
            })
        },

        transportArtifactParamsFactory: function (sId, ctx) {
            var isIflow = ctx.getProperty("type") == 'INTEGRATION_FLOW'
            var container = new FormContainer({
                expanded: true,
                expandable: isIflow,
                title: "[{cas>version}] {cas>id} - {cas>type}"
            })
            if (isIflow) {
                containerRefs.push(container)
                container.bindAggregation("formElements", {
                    path: `/IntegrationDesigntimeArtifacts(Id='${ctx.getProperty("id")}',Version='${ctx.getProperty("version")}')/Configurations`,
                    template: new FormElement({
                        label: "{ParameterKey}",
                        fields: [
                            new Text({ text: "{ParameterValue}" }),
                            (new ObjectStatus({
                                text: "{ParameterValueMtar}",
                                state: "{= ${ParameterValue} === ${ParameterValueMtar} ? 'Success' : 'Error' }"
                            })).addStyleClass("sapMObjectStatusLongText")
                        ]
                    })
                })
            }
            return container
        },

        applyMtarParams: function (e) {
            BusyIndicator.show(50)
            this.editFlow.invokeAction('/applyMtarParams', {
                model: e.getSource().getModel()
            }).then(function (res) {
                BusyIndicator.hide()
                MessageToast.show('OK')
            }).catch(function (err) {
                BusyIndicator.hide()
                console.log(err)
                MessageToast.show('ERROR')
            })
        },

        refreshMtarParams: function (e) {
            containerRefs.forEach(function (fc) {
                fc.getBinding("formElements").refresh()
            })
        }
    })
})