
const { getKarafInfo, handleJars, handleWar } = require('./setupFuncs')

const JAR_DIR = process.env.JAR_DIR || './jars'

const [_, __, startIdOrWarFile] = process.argv

let startId, warFile
if (!startIdOrWarFile) startId = 1
if (!Number.isInteger(startId = +startIdOrWarFile)) warFile = startIdOrWarFile

try {
    getKarafInfo(JAR_DIR)
    if (!warFile) warFile = handleJars(startId, JAR_DIR)
    handleWar(warFile, JAR_DIR)
    process.stdout.write('')
} catch (e){
    process.stdout.write(warFile)
}
