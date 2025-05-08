public class UpdateAccountStatusBatch implements Database.Batchable<Sobject> {
    
    public Database.QueryLocator start(Database.BatchableContext BC){
        string oneYearAgoDate = String.valueof(Date.today().addyears(-1));
                
        String query = 'Select id,Status__c,LastActivityDate From Account Where LastActivityDate < '+oneYearAgoDate;
        
        return Database.getQueryLocator(query);
    }
    
    public void execute(Database.BatchableContext BC,List<Account> accountList){
    List<Account> accListToUpdate = new List<Account>();
        
        if(accountList.size() > 0){
            for(Account acc : accountList){
                acc.Status__c = 'Inactive';
                accListToUpdate.add(acc);
            }
        }
        
        if(accListToUpdate.size() > 0){
            update accListToUpdate;
        }
    }
    
    public void finish(Database.BatchableContext BC){
        
    }
    
}