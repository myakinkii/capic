sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageToast"], function (PageController, MessageToast) {
    "use strict";

    return PageController.extend("apimdbg.Detail", {

        onInit: function () {
            this.getOwnerComponent().getRouter().getRoute("DetailRoute").attachPatternMatched(this.onRouteMatched, this)
            this.getOwnerComponent().getRouter().getRoute("PointDetailsRoute").attachPatternMatched(this.onRouteMatched, this)
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
            this.getView().bindElement({ path: `/${pars.key}` })

        },

        navtoPointDetails: function (e) {
            var index = this.getView().getBindingContext().getPath().split("/")[1]
            var src = e.getSource()
            var pointIndex = src.getBindingContext().getPath().split("/")[3]
            var nextLayout = 'ThreeColumnsEndExpanded'
            this.getOwnerComponent().getRouter().navTo("PointDetailsRoute", { 
                key: index,
                key2: pointIndex,
                "?query": { layout: nextLayout }
            })
        }
    })
})