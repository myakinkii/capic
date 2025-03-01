const cds = require('@sap/cds')
const axios = require('axios')

async function fetchAuthToken(dst) {
    return await axios.post(dst.tokenurl, {
        grant_type: 'client_credentials', client_id: dst.clientid, client_secret: dst.clientsecret,
    }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(r => r.data)
}

async function getCsrfToken(url, authToken) {
    return axios.head(url, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'X-CSRF-Token': 'fetch' }
    }).then(r => ({ 'X-CSRF-Token': r.headers["x-csrf-token"], 'Cookie': r.headers["set-cookie"] }))
}

class BaseService extends cds.Service {

    async init() {
        await super.init()
        this.middlewares = []
        this.path = ''
        this.auth = {}
    }

    async prepareAxiosRequest(reqOptions, endpointUrl, borrowSvcCreds) {

        const destination = borrowSvcCreds ? cds.requires[borrowSvcCreds].credentials : this.options.credentials

        if (!destination?.url) throw new Error('CREDENTIALS_NOT_SET')

        const fetchRefresh = !this.auth.token || Date.now() > this.auth.expires
        if (fetchRefresh) {
            const { access_token: token, expires_in, scope } = await fetchAuthToken(destination)
            this.auth = { token, scope, expires: Date.now() + 1000 * expires_in }
        }

        reqOptions.baseURL = endpointUrl.startsWith('http') ? endpointUrl : destination.url + endpointUrl

        reqOptions.headers = Object.assign(reqOptions.headers || {}, {
            'Authorization': `Bearer ${this.auth.token}`
        })

        try {
            const csrf = await getCsrfToken(reqOptions.baseURL, this.auth.token)
            Object.assign(reqOptions.headers, csrf)
        } catch (e){
            // we assume, there's no csrf protection
        }
    }

    async runAxiosRequest(reqOptions) {
        return axios(reqOptions)
    }
}

module.exports = BaseService