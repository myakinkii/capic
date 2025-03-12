sap.ui.define(["sap/fe/core/PageController", "sap/ui/core/BusyIndicator"], function (PageController, BusyIndicator) {
    "use strict";

    return PageController.extend("ftp_local.Main", {

        onInit: function () {
            PageController.prototype.onInit.apply(this)
            this.getView().getModel("ui").setProperty("/isEditable", true)
        },

        openFtp: function (e) {
            e.preventDefault(true)
            sap.m.URLHelper.redirect(e.getSource().getHref(), true)
        },

        forceRefresh: function (e) {
            // this.getView().byId("macroTable").getAggregation("content").getRowBinding().refresh()
            this.getView().byId("macroTable").refresh()
        },

        onSelectEdit: function (event) {
            this.getView().getModel("ui").setProperty("/isEditable", event.getParameter("pressed"))
        },

        checkCreateFolders:function(e){
            this.editFlow.invokeAction('/checkCreateFolders', {
                model: e.getSource().getBindingContext().getModel()
            })
        },

        unlinkInFile: function (e) {
            var fileName = e.getSource().getBindingContext().getProperty("fileName")
            this.editFlow.invokeAction('/unlinkInFile', {
                model: this.getView().getModel(),
                parameterValues: [{ name: "fileName", value: fileName }],
                skipParameterDialog: true
            })
        },
        
        runGenericTester:function(e){
            var panel = e.getSource().getParent().getParent()
            var fisrtChild = panel.getContent()[0]
            BusyIndicator.show(50)
            this.editFlow.invokeAction('/runGenericTester', {
                model: e.getSource().getBindingContext().getModel()
            }).then(function(res){
                BusyIndicator.hide()
                panel.setExpanded(true)
                fisrtChild.setText(res.value)
            })
        }

    })
})