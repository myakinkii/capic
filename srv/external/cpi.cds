/* checksum : 340dbd1569f2b36c66503390bc031dbc */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
service cpi {};

@cds.external : true
@cds.persistence.skip : true
entity cpi.B2BArchivingConfigurations {
  key Id : LargeString not null;
  Active : Boolean not null;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.ErrorDetails {
  key Id : LargeString not null;
  ErrorInformation : LargeString;
  ErrorCategory : LargeString;
  IsTransientError : Boolean;
  @cds.ambiguous : 'missing on condition?'
  BusinessDocumentProcessingEvent : Association to cpi.BusinessDocumentProcessingEvents {  };
  @cds.ambiguous : 'missing on condition?'
  OrphanedInterchange : Association to cpi.OrphanedInterchanges {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.CustomObjects {
  key Id : LargeString not null;
  SearchFieldValue1 : LargeString;
  SearchFieldValue2 : LargeString;
  SearchFieldValue3 : LargeString;
  SearchFieldValue4 : LargeString;
  SearchFieldValue5 : LargeString;
  SearchFieldValue6 : LargeString;
  SearchFieldValue7 : LargeString;
  SearchFieldValue8 : LargeString;
  SearchFieldValue9 : LargeString;
  SearchFieldValue10 : LargeString;
  @cds.ambiguous : 'missing on condition?'
  BusinessDocument : Association to cpi.BusinessDocuments {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.BusinessDocumentPayloads {
  key Id : LargeString not null;
  ProcessingState : LargeString;
  Direction : LargeString;
  PayloadId : LargeString;
  PayloadContainerContentType : LargeString;
  PayloadContentType : LargeString;
  ArchivingRelevant : Boolean;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  BusinessDocumentProcessingEvent : Association to cpi.BusinessDocumentProcessingEvents {  };
  @cds.ambiguous : 'missing on condition?'
  BusinessDocument : Association to cpi.BusinessDocuments {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.B2BArchivingKeyPerformanceIndicators {
  @odata.Type : 'Edm.DateTime'
  key RunStart : DateTime not null;
  RunDurationInMinutes : Integer;
  DataCollectionDurationInMinutes : Integer;
  DataCompressionDurationInMinutes : Integer;
  DataUploadDurationInMinutes : Integer;
  DocumentsToBeArchived : Integer;
  DocumentsArchived : Integer;
  DocumentsArchivingFailed : Integer;
  @odata.Type : 'Edm.DateTime'
  DocumentsArchivedUntilDate : DateTime;
  @odata.Type : 'Edm.DateTime'
  DateOfOldestDocumentToBeArchivedAfterRun : DateTime;
  DataUploadedInMb : Integer;
  RunStatus : LargeString;
  RunFailedPhase : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.BusinessDocumentRelations {
  key SourceDocumentId : LargeString not null;
  key TargetDocumentId : LargeString not null;
  Type : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.BusinessDocuments {
  key Id : LargeString not null;
  SenderMessageType : LargeString;
  SenderGroupControlNumber : LargeString;
  SenderDocumentStandard : LargeString;
  SenderInterchangeControlNumber : LargeString;
  SenderMessageNumber : LargeString;
  SenderTradingPartnerName : LargeString;
  SenderSystemId : LargeString;
  SenderAdapterType : LargeString;
  SenderCommunicationPartnerName : LargeString;
  ReceiverMessageType : LargeString;
  ReceiverGroupControlNumber : LargeString;
  ReceiverDocumentStandard : LargeString;
  ReceiverInterchangeControlNumber : LargeString;
  ReceiverMessageNumber : LargeString;
  ReceiverSystemId : LargeString;
  ReceiverAdapterType : LargeString;
  ReceiverTradingPartnerName : LargeString;
  ReceiverCommunicationPartnerName : LargeString;
  AgreedSenderIdentiferAtSenderSide : LargeString;
  AgreedSenderIdentiferQualifierAtSenderSide : LargeString;
  AgreedReceiverIdentiferAtSenderSide : LargeString;
  AgreedReceiverIdentiferQualifierAtSenderSide : LargeString;
  AgreedSenderIdentiferAtReceiverSide : LargeString;
  AgreedSenderIdentiferQualifierAtReceiverSide : LargeString;
  AgreedReceiverIdentiferAtReceiverSide : LargeString;
  AgreedReceiverIdentiferQualifierAtReceiverSide : LargeString;
  Bulk : Boolean;
  TransactionDocumentType : LargeString;
  ProcessingStatus : LargeString;
  ReceiverFunctionalAckStatus : LargeString;
  ReceiverTechnicalAckStatus : LargeString;
  OverallStatus : LargeString;
  @odata.Type : 'Edm.DateTime'
  StartedAt : DateTime;
  @odata.Type : 'Edm.DateTime'
  EndedAt : DateTime;
  @odata.Type : 'Edm.DateTime'
  DocumentCreationTime : DateTime;
  @odata.Type : 'Edm.DateTime'
  TechnicalAckDueTime : DateTime;
  @odata.Type : 'Edm.DateTime'
  FunctionalAckDueTime : DateTime;
  ResendAllowed : Boolean;
  RetryAllowed : Boolean;
  AgreementTypeName : LargeString;
  TransactionTypeName : LargeString;
  ArchivingStatus : LargeString;
  InterchangeName : LargeString;
  InterchangeDirection : LargeString;
  TransactionActivityType : LargeString;
  @cds.ambiguous : 'missing on condition?'
  BusinessDocumentRelations : Association to many cpi.BusinessDocumentRelations {  };
  @cds.ambiguous : 'missing on condition?'
  BusinessDocumentProcessingEvents : Association to many cpi.BusinessDocumentProcessingEvents {  };
  @cds.ambiguous : 'missing on condition?'
  BusinessDocumentPayloads : Association to many cpi.BusinessDocumentPayloads {  };
  @cds.ambiguous : 'missing on condition?'
  SenderTechnicalAcknowledgement : Association to cpi.TechnicalAcknowledgements {  };
  @cds.ambiguous : 'missing on condition?'
  ReceiverTechnicalAcknowledgement : Association to cpi.TechnicalAcknowledgements {  };
  @cds.ambiguous : 'missing on condition?'
  SenderFunctionalAcknowledgement : Association to cpi.FunctionalAcknowledgements {  };
  @cds.ambiguous : 'missing on condition?'
  ReceiverFunctionalAcknowledgement : Association to cpi.FunctionalAcknowledgements {  };
  @cds.ambiguous : 'missing on condition?'
  LastErrorDetails : Association to cpi.ErrorDetails {  };
  @cds.ambiguous : 'missing on condition?'
  CustomObjects : Association to cpi.CustomObjects {  };
  @cds.ambiguous : 'missing on condition?'
  BusinessDocumentNotes : Association to many cpi.BusinessDocumentNotes {  };
  @cds.ambiguous : 'missing on condition?'
  BusinessDocumentProtocolHeaders : Association to many cpi.BusinessDocumentProtocolHeaders {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.BusinessDocumentProtocolHeaders {
  key Id : LargeString not null;
  Name : LargeString;
  Value : LargeString;
  @cds.ambiguous : 'missing on condition?'
  BusinessDocument : Association to cpi.BusinessDocuments {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.TechnicalAcknowledgements {
  key Id : LargeString not null;
  Type : LargeString;
  Direction : LargeString;
  PayloadId : LargeString;
  Status : LargeString;
  PayloadContainerContentType : LargeString;
  PayloadContentType : LargeString;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  BusinessDocumentProcessingEvent : Association to cpi.BusinessDocumentProcessingEvents {  };
  @cds.ambiguous : 'missing on condition?'
  BusinessDocument : Association to cpi.BusinessDocuments {  };
  @cds.ambiguous : 'missing on condition?'
  FunctionalAcknowledgement : Association to cpi.FunctionalAcknowledgements {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.OrphanedInterchanges {
  key Id : LargeString not null;
  AdapterType : LargeString;
  MonitoringType : LargeString;
  MonitoringId : LargeString;
  @odata.Type : 'Edm.DateTime'
  Date : DateTime;
  PayloadId : LargeString;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  CommunicationProtocolHeaders : Association to many cpi.CommunicationProtocolHeaders {  };
  @cds.ambiguous : 'missing on condition?'
  ErrorDetails : Association to cpi.ErrorDetails {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.CommunicationProtocolHeaders {
  key Id : LargeString not null;
  Name : LargeString;
  Value : LargeString;
  @cds.ambiguous : 'missing on condition?'
  OrphanedInterchange : Association to cpi.OrphanedInterchanges {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.FunctionalAcknowledgements {
  key Id : LargeString not null;
  PayloadId : LargeString;
  PayloadContainerContentType : LargeString;
  PayloadContentType : LargeString;
  DocumentId : LargeString;
  MessageType : LargeString;
  DocumentStandard : LargeString;
  Direction : LargeString;
  Status : LargeString;
  TransmissionStatus : LargeString;
  TransmissionErrorInformation : LargeString;
  TransmissionHttpCode : Integer;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  BusinessDocumentProcessingEvents : Association to many cpi.BusinessDocumentProcessingEvents {  };
  @cds.ambiguous : 'missing on condition?'
  BusinessDocument : Association to cpi.BusinessDocuments {  };
  @cds.ambiguous : 'missing on condition?'
  TechnicalAcknowledgement : Association to cpi.TechnicalAcknowledgements {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.BusinessDocumentNotes {
  key Id : LargeString not null;
  UserId : LargeString;
  @odata.Type : 'Edm.DateTime'
  CreateTimeStamp : DateTime;
  Text : LargeString;
  Type : LargeString;
  @cds.ambiguous : 'missing on condition?'
  BusinessDocumentProcessingEvent : Association to cpi.BusinessDocumentProcessingEvents {  };
  @cds.ambiguous : 'missing on condition?'
  BusinessDocument : Association to cpi.BusinessDocuments {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.BusinessDocumentProcessingEvents {
  key Id : LargeString not null;
  EventType : LargeString;
  @odata.Type : 'Edm.DateTime'
  Date : DateTime;
  MonitoringType : LargeString;
  MonitoringId : LargeString;
  @cds.ambiguous : 'missing on condition?'
  BusinessDocument : Association to cpi.BusinessDocuments {  };
  @cds.ambiguous : 'missing on condition?'
  FunctionalAcknowledgement : Association to cpi.FunctionalAcknowledgements {  };
  @cds.ambiguous : 'missing on condition?'
  BusinessDocumentPayload : Association to many cpi.BusinessDocumentPayloads {  };
  @cds.ambiguous : 'missing on condition?'
  ErrorDetails : Association to many cpi.ErrorDetails {  };
  @cds.ambiguous : 'missing on condition?'
  BusinessDocumentNotes : Association to many cpi.BusinessDocumentNotes {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.Resources {
  key Name : LargeString not null;
  key ResourceType : LargeString not null;
  ReferencedResourceType : LargeString;
  ResourceSize : Integer64;
  ResourceSizeUnit : LargeString;
  ResourceContent : LargeBinary;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.ScriptCollectionDesigntimeArtifacts {
  key Id : LargeString not null;
  key Version : LargeString not null;
  PackageId : LargeString;
  Name : LargeString;
  Description : LargeString;
  ArtifactContent : LargeBinary;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  Resources : Association to many cpi.Resources {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.Configurations {
  key ParameterKey : LargeString not null;
  ParameterValue : LargeString;
  DataType : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.EntryPoints {
  key Url : LargeString not null;
  Name : LargeString not null;
  Type : LargeString;
  AdditionalInformation : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.ServiceEndpoints {
  key Id : LargeString not null;
  Name : LargeString;
  Title : LargeString not null;
  Version : LargeString not null;
  Summary : LargeString not null;
  Description : LargeString not null;
  @odata.Type : 'Edm.DateTime'
  LastUpdated : DateTime;
  Protocol : LargeString;
  @cds.ambiguous : 'missing on condition?'
  EntryPoints : Association to many cpi.EntryPoints {  };
  @cds.ambiguous : 'missing on condition?'
  ApiDefinitions : Association to many cpi.APIDefinitions {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.DesignGuidelineExecutionResults {
  key ExecutionId : LargeString not null;
  ArtifactVersion : LargeString;
  ExecutionStatus : LargeString;
  ExecutionTime : LargeString;
  ReportType : LargeString;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  DesignGuidelines : Association to many cpi.DesignGuidelines {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.APIDefinitions {
  key Url : LargeString not null;
  Name : LargeString not null;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.NumberRanges {
  key Name : LargeString not null;
  Description : LargeString;
  MaxValue : LargeString;
  MinValue : LargeString;
  Rotate : LargeString;
  CurrentValue : LargeString;
  FieldLength : LargeString;
  DeployedBy : LargeString;
  @odata.Type : 'Edm.DateTime'
  DeployedOn : DateTime;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.IntegrationDesigntimeLocks {
  key ResourceId : LargeString not null;
  ArtifactId : LargeString not null;
  ArtifactName : LargeString;
  ArtifactType : LargeString;
  PackageId : LargeString;
  PackageName : LargeString;
  @odata.Type : 'Edm.DateTime'
  CreatedAt : DateTime;
  CreatedBy : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.IntegrationPackages {
  key Id : LargeString not null;
  Name : LargeString not null;
  ResourceId : LargeString not null;
  Description : LargeString;
  ShortText : LargeString not null;
  Version : LargeString;
  Vendor : LargeString;
  PartnerContent : Boolean;
  UpdateAvailable : Boolean;
  Mode : LargeString;
  SupportedPlatform : LargeString;
  ModifiedBy : LargeString;
  CreationDate : LargeString;
  ModifiedDate : LargeString;
  CreatedBy : LargeString;
  Products : LargeString;
  Keywords : LargeString;
  Countries : LargeString;
  Industries : LargeString;
  LineOfBusiness : LargeString;
  PackageContent : LargeBinary;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  IntegrationDesigntimeArtifacts : Association to many cpi.IntegrationDesigntimeArtifacts {  };
  @cds.ambiguous : 'missing on condition?'
  ValueMappingDesigntimeArtifacts : Association to many cpi.ValueMappingDesigntimeArtifacts {  };
  @cds.ambiguous : 'missing on condition?'
  MessageMappingDesigntimeArtifacts : Association to many cpi.MessageMappingDesigntimeArtifacts {  };
  @cds.ambiguous : 'missing on condition?'
  ScriptCollectionDesigntimeArtifacts : Association to many cpi.ScriptCollectionDesigntimeArtifacts {  };
  @cds.ambiguous : 'missing on condition?'
  CustomTags : Association to many cpi.CustomTags {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.IntegrationFlows {
  key Id : LargeString not null;
  Name : LargeString;
  SenderHostType : LargeString;
  ReceiverHostType : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.BuildAndDeployStatus {
  key TaskId : LargeString not null;
  Status : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MDIDeltaToken {
  key Operation : LargeString not null;
  key Entity : LargeString not null;
  key Version : LargeString not null;
  DeltaToken : LargeString;
  LastUpdateTimestamp : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.ValMapSchema {
  key SrcAgency : LargeString not null;
  key SrcId : LargeString not null;
  key TgtAgency : LargeString not null;
  key TgtId : LargeString not null;
  State : LargeString;
  @cds.ambiguous : 'missing on condition?'
  ValMaps : Association to many cpi.ValMaps {  };
  @cds.ambiguous : 'missing on condition?'
  DefaultValMaps : Association to many cpi.DefaultValMaps {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageMappingDesigntimeArtifacts {
  key Id : LargeString not null;
  key Version : LargeString not null;
  PackageId : LargeString not null;
  Name : LargeString not null;
  Description : LargeString;
  ArtifactContent : LargeBinary;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  Resources : Association to many cpi.Resources {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.ValMaps {
  key Id : LargeString not null;
  Value : cpi.Value not null;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.CustomTagConfigurations {
  key Id : LargeString not null;
  CustomTagsConfigurationContent : LargeString;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.IntegrationConnections {
  key Id : Integer not null;
  ResolvedConnection : Boolean;
  SenderHost : LargeString not null;
  ReceiverHost : LargeString not null;
  @cds.ambiguous : 'missing on condition?'
  IntegrationFlows : Association to many cpi.IntegrationFlows {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.CustomTags {
  key Name : LargeString not null;
  Value : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.IntegrationAdapterDesigntimeArtifacts {
  key Id : LargeString not null;
  Version : LargeString not null;
  PackageId : LargeString;
  Name : LargeString;
  ArtifactContent : LargeBinary;
  Description : LargeString;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.ValueMappingDesigntimeArtifacts {
  key Id : LargeString not null;
  key Version : LargeString not null;
  PackageId : LargeString not null;
  Name : LargeString not null;
  Description : LargeString;
  ArtifactContent : LargeBinary;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  ValMapSchema : Association to many cpi.ValMapSchema {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.DesignGuidelines {
  key GuidelineId : LargeString not null;
  GuidelineName : LargeString;
  Category : LargeString;
  Severity : LargeString;
  Applicability : LargeString;
  Compliance : LargeString;
  IsGuidelineSkipped : Boolean;
  SkipReason : LargeString;
  SkippedBy : LargeString;
  ExpectedKPI : LargeString;
  ActualKPI : LargeString;
  ViolatedComponents : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.DefaultValMaps {
  key Id : LargeString not null;
  Value : cpi.Value not null;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.IntegrationDesigntimeArtifacts {
  key Id : LargeString not null;
  key Version : LargeString not null;
  PackageId : LargeString;
  Name : LargeString;
  Description : LargeString;
  Sender : LargeString;
  Receiver : LargeString;
  CreatedBy : LargeString;
  CreatedAt : LargeString;
  ModifiedBy : LargeString;
  ModifiedAt : LargeString;
  ArtifactContent : LargeBinary;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  Configurations : Association to many cpi.Configurations {  };
  @cds.ambiguous : 'missing on condition?'
  Resources : Association to many cpi.Resources {  };
  @cds.ambiguous : 'missing on condition?'
  DesignGuidelineExecutionResults : Association to many cpi.DesignGuidelineExecutionResults {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.IdempotentRepositoryEntries {
  key HexSource : String(2000) not null;
  key HexEntry : String(2000) not null;
  Source : LargeString;
  Entry : LargeString;
  Component : LargeString;
  CreationTime : Integer64;
  ExpirationTime : Integer64;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.GenericIdempotentRepositoryEntries {
  key HexVendor : LargeString not null;
  key HexSource : String(2000) not null;
  key HexEntry : String(2000) not null;
  key HexComponent : String(200) not null;
  Source : LargeString;
  Entry : LargeString;
  Component : LargeString;
  Vendor : String(100);
  CreationTime : Integer64;
  ExpirationTime : Integer64;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.IdMapFromIds {
  key FromId : String(200) not null;
  @cds.ambiguous : 'missing on condition?'
  ToIds : Association to many cpi.IdMapToIds {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.IdMapToIds {
  key ToId : LargeString not null;
  FromId_ : LargeString;
  Mapper : LargeString;
  @odata.Type : 'Edm.DateTimeOffset'
  ExpirationTime : DateTime;
  Qualifier : LargeString;
  Context : LargeString;
  @cds.ambiguous : 'missing on condition?'
  FromId : Association to cpi.IdMapFromIds {  };
  @cds.ambiguous : 'missing on condition?'
  FromId2s : Association to many cpi.IdMapFromId2s {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.IdMapFromId2s {
  key FromId : String(200) not null;
  ToId2 : LargeString;
  Mapper : LargeString;
  @odata.Type : 'Edm.DateTimeOffset'
  ExpirationTime : DateTime;
  Qualifier : LargeString;
  Context : LargeString;
  @cds.ambiguous : 'missing on condition?'
  ToId : Association to cpi.IdMapToIds {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.Locks {
  key Component : LargeString not null;
  key HexSource : LargeString not null;
  key HexEntry : LargeString not null;
  Source : LargeString;
  Entry : LargeString;
  CreationTime : Integer64;
  ExpirationTime : Integer64;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.DataStores {
  key DataStoreName : LargeString not null;
  key IntegrationFlow : LargeString not null;
  key Type : LargeString not null;
  Visibility : LargeString;
  NumberOfMessages : Integer64;
  NumberOfOverdueMessages : Integer64;
  @cds.ambiguous : 'missing on condition?'
  Entries : Association to many cpi.DataStoreEntries {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.DataStoreEntries {
  key Id : LargeString not null;
  key DataStoreName : LargeString not null;
  key IntegrationFlow : LargeString not null;
  key Type : LargeString not null;
  Status : LargeString;
  MessageId : LargeString;
  @odata.Type : 'Edm.DateTime'
  DueAt : DateTime;
  @odata.Type : 'Edm.DateTime'
  CreatedAt : DateTime;
  @odata.Type : 'Edm.DateTime'
  RetainUntil : DateTime;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.Variables {
  key VariableName : LargeString not null;
  key IntegrationFlow : LargeString not null;
  Visibility : LargeString;
  @odata.Type : 'Edm.DateTime'
  UpdatedAt : DateTime;
  @odata.Type : 'Edm.DateTime'
  RetainUntil : DateTime;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.JmsMessages {
  key Msgid : String(100) not null;
  key Name : String(200) not null;
  key Failed : Boolean not null;
  Mplid : LargeString;
  CreatedAt : Integer64;
  RetryCount : Integer64;
  NextRetry : Integer64;
  MimeMsgid : LargeString;
  ContentType : LargeString;
  MimeVersion : LargeString;
  OverdueAt : Integer64;
  ExpirationDate : Integer64;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  Queue : Association to cpi.Queues {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.Queues {
  key Name : String(200) not null;
  NumbOfMsgs : Integer64;
  Size : Integer64;
  Type : Integer64;
  State : Integer64;
  FillGrade : Integer64;
  Active : Integer64;
  @cds.ambiguous : 'missing on condition?'
  Messages : Association to many cpi.JmsMessages {  };
  @cds.ambiguous : 'missing on condition?'
  Artifacts : Association to many cpi.JmsArtifacts {  };
  @cds.ambiguous : 'missing on condition?'
  JmsQueues : Association to many cpi.JmsQueues {  };
  @cds.ambiguous : 'missing on condition?'
  Broker : Association to cpi.JmsBrokers {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.JmsQueues {
  key Name : String(200) not null;
  MaxQueueSize : Integer64;
  ActiveState : Integer64;
  QueueSize : Integer64;
  State : Integer64;
  @cds.ambiguous : 'missing on condition?'
  Queue : Association to cpi.Queues {  };
  @cds.ambiguous : 'missing on condition?'
  Broker : Association to cpi.JmsBrokers {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.JmsBrokers {
  key ![Key] : String(10) not null;
  Capacity : Integer64;
  MaxCapacity : Integer64;
  IsTransactedSessionsHigh : Integer;
  IsConsumersHigh : Integer;
  IsProducersHigh : Integer;
  MaxQueueNumber : Integer64;
  QueueNumber : Integer64;
  CapacityOk : Integer64;
  CapacityWarning : Integer64;
  CapacityError : Integer64;
  IsQueuesHigh : Integer;
  IsMessageSpoolHigh : Integer;
  @cds.ambiguous : 'missing on condition?'
  QueueNamesHigh : Association to many cpi.JmsQueues {  };
  @cds.ambiguous : 'missing on condition?'
  InactiveQueues : Association to many cpi.Queues {  };
  @cds.ambiguous : 'missing on condition?'
  QueueStates : Association to many cpi.QueueStates {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.JmsArtifacts {
  key Name : String(200) not null;
  Id : LargeString;
  Direction : Integer64;
  @cds.ambiguous : 'missing on condition?'
  Queue : Association to cpi.Queues {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.QueueStates {
  key Name : String(200) not null;
  State : Integer64;
  @cds.ambiguous : 'missing on condition?'
  Broker : Association to cpi.JmsBrokers {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.WNNodes {
  key Type : LargeString not null;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.StringParameters : cpi.Parameter {
  Value : String(4000) not null;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.BinaryParameters : cpi.Parameter {
  ContentType : String(300) not null;
  Value : Binary(1572864) not null;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.AlternativePartners {
  key Hexagency : String(480) not null;
  key Hexscheme : String(480) not null;
  key Hexid : String(1020) not null;
  Agency : String(120) not null;
  Scheme : String(120) not null;
  Id : String(255) not null;
  Pid : String(60) not null;
  LastModifiedBy : String(150);
  @odata.Type : 'Edm.DateTime'
  LastModifiedTime : DateTime;
  CreatedBy : String(150);
  @odata.Type : 'Edm.DateTime'
  CreatedTime : DateTime;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.AuthorizedUsers {
  key User : String(150) not null;
  Pid : String(60) not null;
  LastModifiedBy : String(150);
  @odata.Type : 'Edm.DateTime'
  LastModifiedTime : DateTime;
  CreatedBy : String(150);
  @odata.Type : 'Edm.DateTime'
  CreatedTime : DateTime;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.Partners {
  key Pid : String(60) not null;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.NodeProfiles {
  key Name : String(100) not null;
  @cds.ambiguous : 'missing on condition?'
  Roles : Association to many cpi.Roles {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.Roles {
  key Name : LargeString not null;
  @cds.ambiguous : 'missing on condition?'
  NodeProfile : Association to cpi.NodeProfiles {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.XiDataStores {
  key Name : LargeString not null;
  key Qualifier : LargeString not null;
  Participant : LargeString not null;
  Channel : LargeString not null;
  @cds.ambiguous : 'missing on condition?'
  Artifact : Association to cpi.XiDataStoreArtifacts {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.XiDataStoreArtifacts {
  key Id : LargeString not null;
  Name : LargeString;
  @cds.ambiguous : 'missing on condition?'
  DataStores : Association to many cpi.XiDataStores {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.PgpKeyEntries {
  key Id : LargeString not null;
  KeyId : LargeString;
  Fingerprint : LargeString;
  Type : LargeString;
  @odata.Type : 'Edm.DateTimeOffset'
  CreatedTime : DateTime;
  Algorithm : LargeString;
  KeyLength : Integer;
  KeyFlags : Integer;
  KeyFlagsLabel : LargeString;
  ValidityState : String(20);
  @odata.Type : 'Edm.DateTimeOffset'
  ValidUntil : DateTime;
  @odata.Type : 'Edm.DateTimeOffset'
  ModifiedOn : DateTime;
  ErrorInformation : LargeString;
  PrimaryUserId : String(512);
  @cds.ambiguous : 'missing on condition?'
  UserIds : Association to many cpi.PgpUserIds {  };
  @cds.ambiguous : 'missing on condition?'
  SubKeys : Association to many cpi.PgpSubKeys {  };
  @cds.ambiguous : 'missing on condition?'
  PublicResource : Association to cpi.PgpKeyPublicResources {  };
  @cds.ambiguous : 'missing on condition?'
  SecretResource : Association to cpi.PgpKeySecretResources {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.PgpKeyEntryImportResults {
  key Id : LargeString not null;
  KeyId : LargeString;
  PrimaryUserId : String(512);
  Status : LargeString;
  StatusDetails : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.PgpUserIds {
  key UserId : String(512) not null;
  @cds.ambiguous : 'missing on condition?'
  PgpKeyEntry : Association to cpi.PgpKeyEntries {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.PgpSubKeys {
  key Id : LargeString not null;
  KeyId : LargeString;
  @odata.Type : 'Edm.DateTimeOffset'
  CreatedTime : DateTime;
  Algorithm : LargeString;
  KeyLength : Integer;
  KeyFlags : Integer;
  KeyFlagsLabel : LargeString;
  ValidityState : LargeString;
  @odata.Type : 'Edm.DateTimeOffset'
  ValidUntil : DateTime;
  @odata.Type : 'Edm.DateTimeOffset'
  ModifiedOn : DateTime;
  @cds.ambiguous : 'missing on condition?'
  PgpKeyEntry : Association to cpi.PgpKeyEntries {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.PgpKeyPublicResources {
  key KeyId : LargeString not null;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  PgpKeyEntry : Association to cpi.PgpKeyEntries {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.PgpKeySecretResources {
  key KeyId : LargeString not null;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  PgpKeyEntry : Association to cpi.PgpKeyEntries {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.PgpKeyringPublicResources {
  key Name : LargeString not null;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.PgpKeyringSecretResources {
  key Name : LargeString not null;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
};

@cds.external : true
@cds.persistence.skip : true
@open : true
entity cpi.PgpKeyrings {
  key Name : String(100) not null;
  LastModifiedBy : String(150);
  @odata.Type : 'Edm.DateTimeOffset'
  LastModifiedTime : DateTime;
  Size : Integer;
  RuntimeIds : String(620);
  AggregatedStatus : String(20);
  AggregatedErrors : String(5000);
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.PgpPublicKeyrings : cpi.PgpKeyrings {
  @cds.ambiguous : 'missing on condition?'
  Runtimes : Association to many cpi.KeyringRuntimeAssignment {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.PgpSecretKeyrings : cpi.PgpKeyrings {
  @cds.ambiguous : 'missing on condition?'
  Runtimes : Association to many cpi.KeyringRuntimeAssignment {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.KeyringRuntimeAssignment {
  key KeyringName : String(30) not null;
  key RuntimeId : String(30) not null;
  Status : String(20) not null;
  StatusUpdatedAt : Integer64 not null;
  Errors : String(5000);
  @cds.ambiguous : 'missing on condition?'
  Pubring : Association to cpi.PgpPublicKeyrings {  };
  @cds.ambiguous : 'missing on condition?'
  Secring : Association to cpi.PgpSecretKeyrings {  };
};

@cds.external : true
@cds.persistence.skip : true
@open : true
entity cpi.KeystoreEntries : cpi.KeystoreEntryCertificatePart {
  Type : String(30);
  Owner : String(30);
  LastModifiedBy : String(150);
  @odata.Type : 'Edm.DateTimeOffset'
  LastModifiedTime : DateTime;
  CreatedBy : String(150);
  @odata.Type : 'Edm.DateTimeOffset'
  CreatedTime : DateTime;
  Status : String(500);
  @cds.ambiguous : 'missing on condition?'
  ChainCertificates : Association to many cpi.ChainCertificates {  };
  @cds.ambiguous : 'missing on condition?'
  Certificate : Association to cpi.CertificateResources {  };
  @cds.ambiguous : 'missing on condition?'
  Sshkey : Association to cpi.SSHKeyResources {  };
  @cds.ambiguous : 'missing on condition?'
  Keystore : Association to cpi.Keystores {  };
  @cds.ambiguous : 'missing on condition?'
  ChainResource : Association to cpi.CertificateChainResources {  };
  @cds.ambiguous : 'missing on condition?'
  SigningRequest : Association to cpi.CertificateSigningRequests {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.HistoryKeystoreEntries : cpi.KeystoreEntries {
  ActivatedBy : String(150);
  @odata.Type : 'Edm.DateTimeOffset'
  ActiveFrom : DateTime;
  DeactivatedBy : String(150);
  @odata.Type : 'Edm.DateTimeOffset'
  ActiveUntil : DateTime;
  ActivationSequenceNumber : Integer;
  OriginalAlias : String(250);
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.KeyPairResources : cpi.KeystoreEntryAlias {
  Resource : Binary(30072);
  Password : String(500);
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.ChainCertificates {
  key Hexalias : String(2000) not null;
  key Index : Integer not null;
  Alias : String(250) not null;
  Validity : String(1000);
  KeyType : String(30);
  KeySize : Integer;
  @odata.Type : 'Edm.DateTimeOffset'
  ValidNotBefore : DateTime;
  @odata.Type : 'Edm.DateTimeOffset'
  ValidNotAfter : DateTime;
  SubjectDN : String(50000);
  IssuerDN : String(50000);
  SerialNumber : String(66);
  SignatureAlgorithm : String(60);
  Version : Integer;
  FingerprintSha1 : String(200);
  FingerprintSha256 : String(200);
  FingerprintSha512 : String(200);
  @cds.ambiguous : 'missing on condition?'
  KeystoreEntry : Association to cpi.KeystoreEntries {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.SSHKeyResources : cpi.KeystoreEntryAlias {
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  KeystoreEntry : Association to cpi.KeystoreEntries {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.KeyPairGenerationRequests : cpi.KeystoreEntryCertificatePartBase {
  KeyAlgorithmParameter : String(500);
  CommonName : String(500);
  OrganizationUnit : String(500);
  Organization : String(500);
  Locality : String(500);
  State : String(500);
  Country : String(2);
  Email : String(500);
  Extensions : Binary(3000);
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.CertificateSigningRequests {
  key Hexalias : String(2000) not null;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  KeystoreEntry : Association to cpi.KeystoreEntries {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.CertificateResources : cpi.KeystoreEntryAlias {
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  KeystoreEntry : Association to cpi.KeystoreEntries {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.CertificateChainResources : cpi.KeystoreEntryAlias {
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  KeystoreEntry : Association to cpi.KeystoreEntries {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.KeystoreResources {
  key Name : String(100) not null;
  Resource : Binary(6291456);
  Password : String(300);
  Aliases : String(2097152);
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.Keystores {
  key Name : String(100) not null;
  LastModifiedBy : String(150);
  @odata.Type : 'Edm.DateTimeOffset'
  LastModifiedTime : DateTime;
  Size : Integer;
  RuntimeIds : String(620);
  AggregatedStatus : String(20);
  AggregatedErrors : String(5000);
  @cds.ambiguous : 'missing on condition?'
  Entries : Association to many cpi.KeystoreEntries {  };
  @cds.ambiguous : 'missing on condition?'
  Runtimes : Association to many cpi.RuntimeSyncInfos {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.RuntimeSyncInfos {
  key KeystoreName : String(30) not null;
  key RuntimeId : String(30) not null;
  Status : String(20) not null;
  StatusUpdatedAt : Integer64 not null;
  Errors : String(5000);
  @cds.ambiguous : 'missing on condition?'
  Keystore : Association to cpi.Keystores {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.SecurityArtifacts {
  key Name : LargeString not null;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.SSHKeyGenerationRequests : cpi.KeystoreEntryCertificatePartBase {
  SSHFile : String(10000);
  Password : String(500);
  KeyAlgorithmParameter : String(500);
  CommonName : String(500);
  OrganizationUnit : String(500);
  Organization : String(500);
  Locality : String(500);
  State : String(500);
  Country : String(2);
  Email : String(500);
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.RSAKeyGenerationRequests : cpi.KeystoreEntryAlias {
  RSAFile : Binary(10000) not null;
  SignatureAlgorithm : String(60);
  @odata.Type : 'Edm.DateTimeOffset'
  ValidNotBefore : DateTime;
  @odata.Type : 'Edm.DateTimeOffset'
  ValidNotAfter : DateTime;
  SerialNumber : String(256);
  CommonName : String(500);
  OrganizationUnit : String(500);
  Organization : String(500);
  Locality : String(500);
  State : String(500);
  Country : String(2);
  Email : String(500);
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.UserCredentialParameters : cpi.Parameter {
  User : String(200) not null;
  Password : String(200);
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.UserCredentials {
  key Name : LargeString not null;
  Kind : LargeString;
  Description : LargeString;
  User : LargeString;
  Password : LargeString;
  CompanyId : LargeString;
  SecurityArtifactDescriptor : cpi.SecurityArtifactDescriptor not null;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.SecureParameters {
  key Name : String(150) not null;
  Description : String(1024);
  SecureParam : String(4096);
  DeployedBy : String(150);
  @odata.Type : 'Edm.DateTime'
  DeployedOn : DateTime;
  Status : String(20);
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.OAuth2ClientCredentials {
  key Name : String(1024) not null;
  Description : String(1024);
  TokenServiceUrl : String(1024) not null;
  ClientId : String(1024) not null;
  ClientSecret : String(1024);
  ClientAuthentication : String(1024);
  Scope : String(1024);
  ScopeContentType : String(5120);
  Resource : String(1024);
  Audience : String(1024);
  SecurityArtifactDescriptor : cpi.SecurityArtifactDescriptor not null;
  @cds.ambiguous : 'missing on condition?'
  CustomParameters : Association to many cpi.CustomParameters {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.CustomParameters {
  key ![Key] : String(1024) not null;
  key Value : String(1024) not null;
  key SendAsPartOf : String(1024) not null;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.OAuth2AuthorizationCodes {
  key Name : String(150) not null;
  Type : String(50) not null;
  Description : String(200);
  Provider : String(50) not null;
  TokenUrl : String(2000) not null;
  AuthUrl : String(2000) not null;
  ClientId : String(200) not null;
  ClientSecret : String(1000);
  ClientAuthentication : String(200);
  Scope : String(4000);
  UserName : String(1000);
  RefreshToken : String(20000);
  RefreshTokenCreationTime : Integer64;
  RefreshTokenExisting : Boolean;
  RefreshTokenExpiryPeriod : Integer64 not null;
  LastModifiedBy : String(150);
  LastModifiedTime : Integer64;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.IntegrationRuntimeArtifacts {
  key Id : LargeString not null;
  Version : LargeString;
  Name : LargeString;
  Type : LargeString;
  DeployedBy : LargeString;
  @odata.Type : 'Edm.DateTime'
  DeployedOn : DateTime;
  Status : LargeString;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  ErrorInformation : Association to cpi.RuntimeArtifactErrorInformations {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.RuntimeArtifactErrorInformations {
  key Id : LargeString not null;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.AccessPolicies {
  key Id : Integer64 not null;
  RoleName : LargeString;
  Description : LargeString;
  @cds.ambiguous : 'missing on condition?'
  ArtifactReferences : Association to many cpi.ArtifactReferences {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageProcessingLogRunStepProperties {
  key RunId : LargeString not null;
  key ChildCount : Integer not null;
  key Name : LargeString not null;
  Value : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.ArchivingConfigurations {
  key Id : LargeString not null;
  Active : Boolean not null;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageProcessingLogs {
  key MessageGuid : LargeString not null;
  CorrelationId : LargeString;
  ApplicationMessageId : LargeString;
  ApplicationMessageType : LargeString;
  @odata.Type : 'Edm.DateTime'
  LogStart : DateTime;
  @odata.Type : 'Edm.DateTime'
  LogEnd : DateTime;
  Sender : LargeString;
  Receiver : LargeString;
  IntegrationFlowName : LargeString;
  Status : LargeString;
  AlternateWebLink : LargeString;
  IntegrationArtifact : cpi.IntegrationArtifact not null;
  LogLevel : LargeString;
  CustomStatus : LargeString;
  ArchivingStatus : LargeString;
  ArchivingSenderChannelMessages : Boolean;
  ArchivingReceiverChannelMessages : Boolean;
  ArchivingLogAttachments : Boolean;
  ArchivingPersistedMessages : Boolean;
  TransactionId : LargeString;
  PreviousComponentName : LargeString;
  LocalComponentName : LargeString;
  OriginComponentName : LargeString;
  @cds.ambiguous : 'missing on condition?'
  CustomHeaderProperties : Association to many cpi.MessageProcessingLogCustomHeaderProperties {  };
  @cds.ambiguous : 'missing on condition?'
  MessageStoreEntries : Association to many cpi.MessageStoreEntries {  };
  @cds.ambiguous : 'missing on condition?'
  ErrorInformation : Association to cpi.MessageProcessingLogErrorInformations {  };
  @cds.ambiguous : 'missing on condition?'
  AdapterAttributes : Association to many cpi.MessageProcessingLogAdapterAttributes {  };
  @cds.ambiguous : 'missing on condition?'
  Attachments : Association to many cpi.MessageProcessingLogAttachments {  };
  @cds.ambiguous : 'missing on condition?'
  Runs : Association to many cpi.MessageProcessingLogRuns {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.TraceMessageExchangeProperties {
  key TraceId : Integer64 not null;
  key Name : LargeString not null;
  Value : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageProcessingLogRunSteps {
  key RunId : LargeString not null;
  key ChildCount : Integer not null;
  @odata.Type : 'Edm.DateTime'
  StepStart : DateTime;
  @odata.Type : 'Edm.DateTime'
  StepStop : DateTime;
  StepId : LargeString;
  ModelStepId : LargeString;
  BranchId : LargeString;
  Status : LargeString;
  Error : LargeString;
  Activity : LargeString;
  @cds.ambiguous : 'missing on condition?'
  RunStepProperties : Association to many cpi.MessageProcessingLogRunStepProperties {  };
  @cds.ambiguous : 'missing on condition?'
  TraceMessages : Association to many cpi.TraceMessages {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.ExternalLoggingActivationStatus {
  key Id : LargeString not null;
  Active : Boolean;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageStoreEntries {
  key Id : LargeString not null;
  MessageGuid : LargeString;
  MessageStoreId : LargeString;
  @odata.Type : 'Edm.DateTime'
  TimeStamp : DateTime;
  HasAttachments : Boolean;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  Attachments : Association to many cpi.MessageStoreEntryAttachments {  };
  @cds.ambiguous : 'missing on condition?'
  Properties : Association to many cpi.MessageStoreEntryProperties {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageProcessingLogRuns {
  key Id : LargeString not null;
  @odata.Type : 'Edm.DateTime'
  RunStart : DateTime;
  @odata.Type : 'Edm.DateTime'
  RunStop : DateTime;
  LogLevel : LargeString;
  OverallState : LargeString;
  ProcessId : LargeString;
  @cds.ambiguous : 'missing on condition?'
  RunSteps : Association to many cpi.MessageProcessingLogRunSteps {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageProcessingLogAttachments {
  key Id : LargeString not null;
  MessageGuid : LargeString;
  @odata.Type : 'Edm.DateTime'
  TimeStamp : DateTime;
  Name : LargeString;
  ContentType : LargeString;
  PayloadSize : Integer64;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.TraceMessages {
  key TraceId : Integer64 not null;
  MplId : LargeString not null;
  RunId : LargeString;
  ModelStepId : LargeString;
  PayloadSize : Integer64;
  MimeType : LargeString;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  Properties : Association to many cpi.TraceMessageProperties {  };
  @cds.ambiguous : 'missing on condition?'
  ExchangeProperties : Association to many cpi.TraceMessageExchangeProperties {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageStoreEntryAttachmentProperties {
  key AttachmentId : LargeString not null;
  key Name : LargeString not null;
  Value : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageProcessingLogErrorInformations {
  key MessageGuid : LargeString not null;
  Type : LargeString;
  LastErrorModelStepId : LargeString;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.LogFileArchives {
  key Scope : LargeString not null;
  key LogFileType : LargeString not null;
  key NodeScope : LargeString not null;
  ContentType : LargeString;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageStoreEntryProperties {
  key MessageId : LargeString not null;
  key Name : LargeString not null;
  Value : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageProcessingLogCustomHeaderProperties {
  key Id : LargeString not null;
  Name : LargeString;
  Value : LargeString;
  @cds.ambiguous : 'missing on condition?'
  Log : Association to cpi.MessageProcessingLogs {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageStoreEntryAttachments {
  key Id : LargeString not null;
  Name : LargeString;
  ContentType : LargeString;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
  @cds.ambiguous : 'missing on condition?'
  Properties : Association to many cpi.MessageStoreEntryAttachmentProperties {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.ArtifactReferences {
  key Id : Integer64 not null;
  Name : LargeString;
  Description : LargeString;
  Type : LargeString;
  ConditionAttribute : LargeString;
  ConditionValue : LargeString;
  ConditionType : LargeString;
  @cds.ambiguous : 'missing on condition?'
  AccessPolicy : Association to cpi.AccessPolicies {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.ExternalLoggingEvents {
  key Timestamp : Integer64 not null;
  EventType : LargeString;
  EventObject : LargeString;
  HasError : Boolean;
  StatusText : LargeString;
  StatusChangedAtMillis : Integer64;
  AverageLoadSec : Double;
  AverageLagSec : Double;
  AverageAvailability : Double;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.AuditLogs {
  key ChangeId : LargeString not null;
  Action : LargeString;
  @odata.Type : 'Edm.DateTime'
  Timestamp : DateTime;
  UserName : LargeString;
  ObjName : LargeString;
  ObjType : LargeString;
  Source : LargeString;
  NodeType : LargeString;
  UserType : LargeString;
  CustomerVisible : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.ArchivingKeyPerformanceIndicators {
  @odata.Type : 'Edm.DateTime'
  key RunStart : DateTime not null;
  RunDurationInMinutes : Integer;
  DataCollectionDurationInMinutes : Integer;
  DataCompressionDurationInMinutes : Integer;
  DataUploadDurationInMinutes : Integer;
  MplsToBeArchived : Integer;
  MplsArchived : Integer;
  MplsArchivingFailed : Integer;
  @odata.Type : 'Edm.DateTime'
  MplsArchivedUntilDate : DateTime;
  @odata.Type : 'Edm.DateTime'
  DateOfOldestMplToBeArchivedAfterRun : DateTime;
  DataUploadedInMb : Integer;
  RunStatus : LargeString;
  RunFailedPhase : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.LogFiles {
  key Name : LargeString not null;
  key Application : LargeString not null;
  @odata.Type : 'Edm.DateTimeOffset'
  LastModified : DateTime;
  ContentType : LargeString;
  LogFileType : LargeString;
  NodeScope : LargeString;
  Size : Integer64;
  @Core.MediaType : 'application/octet-stream'
  blob : LargeBinary;
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.MessageProcessingLogAdapterAttributes {
  key Id : LargeString not null;
  AdapterId : LargeString;
  AdapterMessageId : LargeString;
  Name : LargeString;
  Value : LargeString;
  @cds.ambiguous : 'missing on condition?'
  MessageProcessingLog : Association to cpi.MessageProcessingLogs {  };
};

@cds.external : true
@cds.persistence.skip : true
entity cpi.TraceMessageProperties {
  key TraceId : Integer64 not null;
  key Name : LargeString not null;
  Value : LargeString;
};

@cds.external : true
@cds.persistence.skip : true
@open : true
entity cpi.Parameter {
  key Pid : String(60) not null;
  key Id : String(1500) not null;
  LastModifiedBy : String(150);
  @odata.Type : 'Edm.DateTime'
  LastModifiedTime : DateTime;
  CreatedBy : String(150);
  @odata.Type : 'Edm.DateTime'
  CreatedTime : DateTime;
};

@cds.external : true
@cds.persistence.skip : true
@open : true
entity cpi.KeystoreEntryAlias {
  key Hexalias : String(2000) not null;
  Alias : String(250) not null;
};

@cds.external : true
@cds.persistence.skip : true
@open : true
entity cpi.KeystoreEntryCertificatePartBase : cpi.KeystoreEntryAlias {
  KeyType : String(30);
  KeySize : Integer;
  @odata.Type : 'Edm.DateTimeOffset'
  ValidNotBefore : DateTime;
  @odata.Type : 'Edm.DateTimeOffset'
  ValidNotAfter : DateTime;
  SerialNumber : String(256);
  SignatureAlgorithm : String(60);
  EllipticCurve : String(500);
};

@cds.external : true
@cds.persistence.skip : true
@open : true
entity cpi.KeystoreEntryCertificatePart : cpi.KeystoreEntryCertificatePartBase {
  Validity : String(1000);
  SubjectDN : String(50000);
  IssuerDN : String(50000);
  Version : Integer;
  FingerprintSha1 : String(200);
  FingerprintSha256 : String(200);
  FingerprintSha512 : String(200);
};

@cds.external : true
type cpi.Value {
  SrcValue : LargeString;
  TgtValue : LargeString;
};

@cds.external : true
type cpi.SecurityArtifactDescriptor {
  Type : String(1024);
  DeployedBy : String(1024);
  @odata.Type : 'Edm.DateTime'
  DeployedOn : DateTime;
  Status : String(1024);
};

@cds.external : true
type cpi.IntegrationArtifact {
  Id : LargeString;
  Name : LargeString;
  Type : LargeString;
  PackageId : LargeString;
  PackageName : LargeString;
};

@cds.external : true
action cpi.activateB2BArchivingConfiguration() returns LargeString;

@cds.external : true
action cpi.singleInterchangeProcess(
  Id : LargeString not null,
  ActionName : LargeString not null,
  NoteText : LargeString
) returns LargeString;

@cds.external : true
action cpi.massInterchangeProcess(
  FiltersQuery : LargeString not null,
  ActionName : LargeString not null,
  NoteText : LargeString
) returns LargeString;

@cds.external : true
action cpi.ScriptCollectionDesigntimeArtifactSaveAsVersion(
  Id : LargeString not null,
  SaveAsVersion : LargeString not null
) returns cpi.ScriptCollectionDesigntimeArtifacts;

@cds.external : true
action cpi.DeployScriptCollectionDesigntimeArtifact(
  Id : LargeString not null,
  Version : LargeString not null
) returns LargeString;

@cds.external : true
action cpi.ExecuteIntegrationDesigntimeArtifactsGuidelines(
  Id : LargeString not null,
  Version : LargeString not null
) returns LargeString;

@cds.external : true
action cpi.CopyIntegrationPackage(
  Id : LargeString not null,
  ImportMode : LargeString,
  Suffix : LargeString
) returns cpi.IntegrationPackages;

@cds.external : true
action cpi.DeployMessageMappingDesigntimeArtifact(
  Id : LargeString not null,
  Version : LargeString not null
) returns cpi.MessageMappingDesigntimeArtifacts;

@cds.external : true
action cpi.MessageMappingDesigntimeArtifactSaveAsVersion(
  Id : LargeString not null,
  SaveAsVersion : LargeString not null
) returns cpi.MessageMappingDesigntimeArtifacts;

@cds.external : true
action cpi.DeleteValMaps(
  Id : LargeString not null,
  Version : LargeString not null,
  SrcAgency : LargeString not null,
  SrcId : LargeString not null,
  TgtAgency : LargeString not null,
  TgtId : LargeString not null
) returns LargeString;

@cds.external : true
action cpi.UpsertValMaps(
  Id : LargeString not null,
  Version : LargeString not null,
  SrcAgency : LargeString not null,
  SrcId : LargeString not null,
  TgtAgency : LargeString not null,
  TgtId : LargeString not null,
  ValMapId : LargeString,
  SrcValue : LargeString not null,
  TgtValue : LargeString not null,
  IsConfigured : Boolean not null
) returns cpi.ValMaps;

@cds.external : true
action cpi.DeployIntegrationAdapterDesigntimeArtifact(
  Id : LargeString not null
) returns LargeString;

@cds.external : true
action cpi.DeployValueMappingDesigntimeArtifact(
  Id : LargeString not null,
  Version : LargeString not null
) returns cpi.ValueMappingDesigntimeArtifacts;

@cds.external : true
action cpi.ValueMappingDesigntimeArtifactSaveAsVersion(
  Id : LargeString not null,
  SaveAsVersion : LargeString not null
) returns cpi.ValueMappingDesigntimeArtifacts;

@cds.external : true
action cpi.UpdateDefaultValMap(
  Id : LargeString not null,
  Version : LargeString not null,
  SrcAgency : LargeString not null,
  SrcId : LargeString not null,
  TgtAgency : LargeString not null,
  TgtId : LargeString not null,
  ValMapId : LargeString not null,
  IsConfigured : Boolean not null
) returns cpi.DefaultValMaps;

@cds.external : true
action cpi.IntegrationDesigntimeArtifactSaveAsVersion(
  Id : LargeString not null,
  SaveAsVersion : LargeString not null
) returns cpi.IntegrationDesigntimeArtifacts;

@cds.external : true
action cpi.DeployIntegrationDesigntimeArtifact(
  Id : LargeString not null,
  Version : LargeString not null
) returns LargeString;

@cds.external : true
action cpi.deactivateQueue(
  Name : LargeString not null,
  State : LargeString
) returns LargeString;

@cds.external : true
action cpi.activateQueue(
  Name : LargeString not null,
  State : LargeString
) returns LargeString;

@cds.external : true
action cpi.OAuth2AuthorizationCodeFullAuthUrl() returns LargeString;

@cds.external : true
function cpi.OAuthTokenFromCode() returns LargeString;

@cds.external : true
action cpi.OAuth2AuthorizationCodeCopy() returns LargeString;

@cds.external : true
action cpi.OAuth2AuthorizationCodeRefreshTokenUpdate() returns LargeString;

@cds.external : true
action cpi.activateArchivingConfiguration() returns LargeString;

@cds.external : true
action cpi.CancelMessageProcessingLog(
  Id : LargeString not null
) returns cpi.MessageProcessingLogs;

@cds.external : true
action cpi.deactivateExternalLogging() returns LargeString;

@cds.external : true
action cpi.activateExternalLogging() returns LargeString;

