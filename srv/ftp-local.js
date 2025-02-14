const fs = require('fs')
const moment = require('moment')

const FTP_DIR = process.env.FTP_DIR || process.cwd() + '/test'
const inputFileName = 'DATA_IN'

module.exports = cds.service.impl(async function() {

    this.on('READ', 'FtpIn', async (req, next) => {
        return {fileName: inputFileName, content:''}
    })

    this.on('UPDATE', 'FtpIn', async (req, next) => {
        fs.writeFileSync(`${FTP_DIR}/in/${inputFileName}`, req.data.content||'')
        const now = moment(new Date()).format('YYYY-MM-DD-dd-HH-mm-ss')
        fs.copyFileSync(`${FTP_DIR}/in/${inputFileName}`,`${FTP_DIR}/in_cache/${now}`)
    })

    this.on('unlinkInFile', async(req,next) =>{
        const {fileName} = req.data
        try {
            fs.unlinkSync(`${FTP_DIR}/in/${fileName}`)
        } catch (e) {
            throw new Error('NOT_FOUND')
        }
    })

    this.on('READ', 'FtpOut', async (req, next) => {
        try {
            return fs.readdirSync(`${FTP_DIR}/out`).map( f => {
                return {fileName: f, url:`/ftp/out/${f}` }
            })
        } catch (e){
            throw new Error('NOT_FOUND')
        }
    })

    this.on('DELETE', 'FtpOut', async (req, next) => {
        const [{ fileName }] = req.params
        fs.unlinkSync(`${FTP_DIR}/out/${fileName}`)
    })
})