const fs = require('fs')
const { execSync } = require('child_process')
const { xml2js } = require('xml-js')

const CPI_EXPORT_PATH = process.env.CPI_EXPORT_PATH
const KARAF_PATH = process.env.KARAF_PATH

const xmlFormat = require('xml-formatter')

const objTypeToPathMap = {
    INTEGRATION_FLOW: (_, bundlePath, bundleId) => `${KARAF_PATH}/deploy/${bundleId}.xml`,
    // INTEGRATION_FLOW: (_, bundlePath, bundleId) => `${bundlePath}/OSGI-INF/blueprint/beans.xml`,
    VALUE_MAPPING: (_, bundlePath, bundleId) => `${bundlePath}/value_mapping.xml`,
    MESSAGE_MAPPING: (_, bundlePath, bundleId) => `${bundlePath}/src/main/resources/mapping/${bundleId}.mmap`,
    SCRIPT_COLLECTION: (_, bundlePath, bundleId) => `${bundlePath}/META-INF/MANIFEST.MF` // not a valid xml though
}

const saveBundleXml = ({ Id: bundleId, PackageId: pckgId, Content: data }) => {
    data = data.replaceAll(' /$', ' $') // some strange stuff in ace editor
    fs.writeFileSync(`${CPI_EXPORT_PATH}/${pckgId}/${bundleId}/blueprint-local.xml`, data) // kinda backup of local flow
    fs.writeFileSync(`${KARAF_PATH}/deploy/${bundleId}.xml`, data)
}

const saveMtar = (pckgId, buffer) => {
    const fileName = `${CPI_EXPORT_PATH}/${pckgId}/export.mtar`
    fs.writeFileSync(fileName, buffer)
}


const getMtarProps = (propFiles, pkgId, bundleId) => {
    // { #, !, =, : } must be unescaped it seems (+ SPACE)
    try {
        const data = fs.readFileSync(`${CPI_EXPORT_PATH}/${pkgId}/${bundleId}/resources/${propFiles}.prop`, 'utf8')
        return data.split("\n").filter(p => !!p && !p.startsWith("#")).reduce((prev, cur) => {
            const [k, v] = cur.split("=")
            prev[k] = v.replaceAll('\\:', ':') // figure out how unescape stuff properly
            return prev
        }, {})
    } catch (e) {
        return {} // most likely not found if wasn't synced to git yet.
    }
}

const getMtarPropFiles = (pkgId) => {
    if (!pkgId) return []
    const artifacts = fs.readdirSync(`${CPI_EXPORT_PATH}/${pkgId}`, { withFileTypes: true })
    const propFiles = {}
    artifacts.filter(a => a.isDirectory()).forEach(dir => {
        try {
            fs.readdirSync(`${dir.parentPath}/${dir.name}/resources`)
                .filter(f => !f.endsWith('.propdef'))
                .forEach(f => {
                    const [name] = f.split(".")
                    if (!propFiles[name]) propFiles[name] = 0
                    propFiles[name]++
                })
        } catch (e) {
            // not an iflow
        }
    })
    return Object.entries(propFiles).map(([file, qty]) => ({ file, qty }))
}

const findBundleInfo = (integrationComponentsList, Id) => {
    const infos = getBundleInfos(integrationComponentsList)
    return infos.find(info => info.symbolicName._text == Id)
}

const getBundleInfos = (integrationComponentsList) => {
    const xml = xml2js(integrationComponentsList, { compact: true, spaces: 4 })
    const artifactInfo = xml["com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentsListResponse"].artifactInformations || []
    return Array.isArray(artifactInfo) ? artifactInfo : [artifactInfo] // cuz when just one is deployed we have obj here... smh
}

const getBundleXml = (pckgId, bundleId, objType) => {
    try {
        const bundlePath = `${CPI_EXPORT_PATH}/${pckgId}/${bundleId}`
        const filePath = objTypeToPathMap[objType]`${bundlePath}/${bundleId}`
        const data = fs.readFileSync(filePath, 'utf8')
        return xmlFormat(data)
    } catch (e) {
        return ''
    }
}

const getDeployedToKarafBundles = () => {
    if (!KARAF_PATH) return []
    try {
        return fs.readdirSync(`${KARAF_PATH}/deploy`)
    } catch (e) {
        return []
    }
}

