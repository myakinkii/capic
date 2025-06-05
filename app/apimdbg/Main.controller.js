sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageToast"], function (PageController, MessageToast) {
    "use strict";

    return PageController.extend("apimdbg.Main", {

        pasteDebugSession: function(e){
            var mdl = this.getView().getModel()
            navigator.clipboard.readText().then(function(text){
                try {
                    var json = JSON.parse(text)
                    mdl.setData(json)
                } catch (e){
                    MessageToast.show("Not a valid json")
                }
            }).catch(function(err){
                console.log(err)
            })
        },

        navtoDetail: function (e) {
            var src = e.getSource()
            var index = src.getParent().indexOfItem(src)
            var nextLayout = 'TwoColumnsMidExpanded'
            this.getOwnerComponent().getRouter().navTo("DetailRoute", { key: index, "?query": { layout: nextLayout } })
        }
    })
})