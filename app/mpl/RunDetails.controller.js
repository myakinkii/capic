sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter", "sap/m/TextArea",
    "sap/ui/core/BusyIndicator", "sap/m/MessageToast", "sap/m/MessageBox"
], function (PageController, JSONModel, Fragment, Filter, TextArea, BusyIndicator, MessageToast, MessageBox) {
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

        onRouteMatched: function (e) {
            var pars = e.getParameter("arguments")
            var serviceUrl = this.getView().getModel().getServiceUrl()
            var runUrl = `/MessageProcessingLogs(${pars.key})/Runs(${pars.key2})`
            BusyIndicator.show(50)
            this.fetchModelDataFor(serviceUrl, runUrl).then(function (res) {
                this.getView().getModel("mpl").setData(res)
                BusyIndicator.hide()
            }.bind(this)).catch(function (err) {
                BusyIndicator.hide()
                console.log(err)
            })
        },

        fetchModelDataFor: function (serviceUrl, runUrl) {
            return Promise.all([
                promisedFetch(serviceUrl + runUrl),
                promisedFetch(serviceUrl + runUrl + '/RunSteps')
            ]).then(function ([run, runSteps]) {
                runSteps.value.forEach( st => {
                    st.RunStepProperties.results.forEach( p => {
                        var activities = p.Value.match(/{Activity=([^}]+)}/g)
                        if(activities) p.Value = activities.join('\n')
                    })
                    if (st.Error) st.RunStepProperties.results.push({
                        Name: 'Error',
                        Value: st.Error
                    })
                })
                run["RunSteps"] = runSteps.value
                return { Run: run }
            })
        }

    })
})