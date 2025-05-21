sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/layout/form/FormElement",
    "sap/ui/base/ManagedObject",
    "sap/m/Text", "sap/m/Link", "sap/m/ObjectStatus"
], function (PageController, JSONModel, FormElement, ManagedObject, Text, Link, ObjectStatus) {
    "use strict";

    var promisedFetch = (url) => new Promise((resolve, reject) => {
        return fetch(url).then(res => res.ok ? res.json() : Promise.reject(res.status)).then(resolve).catch(reject)
    })

    return PageController.extend("mpl.RunSteps", {

        onInit: function () {
            this.getOwnerComponent().getRouter().getRoute("RunStepsRoute").attachPatternMatched(this.onRouteMatched, this)
            var mplModel = new JSONModel()
            mplModel.setSizeLimit(1000)
            this.getView().setModel(mplModel, "mpl")
            this.getView().setModel(new JSONModel({}), "ui")
        },

        handleClose: function (e) {
            var fclMdl = this.getView().getModel("fcl")
            var nextLayout = fclMdl.getProperty("/actionButtonsInfo/endColumn/closeColumn")
            var ctx = e.getSource().getBindingContext("mpl").getObject()
            this.getOwnerComponent().getRouter().navTo("DetailRoute", {
                key: `'${ctx.MPL.MessageGuid}'`,
                "?query": { layout: nextLayout }
            })
        },

        onRouteMatched: function (e) {

            var uiMdl = this.getView().getModel("ui")
            this.getOwnerComponent().getHelper().then(function (helper) {
                uiMdl.setData(helper.getCurrentUIState())
            })

            var pars = e.getParameter("arguments")
            // BusyIndicator.show(50)
            this.fetchModelDataFor(pars.key, pars.key2).then(function (res) {
                this.getView().getModel("mpl").setData(res)
                // BusyIndicator.hide()
            }.bind(this)).catch(function (err) {
                // BusyIndicator.hide()
                console.log(err)
            })
        },

        fetchModelDataFor: function (mplId, runId) {
            var serviceUrl = this.getView().getModel().getServiceUrl()
            var mplUrl = `/MessageProcessingLogs(${mplId})`
            var runUrl = `${mplUrl}/Runs(${runId})`

            var startStopAct = (a) => {
                try {
                    var parts = /Activity=(.+), StartTime=(.+), StopTime=(.+)/g.exec(a)
                    var start = new Date(parts[2])
                    var stop = new Date(parts[3])
                    return {
                        Name: `Camel Activity (${stop-start}ms)`,
                        Value: parts[1],
                    }
                } catch(e){
                    return null
                }
            }
            var startAct = (a) => {
                try {
                    var parts = /Activity=(.+), StartTime=(.+)/g.exec(a)
                    var start = new Date(parts[2])
                    return {
                        Name: `MPL Activity (${start.toISOString()})`,
                        Value: parts[1]
                    }
                } catch(e){
                    return null
                }
            }

            return Promise.all([
                promisedFetch(serviceUrl + mplUrl),
                promisedFetch(serviceUrl + runUrl),
                promisedFetch(serviceUrl + runUrl + '/RunSteps')
            ]).then(function ([mpl, run, runSteps]) {
                runSteps.value.forEach(st => {

                    var newProps = []
                    st.RunStepProperties.results.forEach(p => {

                        var activities = p.Value.match(/{Activity=[^}]+}/g) // but simple expressions make it hard...
                        if (activities) {
                            p.Value.slice(1, -1).split("}, ").forEach( a => { // remove square brackets and split
                                var clean = a.slice(1, a.endsWith('}') ? -1 : undefined)
                                newProps.push( startStopAct(clean) || startAct(clean) )
                            })
                            return
                        }

                        if (p.Name == 'TraceIds') {
                            try{
                                JSON.parse(p.Value).forEach( id => {
                                    newProps.push({
                                        Name: 'TraceId',
                                        Value: id,
                                        Url: `TraceMessages(${id})`
                                    })
                                })
                            } catch (e){
                                // somehow those were not array of ids
                            }
                            return
                        }

                        if (p.Name == 'Attachments') {
                            var name, url
                            p.Value.split(",").map(a => a.split("=")[1]).forEach((part, i) => {
                                if (i % 2 == 0) {
                                    name = part
                                } else {
                                    url = part.replaceAll('}','').replaceAll(']','') // ugly, but don't wanna do regex
                                    newProps.push({
                                        Name: 'Attachment',
                                        Value: name,
                                        Url: `MessageProcessingLogAttachments('${url}')/blob`
                                    })
                                }
                            })
                            return
                        }

                        newProps.push(p)
                    })

                    if (st.Error) newProps.push({
                        Name: 'Error',
                        Value: st.Error
                    })

                    st.RunStepProperties.results = newProps
                })
                run["RunSteps"] = runSteps.value
                run["MPL"] = mpl
                return { Run: run }
            })
        },

        createFormElement: function (sId, ctx) {
            var serviceUrl = this.getView().getModel().getServiceUrl()
            var obj = ctx.getObject()
            var fields = []
            if (obj.Name == 'TraceId') {
                fields.push(
                    new Link({ text: 'Body', href: serviceUrl + obj.Url + '/blob' }),
                    new Link({ text: 'Headers', href: serviceUrl + obj.Url + '/Properties', target:'_blank'}),
                    new Link({ text: 'Properties', href: serviceUrl + obj.Url + '/ExchangeProperties', target:'_blank'})
                )
            } else if (obj.Name == 'Error') {
                var objstat = new ObjectStatus({ text: ManagedObject.escapeSettingsValue(obj.Value), state: 'Error', active: false })
                objstat.addStyleClass("sapMObjectStatusLongText");
                fields.push(objstat)
            } else if (obj.Url) {
                fields.push(new Link({ text: obj.Value, href: serviceUrl + obj.Url }))
            } else {
                fields.push(new Text({ text: '{mpl>Value}' }))
            }
            return new FormElement({ label: '{mpl>Name}', fields: fields })
        }

    })
})