sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter"
], function (PageController, JSONModel, Filter) {
    "use strict";

    var StatusMap = {
        PROCESSING: 'Information',
        COMPLETED: 'Success',
        DISCARDED: 'None',
        ESCALATED: 'Warning',
        RETRY: 'Warning',
        FAILED: 'Error'
    }

    return PageController.extend("mpl.Main", {

        onInit: function () {
            this.getView().setModel(new JSONModel({
                artifactFilter: {
                    PackageId: null,
                    Id: null,
                },
                dateFilter: {
                    value: {},
                    from: null,
                    to: null
                },
                statusFilter: {
                    value: null,
                    equals: true
                }
            }), "ui")
        },

        getProcessingDuration: function (start, end) {
            return new Date(end) - new Date(start) + 'ms'
        },

        navtoDetail: function (e) {
            var oContext = e.getSource().getBindingContext()
            var nextLayout = 'TwoColumnsBeginExpanded'
            this.getOwnerComponent().getRouter().navTo("DetailRoute", { 
                key: `'${oContext.getProperty("MessageGuid")}'`, 
                "?query": { layout: nextLayout } 
            })
        },

        formatMessageState:function(status){
            return StatusMap[status] || 'None'
        },

        refreshLog: function () {
            this.applyFilters()
            // this.getView().byId("MPLTable").getBinding("items").refresh()
        },

        recalcDateFilterValues:function(){
            var uiMdl = this.getView().getModel("ui")
            var value = uiMdl.getProperty("/dateFilter/value")
            if (value.operator) {
                var [from, to] = this.getView().byId("rangePicker").toDates(value)
                var d1 = (new Date(from.getTime())).toISOString()
                var d2 = (new Date(to.getTime())).toISOString()
                uiMdl.setProperty("/dateFilter", { from: d1, to: d2, value })
            } else {
                uiMdl.setProperty("/dateFilter", { from: null, to: null, value: {} })
            }
        },

        filterLog: function (e) {
            this.getView().getModel("ui").setProperty("/dateFilter/value", e.getParameter("value") || {} )
            this.applyFilters()
        },

        pressSearchByCorrId:function(e){
            var corrId = e.getSource().getTitle()
            var searchField = this.getView().byId("msgSearch")
            searchField.setValue(corrId)
            searchField.fireSearch({query: corrId})
        },

        setArtifactFilter:function(pkgId, bundleId){
            this.getView().getModel("ui").setProperty("/artifactFilter", { PackageId: pkgId, Id: bundleId })
            this.applyFilters()
        },

        selectFilterBundle:function(e){
            this.setArtifactFilter(null, e.getSource().getText())
        },

        selectFilterPackage:function(e){
            this.setArtifactFilter(e.getSource().getText(), null)
        },

        clearArtifactFilter:function(){
            this.setArtifactFilter(null, null)
        },

        searchById: function (e) {
            this.getView().getModel("ui").setProperty("/idFilter", e.getParameter("query"))
            this.applyFilters()
        },

        showActiveFilterStrip: function(){
            this.getView().byId("activeFilterStrip").setVisible(true)
        },

        formatActiveFilter:function(msg, pkg, bundle, status, eq, from, to){
            if (msg) return `MessageGuid OR CorrelationId OR ApplicationMessageId = '${msg}'`
            var pars = []
            if (pkg) pars.push(`IntegrationArtifact/PackageId = '${pkg}'`)
            if (bundle) pars.push(`IntegrationArtifact/Id = '${bundle}'`)
            if (status) {
                pars.push(`Status ${eq ? '=' : '!='} '${status}'`)
            }
            if (from) pars.push(`LogStart >= '${from}'`)
            if (to) pars.push(`LogStart <= '${to}'`)
            return pars.join(' AND ')
        },

        applyFilters: function () {
            this.recalcDateFilterValues()
            this.showActiveFilterStrip()

            var filterData = this.getView().getModel("ui").getData()
            var items = this.getView().byId("MPLTable").getBinding("items")

            if (filterData.idFilter){
                items.filter(new Filter('MessageGuid', 'EQ', filterData.idFilter))
                items.refresh()
                return
            }
            
            var filters = []

            var df = filterData.dateFilter
            if (df.from && df.to) filters.push(new Filter('LogStart', 'BT', df.from, df.to))

            var arf = filterData.artifactFilter
            Object.entries(arf).forEach(([key, value]) => {
                if (value) filters.push(new Filter('IntegrationArtifact/' + key, "EQ", value))
            })

            var status = filterData.statusFilter.value
            var operator = filterData.statusFilter.equals ? 'EQ' : 'NE'
            if (status) filters.push(new Filter('Status', operator, status))

            items.filter(new Filter(filters, true))
            items.refresh()
        },

        onAfterRendering: function () {
            var rangePicker = this.getView().byId('rangePicker')
            var opts = ['DATE', 'TODAY', 'YESTERDAY', 'LASTMINUTES', 'LASTHOURS', 'LASTDAYS', 'DATERANGE']
            opts.forEach(o => rangePicker.addStandardOption(o))

            var compData = this.getOwnerComponent().getComponentData()
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