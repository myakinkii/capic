const fs = require('fs')
const { execSync } = require('child_process')

let JAR_DIR = './_jars'
const localCpiUrl = 'http://localhost:4004/cpi'
const karafHome = `${localCpiUrl}/file_download/home/vcap/app`
const karafCacheUrl = `${karafHome}/data/cache`
const karafWarUrl = `${karafHome}/webapps`

const getInfo = () => execSync(`curl ${localCpiUrl}/webshell/info > _info.txt`, { cwd: JAR_DIR })
const getBundleInfo = (n) => execSync(`curl ${karafCacheUrl}/bundle${n}/bundle.info`, { cwd: JAR_DIR }).toString().split('\n')[1]
const formatJarInfo = (n, info) => [n, ...info.split(":")[1].split("/")]

const isJar = (info) => info.startsWith("mvn")
const getJarName = (info) => info.split(":")[1].split("/").filter((s, i) => !!i).join("-")
const getJar = (n, jarName) => execSync(`curl ${karafCacheUrl}/bundle${n}/version0.0/bundle.jar > ${jarName}.jar`, { cwd: JAR_DIR })

const isWar = (info) => info.startsWith("jar")
const getWarName = (info) => info.split("!")[0].split("/")[7]
const getWar = (warName) => execSync(`curl ${karafWarUrl}/${warName} > _${warName}`, { cwd: JAR_DIR })
const unzipWar = (warName) => execSync(`unzip _${warName} -d war`, { cwd: JAR_DIR })

let [_, __, startId, dir] = process.argv

if (!startId) startId = 1

if (!Number.isInteger(startId = +startId)) {
    console.log('not an integer')
    process.exit()
}

if (dir) JAR_DIR = dir

try {
    fs.readdirSync(JAR_DIR)
} catch (e) {
    console.log('no such dir')
    process.exit()
}

console.log('getting info into _info.txt)')
getInfo()

const csv = []
console.log('starting from', startId, 'to', JAR_DIR)
let info
do {
    info = getBundleInfo(startId)
    if (isJar(info)) {
        console.log('getting jar from cache', info)
        getJar(startId, getJarName(info))
        csv.push(formatJarInfo(startId, info))
    }
    startId++
} while (!isWar(info))

const warName = getWarName(info)
console.log('getting war from webapps', warName)
// getWar(warName)
// unzipWar(warName)

console.log('writing csv')
// fs.writeFileSync(`${JAR_DIR}/_bundles.csv`, csv.map(b => b.join(";")).join("\n"))

