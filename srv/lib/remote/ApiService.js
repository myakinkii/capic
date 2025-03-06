const { getReqOptions } = require('@sap/cds/libx/_runtime/remote/utils/client')

// refactor mappings later, looks like we could properly encapsulate it here in this class

const mapToArtifactDesignTimeEntity = {
    INTEGRATION_FLOW: 'IntegrationDesigntimeArtifacts',
    SCRIPT_COLLECTION: 'ScriptCollectionDesigntimeArtifacts',
    MESSAGE_MAPPING: 'MessageMappingDesigntimeArtifacts'
}

const mapToArtifactDeployAction = {
    INTEGRATION_FLOW: '/DeployIntegrationDesigntimeArtifact',
    SCRIPT_COLLECTION: '/DeployScriptCollectionDesigntimeArtifact',
    MESSAGE_MAPPING: '/DeployMessageMappingDesigntimeArtifact'
}

module.exports = class ApiService extends require('./BaseService') {

    getSupportedRezipTypes(){
        return  Object.keys(mapToArtifactDesignTimeEntity)
    }

    getDTEntity(objType){
        return mapToArtifactDesignTimeEntity[objType]
    }

    getDeployAction(objType){
        return mapToArtifactDeployAction[objType]
    }

    async init() {

        this.on('deploy', async (req) => {
            const { bundleId, version, objType } = req.data
            const reqOptions = {
                method: 'POST',
                url: this.getDeployAction(objType),
                params: { Id: "'" + bundleId + "'", Version: "'" + version + "'" }
            }
            await this.prepareAxiosRequest(reqOptions, '/api/v1')
            return this.runAxiosRequest(reqOptions).then( r => r.data )
        })

        this.on('download', async (req) => {
            const { bundleId, version, objType } = req.data
            const entity = this.getDTEntity(objType)
            const reqOptions = {
                method: 'GET',
                responseType: 'arraybuffer',
                headers: { accept: 'application/zip' },
                url: `/${entity}(Id='${bundleId}',Version='${version}')/$value`,
            }
            await this.prepareAxiosRequest(reqOptions, '/api/v1')
            return this.runAxiosRequest(reqOptions).then( r => r.data )
        })

        this.on('*', async (req) => {
            const { query } = req
            // remove some stuff that if not supported by cpi odata v2 api
            if (query.SELECT) {
                query.SELECT.columns = undefined
                query.SELECT.orderBy = undefined
                query.SELECT.count = undefined
                query.SELECT.limit = undefined
                query.SELECT.skip = undefined
            }

            // this converts our query to odata url
            const reqOptions = getReqOptions(req, query, this) // we stole it from actual remote service
            await this.prepareAxiosRequest(reqOptions, '/api/v1')
            return this.runAxiosRequest(reqOptions).then(r => {
                if (query.SELECT) return query.SELECT.one ? r.data.d : r.data.d.results
                else return r.data?.d || r.data
            })
        })

        await super.init()
    }
}