const fs = require('fs')
const { execSync } = require('child_process')

const localCpiUrl = 'http://localhost:4004/cpi'
const karafDownloadHome = `${localCpiUrl}/files/download/home/vcap/app`

const getKarafInfo = (JAR_DIR) => execSync(`curl ${localCpiUrl}/webshell/info > _info.txt`, { cwd: JAR_DIR })

const handleJars = (startId, JAR_DIR ) => {

    const karafCacheUrl = `${karafDownloadHome}/data/cache`
    
    const getBundleInfo = (n) => execSync(`curl ${karafCacheUrl}/bundle${n}/bundle.info`, { cwd: JAR_DIR }).toString().split('\n')[1]
    const formatJarInfo = (n, info) => [n, ...info.split(":")[1].split("/")]
    
    const isJar = (info) => info.startsWith("mvn")
    const getJarName = (info) => info.split(":")[1].split("/").filter((s, i) => !!i).join("-")
    const getJar = (n, jarName) => execSync(`curl ${karafCacheUrl}/bundle${n}/version0.0/bundle.jar > ${jarName}.jar`, { cwd: JAR_DIR })
    
    const isWar = (info) => info.startsWith("jar")
    const getWarName = (info) => info.split("!")[0].split("/")[7]

    const csv = []
    let info
    do {
        info = getBundleInfo(startId)
        if (isJar(info)) {
            getJar(startId, getJarName(info))
            csv.push(formatJarInfo(startId, info))
        }
        startId++
    } while (!isWar(info))

    fs.writeFileSync(`${JAR_DIR}/_bundles.csv`, csv.map(b => b.join(",")).join("\n"))

    return getWarName(info)
}

const handleWar = (warName, JAR_DIR) => {

    const karafWarUrl = `${karafDownloadHome}/webapps`

    const getWar = (warName) => execSync(`curl ${karafWarUrl}/${warName} > _${warName}`, { cwd: JAR_DIR })
    const unzipWar = (warName) => execSync(`unzip _${warName} -d war`, { cwd: JAR_DIR })

    getWar(warName) // its around 200mb, can crash cpi, works unreliably
    unzipWar(warName)
}

const getJarList = (JAR_DIR) => { try { return fs.readdirSync(JAR_DIR) } catch (e) { return [] } }

const getManifest = (JAR_DIR, jarFile) => { try { return execSync(`unzip -p ${jarFile} META-INF/MANIFEST.MF`, { cwd: JAR_DIR }).toString() } catch (e) { return '' } }

const extractTokens = (str) => { // not a proper parser, just some heuristics
    const firstArr = str.replaceAll(' ', '').split('",').map(i => i.split(";")[0])
    return firstArr.reduce((prev, cur) => prev.concat(...cur.split(",")), [])
}

const getManifestInfos = (JAR_DIR) => getJarList(JAR_DIR).reduce((infos, file) => {
    if (!file.endsWith('.jar')) return infos
    let buff = ''

    const raw = getManifest(JAR_DIR, file)
    if (!raw) return infos

    const lines = raw.split("\r\n").reduce((acc, chunk) => {
        if (!chunk.startsWith(' ')) { // new or next
            if (buff) acc.push(buff)
            buff = chunk
            return acc
        } else { // just add
            buff += chunk.trim()
            return acc
        }
    }, [])
    if (buff) lines.push(buff) // last part but maybe there's always a newline...

    const man = lines.filter(l => !!l).reduce((prev, cur) => {
        const match = cur.match(/([\w-]+)\:? (.*)/)
        const [_, k, v] = match
        prev[k] = v
        return prev
    }, {})

    const name = man['Bundle-SymbolicName'].split(';')[0] // can be singleton or something else...
    const key = file
    infos[key] = { name, jar: file }

    if (man['Export-Package']) infos[key].exports = extractTokens(man['Export-Package'])
    if (man['Import-Package']) infos[key].imports = extractTokens(man['Import-Package'])

    if (man['Require-Capability']) {
        const caps = man['Require-Capability'].replaceAll(' ', '').split(";")
        infos[key].caps = caps
    }
    return infos
}, {})

const calcDeps = (infos) => Object.values(infos).reduce((prev, cur) => {
    if (cur.imports) cur.imports.forEach(i => { if (!prev.imports[i]) prev.imports[i] = []; prev.imports[i].push(cur) })
    if (cur.exports) cur.exports.forEach(i => { if (!prev.exports[i]) prev.exports[i] = []; prev.exports[i].push(cur) })
    return prev
}, { imports: {}, exports: {} })

const resolveDeps = (deps, info, resolved) => {
    if (info.imports) info.imports.forEach(i => {
        const provs = deps.exports[i]
        if (!provs) {
            resolved[i] = false
        } else provs.forEach(p => {
            if (p.jar in resolved) return
            resolved[p.jar] = true
            resolveDeps(deps, p, resolved)
        })

    })
}

const findRoot = (infos, jar) => infos[jar] || infos[Object.keys(infos).find(j => j.startsWith(jar))]

const extractArray = (obj, flag) => Object.entries(obj).filter(([_, v]) => v === flag).map(e => e[0])

const doMagic = (path, jars) => {

    const infos = getManifestInfos(path)
    const deps = calcDeps(infos)
    const results = {}

    jars.forEach( jar => {
        const root = findRoot(infos, jar)
        if (root) resolveDeps(deps, root, results)
    })
    return { infos, deps, resolved: extractArray(results, true), unresolved: extractArray(results, false)}
}

module.exports = {
    getKarafInfo,
    handleJars,
    handleWar,
    doMagic
}