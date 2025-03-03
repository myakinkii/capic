sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/core/BusyIndicator", "sap/m/MessageToast"
], function (PageController, JSONModel, Fragment, BusyIndicator, MessageToast) {
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

            this.karafDialogPromise = Fragment.load({ name: "setup.SetupKaraf", controller: this }).then(function (dlg) {
                this.getView().addDependent(dlg)
                dlg.setModel(new JSONModel({ downloadTarget: '*' }), "dlg")
                dlg.getEndButton().attachPress(function () {
                    dlg.close()
                })
                return dlg
            }.bind(this))
        },

        showRezipDlg: function () {
            this.rezipDialogPromise.then(dlg => dlg.open())
        },

        copyPackage: function (e) {
            var ctx = e.getSource().getBindingContext()
            ctx.setProperty("pkgId", e.getParameter("selectedItem").getKey())
        },

        copyBundle: function (e) {
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
        },

        showSetupKarafDialog: function () {
            var dlg
            this.karafDialogPromise.then(function (d) {
                dlg = d
                return this.editFlow.invokeAction('/checkWarRetry', { model: this.getView().getModel() })
            }.bind(this)).then(function (res) {
                dlg.getModel("dlg").setProperty("/downloadTarget", ('value' in res) ? res.value: '*')
                dlg.open()
            })
        },

        karafDownloadJars:function(e){
            var mdl = e.getSource().getModel("dlg")
            var warName = mdl.getProperty('/downloadTarget')
            if (warName) warName = warName.slice(1) // kinda to remove undescore or clear '*'
            
            BusyIndicator.show(50)
            this.editFlow.invokeAction('/setupDownload', {
                model: this.getView().getModel(),
                parameterValues: [{ name: 'warName', value: warName }],
                skipParameterDialog: true
            }).then(function (re) {
                BusyIndicator.hide()
                mdl.setProperty("/downloadTarget", re.value || '')
            }).catch(function (err) {
                BusyIndicator.hide()
                MessageToast.show(err.message)
            })
        },

        karafInstall:function(){
            BusyIndicator.show(50)
            this.editFlow.invokeAction('/setupKaraf', {
                model: this.getView().getModel()
            }).then(function (re) {
                BusyIndicator.hide()
                MessageToast.show('OK')
            }).catch(function (err) {
                BusyIndicator.hide()
                MessageToast.show(err.message)
            })
        }

    })
})