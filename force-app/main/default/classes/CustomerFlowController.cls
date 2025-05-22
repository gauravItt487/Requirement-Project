public with sharing class CustomerFlowController {
    
    @AuraEnabled
    public static AccountOpportunityWrapper createAccountOpportunity(String name, String email, String mobile) {
        Account acc = new Account(Name = name);
        insert acc;
        
        Opportunity opp = new Opportunity(
            Name = name + ' Opportunity',
            AccountId = acc.Id,
            StageName = 'Prospecting',
            CloseDate = System.today().addDays(30)
        );
        insert opp;
        
        AccountOpportunityWrapper wrapper = new AccountOpportunityWrapper();
        wrapper.accountId = acc.Id;
        wrapper.opportunityId = opp.Id;
        return wrapper;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Pricebook2> getPricebooks() {
        return [SELECT Id, Name FROM Pricebook2 WHERE IsActive = TRUE];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<PricebookEntry> getProducts(Id pricebookId) {
        List<PricebookEntry> entries = [SELECT Id, Product2.Name, UnitPrice,Product2.Total_Quantity__c FROM PricebookEntry WHERE Pricebook2Id = :pricebookId AND IsActive = TRUE];
        //return entries.stream().map(e -> new ProductWrapper(e.Id, e.Product2.Name, e.UnitPrice)).toList();
        return entries;
    }
    
    @AuraEnabled
    public static void sendQuotePdf(String fileId , String toAddress) {
        Messaging.SingleEmailMessage message = new Messaging.SingleEmailMessage();
        OrgWideEmailAddress[] owea = [select Id from OrgWideEmailAddress where Address = 'aakashj597@gmail.com'];
        if ( owea.size() > 0 ) {
          message.setOrgWideEmailAddressId(owea.get(0).Id);
        }
        message.toAddresses = new String[] { toAddress};
        message.subject = 'Quote Generated';
        message.plainTextBody = 'This is the message body.';
        message.setEntityAttachments(new List<String>{fileId}) ;
        Messaging.SingleEmailMessage[] messages = 
            new List<Messaging.SingleEmailMessage> {message};
                Messaging.SendEmailResult[] results = Messaging.sendEmail(messages);
        if (results[0].success) {
            System.debug('The email was sent successfully.');
        } else {
            System.debug('The email failed to send: '
                         + results[0].errors[0].message);
        }
    }
    
    @AuraEnabled
    public static void createQuoteWithLines(
        Id pricebookId,
        Id accountId,
        Id opportunityId,
        List<ProductInput> selectedProductsList) {
            // Create Quote
            Quote qt = new Quote();
            qt.OpportunityId = opportunityId;
            qt.Name = 'Quote ' + Date.today();
            qt.Pricebook2Id = pricebookId;
            insert qt;
            
            List<QuoteLineItem> lines = new List<QuoteLineItem>();
            for (ProductInput p : selectedProductsList) {
                // Find the matching PricebookEntry
                QuoteLineItem line = new QuoteLineItem();
                line.Product2Id = p.Product2Id;
                line.PricebookEntryId = '01u5i000001VWS6AAO';
                line.Quantity = p.Quantity;
                line.UnitPrice = p.UnitPrice;
                line.QuoteId = qt.Id;
                lines.add(line);
                System.debug('Id ' + p.Id);
                System.debug('Quantity ' + p.Quantity);
                System.debug('Id ' + p.UnitPrice);
                System.debug('Id ' + p.Product2Id);
            }
            
            insert lines;
        }
    
    
    public class ProductWrapper {
        @AuraEnabled public String Id;
        @AuraEnabled public String Name;
        @AuraEnabled public Decimal UnitPrice;
        public ProductWrapper(String id, String name, Decimal price) {
            Id = id; Name = name; UnitPrice = price;
        }
    }
    
    public class ProductInput {
        @AuraEnabled public Id Id;
        @AuraEnabled public String Product2Id;
        @AuraEnabled public Decimal UnitPrice;
        @AuraEnabled public Double Quantity;
    }
    
    public class AccountOpportunityWrapper {
        @AuraEnabled public Id accountId;
        @AuraEnabled public Id opportunityId;
    }
}