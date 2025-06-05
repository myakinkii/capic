sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    'sap/f/FlexibleColumnLayoutSemanticHelper'
], function (Component, JSONModel, FlexibleColumnLayoutSemanticHelper) {
    "use strict";
    return Component.extend("apimdbg.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            Component.prototype.init.apply(this, arguments)
            this.rootLoadedPromise = this.rootControlLoaded()

            this.setModel(new JSONModel({}), "fcl")

            this.getModel().setSizeLimit(1000)

            var router = this.getRouter()
            router.attachBeforeRouteMatched(this.onBeforeRouteMatched, this);
            router.initialize()
        },

        getFcl: function () {
            return this.rootLoadedPromise.then(function (root) {
                return root.getContent()[0]
            })
        },

        getHelper: function () {
            var router = this.getRouter()
            return this.getFcl().then(function (fcl) {
                return FlexibleColumnLayoutSemanticHelper.getInstanceFor(fcl, router._oConfig.flexibleColumnLayout)
            })
        },

        getNewLayoutFor: function (currLayout) {
            return currLayout ? Promise.resolve(currLayout) : this.getHelper().then(function (helper) {
                var nextUIState = helper.getNextUIState(0)
                return nextUIState.layout
            })
        },

        onBeforeRouteMatched: function (e) {
            var fclMdl = this.getModel("fcl")
            var query = e.getParameter("arguments")["?query"]

            this.getNewLayoutFor(query?.layout).then(function (newLayout) {
                fclMdl.setProperty("/layout", newLayout)
            })
        }

    })
})