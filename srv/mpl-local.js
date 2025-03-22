const CPI_TENANT_URL = process.env.CPI_TENANT_URL || ''

module.exports = cds.service.impl(async function () {

    const mpl = await cds.connect.to('mpl')

    this.on('READ', 'MessageProcessingLogs', async (req, next) => {

        let result
        const odataFilter = req._queryOptions.$filter
        let offset, rows
        const singleObj = req.query.SELECT.one
        if (!singleObj) ({ offset, rows } = req.query.SELECT.limit)

        if (odataFilter) { // gonna make custom query because of odata v2 datetime

            const filters = []
            const filterArtifact = /IntegrationArtifact\/(\w+) eq '(\w+)'/g.exec(odataFilter)
            if (filterArtifact) {
                const [_, key, value] = filterArtifact
                filters.push(`IntegrationArtifact/${key} eq '${value}'`)
            }
            const filterDate = /LogStart ge (.+)Z and LogStart le (.+)Z/g.exec(odataFilter)
            if (filterDate) {
                const [_, from, to] = filterDate
                filters.push(`LogStart ge datetime'${from}'`)
                filters.push(`LogStart le datetime'${to}'`)
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
        })

        if (!singleObj && !offset.val && result.length < rows.val) result.sort((l1, l2) => l2.LogStart - l1.LogStart)

        return result
    })

    // READABLE ONLY VIA NAV PROPERTY
    this.on('READ', 'MessageStoreEntries', async (req, next) => mpl.run(req.query))
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
        return mpl.send('download', SELECT.from('MessageProcessingLogAttachments',{Id}))
    })

});