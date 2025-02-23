const cds = require('@sap/cds')

const projectRoot = __dirname+'/../..' 

describe('Simple webshell test', () => {

    const test = cds.test(projectRoot)

    it('should find two bundles', async () => {
        const { data } = await test.get(`/local/webshell/bundle:list | grep webshell`)
        const bundles = data.split('\n').filter( l => !!l )
        test.expect(bundles.length).to.eq(2)
    })
})