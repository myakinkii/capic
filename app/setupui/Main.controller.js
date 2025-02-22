sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/core/Fragment",
    "sap/ui/core/BusyIndicator", "sap/m/MessageToast"
], function (PageController, Fragment, BusyIndicator, MessageToast) {
    "use strict";

    return PageController.extend("setup.Main", {

        onInit: function () {
            PageController.prototype.onInit.apply(this)
            this.getView().getModel("ui").setProperty("/isEditable", true)

            this.rezipDialogPromise = Fragment.load({ name: "setup.Rezip", controller: this }).then(function (dlg) {
                this.getView().addDependent(dlg)
                dlg.getEndButton().attachPress(function () {
                    dlg.close()
                })
                return dlg
            }.bind(this))
        },

        showRezipDlg: function () {
            this.rezipDialogPromise.then(dlg => dlg.open())
        },

        copyPackage:function(e){
            var ctx = e.getSource().getBindingContext()
            ctx.setProperty("pkgId", e.getParameter("selectedItem").getKey())
        },

        copyBundle:function(e){
            var ctx = e.getSource().getBindingContext()
            ctx.setProperty("bundleId", e.getParameter("value"))
        },

        rezipArtifact: function (e) {
            var ctx = e.getSource().getBindingContext().getObject()
            BusyIndicator.show(50)
            this.editFlow.invokeAction('/rezip', {
                model: this.getView().getModel(),
                parameterValues: [{ name: 'task', value: ctx }],
                skipParameterDialog: true
            }).then(function (re) {
                BusyIndicator.hide()
                MessageToast.show('OK')
            }).catch(function (err) {
                BusyIndicator.hide()
                MessageToast.show(err.message)
            })
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