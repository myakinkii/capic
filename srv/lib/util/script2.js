const fs = require('fs')
const { execSync } = require('child_process')

let JAR_DIR = './jars/war' // cuz basic jars come from features (we copy all those files manually)

const getList = () => { try { return fs.readdirSync(JAR_DIR) } catch (e) { return [] } }

const getManifest = (jarFile) => { try { return execSync(`unzip -p ${jarFile} META-INF/MANIFEST.MF`, { cwd: JAR_DIR }).toString() } catch (e) { return '' } }

let [_, __, jar, showStats] = process.argv

if (!jar) process.exit()

const parts = jar.split("/")

jar = parts.pop()

if (parts.length) JAR_DIR = parts.join("/")

const infos = getList().reduce((infos, file) => {
    if (!file.endsWith('.jar')) return infos
    let buff = ''

    const raw = getManifest(file)
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

function extractTokens(str) { // not a proper parser, just some heuristics
    const firstArr = str.replaceAll(' ', '').split('",').map(i => i.split(";")[0])
    return firstArr.reduce((prev, cur) => prev.concat(...cur.split(",")), [])
}

const deps = Object.values(infos).reduce((prev, cur) => {
    if (cur.imports) cur.imports.forEach(i => { if (!prev.imports[i]) prev.imports[i] = []; prev.imports[i].push(cur) })
    if (cur.exports) cur.exports.forEach(i => { if (!prev.exports[i]) prev.exports[i] = []; prev.exports[i].push(cur) })
    return prev
}, { imports: {}, exports: {} })

if (showStats) {
    console.log('info about', JAR_DIR)
    console.log('jars read', Object.keys(infos).length)
    console.log('imports found', Object.keys(deps.imports).length)
    console.log('exports found', Object.keys(deps.exports).length)
    console.log('possible collisions', Object.entries(deps.exports).filter(([_, v]) => v.length > 1).length)
}

const resolveDeps = (info, resolved) => {
    if (info.imports) info.imports.forEach(i => {
        const provs = deps.exports[i]
        if (!provs) {
            resolved[i] = false
        } else provs.forEach(p => {
            if (p.jar in resolved) return
            resolved[p.jar] = true
            resolveDeps(p, resolved)
        })

    })
}

let root = infos[jar]
if (!root) {
    jar = Object.keys(infos).find(j => j.startsWith(jar)) // first match
    if (jar) root = infos[jar]
}
if (!root) process.exit()
const resolved = {}
resolveDeps(root, resolved)

if (showStats) console.log('unresolved', Object.entries(resolved).filter(([_, v]) => v === false).map(e => e[0]).sort())
const found = Object.entries(resolved).filter(([_, v]) => v === true).map(e => e[0])
console.log('cp', `${JAR_DIR}/${jar}`, found.map(j => `${JAR_DIR}/${j}`).join(' ')) // and hope for the best )
