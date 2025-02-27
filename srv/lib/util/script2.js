
let JAR_DIR = './jars/war' // cuz basic jars come from features (we copy all those files manually)

let [_, __, jar, showStats] = process.argv

if (!jar) process.exit()

const parts = jar.split("/")

jar = parts.pop()

if (parts.length) JAR_DIR = parts.join("/")

const { infos, deps, resolved, unresolved } = require('./setupFuncs').doMagic(JAR_DIR, [jar])

if (showStats) {
    console.log('info about', JAR_DIR)
    console.log('jars read', Object.keys(infos).length)
    console.log('imports found', Object.keys(deps.imports).length)
    console.log('exports found', Object.keys(deps.exports).length)
    console.log('possible collisions', Object.entries(deps.exports).filter(([_, v]) => v.length > 1).length)
    console.log()
    console.log('searched for', jar)
    console.log('resolved', resolved.sort())
    console.log('unresolved', unresolved.sort())
} else {
    console.log('cp', `${JAR_DIR}/${jar}-*`, resolved.map(j => `${JAR_DIR}/${j}`).join(' ')) // and hope for the best )
}
