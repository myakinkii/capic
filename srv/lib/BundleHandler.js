const fs = require('fs')
const { execSync } = require('child_process')
const { xml2js } = require('xml-js')

const CPI_EXPORT_PATH = process.env.CPI_EXPORT_PATH
const KARAF_PATH = process.env.KARAF_PATH

const deployBundleToKaraf = async (pckgId, bundleId) => {
    if (!KARAF_PATH) throw new Error('KARAF_PATH_NOT_SET')
    try {
        execSync(`cp ${CPI_EXPORT_PATH}/${pckgId}/${bundleId}/OSGI-INF/blueprint/beans.xml ${KARAF_PATH}/deploy/${bundleId}.xml`)
    } catch (err) {
        console.error(err.message)
        throw new Error('DEPLOY_FAILED')
    }
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

        execSync(`git add . && git commit -m '${bundleId} - ${bundleVersion} - ${commitMsg}'`, { cwd: exportDir })
    } catch (err) {
        const errMsg = err.stderr?.toString() || err.stdout?.toString() || err.message
        console.error(errMsg)
        throw new Error('SOMETHING_WENT_WRONG')
    }

    return 'ok'
}

module.exports = {
    syncBundleToPackageRepo,
    deployBundleToKaraf
}