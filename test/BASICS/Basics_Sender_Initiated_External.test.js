const cds = require('@sap/cds')
const xmlFormat = require('xml-formatter')

const projectRoot = __dirname + '/../..'

jest.setTimeout(60000)

describe('Simple Basics_Sender_Initiated_External test', () => {

    const test = cds.test(projectRoot)

    const ftpInState = {
        context: 'Basics_Sender_Initiated_External',
        fileName: 'DATA_IN'
    }

    const inputData = {
        productIdentifier: "HT-1081"
    }

    const outputData = {
        expectedXml: xmlFormat('<Products><Product><Category>Scanners</Category><WeightUnit>KG</WeightUnit><ProductId>HT-1081</ProductId><DimensionUnit>m</DimensionUnit><DimensionHeight>0.0700</DimensionHeight><Weight>2.400</Weight><Name>Power Scan</Name><ShortDescription>Flatbed scanner - 1200 dpi x 1200 dpi - 216 x 297 mm - Hi-Speed USB  - Bluetooth Ver. 1.2</ShortDescription><CurrencyCode>EUR</CurrencyCode><DimensionWidth>0.3100</DimensionWidth><SupplierId>100000046</SupplierId><LongDescription>Flatbed scanner - 1200 dpi x 1200 dpi - 216 x 297 mm - Hi-Speed USB  - Bluetooth Ver. 1.2</LongDescription><Price>89.000</Price><CategoryName>Scanners</CategoryName><PictureUrl>HT-1081.jpg</PictureUrl><DimensionDepth>0.4300</DimensionDepth><QuantityUnit>EA</QuantityUnit></Product></Products>')
    }

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

    it('should get default ctx', async () => {
        const { data: ctx } = await test.get('/odata/v4/ftp-local/FtpIn')
        test.expect(ctx.fileName).to.eq(ftpInState.fileName)
        test.expect(ctx.context).to.eq('')
    })

    it('should find no input file', async () => {
        let status
        await test.get(`/ftp/${ftpInState.context}/in/${ftpInState.fileName}`).catch(err => {
            status = err.response.status
        })
        test.expect(status).to.eq(404)
    })

    it('should set ftp context to Basics_Sender_Initiated_External', async () => {
        await test.patch('/odata/v4/ftp-local/FtpIn', { context: ftpInState.context })
        const { data: ctx } = await test.get('/odata/v4/ftp-local/FtpIn')
        test.expect(ctx.context).to.eq(ftpInState.context)
    })

    it('should find no output files', async () => {
        const { data: { value: files } } = await test.get('/odata/v4/ftp-local/FtpOut')
        test.expect(files.length).to.eq(0)
    })

    it('should write conent to FtpIn and find it in input', async () => {
        const input = JSON.stringify(inputData)
        await test.patch('/odata/v4/ftp-local/FtpIn', { content: input })

        const { data } = await test.get(`/ftp/${ftpInState.context}/in/${ftpInState.fileName}`)
        test.expect(JSON.stringify(data)).to.eq(input)
    })

    it('should wait and find 1 output file', async () => {
        const files = await waitForKaraf(1)
        Object.assign(outputData, files[0])
        test.expect(files.length).to.eq(1)
    })

    it('should find xml in out file and delete it', async () => {

        const { data: result } = await test.get(outputData.url)
        test.expect(xmlFormat(result)).to.eq(outputData.expectedXml) // cuz we hit our odata file with pollEnrich

        await test.delete(`/odata/v4/ftp-local/FtpOut('${outputData.fileName}')`)

        const { data: { value: files } } = await test.get('/odata/v4/ftp-local/FtpOut')
        test.expect(files.length).to.eq(0)
    })


    it('should write new conent to FtpIn and find it in input', async () => {
        inputData.productIdentifier = 'HT-1080'
        const input = JSON.stringify(inputData)
        await test.patch('/odata/v4/ftp-local/FtpIn', { content: input })

        const { data } = await test.get(`/ftp/${ftpInState.context}/in/${ftpInState.fileName}`)
        test.expect(JSON.stringify(data)).to.eq(input)
    })


    it('should wait and find 1 output file', async () => {
        const files = await waitForKaraf(1)
        Object.assign(outputData, files[0])
        test.expect(files.length).to.eq(1)
    })


    it('should find json in out file and delete it', async () => {

        const { data: result } = await test.get(outputData.url)
        test.expect(result.productIdentifier).to.eq(inputData.productIdentifier) // cuz we got echo

        await test.delete(`/odata/v4/ftp-local/FtpOut('${outputData.fileName}')`)

        const { data: { value: files } } = await test.get('/odata/v4/ftp-local/FtpOut')
        test.expect(files.length).to.eq(0)
    })

})