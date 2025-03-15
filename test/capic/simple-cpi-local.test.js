const cds = require('@sap/cds')

const projectRoot = __dirname + '/../..'

jest.mock("../../srv/lib/remote/OperationsService", () => {
    const { Service } = jest.requireActual('@sap/cds')
    const RealService = jest.requireActual('../../srv/lib/remote/OperationsService')
    return class FakeService extends Service {
        init(){
            // console.log(this)
        }
        run(query){
            return Promise.resolve([]) // called by READ IntegrationRuntimeArtifacts
        }
    }
})

jest.mock("../../srv/lib/remote/ApiService", () => {
    const { Service } = jest.requireActual('@sap/cds')
    const RealService = jest.requireActual('../../srv/lib/remote/ApiService')
    return class FakeService extends Service {
        init(){
            // console.log(this)
        }
        run(query){
            if (query.target.name == 'CpiLocalService.IntegrationPackages') return Promise.resolve([{"Id": "MAGIC"}])
            if (query.target.name == 'CpiLocalService.IntegrationDesigntimeArtifacts') return Promise.resolve([{
                "Id": "webshell_flows",
                "Version":"1.0.0"
            }])
            if (query.target.name == 'CpiLocalService.ScriptCollectionDesigntimeArtifacts') return Promise.resolve([{
                "Id": "webshell_scripts",
                "Version":"1.0.0"
            }])
            return Promise.resolve([])
        }
    }
})

jest.mock("../../srv/lib/BundleHandler", () => {
    const { 
        syncBundleToPackageRepo, getDeployedToKarafBundles, deployBundleToKaraf, 
        getBundleInfos, findBundleInfo, getBundleXml, saveBundleXml
    } =  jest.requireActual('../../srv/lib/BundleHandler')
    return {
        getDeployedToKarafBundles : () => [],
        getBundleInfos: () => {
            return [] // and later still post-processed in getArtifactIds
        },
        getBundleXml: (pkgId, objId, objType) => objType == 'INTEGRATION_FLOW' ? '<blueprint/>' : ''
    }
})

describe('Very simple test for cpi-local-service', () => {

    process.env.FTP_DIR = '' // to not spin up ftp server

    const test = cds.test(projectRoot)

    let pkgId

    it('should get one package on main page', async () => {
        const { data: {value: pkgs} } = await test.get(`/odata/v4/cpi-local/IntegrationPackages`)
        test.expect(pkgs.length).to.eq(1)
        test.expect(pkgs[0].Id).to.eq('MAGIC')
        pkgId = pkgs[0].Id
    })

    let iflowId
    let scriptId

    it('should get one iflow and one scrtipt collection on detail page', async () => {
        // to emulate ui we call all that stuff for coverage
        const { data: {value: mmaps} } = await test.get(`/odata/v4/cpi-local/IntegrationPackages('${pkgId}')/MessageMappingDesigntimeArtifacts`)
        const { data: {value: vmaps} } = await test.get(`/odata/v4/cpi-local/IntegrationPackages('${pkgId}')/ValueMappingDesigntimeArtifacts`)
        const { data: {value: iflows} } = await test.get(`/odata/v4/cpi-local/IntegrationPackages('${pkgId}')/IntegrationDesigntimeArtifacts`)
        const { data: {value: scripts} } = await test.get(`/odata/v4/cpi-local/IntegrationPackages('${pkgId}')/ScriptCollectionDesigntimeArtifacts`)
        const { data: {value: runtime} } = await test.get(`/odata/v4/cpi-local/IntegrationRuntimeArtifacts`)
        const { data: {value: deployed} } = await test.get(`/odata/v4/cpi-local/DeployedArtifacts`)

        test.expect(iflows.length).to.eq(1)
        test.expect(iflows[0].Id).to.eq('webshell_flows')
        iflowId = iflows[0].Id

        test.expect(scripts.length).to.eq(1)
        test.expect(scripts[0].Id).to.eq('webshell_scripts')
        scriptId = scripts[0].Id
    })

    it('should go to webshell_flows detail-detail page and get blueprint Content', async () => {
        const { data: iflow } = await test.get(`/odata/v4/cpi-local/IntegrationPackages('${pkgId}')/FakeDesigntimeArtifacts(Id='${iflowId}',Type='INTEGRATION_FLOW')?$select=ArtifactURL,Content,Id,Type`)
        test.expect(iflow.Content).to.eq('<blueprint/>')
    })

    it('should go to webshell_scripts detail-detail page and get empty Content', async () => {
        const { data: iflow } = await test.get(`/odata/v4/cpi-local/IntegrationPackages('${pkgId}')/FakeDesigntimeArtifacts(Id='${scriptId}',Type='SCRIPT_COLLECTION')?$select=ArtifactURL,Content,Id,Type`)
        test.expect(iflow.Content).to.eq('')
    })

})