using {cpi as external} from '../srv/external/cpi';

@path: '/odata/v4/mpl-local' // bloody hell they expect camel case
service MPLLocalService {

    @cds.persistence.skip: true
    entity IntegrationArtifact {
        key FakeId      : String;
            Id          : String;
            Name        : String;
            Type        : String;
            PackageId   : String;
            PackageName : String;
    }

    @readonly
    entity MessageProcessingLogs        as
        select from external.MessageProcessingLogs
        mixin {
            IntegrationArtifact : Association to one IntegrationArtifact
                                      on IntegrationArtifact.FakeId = MessageGuid
        }
        into {
            *,
            IntegrationArtifact
        }

    @readonly
    entity MessageProcessingLogRuns     as projection on external.MessageProcessingLogRuns

    @readonly
    entity MessageProcessingLogRunSteps as projection on external.MessageProcessingLogRunSteps
    
    @readonly
    entity MessageProcessingLogAttachments as projection on external.MessageProcessingLogAttachments
}

annotate MPLLocalService.MessageProcessingLogs with @(Capabilities.SearchRestrictions: {Searchable: false});

annotate MPLLocalService.MessageProcessingLogs with @UI: {
    SelectionFields: [
        MessageGuid,
        CorrelationId,
        IntegrationFlowName
    ],
    LineItem       : [
        {Value: MessageGuid},
        {Value: CorrelationId},
        {Value: Status},
        {Value: IntegrationFlowName},
        // {Value: IntegrationArtifact_Id},
        // {Value: IntegrationArtifact_PackageName},
        {Value: LogStart},
        {Value: LogEnd},
    ],
    HeaderInfo     : {
        TypeName      : '{i18n>Mpl}',
        TypeNamePlural: '{i18n>MPL}',
        Title         : {Value: Status},
        Description   : {Value: IntegrationFlowName}
    },
    HeaderFacets   : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Log',
    }],
    FieldGroup #Log: {Data: [{
        Label: '{i18n>AlternateWebLink}',
        Value: AlternateWebLink,
        Url  : AlternateWebLink,
        $Type: 'UI.DataFieldWithUrl'
    }]},
    Facets         : [{
        $Type : 'UI.ReferenceFacet',
        Target: 'Runs/@UI.LineItem'
    }]
};

annotate MPLLocalService.MessageProcessingLogRuns with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>MessageProcessingLogRuns}',
        TypeNamePlural: '{i18n>MessageProcessingLogRuns}',
        Title         : {Value: Id}
    },
    LineItem  : [{Value: Id}],
    Facets    : [{
        $Type : 'UI.ReferenceFacet',
        Target: 'RunSteps/@UI.LineItem'
    }]
};

annotate MPLLocalService.MessageProcessingLogRunSteps with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>MessageProcessingLogRunSteps}',
        TypeNamePlural: '{i18n>MessageProcessingLogRunSteps}',
        Title         : {Value: RunId}
    },
    LineItem  : [
        {Value: ChildCount},
        {Value: Activity}
    ]
};
