const CPI_TENANT_URL = process.env.CPI_TENANT_URL || ''

module.exports = cds.service.impl(async function () {

    const mpl = await cds.connect.to('mpl')
    const operations = await cds.connect.to('operations')

    this.on('READ', 'MessageProcessingLogs', async (req, next) => {

        let result
        const odataFilter = req._queryOptions.$filter
        let offset, rows
        const singleObj = req.query.SELECT.one
        if (!singleObj) ({ offset, rows } = req.query.SELECT.limit)

        if (odataFilter) { // gonna make custom query because of odata v2 datetime

            const filters = []

            const searchId = /MessageGuid eq '([\w-_]+)'/g.exec(odataFilter)
            if (searchId) {
                const search = ['ApplicationMessageId', 'CorrelationId', 'MessageGuid'].map(f => {
                    return `${f} eq '${searchId[1]}'`
                }).join(' or ')
                filters.push(search)
            } else {
                const filterArtifact = /IntegrationArtifact\/(\w+) eq '([\w-_\.]+)'/g.exec(odataFilter)
                if (filterArtifact) {
                    const [_, key, value] = filterArtifact
                    filters.push(`IntegrationArtifact/${key} eq '${value}'`)
                }
                const filterDate = /LogStart ge (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})Z and LogStart le (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})Z/g.exec(odataFilter)
                if (filterDate) {
                    const [_, from, to] = filterDate
                    filters.push(`LogStart ge datetime'${from}'`)
                    filters.push(`LogStart le datetime'${to}'`)
                }

                const filterStatus = /Status (eq|ne) '([A-Z]+)'/g.exec(odataFilter)
                if (filterStatus) filters.push(`Status ${filterStatus[1]} '${filterStatus[2]}'`)

            }

            let q = `MessageProcessingLogs?$filter=${filters.join(' and ')}`

            if (offset) q += `&$skip=${offset.val}`
            if (rows) q += `&$top=${rows.val}`

            result = await mpl.run(q)
        } else {
            result = await mpl.run(req.query)
        }

        if (!result) throw new Error('NOT_FOUND')

        const getDate = (jsonDate) => new Date(parseInt(jsonDate.substr(6)))

        Object.values(singleObj ? [result] : result).forEach(r => {

            r.IntegrationArtifact.FakeId = r.MessageGuid // for fake mixin

            // odata v2 json date back to normal one
            r.LogStart = getDate(r.LogStart)
            r.LogEnd = getDate(r.LogEnd)

            r.AlternateWebLink = `${CPI_TENANT_URL}/shell/monitoring/Messages/{"identifier":"${r.MessageGuid}"}`
            // original one is wrong

            r.MonitoringWebLink = `${CPI_TENANT_URL}/shell/monitoring/Artifacts/{"artifactId":"${r.IntegrationArtifact.Id}"}`
        })

        if (!singleObj && !offset?.val && result.length < rows.val) result.sort((l1, l2) => l2.LogStart - l1.LogStart)

        return result
    })

    this.on('setLogLevel', async (req) => {
        const { bundleId, logLevel } = req.data
        return operations.setLogLevel(bundleId, logLevel)
    })

    // READABLE ONLY VIA NAV PROPERTY
    this.on('READ', 'MessageStoreEntries', async (req, next) => mpl.run(req.query))

    this.on('READ', 'MessageProcessingLogErrorInformations', async (req, next) => {
        // const errorInfo = await mpl.run(req.query)
        const errorValue = await mpl.send('download', req.query) // Buffer
        return { Value: errorValue.toString() }
    })

    this.on('READ', 'MessageProcessingLogRuns', async (req, next) => {
        if (req.params.length == 2) { // detail-detail
            const [{ MessageGuid: Id }, { Id: RunId }] = req.params
            return mpl.run(`MessageProcessingLogs('${Id}')/Runs`).then(r => r[0])
        } else if (req.params.length == 1) return mpl.run(req.query) // detail
        return [] // direct read not implemented
    })
    this.on('READ', 'MessageProcessingLogRunSteps', async (req, next) => {
        if (req.params.length == 2) { // detail-detail
            const [_, { Id }] = req.params
            return mpl.run(`MessageProcessingLogRuns('${Id}')/RunSteps?$format=json&$expand=RunStepProperties`)
        }
        return [] // direct read not implemented
    })

    this.on('READ', 'MessageProcessingLogAttachments', async (req, next) => {
        if (!req.query.SELECT.one) return []
        const [{ Id }] = req.params
        return mpl.send('download', SELECT.from('MessageProcessingLogAttachments', { Id }))
    })

    this.on('READ', 'TraceMessages', async (req, next) => {
        if (!req.query.SELECT.one) return []
        const [{ TraceId }] = req.params
        try {
            const body = await mpl.send('download', SELECT.from('TraceMessages', { TraceId: parseInt(TraceId) }))
            return body
        } catch (e) {
            return new Buffer.from('TRACE_EXPIRED')
        }
    })

    this.on('READ', 'TraceMessageProperties', async (req, next) => {
        req.query.SELECT.limit = undefined
        req.query.SELECT.skip = undefined
        const props = await mpl.run(req.query)
        if (!props) return ['TRACE_EXPIRED']
        return props.map(({ Name, Value }) => ({ [Name]: Value })) // cleaner
        // return props.map( ({Name, Value}) => ({Name, Value})) // but maybe later for ui still need this one
    })

    this.on('READ', 'TraceMessageExchangeProperties', async (req, next) => {
        req.query.SELECT.limit = undefined
        req.query.SELECT.skip = undefined
        const props = await mpl.run(req.query)
        if (!props) return ['TRACE_EXPIRED']
        return props.map(({ Name, Value }) => ({ [Name]: Value })) // cleaner
        // return props.map( ({Name, Value}) => ({Name, Value})) // but maybe later for ui still need this one
    })

});