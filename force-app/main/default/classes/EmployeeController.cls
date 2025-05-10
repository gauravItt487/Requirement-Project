public class EmployeeController {
    @AuraEnabled(cacheable=true)
    public static List<Employee__c> getEmployees(String employeeName) {
        String name = '%' + employeeName + '%';
        return [Select Id, Name, Employee_Email__c, Employee_Id__c,Designation__c,Manager__c,Manager__r.Name,Manager__r.Id from Employee__c WHERE Name LIKE :name ORDER BY LastModifiedDate DESC];
    }
    
}