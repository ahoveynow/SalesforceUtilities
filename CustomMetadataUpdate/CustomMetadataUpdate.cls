/**
 * MIT License
 * Copyright (c) 2022 Andrew Hovey
 * Full License Text: https://ahovey.com/MITLicense.html
 * The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
 */
 
public without sharing class CustomMetadataUpdate implements Metadata.DeployCallback {

    public class CustomMetadataRecord {
        public String mdTypeName;
        public String mdtRecordName;
        public String mdtRecordLabel;
        public Map<String, Object> fieldValues = new Map<String, Object>();

        public CustomMetadataRecord(String mdTypeName, String mdtRecordName, String mdtRecordLabel, Map<String, Object> fieldValues) {
            this.mdTypeName = mdTypeName;
            this.mdtRecordName = mdtRecordName;
            this.mdtRecordLabel = mdtRecordLabel;
            this.fieldValues = fieldValues != null ? fieldValues : new Map<String, Object>();
        }

        public void addFieldValue(String fieldName, Object fieldValue) {
            fieldValues.put(fieldName, fieldValue);
        }
    }

    public static void updateCustomMetadata(List<CustomMetadataRecord> mdtRecords) {
        
            Metadata.DeployContainer mdContainer = new Metadata.DeployContainer();

            for (CustomMetadataRecord mdtRec: mdtRecords) {
                Metadata.CustomMetadata customMetadata = new Metadata.CustomMetadata();
                customMetadata.fullName = mdtRec.mdTypeName + '.' + mdtRec.mdtRecordName; //custom metadata type & record name
                customMetadata.label = mdtRec.mdtRecordLabel;

                for (String fieldName: mdtRec.fieldValues.keySet()) {
                    Metadata.CustomMetadataValue customField = new Metadata.CustomMetadataValue();
                    customField.field = fieldName;
                    customField.value = mdtRec.fieldValues.get(fieldName);
                    customMetadata.values.add(customField);
                }

                mdContainer.addMetadata(customMetadata);
            }

            CustomMetadataUpdate callback = new CustomMetadataUpdate();   
            if (Test.isRunningTest()) { return; } // Deployments cannot be enqueued in test classes
            Id jobId = Metadata.Operations.enqueueDeployment(mdContainer, callback);
    }

    public void handleResult(Metadata.DeployResult result, Metadata.DeployCallbackContext context) {
        if(result?.status == Metadata.DeployStatus.SUCCEEDED)
        {
            System.debug('SUCCESSFUL DEPLOYMENT ===> '+ result);
        }else{
            System.debug('FAILED DEPLOYMENT ===> '+ result);
        }
        
    }
}
