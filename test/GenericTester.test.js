const cds = require('@sap/cds')
const fs = require('fs')

jest.setTimeout(10 * 60 * 1000) // 10 mins

const context = process.env.CTX
if (!context) process.exit()

describe('Automatic test for ' + context, () => {

    const test = cds.test(__dirname + '/..')

    const waitForKaraf = async (files) => {
        return new Promise(function (resolve) {
            async function waitAndResolve() {
                const { data } = await test.get('/odata/v4/ftp-local/FtpOut')
                if (data.value.length == files) resolve(data.value)
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

        test.expect(inFiles.length > 0).to.eq(true)
        test.expect(inFiles.length).to.eq(outFiles.length)

        process.stderr.write(`\nFOUND ${inFiles.length} IN_OUT PAIRS\n`)

        const operations = await cds.connect.to('operations')
        const endpoint = await operations.getFirstEntryEndpoint(context)

        const iflow = await cds.connect.to('iflow')
        const jsonish = (text) => { try { return !!JSON.parse(text) } catch (e) { return false } }

        const doTestRemote = async (input, expected) => {
            test.expect(!!endpoint).to.eq(true)
            const contentType = jsonish(input) ? 'application/json' : 'application/xml'
            const output = await iflow.run({
                endpoint,
                body: input,
                headers: { 'Content-Type': contentType }
            }).catch(e => e.message)
            return output == expected
        }

        const doTestLocal = async (input, expected) => {
            await test.patch('/odata/v4/ftp-local/FtpIn', { content: input })
            const res = await waitForKaraf(1)
            output = fs.readFileSync(`${ftpDir}/out/${res[0].fileName}`).toString()
            await test.delete(`/odata/v4/ftp-local/FtpOut('${res[0].fileName}')`)
            return output == expected
        }

        const doTest = process.env.REMOTE ? doTestRemote : doTestLocal
        process.stderr.write(`TEST = ${ process.env.REMOTE ? endpoint : 'FTP' }\n\n`)

        let i = 0, passed
        while (i < inFiles.length) {
            passed = await doTest(
                fs.readFileSync(`${inOutDir}/${inFiles[i]}`).toString(),
                fs.readFileSync(`${inOutDir}/${outFiles[i]}`).toString()
            )
            process.stderr.write(`${inFiles[i]} - ${passed ? 'PASS' : 'FAIL' }\n`)
            test.expect(passed).to.eq(true)
            i++
        }
        test.expect(i).to.eq(files.length / 2)
        process.stderr.write('\n')
    })

})