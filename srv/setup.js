const fs = require('fs')
const { spawn } = require('child_process')
const { rezipBundle } = require('./lib/BundleHandler')

// we are in single user mode, so we can do this ))
const temp = {
    cdsRcPars: {
        "requires": {
            "cpi": {
                "credentials": {}
            },
            "webshell": {
                "credentials": {}
            }
        }
    },
    envPars: {
        CPI_TENANT_URL: '',
        CPI_EXPORT_PATH: './samples',
        KARAF_PATH: '../karaf',
        FTP_DIR: '../ftp',
        JAR_DIR: '../jars'
    }
}

const fileNames = { envPars: process.cwd() + '/.env', cdsRcPars: process.cwd() + '/.cdsrc.json' }

try {
    const cdsrcData = fs.readFileSync(fileNames.cdsRcPars, 'utf8')
    if (cdsrcData != '{}') temp.cdsRcPars = JSON.parse(cdsrcData) // empty file is crashing cds itself
} catch (e) {
    // do nothing
}

try {
    const envData = fs.readFileSync(fileNames.envPars, 'utf8')
    Object.assign(temp.envPars, envData.split("\n").filter(r => !!r).reduce((prev, cur) => {
        const [key, val] = cur.split('=')
        prev[key] = val
        return prev
    }, {}))
} catch (e) {
    // do nothing
}

module.exports = cds.service.impl(async function () {

    this.on('READ', 'EnvPars', async (req, next) => temp.envPars)
    this.on('UPDATE', 'EnvPars', async (req, next) => Object.assign(temp.envPars, req.data))

    const beautify = require("json-beautify")

    this.on('READ', 'CdsRcPars', async (req, next) => {
        const { requires: { cpi: { credentials: cpi }, webshell: { credentials: webshell } } } = temp.cdsRcPars
        return { cpi: beautify(cpi, null, 2), webshell: beautify(webshell, null, 2) }
    })

    this.on('UPDATE', 'CdsRcPars', async (req, next) => {
        const merge = Object.entries(req.data).reduce((prev, cur) => {
            const [key, val] = cur
            try {
                const pars = JSON.parse(val)
                prev[key] = { credentials: { ...(pars.oauth || pars) } }
                return prev
            } catch (e) {
                return prev
            }
        }, {})
        Object.assign(temp.cdsRcPars.requires, merge)
    })

    const prepareData = {
        envPars: (obj) => Object.entries(obj).map(([k, v]) => `${k}=${v || ''}`).join('\n'),
        cdsRcPars: (obj) => beautify(obj, null, 2)
    }

    this.on('persist', async (req, next) => {
        const { pars } = req.data
        fs.writeFileSync(fileNames[pars], prepareData[pars](temp[pars]))
    })

    const cpi = await cds.connect.to('cpi')

    const mapToArtifactDT = {
        INTEGRATION_FLOW: 'IntegrationDesigntimeArtifacts',
        SCRIPT_COLLECTION: 'ScriptCollectionDesigntimeArtifacts',
        MESSAGE_MAPPING: 'MessageMappingDesigntimeArtifacts'
    }

    this.on('READ', 'RezipTypes', async (req, next) => {
        return Object.keys(mapToArtifactDT).map(Id => ({ Id }))
    })

    this.on('READ', 'RezipPackages', async (req, next) => {
        return fs.readdirSync(`${temp.envPars.CPI_EXPORT_PATH}`).filter(f => !f.startsWith('.')).map(Id => ({ Id }))
    })

    this.on('READ', 'Rezip', async (req, next) => ({
        objType: 'INTEGRATION_FLOW',
        createPkgFlag: true,
        pkgId: '',
        bundleId: '',
        srcPkgId: '',
        srcBundleId: '',
    }))

    this.on('UPDATE', 'Rezip', async (req, next) => req.data)

    this.on('rezip', async (req, next) => {

        const { objType, createPkgFlag, pkgId, bundleId, srcPkgId, srcBundleId } = req.data.task

        if (createPkgFlag) {
            await cpi.run(cds.create('IntegrationPackages').entries({ Id: pkgId, Name: pkgId, ShortText: pkgId }))
        }

        const entity = mapToArtifactDT[objType]

        const artifact = await cpi.run(cds.create(mapToArtifactDT[objType]).entries({
            Id: bundleId, Name: bundleId, PackageId: pkgId
        }))

        const dummyData = await cpi.run(`/${entity}(Id='${artifact.Id}',Version='${artifact.Version}')/$value`)

        const srcDir = `${temp.envPars.CPI_EXPORT_PATH}/${srcPkgId}/${srcBundleId}`
        const rezip64 = rezipBundle(dummyData, srcDir)

        await cpi.run(cds.delete(entity, { Id: artifact.Id, Version: artifact.Version }))

        return await cpi.run(cds.create(entity, { Id: artifact.Id, Version: artifact.Version }).entries({
            Name: artifact.Name,
            Id: artifact.Id,
            PackageId: pkgId,
            ArtifactContent: rezip64
        }))
    })

    this.on('setupDownload', async (req) => {

        const downloadDir = temp.envPars.JAR_DIR
        if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir)

        const { warName } = req.data
        return new Promise( (resolve, reject) => {
            
            const jarDownloadScript = `${process.cwd()}/srv/lib/util/download.js`
            const dw = spawn(process.execPath, [jarDownloadScript, warName ], {
                env: temp.envPars, shell: true, stdio: 'pipe'
            })

            let result
            dw.stdout.on('data', (data) => result = data )
            dw.on('exit', (code) => resolve(result.toString()) )
        })
    })

    this.on('setupKaraf', async (req) => {

        return new Promise( (resolve, reject) => {

            const karafSetupScript = `${process.cwd()}/srv/lib/util/setup.js`
            const st = spawn(process.execPath, [karafSetupScript], {
                env: temp.envPars, shell: true, stdio: 'inherit'
            })

            st.on('exit', resolve)
        })
    })

})