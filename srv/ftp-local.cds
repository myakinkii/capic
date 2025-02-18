using {cpi as external} from '../srv/external/cpi';

service FtpLocalService {

    @readonly
    entity IntegrationRuntimeArtifacts as
        projection on external.IntegrationRuntimeArtifacts {
            key Id
        }

    @odata.singleton
    entity FtpIn {
        fileName : String;
        content  : LargeString;
        context  : String;
        iflows   : Association to many IntegrationRuntimeArtifacts
    }

    action unlinkInFile(fileName : String);
    action checkCreateFolders();

    entity FtpOut {
        key fileName : String;
            url      : String;
    }
}

annotate FtpLocalService.FtpOut with @(
    Capabilities.DeleteRestrictions: {Deletable: true},
    Capabilities.InsertRestrictions: {Insertable: false},
    Capabilities.UpdateRestrictions: {Updatable: false},
    Capabilities.SearchRestrictions: {Searchable: false}
);

annotate FtpLocalService.FtpOut with @UI: {LineItem: [{
    ![@HTML5.CssDefaults]: {width: 'auto'},
    Value                : fileName,
    Url                  : url,
    $Type                : 'UI.DataFieldWithUrl'
}]};
