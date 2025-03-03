
module.exports = class IflowService extends require('./BaseService') {

    async init() {

        this.on('*', async (req) => {
            const { query: { endpoint, body, headers} } = req
            const reqOptions = { method: 'POST', data: body, headers }
            await this.prepareAxiosRequest(reqOptions, endpoint)
            return this.runAxiosRequest(reqOptions).then(r => r.data)
        })

        await super.init()
    }
}