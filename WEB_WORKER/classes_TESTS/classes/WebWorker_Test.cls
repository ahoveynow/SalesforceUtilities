@IsTest
public without sharing class WebWorker_Test {

    /**
     * This test ensures that the visualforce page exists.
     * Beneficial in case the VFP name needs to change, and updating the reference in WebWorker.cls was forgotten.
     */
    @IsTest
    public static void getCSRFProtectedVFPUrl_ensureVFPExists() {
        Exception unexpectedException;

        Test.startTest();
        try {
            String urlResult = WebWorker.getCSRFProtectedVFPUrl();
        } catch (Exception err) {
            unexpectedException = err;
        }
        Test.stopTest();

        System.assertEquals(null, unexpectedException, 'No exception should have been thrown accessing VFP Url. Check that Page reference is valid.');
    }
}