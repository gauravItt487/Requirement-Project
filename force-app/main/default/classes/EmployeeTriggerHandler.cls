public class EmployeeTriggerHandler {
    private Set<String> emailSet;
    private Set<String> mobileNumberSet;
    private EmployeeTriggerSelector selector;
    private static List<Employee__c> employeesWithInvalidData = new List<Employee__c>();
    private static List<Employee__c> employeesWithNoManager =  new List<Employee__c>();
    private static List<Employee__c> employeesWithDuplicateData = new List<Employee__c>();
    private static List<Employee__c> employeesWithInvalidIdPattern = new List<Employee__c>();
    private static List<Employee__c> employeesWithFutureJoiningDate = new List<Employee__c>();
    private static List<Employee__c> employeesWithInvalidMobilePattern = new List<Employee__c>();
    private static List<Employee_Account__c> employeeAccountToInsert = new List<Employee_Account__c>();
    private List<Error_Log__c> errorLogList;
    
    
    public EmployeeTriggerHandler(){
        emailSet = new Set<String>();
        mobileNumberSet = new Set<String>();
        errorLogList = new List<Error_Log__c>();
        selector = new EmployeeTriggerSelector();
    }
    
    
    public void bulkBefore(List<Employee__c> newEmployeeList){
        getEmployeeData();
        validateEmployeeData(newEmployeeList);
    }
    
    public void bulkAfter(){
        prepareErrorLogForInvalidData();
        prepareErrorLogForDupliCateData();
        prepareErrorLogForInvalidManager();
        prepareErrorLogForInvalidJoiningDate();
        prepareErrorLogForInvalidIdPattern();
        prepareErrorLogForInvalidMobilePattern();
        insertEmployeeAccount();
    }
    
    private void prepareErrorLogForInvalidManager() {
        if (employeesWithNoManager.size() > 0) {
            Id userId = selector.getUserId();
            string userName = selector.getUserName();
            for (Employee__c emp : employeesWithNoManager) {
                Error_Log__c log = new Error_Log__c();
                log.Employee_Name__c = emp.Name;
                log.Employee_Id__c = emp.Employee_Id__c;
                log.Error_Message__c = 'Could not find Manager with the entered Manager Employee Id.Please check the data';
                errorLogList.add(log);
            }
            insertErrorLogs(errorLogList);
            sendErrorEmail(errorLogList, 'Employee Error Report-Manager Not Found for this Employee.');
            postFailureToChatter(errorLogList,userId,userName);
        }
    }
    
    private void prepareErrorLogForDupliCateData() {
        if (employeesWithDuplicateData.size() > 0) {
            Id userId = selector.getUserId();
            string userName = selector.getUserName();
            for (Employee__c emp : employeesWithDuplicateData) {
                Error_Log__c log = new Error_Log__c();
                log.Employee_Name__c = emp.Name;
                log.Employee_Id__c = emp.Employee_Id__c;
                log.Error_Message__c = 'Either Email or Mobile Number is duplicate.Please check the data';
                errorLogList.add(log);
            }
            insertErrorLogs(errorLogList);
            sendErrorEmail(errorLogList, 'Employee Error Report-Duplicate Data Entered.');
            postFailureToChatter(errorLogList,userId,userName);
            
        }
    }
    
    private void prepareErrorLogForInvalidJoiningDate() {
        if (employeesWithFutureJoiningDate.size() > 0) {
            Id userId = selector.getUserId();
            string userName = selector.getUserName();
            for (Employee__c emp : employeesWithFutureJoiningDate) {
                Error_Log__c log = new Error_Log__c();
                log.Employee_Name__c = emp.Name;
                log.Employee_Id__c = emp.Employee_Id__c;
                log.Error_Message__c = 'Employee Joining Date Cannot be in the Future.';
                errorLogList.add(log);
            }
            insertErrorLogs(errorLogList);
            sendErrorEmail(errorLogList, 'Employee Error Report-Invalid Joining Date.');
            postFailureToChatter(errorLogList,userId,userName);
        }
    }
    
    private void prepareErrorLogForInvalidIdPattern() {
        if (employeesWithInvalidIdPattern.size() > 0) {
            Id userId = selector.getUserId();
            string userName = selector.getUserName();
            for (Employee__c emp : employeesWithInvalidIdPattern) {
                Error_Log__c log = new Error_Log__c();
                log.Employee_Name__c = emp.Name;
                log.Employee_Id__c = emp.Employee_Id__c;
                log.Error_Message__c = 'Either Employee Id or Manager Id has invalid Pattern.';
                errorLogList.add(log);
            }
            insertErrorLogs(errorLogList);
            sendErrorEmail(errorLogList, 'Employee Error Report-Invalid Pattern for Employe/Manager Employee Id.');
            postFailureToChatter(errorLogList,userId,userName);
        }
    }
    
    private void prepareErrorLogForInvalidMobilePattern() {
        if (employeesWithInvalidMobilePattern.size() > 0) {
            Id userId = selector.getUserId();
            string userName = selector.getUserName();
            for (Employee__c emp : employeesWithInvalidMobilePattern) {
                Error_Log__c log = new Error_Log__c();
                log.Employee_Name__c = emp.Name;
                log.Employee_Id__c = emp.Employee_Id__c;
                log.Error_Message__c = 'Entered Mobile Number does not support allowed pattern.';
                errorLogList.add(log);
            }
            insertErrorLogs(errorLogList);
            sendErrorEmail(errorLogList, 'Employee Error Report-Invalid Pattern for Mobile Number.');
            postFailureToChatter(errorLogList,userId,userName);
        }
    }
    
    private void prepareErrorLogForInvalidData() {        
        if (employeesWithInvalidData.size() > 0) {
            Id userId = selector.getUserId();
            string userName = selector.getUserName();
            for (Employee__c emp : employeesWithInvalidData) {
                Error_Log__c log = new Error_Log__c();
                log.Employee_Name__c = emp.Name;
                log.Employee_Id__c = emp.Employee_Id__c;
                log.Error_Message__c = 'Required Data is missing in employee details. Please check the data.';
                errorLogList.add(log);                
            }
            insertErrorLogs(errorLogList);
            sendErrorEmail(errorLogList, 'Employee Error Report-Required fields are missing.');
            postFailureToChatter(errorLogList,userId,userName);
        }
        
    }
    
    private void validateEmployeeData(List<Employee__c> newEmployeeList){
        for(Employee__c empl : newEmployeeList){
            if(empl.Employee_Email__c == null || empl.Date_of_Joining__c == null
               || empl.Manager_Employee_Id__c == null || empl.Designation__c == null || empl.Mobile__c == null
              ){
                  employeesWithInvalidData.add(empl);
              }
            
            else if(empl.Employee_Email__c != null && empl.Date_of_Joining__c != null
                    && empl.Manager_Employee_Id__c != null && empl.Designation__c != null && empl.Mobile__c != null){
                        if(emailSet.contains(empl.Employee_Email__c) || mobileNumberSet.contains(empl.Mobile__c)){
                            employeesWithDuplicateData.add(empl);
                        }
                        
                        else if(empl.Manager__c == null){
                            employeesWithNoManager.add(empl);
                        }
                        
                        else if(empl.Date_of_Joining__c > system.Today()){
                            employeesWithFutureJoiningDate.add(empl);
                        }
                        
                        else if (!validateEmployeeIdPattern(empl.Manager_Employee_Id__c)){
                            employeesWithInvalidIdPattern.add(empl);
                        }
                        
                        else if (!validateMobileNumberPattern(empl.Mobile__c)){
                            employeesWithInvalidMobilePattern.add(empl);
                        }
                        
                        else {
                            Employee_Account__c employeeAccount = new Employee_Account__c();
                            employeeAccount.Employee_Name__c = empl.Name;
                            employeeAccount.Employee_Email__c = empl.Employee_Email__c;
                            employeeAccount.Date_of_Joining__c = empl.Date_of_Joining__c;
                            employeeAccount.Mobile__c = empl.Mobile__c;
                            employeeAccount.Designation__c = empl.Designation__c;
                            employeeAccountToInsert.add(employeeAccount);
                        }
                        
                    } 
        }
    }
    
    private void getEmployeeData(){
        List<Employee__c> employeeList = selector.getEmployees();
        for(Employee__c emp: employeeList){
            emailSet.add(emp.Employee_Email__c);
            mobileNumberSet.add(emp.Mobile__c);
        }
    }
    
    private void sendErrorEmail(List<Error_Log__c> logs, String subject) {
        string currentUserEmail = userInfo.getUserEmail();
        if (logs.isEmpty()) return;
        
        String body = '<p>The following employee records have invalid data:</p>';
        body += '<table border="1" cellpadding="5" cellspacing="0">';
        body += '<tr><th>Employee Name</th><th>Employee ID</th><th>Error Message</th></tr>';
        
        for (Error_Log__c log : logs) {
            body += '<tr>';
            body += '<td>' + log.Employee_Name__c + '</td>';
            body += '<td>' + log.Employee_Id__c + '</td>';
            body += '<td>' + log.Error_Message__c + '</td>';
            body += '</tr>';
        }
        
        body += '</table>';
        
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        OrgWideEmailAddress[] owea = [select Id from OrgWideEmailAddress where Address = 'aakashj597@gmail.com'];
        if ( owea.size() > 0 ) {
            mail.setOrgWideEmailAddressId(owea.get(0).Id);
        }
        mail.setToAddresses(new String[] { currentUserEmail});
        mail.setSubject(subject);
        mail.setHtmlBody(body);
        
        try {
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
        } catch (Exception e) {
            System.debug('Error sending email: ' + e.getMessage());
        }
    }
    
    private void sendEmailWhenErrorLogCreationFails(List<Error_Log__c> failedLogs) {
        string currentUserEmail = userInfo.getUserEmail();
        String htmlBody = '<html><body>';
        htmlBody += '<p>The following error logs could not be created:</p>';
        htmlBody += '<table border="1" cellpadding="5" cellspacing="0">';
        htmlBody += '<tr><th>Employee Id</th><th>Employee Name</th><th>Error Message</th></tr>';
        
        for (Error_Log__c log : failedLogs) {
            String empId = log.Employee_Id__c;
            String empName = log.Employee_Name__c;
            String errorMessage = log.Error_Message__c;
            htmlBody += '<tr>';
            htmlBody += '<td>' + empId + '</td>';
            htmlBody += '<td>' + empName + '</td>';
            htmlBody += '<td>' + errorMessage + '</td>';
            htmlBody += '<td>Failed to insert error log</td>';
            htmlBody += '</tr>';
        }
        
        htmlBody += '</table>';
        htmlBody += '</body></html>';
        
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        email.setToAddresses(new String[] { currentUserEmail });
        email.setSubject('Error Log Insertion Failed');
        email.setHtmlBody(htmlBody);
        
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { email });
    }
    
    private void postFailureToChatter(List<Error_Log__c> failedLogs, Id userId,string userName) {
        String userMention = '@[' + userName + ']';
        String chatterBody = userMention + 'The following employee records have invalid data:\n\n';
        chatterBody += '**Employee Id | Employee Name | Error Message**\n';
        chatterBody += '--- | --- | ---\n';
        
        for (Error_Log__c log : failedLogs) {
            String empId = log.Employee_Id__c;
            String empName = log.Employee_Name__c;
            string errorMessage = log.Error_Message__c;
            chatterBody += empId + ' | ' + empName + ' | ' + errorMessage;
        }
        
        FeedItem post = new FeedItem();
        post.ParentId = userId;
        post.Body = chatterBody;
        post.Type = 'TextPost';
        insert post;
    }
    
    private Boolean validateEmployeeIdPattern(String employeeId){
        Pattern pattern = Pattern.compile('^[A-Za-z]\\d{4}$');
        
        Matcher matcher = pattern.matcher(employeeId);
        if (matcher.matches()) {
            return true;
        } 
        return false;
    }
    
    private Boolean validateMobileNumberPattern(String mobileNumber){
        Pattern pattern = Pattern.compile('^[0-9]{10}$');
        
        Matcher matcher = pattern.matcher(mobileNumber);
        if (matcher.matches()) {
            return true;
        } 
        return false;
    }
    
    private void insertEmployeeAccount(){
        if(employeeAccountToInsert.size() > 0){
            insert employeeAccountToInsert;
        }
    }
    
    private void insertErrorLogs(List<Error_Log__c> errorLogsToInsert) {
        if (!errorLogsToInsert.isEmpty()) {
            List<Error_Log__c> failedLogs = new List<Error_Log__c>();
            Database.SaveResult[] saveResults = Database.insert(errorLogsToInsert, false);
            
            for (Integer i = 0; i < saveResults.size(); i++) {
                if (!saveResults[i].isSuccess()) {
                    failedLogs.add(errorLogsToInsert[i]);
                    
                    for (Database.Error err : saveResults[i].getErrors()) {
                        System.debug('Error inserting log for Employee: ' + errorLogsToInsert[i].Employee_Name__c + ' - ' + err.getMessage());
                    }
                }
            }
            
            if (!failedLogs.isEmpty()) {
                sendEmailWhenErrorLogCreationFails(failedLogs);
            }
        }
    }
    
    
}