const cds = require('@sap/cds')
const fs = require('fs')
const xmlFormat = require('xml-formatter')

jest.setTimeout(10 * 60 * 1000) // 10 mins

const context = process.env.CTX
if (!context) process.exit()

describe('Automatic test for ' + context, () => {

    const test = cds.test(__dirname + '/..')

    let ftpDir, inOutDir, iflow, endpoint

    beforeAll(async () => {

        ftpDir = `${process.env.FTP_DIR}/${context}` // need cds to load env first
        inOutDir = `${ftpDir}/in_out`

        iflow = await cds.connect.to('iflow')

        const operations = await cds.connect.to('operations')
        endpoint = await operations.getFirstEntryEndpoint(context)
    })

    const jsonish = (text) => { try { return !!JSON.parse(text) } catch (e) { return false } }

    const checkEqualXml = (output, expected) => {
        try {
            return xmlFormat(output) == xmlFormat(expected)
        } catch (e) {
            return false
        }
    }

    const doTestRemote = async (input, expected) => {
        const contentType = jsonish(input) ? 'application/json' : 'application/xml'
        const output = await iflow.run({
            endpoint,
            body: input,
            headers: { 'Content-Type': contentType }
        }).catch(e => e.message)
        return checkEqualXml(output, expected) || output == expected
    }

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

    const doTestLocal = async (input, expected) => {
        await test.patch('/odata/v4/ftp-local/FtpIn', { content: input })
        const res = await waitForKaraf(1)
        output = fs.readFileSync(`${ftpDir}/out/${res[0].fileName}`).toString()
        await test.delete(`/odata/v4/ftp-local/FtpOut('${res[0].fileName}')`)
        return checkEqualXml(output, expected) || output == expected
    }

    it('should loop through in_out and compare results', async () => {
        const files = fs.readdirSync(inOutDir)
        const inFiles = files.filter(f => f.endsWith('-IN')).sort()
        const outFiles = files.filter(f => f.endsWith('-OUT')).sort()

        test.expect(inFiles.length).to.be.above(0)
        test.expect(inFiles.length).to.eq(outFiles.length)

        process.stderr.write(`\nFOUND ${inFiles.length} IN_OUT PAIRS\n`)

        const doTest = process.env.REMOTE ? doTestRemote : doTestLocal
        process.stderr.write(`TEST = ${process.env.REMOTE ? endpoint : 'FTP'}\n\n`)

        if (process.env.REMOTE) {
            test.expect(endpoint).to.be.a('string')
        } else {
            await test.patch('/odata/v4/ftp-local/FtpIn', { context })
            const { data: ctx } = await test.get('/odata/v4/ftp-local/FtpIn')
            test.expect(ctx.context).to.eq(context)

            const { data: { value: files } } = await test.get('/odata/v4/ftp-local/FtpOut')
            test.expect(files.length).to.eq(0)
        }

        let i = 0, passed
        while (i < inFiles.length) {
            passed = await doTest(
                fs.readFileSync(`${inOutDir}/${inFiles[i]}`).toString(),
                fs.readFileSync(`${inOutDir}/${outFiles[i]}`).toString()
            )
            process.stderr.write(`${inFiles[i]} - ${passed ? 'PASS' : 'FAIL'}\n`)
            test.expect(passed).to.eq(true)
            i++
        }
        test.expect(i).to.eq(files.length / 2)
        process.stderr.write('\n')
    })

})