using {cpi as external} from '../srv/external/cpi';

service FtpLocalService {

    @readonly
    @cds.persistence.skip: true
    entity DeployedArtifacts {
        key Id : String;
    }

    @odata.singleton
    @cds.persistence.skip: true
    entity FtpIn {
        fileName : String;
        content  : LargeString;
        context  : String;
        iflows   : Association to many DeployedArtifacts
    }

    action unlinkInFile(fileName : String);
    action checkCreateFolders();
    action runGenericTester() returns String;

    @cds.persistence.skip: true
    entity FtpOut {
        key fileName : String;
            url      : String;
    } actions {
        @(Common.SideEffects: {TargetEntities: ['/FtpLocalService.EntityContainer/FtpOut']})
        action linkInOut(fileId : String) returns String;
    }
}

annotate FtpLocalService.FtpOut with @(
    Capabilities.DeleteRestrictions: {Deletable: true},
    Capabilities.InsertRestrictions: {Insertable: false},
    Capabilities.UpdateRestrictions: {Updatable: false},
    Capabilities.SearchRestrictions: {Searchable: false}
);

annotate FtpLocalService.FtpOut with @UI: {LineItem: [
    {
        ![@HTML5.CssDefaults]: {width: 'auto'},
        Value                : fileName,
        Url                  : url,
        $Type                : 'UI.DataFieldWithUrl'
    },
    {
        $Type : 'UI.DataFieldForAction',
        Action: 'FtpLocalService.linkInOut',
        Inline: true,
        Label : '{i18n>linkInOut}'
    }
]};
