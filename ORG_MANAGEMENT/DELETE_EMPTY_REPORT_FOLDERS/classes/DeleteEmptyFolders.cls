/**
 * MIT License
 * Copyright (c) 2022 Andrew Hovey
 * Full License Text: https://ahovey.com/MITLicense.html
 * The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
 * 
 * This tool uses the Zippex Utility: https://github.com/pdalcol/Zippex
 */

public without sharing class DeleteEmptyFolders {

    private List<FolderNode> topLevelFolders = new List<FolderNode>();
    private Map<Id, FolderNode> folderNodeMap = new Map<Id, FolderNode>(); // Map<Folder Id, FolderNode>
    private List<Folder> emptyFolders = new List<Folder>();
    private List<Folder> emptyFoldersButWithDeletedReports = new List<Folder>();


    /**************************/
    /***** PUBLIC METHODS *****/
    /**************************/

    public with sharing class ProcessEmptyFoldersResult {
        public Boolean folderDeleteAttempted;
        public Map<Folder, Boolean> emptyFoldersDeleteResultMap;
        public List<Folder> emptyFoldersButWithDeletedReports;
    }
    
    public ProcessEmptyFoldersResult processEmptyFolders(Boolean deleteEmptyFolders) {
        organizeFoldersIntoDataStructure();
        organizeReportsIntoDataStructure();
        traverseAndPopulateEmptyFoldersList(topLevelFolders);

        ProcessEmptyFoldersResult result = new ProcessEmptyFoldersResult();
        result.folderDeleteAttempted = deleteEmptyFolders;

        if (deleteEmptyFolders && emptyFolders.isEmpty() == false) {
            deleteEmptyFoldersWithMetadataApi(emptyFolders);
        }

        return null;
    }




    /***************************/
    /***** PRIVATE METHODS *****/
    /***************************/

    private void organizeFoldersIntoDataStructure() {
        List<Folder> folderRecords = [
            SELECT Id, 
                Name, 
                DeveloperName, 
                ParentId, 
                Type
            FROM Folder
            WHERE NamespacePrefix = NULL
                AND Type = 'Report'
                AND DeveloperName != NULL
        ];

        // First, simply load the records into the map without linking together, since order likely doesn't place dependencies first
        for (Folder folderRecord: folderRecords) {
            folderNodeMap.put(folderRecord.Id, new FolderNode(folderRecord));
        }

        // Create parent and child relationships
        for (FolderNode currentFolderNode: folderNodeMap.values()) {
            Id parentFolderId = currentFolderNode.folderRecord.ParentId;
            if (parentFolderId == null) {
                topLevelFolders.add(currentFolderNode);
            } else {
                FolderNode parentFolderNode = folderNodeMap.get(parentFolderId);
                currentFolderNode.parentFolderNode = parentFolderNode; // parent relationship
                parentFolderNode.childFolderNodes.add(currentFolderNode); // child relationship
            }
        }
    }


    private void organizeReportsIntoDataStructure() {
        List<Report> reportRecords = [
            SELECT Id,
                Name,
                DeveloperName,
                FolderName, // Folder Label
                IsDeleted,
                OwnerId // Folder ID
            FROM Report
            WHERE NamespacePrefix = NULL
                AND OwnerId != :UserInfo.getOrganizationId() // Exclude reports in 'Public Reports' folder, which uses Org ID as OwnerId
            ALL ROWS // fetches deleted reports as well
        ];

        for (Report reportRecord: reportRecords) {
            FolderNode reportFolderNode = folderNodeMap.get(reportRecord.OwnerId);
            if (reportFolderNode == null) { continue; }
            if (reportRecord.IsDeleted == false) {
                reportFolderNode.reportsInThisFolder.add(reportRecord);
            } else {
                reportFolderNode.deletedReportsInThisFolder.add(reportRecord);
            }
        }
    }


    /**
     * Each time this is called, it evaluates the folder which contains the siblingNodes that are passed in
     * (which are the children of the folder being evaluated).
     * It is done this way because initially we have a list of FolderNodes at the top level, not a parent folder.
     */
    private Map<String, Integer> traverseAndPopulateEmptyFoldersList (List<FolderNode> siblingNodes) {
        Integer totalDescendentReports = 0;
        Integer totalDeletedDescendentReports = 0;
        
        for (FolderNode currentNode: siblingNodes) {
            Integer reportsInCurrentFolder = 0;
            Integer deletedReportsInCurrentFolder = 0;

            reportsInCurrentFolder += currentNode.reportsInThisFolder.size();
            deletedReportsInCurrentFolder += currentNode.deletedReportsInThisFolder.size();

            Map<String, Integer> traverseResult = traverseAndPopulateEmptyFoldersList(currentNode.childFolderNodes);
            reportsInCurrentFolder += traverseResult.get('totalDescendentReports');
            deletedReportsInCurrentFolder += traverseResult.get('totalDeletedDescendentReports');
        
            // If this folder or ANY of its descendent folders have at least one report, it is not empty.
            if (reportsInCurrentFolder == 0) {
                if (deletedReportsInCurrentFolder == 0) {
                    emptyFolders.add(currentNode.folderRecord);
                    System.debug('Found Empty Folder: ' + currentNode.folderRecord.Name);
                } else {
                    emptyFoldersButWithDeletedReports.add(currentNode.folderRecord);
                    System.debug('Found Empty Folder BUT with Deleted reports: ' + currentNode.folderRecord.Name);
                }
            } else {
                System.debug('Found folder with descendents: ' + currentNode.folderRecord.Name + ' (' + totalDescendentReports + ')');
            }

            totalDescendentReports += reportsInCurrentFolder;
        }

        return new Map<String, Integer> {
            'totalDescendentReports' => totalDescendentReports,
            'totalDeletedDescendentReports' => totalDeletedDescendentReports
        };
    }


    private void deleteEmptyFoldersWithMetadataApi(List<Folder> foldersToDelete) {
        /* Note: I'm planning to create a utility that makes all of this
         * much more elegant. For now, so this DeleteEmptyFolders tool 
         * can be used sooner, I'm going to use what you see below
         * in all of it's scary-looking glory. Once I build a utility
         * to generate metadata package manifests in a scalable way,
         * I'll come back and replace this with calls to the utility.
         * - Andrew Hovey
         */

        String packageXml = '<!--?xml version="1.0" encoding="UTF-8"?-->\n';
        packageXml += '<package xmlns="http://soap.sforce.com/2006/04/metadata">\n';
        packageXml += '<version>53.0</version>\n</package>';
        
        String destructiveChangesXml = '<?xml version="1.0" encoding="utf-8"?>\n';
        destructiveChangesXml += '<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n';
        destructiveChangesXml += '<types><name>Report</name>';
        for (Folder folderToDelete: foldersToDelete) {
            destructiveChangesXml += '<members>' + folderToDelete.DeveloperName + '</members>\n';
        }
        destructiveChangesXml += '</types>\n';
        destructiveChangesXml += '<version>53.0</version></Package>';
        
        Zippex deleteFoldersZip = new Zippex();
        Blob packageXmlFile = Blob.valueOf(packageXml);
        deleteFoldersZip.addFile('package.xml', packageXmlFile, null);
        Blob destructiveChangesXmlFile = Blob.valueOf(destructiveChangesXml);
        deleteFoldersZip.addFile('destructiveChanges.xml', destructiveChangesXmlFile, null);
        Blob zipData = deleteFoldersZip.getZipArchive();
        
        String bodyEncoded = EncodingUtil.base64Encode(zipData);
        
        /*** ENCODE IN MULTIPART/FORM-DATA ***/

        String crlf='\n';
        String boundary = '--------------------------BOUNDARY';
        String endPoint = System.URL.getOrgDomainUrl().toExternalForm() + '/services/data/v53.0/metadata/deployRequest';
        
        String deploymentOptions =  '{"deployOptions" :{"allowMissingFiles" : false,"autoUpdatePackage" : false,"checkOnly" : false,"ignoreWarnings" : false, "performRetrieve" : false,"purgeOnDelete" : false,"rollbackOnError" : false,"runTests" : null,"runAllTests":false, "singlePackage" : true,"testLevel" : "NoTestRun"}}';
        
        String header = '--' + boundary + crlf
                    + 'Content-Disposition: form-data; name="entity_content"' + crlf
                    + 'Content-Type: application/json;'  + crlf + crlf
                    + deploymentOptions + crlf
                    +'--' + boundary + crlf
                    + 'Content-Disposition: form-data; name="file";filename="deploy.zip"' + crlf
                    + 'Content-Type: application/zip;' + crlf + crlf;
        
        String footer = + crlf + '--' + boundary + '--';
        
        String headerEncoded = EncodingUtil.base64Encode(Blob.valueOf(header));
        while(headerEncoded.endsWith('=')){
            header += ' ';
            headerEncoded = EncodingUtil.base64Encode(Blob.valueOf(header));
        }
    
        String footerEncoded = EncodingUtil.base64Encode(Blob.valueOf(footer));
    
        Blob bodyBlob = null;
        //last encoded body bytes
        String last4Bytes = bodyEncoded.substring(bodyEncoded.length() - 4, bodyEncoded.length());
        //if the last 4 bytes encoded base64 ends with the padding character (= or ==) then re-encode those bytes with the footer
        //to ensure the padding is added only at the end of the body
        if(last4Bytes.endsWith('=')){
            Blob decoded4Bytes = EncodingUtil.base64Decode(last4Bytes);
            HttpRequest tmp = new HttpRequest();
            tmp.setBodyAsBlob(decoded4Bytes);
            String last4BytesFooter = tmp.getBody() + footer;  
            bodyBlob = EncodingUtil.base64Decode(headerEncoded + bodyEncoded.substring(0, bodyEncoded.length() - 4) + EncodingUtil.base64Encode(Blob.valueOf(last4BytesFooter)));
        }
        else{
            bodyBlob = EncodingUtil.base64Decode(headerEncoded + bodyEncoded + footerEncoded);
        }
        
        HttpRequest req = new HttpRequest();    
        req.setEndpoint(endpoint);    
        req.setHeader('Authorization','Bearer '+ UserInfo.getSessionID());
        req.setMethod('POST');
        req.setHeader('Content-Type', 'multipart/form-data; boundary='+boundary);
        req.setBodyAsBlob(bodyBlob);
        req.setTimeout(120000);
        req.setHeader('Content-Length', String.valueof(req.getBodyAsBlob().size()));
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        //System.debug('status code ==>:'+ res.getStatusCode());
        //System.debug('response body ==>:'+ res.getBody());
    
        String response = res.getBody();
    }


    private with sharing class FolderNode {
        public Folder folderRecord;
        public FolderNode parentFolderNode;
        public List<FolderNode> childFolderNodes = new List<FolderNode>();
        public List<Report> reportsInThisFolder = new List<Report>();
        public List<Report> deletedReportsInThisFolder = new List<Report>();

        public FolderNode(Folder folderRecord) {
            this.folderRecord = folderRecord;
        }
    }
}