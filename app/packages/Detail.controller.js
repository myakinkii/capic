sap.ui.define(["sap/fe/core/PageController"], function (PageController) {
    "use strict";

    return PageController.extend("packages.Main", {

        onInit: function () {
            PageController.prototype.onInit.apply(this)
            var tbl = this.getView().byId("macroTable").getAggregation("content")
            tbl.getType().setGrowingMode('None') // later decide if I need searchable local m.Table..
        }
        
    })
})