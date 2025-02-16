sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/core/BusyIndicator", "sap/m/MessageToast",
], function (PageController, JSONModel, Fragment, Filter, BusyIndicator, MessageToast) {
    "use strict";

    var promisedFetch = (url) => new Promise((resolve, reject) => {
        return fetch(url).then(res => res.ok ? res.json() : Promise.reject(res.status)).then(resolve).catch(reject)
    })

    return PageController.extend("packages.Detail", {

        onInit: function () {
            PageController.prototype.onInit.apply(this)
            this.getAppComponent().getRouter().getRoute("IntegrationPackagesDetailsRoute").attachMatched(this.onRouteMatched, this) // like in good old days )
            this.getView().setModel(new JSONModel(), "pkg")
            this.getView().setModel(new JSONModel({
                filter: { // calculated properties enriched by enrichData
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
        },

        onRouteMatched: function (e) {
            var pars = e.getParameter("arguments")
            var cfg = e.getParameter("config")
            var serviceUrl = this.getView().getModel().getServiceUrl()
            var packageUrl = cfg.pattern.replace('{key}', pars.key)
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
                promisedFetch(serviceUrl + 'IntegrationRuntimeArtifacts')
            ]).then(function (res) {

                var data = res.shift() // header
                data["DesigntimeArtifacts"] = []

                var rtArts = res.pop().value // all stuff, cuz osgi bundles have idea of packages
                data["RuntimeArtifacts"] = rtArts // for stuff in second table (see "Claimed" flag below and in xml)

                var deployed = rtArts.reduce((prev, cur) => Object.assign(prev, { [cur.Id]: cur }), {})

                res.forEach(artifactType => {

                    artifactType.value.forEach(a => {

                        Object.assign(a, { Runtime: deployed[a.Id] || {} })
                        if (a.Runtime["Id"]) deployed[a.Id]["Claimed"] = true // to filter out others

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

        gotoMonitoring: function (e) {
            var pkgUrl = e.getSource().getBindingContext("pkg").getProperty("PackageURL")
            var url = pkgUrl.split('shell')[0] + 'shell/monitoring/Artifacts'
            sap.m.URLHelper.redirect(url, true)
        },

        navtoDTArtifacts: function (e) {
            var ctx = e.getSource().getBindingContext("pkg").getObject()
            this.routing.navigateToRoute("IntegrationDesigntimeArtifactsRoute", {
                key: `'${ctx.PackageId}'`,
                key2: `Id='${ctx.Id}',Version='${ctx.Version}'`
            })
        },

        openActions: function (e) {
            var ctx = e.getSource().getBindingContext("pkg")
            this.actionsPromise.then(act => {
                act.setBindingContext(ctx, "pkg")
                act.openBy(e.getSource())
            })
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
            navigator.clipboard.readText().then(function(res){
                // BusyIndicator.show(50)
                return this.editFlow.invokeAction('CpiLocalService.syncGitToPackage', {
                    contexts: rtOdataCtx,
                    parameterValues: [
                        { name: "pckgId", value: pkgOdataCtx.getProperty("Id") },
                        { name: "xmlString", value: res },
                        { name: "version", value: rt.Version }
                    ],
                    skipParameterDialog: false
                })
            }.bind(this)).then(function (res) {
                // BusyIndicator.hide()
                MessageToast.show(res.getObject().value)
            }).catch(function (err) {
                // BusyIndicator.hide()
                console.log(err)
                // MessageToast.show('ERROR')
            })
        },

        deployKaraf: function (e) {
            var pkgOdataCtx = this.getView().getBindingContext()
            var ctx = e.getSource().getBindingContext("pkg")
            var rt = ctx.getProperty("Runtime") || ctx.getObject()
            if (!rt.Id) return MessageToast.show('NOT_DEPLOYED')

            var rtOdataCtx = pkgOdataCtx.getModel().bindContext(`/IntegrationRuntimeArtifacts('${rt.Id}')`)
            navigator.clipboard.readText().then(function(res){
                // BusyIndicator.show(50)
                return this.editFlow.invokeAction('CpiLocalService.deployKarafFromPackage', {
                    contexts: rtOdataCtx,
                    parameterValues: [
                        { name: "pckgId", value: pkgOdataCtx.getProperty("Id") }
                    ],
                    skipParameterDialog: true
                })
            }.bind(this)).then(function (res) {
                // BusyIndicator.hide()
                MessageToast.show(res.getObject().value)
            }).catch(function (err) {
                BusyIndicator.hide()
                console.log(err)
                // MessageToast.show('ERROR')
            })
        },

        filterDTArtifacts: function (e) {
            var filterData = this.getView().getModel("ui").getProperty("/filter")
            var filters = Object.entries(filterData).filter(([_, v]) => !!v).map(([k, v]) => {
                return new Filter({ path: k, operator: "EQ", value1: v })
            })
            e.getSource().getParent().getParent().getBinding("items").filter(new Filter(filters, true), 'Application')
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
        }

    })
})