sap.ui.define([], function() {
    "use strict";
    
    return {
        flushTmpFile:function(e){
            this.editFlow.invokeAction('/flushTmpFile', {
                model: e.getSource().getBindingContext().getModel()
            })
        },
        formatEditable:function(fileData, fileType){
            return fileData ? fileType == 'INTEGRATION_FLOW' : false
        }
    }
})