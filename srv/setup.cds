service SetupService {

    @odata.singleton
    @cds.persistence.skip: true
    entity EnvPars {
        CPI_TENANT_URL  : String;
        CPI_EXPORT_PATH : String;
        KARAF_PATH      : String;
        FTP_DIR         : String;
        JAR_DIR         : String;
    }

    @odata.singleton
    @cds.persistence.skip: true
    entity CdsRcPars {
        cpi      : String;
        iflow : String;
    }

    @odata.singleton
    @cds.persistence.skip: true
    entity Rezip {
        objType       : String;
        createPkgFlag : Boolean;
        pkgId         : String;
        bundleId      : String;
        srcPkgId      : String;
        srcBundleId   : String;
    };

    @cds.persistence.skip: true
    entity RezipTypes {
        key Id : String;
    }

    @cds.persistence.skip: true
    entity RezipPackages {
        key Id : String;
    }

    action persist(pars : String);
    action rezip(task : Rezip);
    action checkWarRetry()                 returns String;
    action setupDownload(warName : String) returns String;
    action setupKaraf();

}
