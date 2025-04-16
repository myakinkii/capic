const {
    syncBundleToPackageRepo, getDeployedToKarafBundles, deployBundleToKaraf,
    getBundleInfos, findBundleInfo, getBundleXml, saveBundleXml, saveMtar, getMtarPropFiles, getMtarProps
} = require('./lib/BundleHandler')

const CPI_TENANT_URL = process.env.CPI_TENANT_URL || ''

module.exports = cds.service.impl(async function () {

    const cpi = await cds.connect.to('cpi')
    const operations = await cds.connect.to('operations')
    const iflow = await cds.connect.to('iflow')
    const cas = await cds.connect.to('cas')

    const getSelf = async (id) => operations.run({ cmd: 'IntegrationComponentsList' })
        .then(list => findBundleInfo(list, id))

    const getArtifactIds = () => operations.run({ cmd: 'IntegrationComponentsList' })
        .then(list => getBundleInfos(list)
            .reduce((prev, { symbolicName: { _text: n }, id: { _text: id } }) => Object.assign(prev, { [n]: id }), {}))

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

    this.on('deployArtifactToCpi', async (req) => cpi.send('deploy', req.data))

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

    // IntegrationDesigntimeArtifacts params and resources (local files)
    // this.on('READ', 'Configurations', async (req, next) => cpi.run(req.query)
    //     .then(res => res.map(({ ParameterKey, ParameterValue }) => ({ [ParameterKey]: ParameterValue })))
    // ) // moved to mtar magic
    this.on('READ', 'Resources', async (req, next) => cpi.run(req.query)
        .then(res => res.map(({ Name }) => Name))
    )

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
    this.on('READ', 'DeployedArtifacts', async (req, next) => getDeployedToKarafBundles().map(f => ({ Id: f.split('.')[0] })))

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

    this.on('testIflowEndpoint', async (req) => {
        const { endpoint, text } = req.data
        let body, headers
        // body and headers are separated by empty line
        // BUT body can have empty lines too, but for now we dont care
        const parts = text.split('\n\n')
        if (parts.length == 1) {
            body = parts[0]
        } else {
            body = parts[1]
            headers = parts[0].split('\n').reduce((prev, cur) => {
                const [key, value] = cur.split(': ')
                prev[key] = value
                return prev
            }, {})
        }
        return iflow.run({ endpoint, body, headers }).catch(e => e.message)
    })

    // CAS mtar export magic
    const mtarDst = {
        pkgId: null,
        system: 'parameters'
    }

    this.on('READ', 'Configurations', async (req, next) => {
        const [{ Id }] = req.params
        const { pkgId, system } = mtarDst
        const props = getMtarProps(system, pkgId, Id)
        return cpi.run(req.query).then(res => res.map(({ ParameterKey, ParameterValue }) => {
            return {
                ParameterKey,
                ParameterValue,
                ParameterValueMtar: props[ParameterKey] || ''
            }
        }))
    })

    this.on('READ', 'CasResources', async (req, next) => {
        const resources = await cas.getResources()
        if (!req.query.SELECT.one) return resources
        const [{ id }] = req.params
        return resources.find(r => r.id == id)
    })

    this.on('READ', 'CasActivities', async (req, next) => {
        if (!req.query.SELECT.one) return []
        const [{ activityId }] = req.params
        return cas.getActivity(activityId)
    })

    this.on('getCasPropFiles', async (req, next) => {
        const { pkgId } = req.data
        mtarDst.pkgId = pkgId
        return getMtarPropFiles(pkgId)
    })
    
    this.on('READ', 'CasMtarDestination', async (req, next) => mtarDst)
    this.on('UPDATE', 'CasMtarDestination', async (req, next) => Object.assign(mtarDst, req.data))

    this.on('exportPackage', async (req) => {
        const { pkgId, resourceId } = req.data
        const activityId = await cas.exportPackage(pkgId, resourceId)
        return activityId
    })

    this.on('downloadMtar', async (req) => {
        const { pkgId, activityId } = req.data
        const buffer = await cas.downloadMtar(activityId)
        saveMtar(pkgId, buffer)
    })

});