const { getReqOptions } = require('@sap/cds/libx/_runtime/remote/utils/client')

module.exports = class MPLService extends require('./BaseService') {

    async init() {

        this.on('download', async (req) => {
            const { data: query } = req
            const reqOptions = getReqOptions(req, query, this) // we stole it from actual remote service
            await this.prepareAxiosRequest(reqOptions, '/api/v1', 'cpi')
            reqOptions.url+='/$value'
            reqOptions.responseType='arraybuffer'
            return this.runAxiosRequest(reqOptions).then( r => r.data )
        })

        this.on('*', async (req) => {
            const { query } = req
            // remove some stuff that if not supported by cpi odata v2 api
            if (query.SELECT) {
                query.SELECT.columns = undefined
                query.SELECT.orderBy = undefined // does not work anyway
                query.SELECT.count = undefined
            //     query.SELECT.limit = undefined
            //     query.SELECT.skip = undefined
            }

            // this converts our query to odata url
            const reqOptions = getReqOptions(req, query, this) // we stole it from actual remote service
            await this.prepareAxiosRequest(reqOptions, '/api/v1', 'cpi')
            return this.runAxiosRequest(reqOptions).then(r => {
                return query.SELECT?.one ? r.data.d : r.data.d.results
            }).catch(err => {
                console.log(err)
            })
        })

        await super.init()
    }
}