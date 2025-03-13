sap.ui.define([
    "sap/ui/model/xml/XMLModel", "sap/ui/model/Filter",
    "sap/m/Popover", "sap/m/Tree", "sap/m/StandardTreeItem",
], function (XMLModel, Filter, Popover, Tree, StandardTreeItem) {
    "use strict";

    // dunno why, but let's go oldschool )
    // maybe we'll add some nasty jquery here later to process xml nodes
    var xmlModel = new XMLModel()

    var tree = new Tree()
    var outlinePopover = new Popover({
        showHeader: false,
        placement: "Auto",
        resizable: true,
        content: tree
    })
    outlinePopover.setModel(xmlModel, "xml")

    return {
        flushTmpFile: function (e) {
            this.editFlow.invokeAction('/flushTmpFile', {
                model: e.getSource().getBindingContext().getModel()
            })
        },
        formatEditable: function (fileData, fileType) {
            if (fileType && fileData) { // a little hack as dataReceived event did not fire..
                xmlModel.setNameSpace("http://www.osgi.org/xmlns/blueprint/v1.0.0")
                xmlModel.setNameSpace("http://camel.apache.org/schema/blueprint", "camel")
                xmlModel.setXML(fileData)
                // console.log(xmlModel.getObject('/camel:camelContext'))
                // https://developer.mozilla.org/en-US/docs/Web/API/Node
            }
            return fileData ? fileType == 'INTEGRATION_FLOW' : false
        },

        showCamelContextOutline: function (e) {
            tree.bindAggregation("items", {
                path: "xml>/camel:camelContext",
                template: new StandardTreeItem({
                    title: {
                        parts: [
                            { path: 'xml>@uri' },
                            { path: 'xml>@id' },
                            { path: 'xml>camel:from/@uri' }
                        ],
                        formatter: function (uri, id, from) {
                            // in formatters outside of controller scope
                            // 'this' refers to control itself
                            // which sometimes can be pretty useful
                            if (from) {
                                this.data("from", from) // like here to set custom data
                                return "camel:route" + (id ? ' id="' + id + '"' : '')
                            }
                            function uriPart(uri) { return uri && uri.split("?")[0] }
                            var parts = this.getItemNodeContext().context.getPath().match(/(camel:\w+)/g)
                            var parent = this.getParentNode()
                            if (!parent) return parts.pop() + ' ' + uriPart(uri)
                            if (parent && uri && uri == parent.data("from")) {
                                return "from: " + uriPart(uri)
                            }
                            if (uri) {
                                return "to: " + uriPart(uri)
                            }
                            return parts.pop() + (id ? ' id="' + id + '"' : '')
                        }
                    }
                }),
                filters: new Filter([
                    // new Filter("@id", "NE", null),
                    new Filter("@uri", "NE", null)
                ], false)
            })
            tree.expandToLevel(1)
            outlinePopover.openBy(e.getSource())
        }
    }
})