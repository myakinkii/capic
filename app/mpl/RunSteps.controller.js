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

    var parseActivities = (rawActs) => {
        // rawActs is just a string looking like this "[{Activity=}, {Activity=}]"
        // the problem is we can have COMPLEX "simple expressions" inside Activity= part (loop, choice, headers reference etc)
        var tokens = rawActs.slice(1, -1).split(", ") // so we just try splitting this stuff into chunks
        // and each activity then is array of 2 or 3 tokens per activity 
        // '{Activity=' + 'StartTime=..' and 'StopTime=..}' OR just + 'StartTime=..}'
        var acts = [], t, parts, start, stop, name
        while (tokens.length){
            t = tokens.pop() // we go in reverse order
            if (t.startsWith('{')) {
                name = stop ? `Camel Activity (${stop-start}ms)` : `MPL Activity (${start.toISOString()})`
                acts.unshift({ Name: name, Value: t.replace('{Activity=', '')})
                start = ''
                stop = ''
            } else {
                if (t.endsWith('}')) t = t.slice(0, -1)
                parts = t.split("=")
                if (parts[0]=='StartTime') start = new Date(parts[1])
                if (parts[0]=='StopTime') stop = new Date(parts[1])
            }
        }
        return acts
    }

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
                            newProps.push( ...parseActivities(p.Value) ) // maybe I'll write tests one day...
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
            var obj = ctx.getObject() || {}
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