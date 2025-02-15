sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/core/BusyIndicator"
], function (PageController, JSONModel, Filter, BusyIndicator) {
    "use strict";

    return PageController.extend("packages.Detail", {

        onInit: function () {
            PageController.prototype.onInit.apply(this)
            this.getAppComponent().getRouter().getRoute("IntegrationPackagesDetailsRoute").attachMatched(this.onRouteMatched, this) // like in good old days )
            this.getView().setModel(new JSONModel(), "pkg")
            this.getView().setModel(new JSONModel({
                filter :{ // calculated properties enriched by enrichData
                    IsDeployed: false,
                    HasDraft: false,
                },
                search: ['Id', 'Name']
            }), "ui")
        },

        onRouteMatched: function (e) {
            var pars = e.getParameter("arguments")
            var cfg = e.getParameter("config")
            var serviceUrl = this.getView().getModel().getServiceUrl()
            var packageUrl = cfg.pattern.replace('{key}', pars.key)
            BusyIndicator.show()
            this.fetchModelDataFor(serviceUrl, packageUrl).then(function (res) {
                this.getView().getModel("pkg").setData(this.enrichData(res))
                BusyIndicator.hide()
            }.bind(this)).catch(function (err) {
                BusyIndicator.hide()
                console.log(err)
            })
        },

        fetchModelDataFor: function (serviceUrl, pkgUrl) {
            var promisedFetch = (url) => new Promise((resolve, reject) => {
                return fetch(url).then(res => res.ok ? res.json() : Promise.reject(res.status)).then(resolve).catch(reject)
            })
            return Promise.all([
                promisedFetch(serviceUrl + pkgUrl),
                promisedFetch(serviceUrl + pkgUrl + '/IntegrationDesigntimeArtifacts'),
                promisedFetch(serviceUrl + 'IntegrationRuntimeArtifacts')
            ]).then(function (res) {
                return Object.assign(res[0],
                    { IntegrationDesigntimeArtifacts: res[1].value },
                    { IntegrationRuntimeArtifacts: res[2].value }
                )
            })
        },

        enrichData: function (data) {
            var dtArts = data["IntegrationDesigntimeArtifacts"] // only current package
            var rtArts = data["IntegrationRuntimeArtifacts"] // all stuff, cuz osgi bundles have idea of packages
            var deployed = rtArts.reduce((prev, cur) => Object.assign(prev, { [cur.Id]: cur }), {})
            dtArts.forEach(a => {
                Object.assign(a, { Runtime: deployed[a.Id] || {} })
                a["IsDeployed"] = !!a.Runtime["Version"]
                a["HasDraft"] = a.Runtime && a["Version"] != a.Runtime["Version"]
            })
            data["IntegrationDesigntimeArtifactsCount"] = dtArts.length
            return data
        },

        gotoPackage: function (e) {
            var url = e.getSource().getBindingContext("pkg").getProperty("PackageURL")
            sap.m.URLHelper.redirect(url, true)
        },

        gotoMonitoring: function(e){
            var pkgUrl = e.getSource().getBindingContext("pkg").getProperty("PackageURL")
            var url = pkgUrl.split('shell')[0] + 'shell/monitoring/Artifacts'
            sap.m.URLHelper.redirect(url, true)
        },

        navtoDTArtifacts:function(e){
            var ctx = e.getSource().getBindingContext("pkg").getObject()
            this.routing.navigateToRoute("IntegrationDesigntimeArtifactsRoute",{ 
                key: `'${ctx.PackageId}'`, 
                key2: `Id='${ctx.Id}',Version='${ctx.Version}'`
            })
        },

        fetchMagicUrl: function () {
            // IntegrationPackages('PIPKG')/IntegrationDesigntimeArtifacts(Id='echo_test',Version='1.1.0')/IntegrationRuntimeArtifacts
        },

        filterDTArtifacts: function (e) {
            var filterData = this.getView().getModel("ui").getProperty("/filter")
            var filters = Object.entries(filterData).filter(([_, v]) => !!v ).map(([k, v]) => {
                return new Filter({ path: k, operator: "EQ", value1: v })
            })
            e.getSource().getParent().getParent().getBinding("items").filter(new Filter(filters, true), 'Application')
        },

        searchArtifacts: function (e) {
            var fields = this.getView().getModel("ui").getProperty("/search")
            var filters = []
            var search = e.getParameter("newValue")
            if (search) {
                filters.push(new Filter(fields.map(function (f) {
                    return new Filter({ path: f, operator: "Contains", value1: search, caseSensitive: false })
                }), false)) // OR-ed
            }
            e.getSource().getParent().getParent().getBinding("items").filter(filters, 'Control')
        },

        formatVersion:function(rtVer, dtVer){
            if (!rtVer) return dtVer
            return rtVer==dtVer ? rtVer : rtVer+'*'
        },

        formatVersionStatus:function(rtVer, dtVer){
            if (!rtVer || !dtVer) return 'None'
            return rtVer==dtVer ? 'Success' : 'Warning'
        }

    })
})