const cds = require('@sap/cds')
const fs = require('fs')
const express = require('express')
const serveIndex = require('serve-index')
const proxy = require('express-http-proxy')
const xmlFormat = require('xml-formatter')
const beautify = require("json-beautify")

const FTP_DIR = process.env.FTP_DIR || process.cwd() + '/test'

const FtpSrv = require('ftp-srv')
const ftp_host = '0.0.0.0' // so that camel can connect to us, 'localhost' does not work
const ftp_port = 2021

cds.on('bootstrap', app => {

    const ftp = new FtpSrv({ url: `ftp://${ftp_host}:${ftp_port}`, pasv_url: ftp_host, anonymous: false })
    ftp.on('login', ({ connection, username, password }, resolve, reject) => resolve({ root: FTP_DIR }))
    ftp.listen().then(() => { console.log(`FTP is starting at ${ftp_host} : ${ftp_port} / ${FTP_DIR}`) })

    const setHeaders = (res, path) => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    }

    const xmlish = (text) => { try { return xmlFormat(text) } catch (e) { return false } }
    const jsonish = (text) => { try { return beautify(JSON.parse(text),null,2) } catch (e) { return false } }

    const formatData = (req, res, next) => {
        try {
            const data = fs.readFileSync(FTP_DIR + req.url, 'utf8') // will throw if we are folder
            let formatted
            if (formatted=xmlish(data)){
                res.setHeader('Content-Type', 'application/xml; charset=utf-8')
                res.send(formatted)
            } else if(formatted=jsonish(data)){
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.send(formatted)
            } else return next()
        } catch (e) {
            next() // neit
        }
    }
    app.use('/ftp', formatData, express.static(FTP_DIR, { setHeaders }), serveIndex(FTP_DIR, { 'icons': true }))

    const cpiCreds = cds.env.requires.webshell?.credentials
    if (!cpiCreds || ! cpiCreds.url) return
    const auth = new Buffer.from(cpiCreds.clientid + ':' + cpiCreds.clientsecret)
    const cpiRuntimeHost = cpiCreds.url.split('/')[2]
    app.use('/cpi', proxy(cpiCreds.url, {
        proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
            proxyReqOpts.headers['Authorization'] = `Basic ${auth.toString('base64')}`
            proxyReqOpts.method = 'GET'
            srcReq.baseUrl = '/http' // modify baseUr
            if (srcReq.url.startsWith('/webshell')) {
                proxyReqOpts.method = 'POST'
                srcReq.url = '/webshell'
            }
            return proxyReqOpts
        },
        proxyReqBodyDecorator: function (bodyContent, srcReq) {
            const cmd = srcReq.originalUrl.split('/')[3]
            return decodeURIComponent(cmd)
        },
        proxyReqPathResolver: function (req) {
            return req.baseUrl + req.url // as this guy only proxies to host and mounted url (/cpi)
        },
        userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
            if (userReq.url == '/webshell') headers['Content-Type'] = 'text/plain'
            return headers
        },
        userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
            return proxyResData.toString('utf8').replaceAll(cpiRuntimeHost + '/http', 'cpi') // replace links back
        }
    }))

    app.use('/local/webshell/:cmd', (req, res, next) => {
        // for now we assume we are single-user mode with one cmd being processed
        // camel done file can de dynamic, but need to figure out how to read result later
        const webshellPath = `${FTP_DIR}/webshell`
        const cmdFile = `${webshellPath}/cmd` // 
        fs.writeFileSync(cmdFile, req.params.cmd) // actual command
        const doneFile = `${webshellPath}/done` // camel doneFileName so that it picks cmd up
        fs.writeFileSync(doneFile, '') // empty
        const checkResult = setInterval(() => {
            const content = fs.readdirSync(webshellPath)
            if (content.length == 1) { // processing done and we have 1 new file
                const resultPath = `${webshellPath}/${content[0]}`
                const result = fs.readFileSync(resultPath, 'utf8') // get stuff
                fs.unlinkSync(resultPath) // and remove it so that camel does not pick it
                clearInterval(checkResult)
                res.setHeader('Content-Type', 'text/plain; charset=utf-8')
                res.send(result)
            }
        }, 200)
    })

})