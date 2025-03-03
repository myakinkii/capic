module.exports = class WebshellService extends require('./BaseService') {

    async init() {

        this.on('*', async (req) => {
            const { query: filePath } = req
            const reqOptions = { method: 'GET', url: `/http/files/download${filePath}`, responseType: 'arraybuffer' }
             // so that csrf token call to http/files triggers 404 and not 500
            await this.prepareAxiosRequest(reqOptions, '' , 'webshell')
            return this.runAxiosRequest(reqOptions).then(r => r.data)
        })

        await super.init()
    }

}