
const JAR_DIR = process.env.JAR_DIR || './jars'
const KARAF_PATH = process.env.KARAF_PATH || './karaf'

const { execSync } = require('child_process')
const makeCpCmd = (files, prefix, dst) => `cp ${files.map(j => `${prefix}/${j}`).join(' ')} ${dst}`
const makeInstallCmd = (feats) => `./bin/client feature:install ${feats.join(' ')}`

// enable remote shell in etc/users.properties (https://karaf.apache.org/manual/latest/remote)
const karafFeatures = [
    'aries-proxy', 'aries-blueprint', 'feature', 'shell', 'shell-compat', 'deployer', 'bundle', 'config', 'diagnostic', 'instance', 'jaas', 'log', 'package', 'service', 'system', 'kar', 'ssh', 'management', 'eventadmin', 'scr', 'pax-url-wrap', 'standard',
    'transaction-api', 'transaction-manager-geronimo', 'transaction', 'eclipselink', 'jndi', 'jdbc', 'subsystems',
    'jpa',
    'pax-jdbc', 'pax-jdbc-config', 'pax-jdbc-spec', 'pax-transx-tm-api', 'pax-transx-tm-geronimo', 'pax-web-core', 'pax-web-http-tomcat', 'pax-web-jsp', 'pax-web-tomcat', 'pax-web-war', 'pax-web-whiteboard'
]

const jarsFromCache = [
    'org.apache.servicemix.specs.activation-api', 
    'javax.mail',
    'gson',
    'stax-ex',
    'org.apache.servicemix.specs.jaxws-api', 
    'jakarta.jws-api',
    'org.apache.servicemix.specs.saaj-api',
    'woodstox-core', 
    'stax2-api',
    'commons-lang3'
]

const jarsFromWar = [
    'org.apache.camel.camel-core-languages',
    'org.apache.camel.karaf.camel-blueprint',
    'org.apache.camel.camel-ftp',
    'com.sap.it.script.custom-development',
    'com.sap.it.script.script.artifact.osgi',
    'com.sap.it.script.com.sap.groovy.script.engine',
    'org.quartz-scheduler.quartz',
    'org.apache.camel.camel-quartz',
    'org.apache.camel.camel-direct',
    'org.apache.camel.camel-directvm',
    'com.sap.it.saxonee',
    'com.sap.it.iflow.saxonee',
    'org.apache.camel.camel-xpath',
    'org.apache.camel.camel-dataformat',
    'com.sap.esb.camel.core.camel.xmljson',
    'com.sap.esb.xi.mapping.rt',
    'com.sap.esb.camel.esr.mapping.camel.xi.mapping',
    'com.sap.esb.security',
    'com.sap.esb.camel.security.camel.security.cms',
    'com.sap.esb.camel.core.endpoint.configurator.api',
    'com.sap.it.script.com.sap.it.script.fragment.camel.impl' // this guy is not resolved for some reason
]

const karafFeaturesInstall = makeInstallCmd(karafFeatures)

const warsDir = JAR_DIR + '/war'
const { infos, deps, resolved, unresolved } = require('./setupFuncs').doMagic(warsDir, jarsFromWar)
const copyFromWar = makeCpCmd(jarsFromWar.map( j => j+'-*' ).concat(resolved), warsDir, KARAF_PATH+'/deploy')

const cacheDir = JAR_DIR
const copyFromCache = makeCpCmd(jarsFromCache.map( j => j+'-*' ), cacheDir, KARAF_PATH+'/deploy')

const [_, __, dryRun] = process.argv

if (dryRun) {
    console.log('manual jars from cache')
    console.log(copyFromCache)
    console.log()
    console.log('info about', warsDir)
    console.log('jars read', Object.keys(infos).length)
    console.log('imports found', Object.keys(deps.imports).length)
    console.log('exports found', Object.keys(deps.exports).length)
    console.log('possible collisions', Object.entries(deps.exports).filter(([_, v]) => v.length > 1).length)
    console.log()
    console.log('number of jars to resolve', jarsFromWar.length)
    console.log('resolved', resolved.sort())
    console.log('unresolved', unresolved.sort())
    console.log()
    console.log(copyFromWar)
    console.log()
    console.log('karaf features install')
    console.log(karafFeaturesInstall)
} else { // run and hope for the best )
    // execSync(karafFeaturesInstall, { cwd: KARAF_PATH }) // investigate later
    execSync(copyFromCache)
    execSync(copyFromWar)
}
