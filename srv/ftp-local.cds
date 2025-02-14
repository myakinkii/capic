service FtpLocalService {

    @odata.singleton
    entity FtpIn {
        fileName : String;
        content  : LargeString;
    }

    action unlinkInFile(fileName : String);

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
    Value: fileName,
    Url  : url,
    $Type: 'UI.DataFieldWithUrl'
}]};
