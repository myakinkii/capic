// sap.ui.define(["sap/ui/core/UIComponent"], function (Component) {
sap.ui.define(["sap/fe/core/AppComponent"], function (Component) {
    "use strict";
    return Component.extend("mpl.Component", {
        metadata: {
            manifest: "json"
        },

        _init: function(){
            Component.prototype.init.apply(this, arguments)
            this.getRouter().initialize()
        }

    })
})