module.exports = class WebshellService extends require('./BaseService') {

    async init() {

        this.on('*', async (req) => {
            const { query: cmd } = req
            const reqOptions = { method: 'POST', data: cmd, headers: { 'Content-Type': 'text/plain' } }
            await this.prepareAxiosRequest(reqOptions, '/http/webshell', 'iflow')
            return this.runAxiosRequest(reqOptions).then(r => r.data)
        })

        await super.init()
    }

}