const deployBundleToKaraf = async (pckgId, bundleId, fromLocalBlueprint) => {

    const fromXml = (tryLocal) => {
        try {
            const blueprint = tryLocal ? 'blueprint-local.xml' : 'OSGI-INF/blueprint/beans.xml'
            execSync(`cp ${CPI_EXPORT_PATH}/${pckgId}/${bundleId}/${blueprint} ${KARAF_PATH}/deploy/${bundleId}.xml`)
            return blueprint
        } catch (err) {
            return false
        }
    }

    const fromJar = () => {
        try {
            const bundle = 'bundle.jar'
            execSync(`cp ${CPI_EXPORT_PATH}/${pckgId}/${bundleId}/${bundle} ${KARAF_PATH}/deploy/${bundleId}.jar`)
            return bundle
        } catch (err) {
            return false
        }
    }

    if (!KARAF_PATH) throw new Error('KARAF_PATH_NOT_SET')
    let from
    if (from = fromXml(fromLocalBlueprint)) return from
    else if (from = fromJar()) return from
    else throw new Error('DEPLOY_FAILED')
}

const syncBundleToPackageRepo = async (pckgId, bundleId, bundleVersion, commitMsg, xmlString) => {

    let bundleName

    try {
        const xml = xml2js(xmlString, { compact: true, spaces: 4 })
        const fullDoc = xml["com.sap.it.nm.commands.deploy.DownloadContentResponse"]

        if (fullDoc) {
            buffer = Buffer.from(fullDoc.artifacts.content._text, 'base64')
            bundleName = fullDoc.artifacts._attributes.name
        } else {
            buffer = Buffer.from(xml.content._text, 'base64') // just <content>base64_encoded_jar</content> part
            bundleName = bundleId // as if you knew what you were doing
        }
    } catch (err) {
        console.error(err)
        throw new Error('INVALID_XML_STRING')
    }

    if (bundleName != bundleId) throw (new Error('XML_BUNDLE_MISMATCH'))

    try {
        let exportDir = CPI_EXPORT_PATH
        if (!exportDir) throw new Error('CPI_EXPORT_PATH_NOT_SET')
        if (!fs.existsSync(exportDir = `${exportDir}/${pckgId}`)) {
            fs.mkdirSync(exportDir)
            execSync('git init', { cwd: exportDir })
        }
        if (!fs.existsSync(exportDir = `${exportDir}/${bundleId}`)) fs.mkdirSync(exportDir)

        const fileName = `${exportDir}/bundle.jar`
        fs.writeFileSync(fileName, buffer)
        execSync('unzip -o bundle.jar', { cwd: exportDir })

        const msg = `${bundleId} - ${bundleVersion} - ${commitMsg}`
        const res = execSync(`git add -- . ':!blueprint.xml' . && git commit -m '${msg}'`, { cwd: exportDir })
        return res.toString()
    } catch (err) {
        const errMsg = err.stderr?.toString() || err.stdout?.toString() || err.message
        console.error(errMsg)
        return errMsg
        throw new Error('SOMETHING_WENT_WRONG')
    }

    return 'ok'
}

const rezipBundle = (data, srcDir) => {

    let tmpDir = './.tmp'
    if (fs.existsSync(tmpDir)) execSync(`rm -rf ${tmpDir}`)

    fs.mkdirSync(tmpDir)
    fs.writeFileSync(`${tmpDir}/bundle.zip`, Buffer.from(data))
    execSync('unzip -o bundle.zip', { cwd: tmpDir })

    execSync('rm bundle.zip', { cwd: tmpDir })
    execSync('rm -rf ./src', { cwd: tmpDir })

    execSync(`cp -rp ${srcDir}/src ${tmpDir}/src`)
    execSync('zip -D -r rezip.zip ./', { cwd: tmpDir })

    return fs.readFileSync(`${tmpDir}/rezip.zip`).toString('base64')
}

module.exports = {
    rezipBundle,
    getMtarProps,
    getMtarPropFiles,
    saveMtar,
    saveBundleXml,
    getBundleInfos,
    findBundleInfo,
    getBundleXml,
    syncBundleToPackageRepo,
    getDeployedToKarafBundles,
    deployBundleToKaraf
}