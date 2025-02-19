module.exports = class MyRemoteServiceOperations extends require('./MyRemoteService') {

    async init() {

        const commands = {
            IntegrationComponentsList: 'com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentsListCommand',
            IntegrationComponentDetail: 'com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentDetailCommand', // artifactId
            DownloadContent: 'com.sap.it.nm.commands.deploy.DownloadContentCommand', // artifactIds
        }

        this.on('*', async (req) => {
            const { query } = req
            const reqOptions = { method: 'GET', url: commands[query.cmd] }
            if (query.params) reqOptions.params = query.params
            await this.prepareAxiosRequest(reqOptions, '/Operations', 'cpi')
            return this.runAxiosRequest(reqOptions).then(r => r.data)
        })

        await super.init()
    }

}