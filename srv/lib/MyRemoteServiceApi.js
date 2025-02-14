const { getReqOptions } = require('@sap/cds/libx/_runtime/remote/utils/client')

module.exports = class MyRemoteServiceApi extends require('./MyRemoteService') {

    async init() {

        this.on('*', async (req) => {
            const { query } = req
            // remove some stuff that if not supported by cpi odata v2 api
            query.SELECT.columns = undefined
            query.SELECT.orderBy = undefined
            query.SELECT.count = undefined
            query.SELECT.limit = undefined
            query.SELECT.skip = undefined

            // this converts our query to odata url
            const reqOptions = getReqOptions(req, query, this) // we stole it from actual remote service
            await this.prepareAxiosRequest(reqOptions, '/api/v1')
            return this.runAxiosRequest(reqOptions).then(r => query.SELECT.one ? r.data.d : r.data.d.results)
        })

        await super.init()
    }
}