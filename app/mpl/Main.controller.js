sap.ui.define([
    "sap/fe/core/PageController", "sap/ui/model/json/JSONModel", "sap/ui/model/Filter"
], function (PageController, JSONModel, Filter) {
    "use strict";

    return PageController.extend("mpl.Main", {

        onInit: function () {
            PageController.prototype.onInit.apply(this)
            this.getView().setModel(new JSONModel({
                artifactFilter: {
                    PackageId: null,
                    Id: null,
                },
                dateFilter: {
                    from: null,
                    to: null
                },
                statusFilter: null
            }), "ui")
        },

        getProcessingDuration: function (start, end) {
            return new Date(end) - new Date(start) + 'ms'
        },

        navtoDetail: function (e) {
            var oContext = e.getSource().getBindingContext();
            this.routing.navigate(oContext);
        },

        refreshLog: function () {
            this.getView().byId("MPLTable").getBinding("items").refresh()
        },

        filterLog: function (e) {
            var uiMdl = this.getView().getModel("ui")
            var value = e.getParameter("value")
            if (value) {
                var [from, to] = e.getSource().toDates(value)
                var d1 = (new Date(from.getTime())).toISOString()
                var d2 = (new Date(to.getTime())).toISOString()
                uiMdl.setProperty("/dateFilter", { from: d1, to: d2 })
            } else {
                uiMdl.setProperty("/dateFilter", { from: null, to: null })
            }
            this.applyFilters()
        },

        searchById: function (e) {
            var q = e.getParameter("query")
            var filters = q ? [new Filter('MessageGuid', 'EQ', q)] : []
            this.getView().byId("MPLTable").getBinding("items").filter(new Filter(filters, true))
        },

        applyFilters: function () {
            var filterData = this.getView().getModel("ui").getData()
            var filters = []

            var df = filterData.dateFilter
            if (df.from && df.to) filters.push(new Filter('LogStart', 'BT', df.from, df.to))

            var arf = filterData.artifactFilter
            Object.entries(arf).forEach(([key, value]) => {
                if (value) filters.push(new Filter('IntegrationArtifact/' + key, "EQ", value))
            })

            var status = filterData.statusFilter
            if (status) filters.push(new Filter('Status', 'EQ', status))

            this.getView().byId("MPLTable").getBinding("items").filter(new Filter(filters, true))
        },

        onAfterRendering: function () {
            var rangePicker = this.getView().byId('rangePicker')
            var opts = ['DATE', 'TODAY', 'YESTERDAY', 'LASTMINUTES', 'LASTHOURS', 'LASTDAYS', 'DATERANGE']
            opts.forEach(o => rangePicker.addStandardOption(o))

            var compData = this.getAppComponent().getComponentData()
            var pars = compData.startupParameters
            if (pars) {
                var uiMdl = this.getView().getModel("ui")
                uiMdl.setProperty("/artifactFilter", Object.entries(pars).reduce((prev, cur) => {
                    var [key, [value]] = cur
                    prev[key] = value
                    return prev
                }, {}))
                this.applyFilters()
            }
        }
    })
})