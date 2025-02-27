const { 
    syncBundleToPackageRepo, getDeployedToKarafBundles, deployBundleToKaraf, 
    getBundleInfos, findBundleInfo, getBundleXml, saveBundleXml
} = require('./lib/BundleHandler')
const CPI_TENANT_URL = process.env.CPI_TENANT_URL || ''
const IntegrationComponentsListCommand = 'com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentsListCommand'
const DownloadContentCommand = 'com.sap.it.nm.commands.deploy.DownloadContentCommand'

module.exports = cds.service.impl(async function () {

    const cpi = await cds.connect.to('cpi')
    const operations = await cds.connect.to('operations')

    const getSelf = async (id) => operations.run({ cmd: 'IntegrationComponentsList' })
        .then(list => findBundleInfo(list, id))

    const getArtifactIds = () => operations.run({ cmd: 'IntegrationComponentsList' })
        .then(list => getBundleInfos(list)
            .reduce((prev, { name: { _text: n }, id: { _text: id } }) => Object.assign(prev, { [n]: id }), {}))

    this.on('syncGitToPackage', async (req) => {
        const [{ Id: bundleId }] = req.params
        const { pckgId, version, commitMsg } = req.data

        const artifact = await getSelf(bundleId)
        const xmlString = await operations.run({
            cmd: 'DownloadContent',
            params: { artifactIds: artifact.id._text }
        })

        return syncBundleToPackageRepo(pckgId, bundleId, version, commitMsg, xmlString)
    })

    this.on('deployKarafFromPackage', async (req) => {
        const [{ Id: bundleId }] = req.params
        const { pckgId, tryLocal } = req.data
        const res = await deployBundleToKaraf(pckgId, bundleId, tryLocal)
        return `DEPLOYED_FROM: ${pckgId}/${bundleId}/${res}`
    })

    this.on('READ', 'IntegrationPackages', async (req, next) => {
        const result = await cpi.run(req.query)
        Object.values(req.query.SELECT.one ? [result] : result).forEach(r => { // can have single package or list here
            r.PackageURL = `${CPI_TENANT_URL}/shell/design/contentpackage/${r.Id}?section=ARTIFACTS`
        })
        return result
    })

    // READABLE ONLY VIA PACKAGE NAV PROPERTY
    this.on('READ', 'IntegrationDesigntimeArtifacts', async (req, next) => cpi.run(req.query))
    this.on('READ', 'ScriptCollectionDesigntimeArtifacts', async (req, next) => cpi.run(req.query))
    this.on('READ', 'ValueMappingDesigntimeArtifacts', async (req, next) => cpi.run(req.query))
    this.on('READ', 'MessageMappingDesigntimeArtifacts', async (req, next) => cpi.run(req.query))

    const mapToArtifactDT = {
        INTEGRATION_FLOW: 'integrationflows',
        SCRIPT_COLLECTION: 'scriptcollections',
        VALUE_MAPPING: 'valuemappings',
        MESSAGE_MAPPING: 'messagemappings'
    }

    const tmpFile = {} // simple hack as we only edit one artifact in single-user mode

    this.on("flushTmpFile", async (req) => {
        if (tmpFile.Content) saveBundleXml(tmpFile)
    })

    this.on('UPDATE', 'FakeDesigntimeArtifacts', async (req, next) => {
        Object.assign(tmpFile, req.data)
    })

    this.on('READ', 'FakeDesigntimeArtifacts', async (req, next) => {
        if (req.params.length == 2) { // detail-detail
            const [{ Id: PackageId }, { Id, Type }] = req.params
            if (tmpFile.Id && tmpFile.Id != Id) Object.assign(tmpFile, { Content: '' }) // had someone else
            Object.assign(tmpFile, { Id, PackageId }) // always, not to lose package id
            return {
                Id, Type, PackageId,
                Content: getBundleXml(PackageId, Id, Type),
                ArtifactURL: `${CPI_TENANT_URL}/shell/design/contentpackage/${PackageId}/${mapToArtifactDT[Type]}/${Id}`
            }
        } else return next()
    })

    // here we return absolutely everything cuz we want to see our scripts or mappings
    this.on('READ', 'DeployedArtifacts', async (req, next) => getDeployedToKarafBundles().map( f => ({Id: f.split('.')[0]}) ))

    this.on('READ', 'IntegrationRuntimeArtifacts', async (req, next) => {
        if (req.params.length == 1) { // details
            const [{ Id }] = req.params
            const q = SELECT.from('IntegrationRuntimeArtifacts').where({ Id })
            req.query = q
        }
        const ids = await getArtifactIds()
        return cpi.run(req.query).then(re => re.map(r => Object.assign(r, {
            ArtifactId: ids[r.Id],
            DeployURL: `${CPI_TENANT_URL}/Operations/${operations.getCommand('IntegrationComponentDetail')}?artifactId=${ids[r.Id]}`
        })))
    })

    this.on('getRuntimeDetails', async (req) => {
        return operations.run({ cmd: 'IntegrationComponentDetail', params: req.data })
    })

});