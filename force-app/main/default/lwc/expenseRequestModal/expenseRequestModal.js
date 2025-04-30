import { LightningElement } from 'lwc';
import LightningModal from 'lightning/modal';

export default class ExpenseRequestModal extends LightningModal {

    flowApiName = "Expense_Request_Create_Expense_Request";


    handleStatusChange(event) {
        if (event.detail.status === 'FINISHED') {
            console.log('event.detail.status', event.detail.status)
            this.close('okay');
            window.location.reload();
        }
    }
}