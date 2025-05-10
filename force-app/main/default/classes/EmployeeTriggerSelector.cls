public class EmployeeTriggerSelector {
    public List<Employee__c> getEmployees(){
        return [Select Id, Name, Employee_Email__c, Employee_Id__c,Designation__c,Manager__c,
                Manager_Employee_Id__c,Mobile__c,Date_of_Joining__c from Employee__c
                where Name != null AND Employee_Email__c != NULL AND Employee_Id__c != NULL AND Designation__c != NULL
                AND Manager__c != NULL AND Mobile__c != NULL AND Date_of_Joining__c != NULL];
    }
    
    public Id getUserId(){
        return[Select id,Name from user where Name = 'test gaurav test' limit 1].Id;
    }
    
    public String getUserName(){
        return[Select id,Name from user where Name = 'test gaurav test' limit 1].Name;
    }
    
}