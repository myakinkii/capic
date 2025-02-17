const { syncBundleToPackageRepo, deployBundleToKaraf, getBundleXml } = require('./lib/BundleHandler')

const CPI_TENANT_URL = process.env.CPI_TENANT_URL || ''
const IntegrationComponentsListCommand = 'com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentsListCommand'
const DownloadContentCommand = 'com.sap.it.nm.commands.deploy.DownloadContentCommand'

module.exports = cds.service.impl(async function () {

    const cpi = await cds.connect.to('cpi')
    const webshell = await cds.connect.to('webshell')

    this.on('syncGitToPackage', async (req) => {
        const [{ Id: bundleId }] = req.params
        const { pckgId, version, xmlString, commitMsg } = req.data
        const res = await syncBundleToPackageRepo(pckgId, bundleId, version, commitMsg, xmlString)
        return `SYNCED_TO: ${pckgId}/${bundleId} \n COMMIT_MSG: ${res} `
    })

    this.on('deployKarafFromPackage', async (req) => {
        const [{ Id: bundleId }] = req.params
        const { pckgId } = req.data
        const res = await deployBundleToKaraf(pckgId, bundleId)
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

    this.on('READ', 'FakeDesigntimeArtifacts', async (req, next) => {
        if (req.params.length == 2) { // detail-detail
            const [{ Id: PackageId }, { Id, Type }] = req.params
            return {
                Id, Type, PackageId,
                Content: getBundleXml(PackageId, Id, Type),
                ArtifactURL: `${CPI_TENANT_URL}/shell/design/contentpackage/${PackageId}/${mapToArtifactDT[Type]}/${Id}`
            }
        } else return next()
    })

    this.on('READ', 'IntegrationRuntimeArtifacts', async (req, next) => {
        if (req.params.length == 1) { // details
            const [{ Id }] = req.params
            const q = SELECT.from('IntegrationRuntimeArtifacts').where({ Id })
            req.query = q
        }
        const result = await cpi.run(req.query)
        if (result.length > 1) return result // only allow one by one
        for (let r of result) {
            const headers = await webshell.run(`headers ${r.Id}`)
            const [_, artifactId] = headers.split("\n").find(l => l.startsWith('SAP-ArtifactId')).split(" = ")
            r.DeployURL = `${CPI_TENANT_URL}/Operations/${DownloadContentCommand}?artifactIds=${artifactId}`
        }
        return result
    })

});