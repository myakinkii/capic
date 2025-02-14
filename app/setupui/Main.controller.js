sap.ui.define(["sap/fe/core/PageController"], function (PageController) {
    "use strict";

    return PageController.extend("setup.Main", {

        onInit: function () {
            PageController.prototype.onInit.apply(this)
            this.getView().getModel("ui").setProperty("/isEditable", true)
        },

        persistPars: function (e) {
            var pars = e.getSource().data("pars") // env or cdsrc
            this.editFlow.invokeAction('/persist', {
                model: this.getView().getModel(),
                parameterValues: [{ name: "pars", value: pars }],
                skipParameterDialog: true
            })
        }

    })
})