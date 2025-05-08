public class UpdateAccountStatusScheduler {
    
    public void execute( SchedulableContext ctx ) {
        Database.executeBatch( new UpdateAccountStatusBatch(),100 );
       
    }
}