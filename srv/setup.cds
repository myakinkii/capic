service SetupService {

    @odata.singleton
    entity EnvPars {
        CPI_TENANT_URL  : String;
        CPI_EXPORT_PATH : String;
        KARAF_PATH      : String;
        FTP_DIR         : String;
    }

    @odata.singleton
    entity CdsRcPars {
        cpi      : String;
        webshell : String;
    }

    @odata.singleton
    entity Rezip {
        objType       : String;
        createPkgFlag : Boolean;
        pkgId         : String;
        bundleId      : String;
        srcPkgId      : String;
        srcBundleId   : String;
    };

    entity RezipTypes {
        key Id: String;
    }

    entity RezipPackages {
        key Id: String;
    }

    action persist(pars : String);
    action rezip(task : Rezip);
}
