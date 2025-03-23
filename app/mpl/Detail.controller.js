sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (PageController, JSONModel, MessageToast) {
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
            this.getView().bindElement({ path: `/MessageProcessingLogs(${pars.key})` })

            this.fetchModelDataFor(pars.key).then(function (res) {
                this.getView().getModel("mpl").setData(res)
                // BusyIndicator.hide()
            }.bind(this)).catch(function (err) {
                // BusyIndicator.hide()
                console.log(err)
            })
        },

        formatLogRunTime:function(d1, d2){
            if (!d1 || !d2) return ''
            var start = new Date(d1)
            var end = new Date(d2)
            return `${start.toLocaleString()} (${end - start}ms)`
        },

        fetchModelDataFor: function (mplId, runId) {
            var serviceUrl = this.getView().getModel().getServiceUrl()
            var mplUrl = `/MessageProcessingLogs(${mplId})`
            var runsUrl = `${mplUrl}/Runs`
            return Promise.all([
                promisedFetch(serviceUrl + mplUrl + '/ErrorInformation'),
                promisedFetch(serviceUrl + runsUrl)
            ]).then(function ([errorInfo, runs]) {
                return { Error: errorInfo.Value, Runs: runs.value }
            })
        },

        navtoRunDetails: function (e) {
            var runId = e.getSource().getBindingContext("mpl").getProperty("Id")
            var msgGuid = this.getView().getBindingContext().getProperty("MessageGuid")
            var nextLayout = 'ThreeColumnsEndExpanded'
            this.getOwnerComponent().getRouter().navTo("RunStepsRoute", {
                key: `'${msgGuid}'`,
                key2: `'${runId}'`,
                "?query": { layout: nextLayout }
            })
        },

        setLogLevel:function(e){

            var src = e.getSource()
            var ctx = src.getBindingContext()
            var action = src.getModel().bindContext("MPLLocalService.setLogLevel(...)", ctx )

            var bundleId = ctx.getObject().IntegrationArtifact.Id
            var logLevel = e.getSource().getText()

            action.setParameter("bundleId", bundleId).setParameter("logLevel", logLevel)
            action.execute().then(function(){
                MessageToast.show('OK')
            }).catch(function(err){
                // console.log(err)
                MessageToast.show(err.message)
            })
        }
    })
})