const cds = require('@sap/cds')
const axios = require('axios')

async function _getAccessToken(dst) {
    return await axios.post(dst.tokenurl, {
        grant_type: 'client_credentials', client_id: dst.clientid, client_secret: dst.clientsecret,
    }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(r => r.data.access_token)
}

async function _getCsrfToken(url, authToken) {
    return axios.head(url, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'X-CSRF-Token': 'fetch' }
    }).then(r => ({ token: r.headers["x-csrf-token"], cookies: r.headers["set-cookie"] }))
}

class MyRemoteService extends cds.Service {

    async init() {
        await super.init()
        this.middlewares = []
        this.path = ''
        this.authToken = null
    }

    async prepareAxiosRequest(reqOptions, endpointUrl) {

        const destination = this.options.credentials

        if (!destination?.url) throw new Error('CREDENTIALS_NOT_SET')

        if (!this.authToken) this.authToken = await _getAccessToken(destination)

        reqOptions.baseURL = destination.url + endpointUrl
        const csrf = await _getCsrfToken(reqOptions.baseURL, this.authToken)

        reqOptions.headers = Object.assign(reqOptions.headers || {}, {
            'Authorization': `Bearer ${this.authToken}`,
            'X-CSRF-Token': csrf.token,
            'Cookie': csrf.cookies // cpi REALLY WANTS it
        })
    }

    async runAxiosRequest(reqOptions) {
        return axios(reqOptions)
    }
}

module.exports = MyRemoteService