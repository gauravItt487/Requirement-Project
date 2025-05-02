public class ExpenseRequestController {
    @AuraEnabled(cacheable = true)
    public static List<Expense_Request__c> getExpenseRequests(){
        Id currentUserId = UserInfo.getUserId();

        return [SELECT Id, Name,Employee_Name__c,Employee_Email__c, Amount__c, Expense_Date__c, Submission_Date__c,ownerId,CreatedDate FROM Expense_Request__c
                 where ownerId =: currentUserId order by CreatedDate Desc];

    }

     @AuraEnabled
    public static Boolean getExpenseCount(){
        Id currentUserId = UserInfo.getUserId();

        List<Expense_Request__c> ExpenseRequestList =  [SELECT Id, Name,Employee_Name__c,Employee_Email__c, Amount__c, Expense_Date__c, Submission_Date__c,ownerId,CreatedDate FROM Expense_Request__c
                 where ownerId =: currentUserId AND CreatedDate = THIS_MONTH ];

        if(ExpenseRequestList.size() == 5){
            return true;
        }
        return false;

    }
    
}