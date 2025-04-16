trigger EmployeeTrigger on Employee__c (before insert,After insert) {
    EmployeeTriggerHandler handler = new EmployeeTriggerHandler();
    if(Trigger.isBefore && Trigger.IsInsert){
        handler.bulkBefore(trigger.new);

    }
    
    if(Trigger.isAfter && Trigger.IsInsert){
        handler.bulkAfter();  
    }
    
}