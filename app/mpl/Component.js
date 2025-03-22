// sap.ui.define(["sap/ui/core/UIComponent"], function (Component) {
sap.ui.define([
    "sap/fe/core/AppComponent",
    'sap/f/FlexibleColumnLayoutSemanticHelper'
], function (Component, FlexibleColumnLayoutSemanticHelper) {
    "use strict";
    return Component.extend("mpl.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            Component.prototype.init.apply(this, arguments)
            this.rootLoadedPromise = this.rootControlLoaded()
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
            var uiMdl = this.getModel("ui")
            var query = e.getParameter("arguments")["?query"]

            this.getNewLayoutFor(query?.layout).then(function (newLayout) {
                uiMdl.setProperty("/layout", newLayout)
            })
        }

    })
})