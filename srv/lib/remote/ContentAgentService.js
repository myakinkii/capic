// check out the https://discovery-center.cloud.sap/serviceCatalog/content-agent with "free" plan (UI stuff)
// here we use apis from "application" plan https://api.sap.com/api/contentagentapi/overview

module.exports = class OperationsService extends require('./BaseService') {

    async getResources() {
        const reqOptions = { method: 'GET' }
        await this.prepareAxiosRequest(reqOptions, '/v1/contentResources')
        return this.runAxiosRequest(reqOptions).then(r => r.data?.contentResources)
    }

    async getActivity(activityId) {
        const reqOptions = { method: 'GET' }
        await this.prepareAxiosRequest(reqOptions, '/v1/operations/' + activityId)
        return this.runAxiosRequest(reqOptions).then(r => r.data)
    }

    async downloadMtar(activityId) {

        const reqOptions = { method: 'GET' }
        await this.prepareAxiosRequest(reqOptions, `/v1/operations/${activityId}/config`)
        const fileId = await this.runAxiosRequest(reqOptions).then(r => r.data.fileID)

        const dowloadOptions = {
            method: 'GET',
            url: `/v1/operations/${activityId}/file/${fileId}`,
            responseType: 'arraybuffer',
            headers: {
                'Accept': 'application/octet-stream'
            }
        }
        await this.prepareAxiosRequest(dowloadOptions, '')
        return this.runAxiosRequest(dowloadOptions).then(r => r.data)
    }

    async exportPackage(pkgId, resourceId) {
        const reqOptions = {
            method: 'POST',
            data: {
                "id": "export_" + pkgId,
                "exportMode": "download",
                "exportMediaType": "MTAR",
                "contentResources": [{
                    "id": pkgId,
                    "name": pkgId,
                    "resourceID": resourceId,
                    "type": "Cloud Integration",
                    "subType": "package"
                }]
            },
            headers: { 'Content-Type': 'application/json' }
        }
        await this.prepareAxiosRequest(reqOptions, '/v1/contentResources/export')
        const activityId = await this.runAxiosRequest(reqOptions).then(r => r.data.activityId)
        return activityId
    }

    async init() {
        await super.init()
    }
}
