module.exports = class WebshellService extends require('./BaseService') {

    async init() {

        this.on('*', async (req) => {
            const { query: filePath, data: asStream } = req // abuse req.data a little bit

            const reqOptions = { 
                method: 'GET', 
                url: `/http/files/download${filePath}`, 
                responseType: asStream === true ?  'stream' : 'arraybuffer',
                headers: {
                    'Accept': 'application/octet-stream'
                }
            }
             // so that csrf token call to http/files triggers 404 and not 500
            await this.prepareAxiosRequest(reqOptions, '' , 'iflow')
            return this.runAxiosRequest(reqOptions).then(r => r.data)
        })

        await super.init()
    }

}