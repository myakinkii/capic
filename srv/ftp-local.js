const fs = require('fs')
const moment = require('moment')

const { getDeployedToKarafBundles } = require('./lib/BundleHandler')

const FTP_DIR = process.env.FTP_DIR

const ftpIn = {
    inputFileName: 'DATA_IN',
    context: ''
}

module.exports = cds.service.impl(async function() {

    const cpi = await cds.connect.to('cpi')

    this.on('READ', 'DeployedArtifacts', async (req, next) => {
        return getDeployedToKarafBundles().filter( f => f.endsWith('.xml')).map( f => ({Id: f.split('.')[0]}) )
    })

    this.on('READ', 'FtpIn', async (req, next) => {
        return {fileName: ftpIn.inputFileName, content:'', context: ftpIn.context }
    })

    const ctxdPath = (segm, fName) =>  `${FTP_DIR}${ ftpIn.context ?  '/' + ftpIn.context : '' }${segm[0]}${fName||''}`

    this.on("checkCreateFolders",async (req, next) => {
        [ctxdPath`/`, ctxdPath`/in`, ctxdPath`/in_cache`, ctxdPath`/out`].forEach(d => { 
            if (!fs.existsSync(d)) fs.mkdirSync(d)
        })
    })

    this.on('UPDATE', 'FtpIn', async (req, next) => {
        const {context, content} = req.data
        if (!content && (ftpIn.context = context) ) return // we update EITHER / OR
        try {
            fs.writeFileSync(ctxdPath`/in/${ftpIn.inputFileName}`, content||'')
            const now = moment(new Date()).format('YYYY-MM-DD-dd-HH-mm-ss')
            fs.copyFileSync(ctxdPath`/in/${ftpIn.inputFileName}`,ctxdPath`/in_cache/${now}`)
        } catch (e){
            return
        }
    })

    this.on('unlinkInFile', async(req,next) =>{
        const {fileName} = req.data
        try {
            fs.unlinkSync(ctxdPath`/in/${fileName}`)
        } catch (e) {
            throw new Error('NOT_FOUND')
        }
    })

    this.on('READ', 'FtpOut', async (req, next) => {
        try {
            return fs.readdirSync(ctxdPath`/out${''}`).map( f => {
                return {fileName: f, url: ctxdPath`/out/${f}`.replace(FTP_DIR,'/ftp') }
            })
        } catch (e){
            return  []
            throw new Error('NOT_FOUND')
        }
    })

    this.on('DELETE', 'FtpOut', async (req, next) => {
        const [{ fileName }] = req.params
        fs.unlinkSync(ctxdPath`/out/${fileName}`)
    })
})