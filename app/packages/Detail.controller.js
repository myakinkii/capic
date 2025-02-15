sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/json/JSONModel"
], function (PageController, JSONModel) {
    "use strict";

    return PageController.extend("packages.Detail", {

        onInit: function () {
            PageController.prototype.onInit.apply(this)
            this.getAppComponent().getRouter().getRoute("IntegrationPackagesDetailsRoute").attachMatched(this.onRouteMatched, this) // like in good old days )
            this.getView().setModel(new JSONModel(),"pkg")
        },

        fetchModelDataFor: function(serviceUrl, pkgUrl){
            var promisedFetch = (url) => new Promise( (resolve, reject) => {
                return fetch(url).then( res => res.ok ? res.json() : Promise.reject(res.status) ).then(resolve).catch(reject)
            })
            return Promise.all([
                promisedFetch(serviceUrl + pkgUrl),
                promisedFetch(serviceUrl + pkgUrl+'/IntegrationDesigntimeArtifacts'),
                promisedFetch(serviceUrl + '/IntegrationRuntimeArtifacts')
            ]).then(function(res){
                return Object.assign(res[0], 
                    { IntegrationDesigntimeArtifacts: res[1].value },
                    { IntegrationRuntimeArtifacts: res[2].value }
                )
            })
        },

        enrichData: function(data){
            var dtArts = data["IntegrationDesigntimeArtifacts"] // only current package
            var rtArts = data["IntegrationRuntimeArtifacts"] // all stuff, cuz osgi bundles have idea of packages
            var deployed = rtArts.reduce( (prev, cur) => Object.assign(prev, { [cur.Id]:cur }), {})
            dtArts.forEach( a => Object.assign(a, { Runtime: deployed[a.Id] }) )
            data["IntegrationDesigntimeArtifactsCount"] = dtArts.length
            return data
        },

        fetchMagicUrl:function(){
            // IntegrationPackages('PIPKG')/IntegrationDesigntimeArtifacts(Id='echo_test',Version='1.1.0')/IntegrationRuntimeArtifacts
        },

        onRouteMatched:function(e){
            var pars = e.getParameter("arguments")
            var cfg = e.getParameter("config")
            var serviceUrl = this.getView().getModel().getServiceUrl()
            var packageUrl = cfg.pattern.replace('{key}',pars.key)
            this.fetchModelDataFor(serviceUrl, packageUrl).then(function(res){
                this.getView().getModel("pkg").setData(this.enrichData(res))
            }.bind(this)).catch(function(err){
                console.log(err)
            })
        },

        gotoPackage: function (e) {
            var url = e.getSource().getBindingContext("pkg").getProperty("PackageURL")
            sap.m.URLHelper.redirect(url, true)
        },
        
    })
})