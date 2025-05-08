trigger UserTrigger on User (after insert ,after update) {
    
    if(Trigger.isAfter){
        if(Trigger.isUpdate){
            List<Id> userIds = new List<Id>();
            for(User us : Trigger.new){
                if(us.IsActive == false){
                    userIds.add(us.Id);
                }
            }
            
            if(userIds.size() > 0){
                RemovePermissionsWhenUserIsDeactivated.updateUserPermissionsWhenInactive(userIds);
            }
        }
        
        if(Trigger.isInsert){
             List<Id> userIds = new List<Id>();
            for(User us : Trigger.new){
                if(us.IsActive == true){
                    userIds.add(us.Id);
                }
            }
            
            if(userIds.size() > 0){
                System.EnqueueJob(new AssignPermissionOnUserCreationQueueable(userIds));
            }
        }
        
    }
    
}