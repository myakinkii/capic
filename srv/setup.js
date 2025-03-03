const fs = require('fs')
const { spawn } = require('child_process')
const { rezipBundle } = require('./lib/BundleHandler')
const { handleJarsAsync, handleWarAsync } = require('./lib/util/setupFuncs')

// we are in single user mode, so we can do this ))
const temp = {
    cdsRcPars: {
        "requires": {
            "cpi": {
                "credentials": {}
            },
            "iflow": {
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
        const { requires: { cpi: { credentials: cpi }, iflow: { credentials: iflow } } } = temp.cdsRcPars
        return { cpi: beautify(cpi, null, 2), iflow: beautify(iflow, null, 2) }
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

    this.on("checkCreateFolders", async (req, next) => {
        const { param } = req.data
        let dir = temp.envPars[param]
        if (!fs.existsSync(dir)) fs.mkdirSync(dir)
        if (param == 'FTP_DIR' && !fs.existsSync(dir = `${dir}/webshell`)) fs.mkdirSync(dir)
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

    this.on('checkWarRetry', async (req) => {
        const downloadDir = temp.envPars.JAR_DIR

        const warDirExists = fs.existsSync(`${downloadDir}/war`)
        if (warDirExists) return ''

        try {
            return fs.readdirSync(downloadDir).find(f => f.endsWith('.war'))
        } catch (e) {
            // no war or dir itself
        }
    })

    const downloader = await cds.connect.to('download')

    this.on('setupDownload', async (req) => {

        const downloadDir = temp.envPars.JAR_DIR
        if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir)

        let { warName } = req.data
        if (!warName) warName = await handleJarsAsync(downloader, 1, downloadDir)

        try {
            await handleWarAsync(downloader, warName, downloadDir)
            return ''
        } catch (e) {
            return '_' + warName
        }
    })

    this.on('setupKaraf', async (req) => {

        return new Promise((resolve, reject) => {

            const karafSetupScript = `${process.cwd()}/srv/lib/util/setup.js`
            const st = spawn(process.execPath, [karafSetupScript], {
                env: temp.envPars, shell: true, stdio: 'inherit'
            })

            st.on('exit', resolve)
        })
    })

})