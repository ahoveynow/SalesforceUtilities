public with sharing class WebWorker {

    /**
     * Gets the URL for the WebWorker Visualforce Page, that contains the CONFIRMATIONTOKEN required for CSRF Protections
     */
    @AuraEnabled
    public static String getCSRFProtectedVFPUrl() {
        return Page.WebWorker.getUrl();
    }
}