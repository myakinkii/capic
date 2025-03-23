sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (PageController, JSONModel) {
    "use strict";

    var promisedFetch = (url) => new Promise((resolve, reject) => {
        return fetch(url).then(res => res.ok ? res.json() : Promise.reject(res.status)).then(resolve).catch(reject)
    })

    return PageController.extend("mpl.Detail", {

        onInit: function () {
            this.getView().setModel(new JSONModel(), "mpl")
            this.getOwnerComponent().getRouter().getRoute("DetailRoute").attachPatternMatched(this.onRouteMatched, this)
            this.getOwnerComponent().getRouter().getRoute("RunStepsRoute").attachPatternMatched(this.onRouteMatched, this)
        },

        handleClose: function (e) {
            var fclMdl = this.getView().getModel("fcl")
            var nextLayout = fclMdl.getProperty("/actionButtonsInfo/midColumn/closeColumn")
            this.getOwnerComponent().getRouter().navTo("MainRoute", { "?query": { layout: nextLayout } })
        },

        onRouteMatched: function (e) {

            var fclMdl = this.getView().getModel("fcl")
            this.getOwnerComponent().getHelper().then(function (helper) {
                fclMdl.setData(helper.getCurrentUIState())
            })

            var pars = e.getParameter("arguments")
            this.getView().bindElement({path: `/MessageProcessingLogs(${pars.key})` })

            this.fetchModelDataFor(pars.key).then(function (res) {
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
            var runsUrl = `${mplUrl}/Runs`
            return Promise.all([
                promisedFetch(serviceUrl + runsUrl)
            ]).then(function ([runs]) {
                return {Runs: runs.value}
            })
        },

        navtoRunDetails:function(e){
            var runId = e.getSource().getBindingContext("mpl").getProperty("Id")
            var msgGuid = this.getView().getBindingContext().getProperty("MessageGuid")
            var nextLayout = 'ThreeColumnsEndExpanded'
            this.getOwnerComponent().getRouter().navTo("RunStepsRoute", { 
                key: `'${msgGuid}'`, 
                key2: `'${runId}'`,
                "?query": { layout: nextLayout } 
            })
        }
    })
})