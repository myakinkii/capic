const { getBundleInfos, findBundleInfo } = require('../BundleHandler')

const OP_COMMANDS = {
    IntegrationComponentsList: 'com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentsListCommand',
    IntegrationComponentDetail: 'com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentDetailCommand', // artifactId
    DownloadContent: 'com.sap.it.nm.commands.deploy.DownloadContentCommand', // artifactIds
}

module.exports = class OperationsService extends require('./BaseService') {

    async getArtifactInfo(bundleId){
        return this.run({ cmd: 'IntegrationComponentsList' }).then(list => findBundleInfo(list, bundleId))
    }

    async getFirstEntryEndpoint(bundleId){
        const artifact = await this.getArtifactInfo(bundleId)
        if (!artifact) return // not deployed
        const rtData = await this.run({ 
            cmd: 'IntegrationComponentDetail', 
            params: { artifactId: artifact.id._text }
        })
        const firstEntry = rtData.endpointInformation && rtData.endpointInformation.find(i => i.endpointInstances.find(e => e.endpointCategory == 'ENTRY_POINT'))
        return firstEntry?.endpointInstances[0].endpointUrl
    }

    getCommand(cmd) { return OP_COMMANDS[cmd] }

    async init() {

        this.on('*', async (req) => {
            const { query } = req
            const reqOptions = { method: 'GET', url: this.getCommand(query.cmd) }
            if (query.params) reqOptions.params = query.params
            await this.prepareAxiosRequest(reqOptions, '/Operations', 'cpi')
            return this.runAxiosRequest(reqOptions).then(r => r.data)
        })

        await super.init()
    }

}