sap.ui.define([
    "sap/ui/core/mvc/Controller", "sap/m/MessageToast", "sap/ui/base/ManagedObject"
], function (PageController, MessageToast, ManagedObject) {
    "use strict";

    return PageController.extend("apimdbg.Main", {

        pasteDebugSession: function(e){
            navigator.clipboard.readText().then(function(text){
                try {
                    var json = JSON.parse(text)
                    this.getView().getModel().setData(this.transformData(json))
                } catch (e){
                    MessageToast.show("Not a valid json")
                }
            }.bind(this)).catch(function(err){
                console.log(err)
            })
        },

        transformData: function(data){
            var addZero = num => num < 10 ? '0'+num : ''+num
            var shortActs = {
                RequestMessage: "REQ", ResponseMessage: "RES", ErrorMessage: "ERR", 
                DebugInfo: "DBG", VariableAccess: "VAR"
            }
            data.forEach(function(tx){
                var REQ = '', RES = ''
                var to = "REQ_START", index = 0
                tx.point.forEach(function(p){

                    var req = p.results.find(r => r.ActionResult == "RequestMessage")
                    if (req) {
                        REQ = req.verb + " " + req.uRI
                        req.headers.unshift({
                            name: "REQ", value: REQ
                        },{
                            name: "BODY", value: ManagedObject.escapeSettingsValue(req.content)
                        })
                    }

                    var res = p.results.find(r => r.ActionResult == "ResponseMessage")
                    if (res) {
                        RES = res.statusCode + " " + res.reasonPhrase
                        res.headers.unshift({
                            name: "RES", value: RES, status: res.statusCode,
                        },{
                            name: "BODY", value: ManagedObject.escapeSettingsValue(res.content)
                        })
                    }

                    var err = p.results.find(r => r.ActionResult == "ErrorMessage")
                    if (err) {
                        RES = err.statusCode + " " + err.reasonPhrase
                        err.headers.unshift({
                            name: "ERR", value: RES, status: err.statusCode,
                        },{
                            name: "BODY", value: ManagedObject.escapeSettingsValue(err.content)
                        })
                    }

                    var stateChange =  p.id == "StateChange" && p.results.find(r => r.ActionResult == "DebugInfo")
                    if (stateChange) {
                        to = stateChange.properties.property[0].value
                        index++
                    }
                    p.STAGE = addZero(index) + " " + to

                    var execution = p.id == "Execution" && p.results.find(r => r.ActionResult == "DebugInfo")
                    if (execution){
                        var exType = execution.properties.property.find( p => p.name == 'type' )
                        var exPolicy = execution.properties.property.find( p => p.name == 'stepDefinition-name' )
                        p.ID = exPolicy ? exPolicy.value : exType.value
                    } else {
                        p.ID = p.id
                    }
                    
                    p.ACTS = p.results.map(r => shortActs[r.ActionResult]).join("|")
                })
                tx.REQ = REQ
                tx.RES = RES
                tx.STATUS = RES.startsWith('2') ? 'Success' : 'Error'
                tx.TS = tx.point.find( p => p.id == 'StateChange').results[0].timestamp // ugly as hell..
            })
            return data
        },

        navtoDetail: function (e) {
            var src = e.getSource()
            var index = src.getBindingContext().getPath().split("/")[1]
            var nextLayout = 'TwoColumnsMidExpanded'
            this.getOwnerComponent().getRouter().navTo("DetailRoute", { key: index, "?query": { layout: nextLayout } })
        }
    })
})