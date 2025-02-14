const fs = require('fs')

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
        CPI_EXPORT_PATH: '',
        KARAF_PATH: '',
        FTP_DIR: '',
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
    Object.assign(temp.envPars, envData.split("\n").filter(r => !!r ).reduce((prev, cur) => {
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
        envPars: (obj) => Object.entries(obj).map(([k, v]) => `${k}=${v||''}`).join('\n'),
        cdsRcPars: (obj) => beautify(obj, null, 2)
    }

    this.on('persist', async (req, next) => {
        const { pars } = req.data
        fs.writeFileSync(fileNames[pars], prepareData[pars](temp[pars]))
    })

})