const cds = require('@sap/cds')
const fs = require('fs')

jest.setTimeout(10*60*1000) // 10 mins

const context = process.argv[3]
if (!context) process.exit()

describe('Automatic test for '+context, () => {

    const test = cds.test(__dirname + '/..')

    const waitForKaraf = async (files) => {
        return new Promise(function (resolve) {
            async function waitAndResolve() {
                const { data } = await test.get('/odata/v4/ftp-local/FtpOut')
                if ( data.value.length == files ) resolve(data.value)
                else setTimeout(waitAndResolve, 1000)
            }
            waitAndResolve()
        })
    }

    it('should set ftp context', async () => {
        await test.patch('/odata/v4/ftp-local/FtpIn', { context })
        const { data: ctx } = await test.get('/odata/v4/ftp-local/FtpIn')
        test.expect(ctx.context).to.eq(context)
    })

    it('should find no output files', async () => {
        const { data: { value: files } } = await test.get('/odata/v4/ftp-local/FtpOut')
        test.expect(files.length).to.eq(0)
    })

    it('should loop through in_out and compare stuff', async () => {
        const ftpDir = `${process.env.FTP_DIR}/${context}`
        const inOutDir = `${ftpDir}/in_out`
        const files = fs.readdirSync(inOutDir)
        const inFiles = files.filter(f => f.endsWith('-IN')).sort()
        const outFiles = files.filter(f => f.endsWith('-OUT')).sort()

        test.expect(inFiles.length).to.eq(outFiles.length)

        let i=0, f, res, input, output, expected
        do {
            input = fs.readFileSync(`${inOutDir}/${inFiles[i]}`).toString()
            await test.patch('/odata/v4/ftp-local/FtpIn', { content: input })
            res = await waitForKaraf(1)
            output = fs.readFileSync(`${ftpDir}/out/${res[0].fileName}`).toString()
            expected = fs.readFileSync(`${inOutDir}/${outFiles[i]}`).toString()
            test.expect(output).to.eq(expected)
            await test.delete(`/odata/v4/ftp-local/FtpOut('${res[0].fileName}')`)
            i++
        } while (i< inFiles.length)
        test.expect(i).to.eq(files.length/2)
    })

})