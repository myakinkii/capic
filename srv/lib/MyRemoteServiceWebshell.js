module.exports = class MyRemoteServiceWebshell extends require('./MyRemoteService') {

    async init() {

        this.on('*', async (req) => {
            const { query: cmd } = req
            const reqOptions = { method: 'POST', data: cmd, headers: { 'Content-Type': 'text/plain' } }
            await this.prepareAxiosRequest(reqOptions, '/http/webshell')
            return this.runAxiosRequest(reqOptions).then(r => r.data)
        })

        await super.init()
    }

}