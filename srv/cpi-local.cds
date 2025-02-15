using {cpi as external} from '../srv/external/cpi';

service CpiLocalService {

    @readonly
    entity IntegrationPackages            as
        projection on external.IntegrationPackages {
            *,
            '' as PackageURL : String
        }
        excluding {
            PackageContent,
            blob
        };

    @readonly
    entity IntegrationDesigntimeArtifacts as
        select from external.IntegrationDesigntimeArtifacts
        mixin {
            IntegrationRuntimeArtifacts : Association to many IntegrationRuntimeArtifacts
                                              on  IntegrationRuntimeArtifacts.Id      = Id
                                              and IntegrationRuntimeArtifacts.Version = Version
        }
        into {
            *,
            IntegrationRuntimeArtifacts
        }
        excluding {
            ArtifactContent,
            blob
        }
        actions {
            action syncGit(xmlString : LargeString, commitMsg : String) returns String;
            action deployKaraf()                                        returns String;
        };

    @readonly
    entity IntegrationRuntimeArtifacts    as
        projection on external.IntegrationRuntimeArtifacts {
            key Id,
            key Version,
                *,
                '' as DeployURL : String
        }
        actions {
            action syncGitPackage(pckgId : String, xmlString : LargeString, commitMsg : String) returns String;
        };
}


annotate CpiLocalService.IntegrationPackages with @(Capabilities.SearchRestrictions: {Searchable: false});

annotate CpiLocalService.IntegrationPackages with @UI: {
    LineItem  : [
        {Value: Id},
        {Value: Name},
        {Value: CreatedBy},
        {Value: Version},
    ],
    HeaderInfo: {
        TypeName      : '{i18n>IntegrationPackage}',
        TypeNamePlural: '{i18n>IntegrationPackages}',
        Title         : {Value: Id},
        Description   : {Value: Name}
    },
    Facets    : [{
        $Type : 'UI.ReferenceFacet',
        Target: 'IntegrationDesigntimeArtifacts/@UI.LineItem',
        Label : '{i18n>IntegrationDesigntimeArtifacts}'
    }]
};

annotate CpiLocalService.IntegrationDesigntimeArtifacts with @(Capabilities.SearchRestrictions: {Searchable: false});

annotate CpiLocalService.IntegrationDesigntimeArtifacts with @UI: {
    Identification: [
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'CpiLocalService.syncGit',
            Label : '{i18n>syncGit}'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'CpiLocalService.deployKaraf',
            Inline: true,
            Label : '{i18n>deployKaraf}'
        }
    ],
    LineItem      : [
        {Value: Id},
        {Value: Name},
        {Value: CreatedBy},
        {Value: Version},
    ],
    HeaderInfo    : {
        TypeName      : '{i18n>IntegrationDesigntimeArtifact}',
        TypeNamePlural: '{i18n>IntegrationDesigntimeArtifacts}',
        Title         : {Value: Id},
        Description   : {Value: Name}
    },
    Facets        : [{
        $Type : 'UI.ReferenceFacet',
        Target: 'IntegrationRuntimeArtifacts/@UI.LineItem#EXT',
        Label : '{i18n>IntegrationRuntimeArtifacts}'
    }]
};

annotate CpiLocalService.IntegrationRuntimeArtifacts with @(Capabilities.SearchRestrictions: {Searchable: false});

annotate CpiLocalService.IntegrationRuntimeArtifacts with @UI: {
    HeaderInfo   : {
        TypeName      : '{i18n>IntegrationRuntimeArtifact}',
        TypeNamePlural: '{i18n>IntegrationRuntimeArtifacts}',
        Title         : {Value: Id},
        Description   : {Value: Name}
    },
    LineItem     : [
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'CpiLocalService.syncGitPackage',
            Inline: true,
            Label : '{i18n>syncGit}'
        },
        {Value: Id},
        {Value: Type},
        {Value: Version},
        {
            Label: '{i18n>DeployedOn}',
            Value: DeployedOn,
            Url  : DeployURL,
            $Type: 'UI.DataFieldWithUrl'
        }
    ],
    LineItem #EXT: [
        {Value: Type},
        {Value: Version},
        {
            Label: '{i18n>DeployedOn}',
            Value: DeployedOn,
            Url  : DeployURL,
            $Type: 'UI.DataFieldWithUrl'
        }
    ]
};
