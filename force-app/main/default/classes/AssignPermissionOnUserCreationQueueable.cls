public class AssignPermissionOnUserCreationQueueable implements Queueable {
    private List<Id> userIds;
    
    public assignPermissionOnUserCreationQueueable(List<Id> userIds){
        this.userIds = userIds;
    }
    
    public void execute(QueueableContext ctx){
        PermissionSet ps = [Select id,Name from PermissionSet where Name = 'SalesUserPsl'];
        List<PermissionSetAssignment> assignmentList = new List<PermissionSetAssignment>();
        
        For(Id usrId : userIds){
            assignmentList.add(new PermissionSetAssignment(
                PermissionSetId = ps.Id,
                AssigneeId = usrId
            ));
        }
        
        if(assignmentList.size() > 0){
            Database.SaveResult[] saveResult = Database.insert(assignmentList,false);
            List<Error_Log__c> errorLogList = new List<Error_Log__c>();
            for(Database.SaveResult result : saveResult){
                if(!result.IsSuccess()){
                    for(Database.Error err : result.getErrors()){
                        errorLogList.add(new Error_Log__c(
                            Error_Message__c = err.getMessage()
                        ));
                    }
                }
            }
            
            if(errorLogList.size() > 0){
                insert errorLogList;
            }
                
        }
        
    }
}