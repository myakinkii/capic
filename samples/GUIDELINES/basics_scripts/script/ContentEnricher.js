importClass(com.sap.gateway.ip.core.customdev.util.Message);
importClass(java.util.HashMap);

function enrichByCategory(message) {
    
    // var messsageLog = messageLogFactory.getMessageLog(message);
    
    var newBody = message.getBody(java.lang.String);
    var categories = JSON.parse(newBody);
    
    var lookup = categories.d.results.reduce(function(prev, cur){
        prev[cur["Category"]] = cur["MainCategoryName"];
        return prev;
    },{});
    // messsageLog.addAttachmentAsString("Lookup", JSON.stringify(lookup), "application/json");
    
    var props = message.getProperties();
    var oldBody = props.get("oldBody");
    
    var json = JSON.parse(oldBody);
    json["Items"].forEach(function(item){
        item["MainCategoryName"] = lookup[item["Category"]] || null
    })
    
    message.setBody(JSON.stringify(json));
    return message;
}