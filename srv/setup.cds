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

    action persist(pars : String);
}
