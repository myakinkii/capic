sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/layout/form/FormContainer", "sap/ui/layout/form/FormElement",
    "sap/m/Text", "sap/m/Link", "sap/m/ObjectStatus", 
    "sap/ui/base/ManagedObject"
], function (PageController, FormContainer, FormElement, Text, Link, ObjectStatus, ManagedObject) {
    "use strict";

    return PageController.extend("apimdbg.PointDetails", {

        onInit: function () {
            this.getOwnerComponent().getRouter().getRoute("PointDetailsRoute").attachPatternMatched(this.onRouteMatched, this)
        },

        handleClose: function (e) {
            var fclMdl = this.getView().getModel("fcl")
            var nextLayout = fclMdl.getProperty("/actionButtonsInfo/endColumn/closeColumn")
            var index = this.getView().getBindingContext().getPath().split("/")[1]
            this.getOwnerComponent().getRouter().navTo("DetailRoute", { key: index, "?query": { layout: nextLayout } })
        },

        onRouteMatched: function (e) {
            var fclMdl = this.getView().getModel("fcl")
            this.getOwnerComponent().getHelper().then(function (helper) {
                fclMdl.setData(helper.getCurrentUIState())
            })

            var pars = e.getParameter("arguments")
            this.getView().bindElement({ path: `/${pars.key}/point/${pars.key2}` })

        },

        createFormContainer:function (sId, ctx) {
            var pathMap = {
                DebugInfo: "properties/property",
                RequestMessage: "headers",
                ResponseMessage: "headers",
                VariableAccess: "accessList"
            }
            var obj = ctx.getObject()
            var actionResult = obj.ActionResult
            if (actionResult == "RequestMessage" && obj.headers.findIndex( h => h.name == "BODY") == -1 ){ // for now
                obj.headers.unshift({
                    name: "REQ",
                    value: obj.verb + " " + obj.uRI
                },{
                    name: "BODY",
                    value: ManagedObject.escapeSettingsValue(obj.content)
                })
            }
            if (actionResult == "ResponseMessage" && obj.headers.findIndex( h => h.name == "BODY") == -1 ){ // for now
                obj.headers.unshift({
                    name: "RES",
                    value: obj.statusCode + " " + obj.reasonPhrase
                },{
                    name: "BODY",
                    value: ManagedObject.escapeSettingsValue(obj.content)
                })
            }
            var fc = new FormContainer({ expandable: true, expanded: true, title: '{ActionResult}' })
            fc.bindAggregation("formElements", {
                path: pathMap[actionResult],
                factory: function(sId, ctx) {
                    var obj = ctx.getObject()
                    if (actionResult != "VariableAccess") {
                        return new FormElement({ label: obj.name, fields: [new Text({ text: obj.value })] })
                    } else {
                        var par = obj.Get || obj.Set
                        return new FormElement({ 
                            label: (obj.Get ? 'Get ' : 'Set ') + par.name, 
                            fields: [new Text({ text: par.value })]
                        })
                    }
                }
            })
            return fc
        }
    })
})