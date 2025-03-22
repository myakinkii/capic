sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/layout/form/FormElement", "sap/m/Text", "sap/m/Link"
], function (PageController, JSONModel, FormElement, Text, Link) {
    "use strict";

    var promisedFetch = (url) => new Promise((resolve, reject) => {
        return fetch(url).then(res => res.ok ? res.json() : Promise.reject(res.status)).then(resolve).catch(reject)
    })

    return PageController.extend("packages.Detail", {

        onInit: function () {
            PageController.prototype.onInit.apply(this)
            this.getAppComponent().getRouter().getRoute("RunsRoute").attachMatched(this.onRouteMatched, this) // like in good old days )
            this.getView().setModel(new JSONModel(), "mpl")
            this.getView().setModel(new JSONModel({}), "ui")
        },

        handleClose: function (e) {
            var uiMdl = this.getView().getModel("ui")
            var nextLayout = uiMdl.getProperty("/actionButtonsInfo/endColumn/closeColumn")
            var logId = e.getSource().getBindingContext("mpl").getProperty("LogId")
            this.routing.navigateToRoute("DetailsRoute", { key: `'${logId}'`, "?query": { layout: nextLayout } })
        },

        onRouteMatched: function (e) {

            var uiMdl = this.getView().getModel("ui")
            this.getAppComponent().getHelper().then(function (helper) {
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

                        var activities = p.Value.match(/{Activity=[^}]+}/g)
                        if (activities) p.Value = activities.join('\n')

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
                run["LogId"] = mpl.MessageGuid // maybe later we will use something else
                return { Run: run }
            })
        },

        createFormElement: function (sId, ctx) {
            var serviceUrl = this.getView().getModel().getServiceUrl()
            var obj = ctx.getObject()
            var element = new Text({ text: '{mpl>Value}' })
            if (obj.Url) element = new Link(({ text: obj.Value, href: serviceUrl + obj.Url }))
            return new FormElement({ label: '{mpl>Name}', fields: [element] })
        }

    })
})