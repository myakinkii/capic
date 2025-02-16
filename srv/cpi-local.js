const {syncBundleToPackageRepo, deployBundleToKaraf} = require('./lib/BundleHandler')

const CPI_TENANT_URL = process.env.CPI_TENANT_URL || ''
const IntegrationComponentsListCommand = 'com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentsListCommand'
const DownloadContentCommand = 'com.sap.it.nm.commands.deploy.DownloadContentCommand'

module.exports = cds.service.impl(async function() {
    
    const cpi = await cds.connect.to('cpi')
    const webshell = await cds.connect.to('webshell')

    this.on('syncGit', async (req) => {
        const [ {Id:pckgId}, {Id:bundleId, Version:bundleVersion} ] = req.params
        const { xmlString, commitMsg } = req.data
        return syncBundleToPackageRepo(pckgId, bundleId, bundleVersion, commitMsg, xmlString)
    })

    this.on('syncGitPackage', async (req) => {
        const [ {Id:bundleId, Version:bundleVersion} ] = req.params
        const { xmlString, commitMsg, pckgId } = req.data
        return syncBundleToPackageRepo(pckgId, bundleId, bundleVersion, commitMsg, xmlString)
    })

    this.on('deployKaraf', async (req) => {
        const [ {Id:pckgId}, {Id:bundleId, Version:bundleVersion} ] = req.params
        return deployBundleToKaraf(pckgId, bundleId)
    })
  
    this.on('READ', 'IntegrationPackages', async (req, next) => {
        const result = await cpi.run(req.query)
        Object.values( req.query.SELECT.one ? [result]: result ).forEach( r => { // can have single package or list here
            r.PackageURL = `${CPI_TENANT_URL}/shell/design/contentpackage/${r.Id}?section=ARTIFACTS`
        })
        return result
    })

    // READABLE ONLY VIA PACKAGE NAV PROPERTY
    this.on('READ', 'IntegrationDesigntimeArtifacts', async (req, next) => cpi.run(req.query) )
    this.on('READ', 'ScriptCollectionDesigntimeArtifacts', async (req, next) => cpi.run(req.query) )
    this.on('READ', 'ValueMappingDesigntimeArtifacts', async (req, next) => cpi.run(req.query) )
    this.on('READ', 'MessageMappingDesigntimeArtifacts', async (req, next) => cpi.run(req.query) )

    this.on('READ', 'IntegrationRuntimeArtifacts', async (req, next) => {
        if (req.params.length == 2){ // via nav property pkg -> runtime
            const [ {Id:pckgId}, {Id, Version} ] = req.params
            const q = SELECT.from('IntegrationRuntimeArtifacts').where({Id, Version})
            req.query = q
        } else if (req.params.length == 1){ // details
            const [ {Id, Version} ] = req.params
            const q = SELECT.from('IntegrationRuntimeArtifacts').where({Id, Version})
            req.query = q
        }
        const result = await cpi.run(req.query)
        if (result.length > 1 ) return result // only allow one by one
        for (let r of result ){
            const headers = await webshell.run(`headers ${r.Id}`)
            const [_,artifactId] = headers.split("\n").find( l => l.startsWith('SAP-ArtifactId')).split(" = ")
            r.DeployURL = `${CPI_TENANT_URL}/Operations/${DownloadContentCommand}?artifactIds=${artifactId}`
        }
        return result
    })

  });