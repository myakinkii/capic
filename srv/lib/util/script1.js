const fs = require('fs')

const { getKarafInfo, handleJars, handleWar } = require('./setupFuncs')

let JAR_DIR = './jars'

const [_, __, startIdOrWarFile, dir] = process.argv

if (dir) JAR_DIR = dir

if (!fs.existsSync(JAR_DIR)) {
    console.log('no such dir')
    process.exit()
}

let startId, warFile
if (!startIdOrWarFile) startId = 1
if (!Number.isInteger(startId = +startIdOrWarFile)) warFile = startIdOrWarFile

if (!warFile) {
    console.log('getting info into _info.txt')
    getKarafInfo(JAR_DIR)

    console.log('starting download from', startId, 'to', JAR_DIR)
    warFile = handleJars(startId, JAR_DIR)
}

try {
    console.log('getting war', warFile)
    handleWar(warFile, JAR_DIR)
} catch (e){
    console.log('failed to download war')
}
