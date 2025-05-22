public class QuoteProductPdfController {

    @AuraEnabled(cacheable=true)
    public static List<QuoteLineItem> getQuoteLineItem(Id quoteId){
        return [SELECT Id, QuoteId, Quantity, UnitPrice, ListPrice, TotalPrice, Product2.Name,Quote.QuoteNumber, PricebookEntryId FROM QuoteLineItem where QuoteId = :quoteId];
    }

    @AuraEnabled
    public static String uploadPDFToQuote(String quoteId, String base64EncodedPDF, String fileName) {
        try {
            // Convert base64-encoded string to Blob
            Blob pdfBlob = EncodingUtil.base64Decode(base64EncodedPDF);
            
            // Create ContentVersion record
            ContentVersion cv = new ContentVersion();
            cv.Title = fileName;
            cv.PathOnClient = fileName;
            cv.VersionData = pdfBlob;
            insert cv;
            
            // Retrieve ContentVersion ID (for linking)
            String contentVersionId = cv.Id;

            // Create ContentDocumentLink to associate the file with the Quote
            ContentDocumentLink cdl = new ContentDocumentLink();
            cdl.ContentDocumentId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :contentVersionId].ContentDocumentId;
            cdl.LinkedEntityId = quoteId;  // Link the file to the Quote
            cdl.ShareType = 'V'; // View access
            cdl.Visibility = 'AllUsers';  // Or 'InternalUsers' based on your requirement
            insert cdl;
            
            return contentVersionId;
        } catch (Exception e) {
            throw new AuraHandledException('Error while uploading file: ' + e.getMessage());
        }
    }
}