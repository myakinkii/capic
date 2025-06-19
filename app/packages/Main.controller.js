sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/json/JSONModel", "sap/ui/model/Filter",
    "sap/ui/core/BusyIndicator"
], function (PageController, JSONModel, Filter, BusyIndicator) {
    "use strict";

    var promisedFetch = (url) => new Promise((resolve, reject) => {
        return fetch(url).then(res => res.ok ? res.json() : Promise.reject(res.status)).then(resolve).catch(reject)
    })

    return PageController.extend("packages.Main", {

        onInit: function () {
            PageController.prototype.onInit.apply(this)
            this.getAppComponent().getRouter().getRoute("IntegrationPackagesListRoute").attachMatched(this.onRouteMatched, this) // like in good old days )
            this.getView().setModel(new JSONModel(), "pkg")
        },

        onRouteMatched: function (e) {
            var serviceUrl = this.getView().getModel().getServiceUrl()
            var packageUrl = `/IntegrationPackages`
            BusyIndicator.show(50)
            this.fetchModelDataFor(serviceUrl, packageUrl).then(function (res) {
                this.getView().getModel("pkg").setData(res)
                BusyIndicator.hide()
            }.bind(this)).catch(function (err) {
                BusyIndicator.hide()
                console.log(err)
            })
        },

        fetchModelDataFor: function (serviceUrl, pkgUrl) {
            return Promise.all([
                promisedFetch(serviceUrl + pkgUrl)
            ]).then(function (res) {
                var pkgs = res[0].value
                pkgs.forEach(function(p){
                    var d = new Date(parseInt(p.CreationDate))
                    p.CreatedAt = d.toLocaleString()
                })
                return {
                    _count: pkgs.length,
                    IntegrationPackages: pkgs
                }
            })
        },


        onSearch: function (e) {
            var fields = ["Id", "Name", "CreatedBy", "ShortText"]
            var filters = []
            var search = e.getParameter("newValue")
            if (search) {
                filters.push(new Filter(fields.map(function (f) {
                    return new Filter({ path: f, operator: "Contains", value1: search, caseSensitive: false })
                }), false)) // OR-ed
            }
            e.getSource().getParent().getParent().getBinding("items").filter(filters, 'Control')
        },

        navtoDetail:function(e){
            var id = e.getSource().getBindingContext("pkg").getProperty("Id")
            this.routing.navigateToRoute("IntegrationPackagesDetailsRoute", { key: `'${id}'` })
        }

    })
})