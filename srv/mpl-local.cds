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
    entity MessageProcessingLogs           as
        select from external.MessageProcessingLogs
        mixin {
            IntegrationArtifact : Association to one IntegrationArtifact
                                      on IntegrationArtifact.FakeId = MessageGuid
        }
        into {
            *,
            IntegrationArtifact,
            '' as MonitoringWebLink : String
        }
        actions {
            action setLogLevel(bundleId : String, logLevel : String)
        }

    @readonly
    entity MessageProcessingLogRuns        as projection on external.MessageProcessingLogRuns

    @readonly
    entity MessageProcessingLogRunSteps    as projection on external.MessageProcessingLogRunSteps

    @readonly
    entity MessageProcessingLogAttachments as projection on external.MessageProcessingLogAttachments

    @readonly
    entity TraceMessages                   as projection on external.TraceMessages

    @readonly
    entity TraceMessageProperties          as projection on external.TraceMessageProperties

    @readonly
    entity TraceMessageExchangeProperties  as projection on external.TraceMessageExchangeProperties
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
    Identification : [{
        $Type : 'UI.DataFieldForAction',
        Action: 'MPLLocalService.setLogLevel',
        Inline: false,
        Label : '{i18n>setLogLevel}'
    }],
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
    FieldGroup #Log: {Data: [
        {
            Label: '{i18n>LogLevel}',
            Value: LogLevel
        },
        {
            Label: '{i18n>MonitoringWebLink}',
            Value: MonitoringWebLink,
            Url  : MonitoringWebLink,
            $Type: 'UI.DataFieldWithUrl'
        },
        {
            Label: '{i18n>MessageGuidWebLink}',
            Value: AlternateWebLink,
            Url  : AlternateWebLink,
            $Type: 'UI.DataFieldWithUrl'
        }
    ]},
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
