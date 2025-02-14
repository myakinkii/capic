sap.ui.define(["sap/fe/core/PageController"], function (PageController) {
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

        unlinkInFile: function (e) {
            var fileName = e.getSource().getBindingContext().getProperty("fileName")
            this.editFlow.invokeAction('/unlinkInFile', {
                model: this.getView().getModel(),
                parameterValues: [{ name: "fileName", value: fileName }],
                skipParameterDialog: true
            })
        }

    })
})