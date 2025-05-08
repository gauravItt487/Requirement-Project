public class RemovePermissionsWhenUserIsDeactivated {
    @future
    public static void updateUserPermissionsWhenInactive(List<Id> userIds){
        
        List<PermissionSetAssignment> assignmentList = [Select AssigneeId,PermissionSetId from PermissionSetAssignment where AssigneeId In:userIds];
        
        List<PermissionSetAssignment> assignmentListToDelete = new List<PermissionSetAssignment>();
        
        if(assignmentList.size() > 0){
            for(PermissionSetAssignment asn : assignmentList ){
                assignmentListToDelete.add(asn);
            }
        }
        
        if(assignmentListToDelete.size() > 0){
            Database.deleteResult[] deleteResults = Database.delete(assignmentListToDelete, false);
            List<Error_Log__c> errorLogList = new List<Error_Log__c>();
            for(Database.deleteResult result: deleteResults){
                if(!result.isSuccess()){
                    for(Database.Error err : result.getErrors() ){
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