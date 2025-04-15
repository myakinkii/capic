using {cpi as external} from '../srv/external/cpi';

service CpiLocalService {

    @odata.singleton
    @cds.persistence.skip: true
    entity CasMtarDestination {
        system       : String;
        CasPropFiles : Association to many CasPropFiles;
    }

    @readonly
    @cds.persistence.skip: true
    entity CasPropFiles {
        key file : String;
            qty  : Integer;
    };

    @readonly
    @cds.persistence.skip: true
    entity CasResources {
        key id         : String;
            resourceID : UUID;
            type       : String;
            subType    : String;
            title      : String;
            version    : String;
    };

    @readonly
    @cds.persistence.skip: true
    entity CasActivities {
        key activityId  : UUID;
            processType : String;
            startedAt   : DateTime;
            endedAt     : DateTime;
            state       : String;
    };

    action exportPackage(pkgId : String, resourceId : UUID)                           returns UUID;
    action downloadMtar(pkgId : String, activityId : UUID);

    @readonly
    entity IntegrationPackages                 as
        select from external.IntegrationPackages
        mixin {
            FakeDesigntimeArtifacts : Association to many FakeDesigntimeArtifacts
                                          on FakeDesigntimeArtifacts.PackageId = Id
        }
        into {
            *,
            '' as PackageURL : String,
            FakeDesigntimeArtifacts
        }
        excluding {
            PackageContent,
            blob
        };

    @cds.persistence.skip: true
    entity FakeDesigntimeArtifacts {
        key Id          : String;
        key Type        : String;
            PackageId   : String;
            ArtifactURL : String;
            Content     : LargeString;
    };

    @readonly
    @cds.persistence.skip: true
    entity DeployedArtifacts {
        key Id : String;
    }

    action flushTmpFile();

    @readonly
    entity IntegrationDesigntimeArtifacts      as projection on external.IntegrationDesigntimeArtifacts;

    @readonly
    entity Configurations                      as
        projection on external.Configurations {
            *,
            '' as ParameterValueMtar : String
        };

    @readonly
    entity Resources                           as projection on external.Resources;

    @readonly
    entity ScriptCollectionDesigntimeArtifacts as projection on external.ScriptCollectionDesigntimeArtifacts;

    @readonly
    entity ValueMappingDesigntimeArtifacts     as projection on external.ValueMappingDesigntimeArtifacts;

    @readonly
    entity MessageMappingDesigntimeArtifacts   as projection on external.MessageMappingDesigntimeArtifacts;

    @readonly
    entity IntegrationRuntimeArtifacts         as
        projection on external.IntegrationRuntimeArtifacts {
            key Id,
                *,
                '' as DeployURL  : String,
                '' as ArtifactId : UUID
        }
        actions {
            action syncGitToPackage(pckgId : String not null, version : String, commitMsg : String) returns String;
            action deployKarafFromPackage(pckgId : String not null, tryLocal : Boolean)             returns String;
        };

    action deployArtifactToCpi(bundleId : String, version : String, objType : String) returns String;
    action getRuntimeDetails(artifactId : UUID not null)                              returns String;
    action testIflowEndpoint(endpoint : String, text : LargeString)                   returns LargeString;

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
    }
};


annotate CpiLocalService.FakeDesigntimeArtifacts with @(
    Capabilities.DeleteRestrictions: {Deletable: false},
    Capabilities.InsertRestrictions: {Insertable: false},
    Capabilities.UpdateRestrictions: {Updatable: true},
    Capabilities.SearchRestrictions: {Searchable: false}
);

annotate CpiLocalService.FakeDesigntimeArtifacts with @UI: {
    HeaderInfo        : {
        TypeName      : '{i18n>DesigntimeArtifacts}',
        TypeNamePlural: '{i18n>DesigntimeArtifacts}',
        Title         : {Value: Id},
        Description   : {Value: Type}
    },
    LineItem          : [{Value: Id}],
    HeaderFacets      : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Design',
    }],
    FieldGroup #Design: {Data: [{
        Label: '{i18n>ArtifactURL}',
        Value: ArtifactURL,
        Url  : ArtifactURL,
        $Type: 'UI.DataFieldWithUrl'
    }]},
};

annotate CpiLocalService.IntegrationRuntimeArtifacts with @(Capabilities.SearchRestrictions: {Searchable: false});

annotate CpiLocalService.IntegrationRuntimeArtifacts with @UI: {
    HeaderInfo          : {
        TypeName      : '{i18n>IntegrationRuntimeArtifact}',
        TypeNamePlural: '{i18n>IntegrationRuntimeArtifacts}',
        Title         : {Value: Id},
        Description   : {Value: Name}
    },
    HeaderFacets        : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Deployed',
    }],
    FieldGroup #Deployed: {Data: [{
        Label: '{i18n>DeployedOn}',
        Value: DeployedOn,
        Url  : DeployURL,
        $Type: 'UI.DataFieldWithUrl'
    }]},
    Identification      : [
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'CpiLocalService.syncGitToPackage',
            Inline: true,
            Label : '{i18n>syncGit}'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'CpiLocalService.deployKarafFromPackage',
            Inline: true,
            Label : '{i18n>deployKaraf}'
        }
    ],
    LineItem            : [
        {Value: Id},
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
