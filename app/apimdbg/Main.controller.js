sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageToast"], function (PageController, MessageToast) {
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
            data.forEach(function(tx){
                var to = "REQ_START", index = 0
                tx.point.forEach(function(p){
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
                        p.id = exPolicy ? exPolicy.value : exType.value
                    }
                })
            })
            return data
        },

        navtoDetail: function (e) {
            var src = e.getSource()
            var index = src.getParent().indexOfItem(src)
            var nextLayout = 'TwoColumnsMidExpanded'
            this.getOwnerComponent().getRouter().navTo("DetailRoute", { key: index, "?query": { layout: nextLayout } })
        }
    })
})