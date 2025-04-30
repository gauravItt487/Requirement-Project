import { LightningElement, track, wire } from 'lwc';
import getExpenseRequests from '@salesforce/apex/ExpenseRequestController.getExpenseRequests';
import getExpenseCount from '@salesforce/apex/ExpenseRequestController.getExpenseCount';
import ExpenseRequestModal from 'c/expenseRequestModal';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const columns = [
    {
        label: 'Name', fieldName: 'nameUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'Name' },
            target: '_blank'
        }
    },
    { label: 'Employee Name', fieldName: 'Employee_Name__c' },
    { label: 'Employee Email', fieldName: 'Employee_Email__c' },
    { label: 'Amount', fieldName: 'Amount__c' },
    { label: 'Expense Date', fieldName: 'Expense_Date__c' },
    { label: 'Submission Date', fieldName: 'Submission_Date__c' },

];

export default class ShowExpenseRequests extends LightningElement {
    searcExpenseAmount = '';
    @track expenseList;
    columns = columns


    @wire(getExpenseRequests)
    wiredEmployees(result) {
        if (result.data) {
            console.log('result', result.data)
            this.expenseList = result.data;
            this.expenseList = result.data.map(row => {
                return {
                    ...row,
                    nameUrl: `/${row.Id}`
                };
            });
        }
        else if (result.error) {
            this.error = result.error;
        }
    }


    async handleNewClick() {
        getExpenseCount({})
            .then(data => {
                console.log('data', data);
                if (data == true) {
                    this.handleShowToastEvent('Error', 'You have already created maximum expense requests for the current month', 'error')
                }
                else {
                    this.handleModalOpen()
                }
            })
            .catch(error => {
                this.error = error;
            });
    }

    async handleModalOpen() {
        const result = await ExpenseRequestModal.open({
            size: 'medium'
        });
    }

    handleShowToastEvent(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
}