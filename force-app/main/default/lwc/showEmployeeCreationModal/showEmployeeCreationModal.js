import { LightningElement } from 'lwc';
import LightningModal from 'lightning/modal';


export default class ShowEmployeeCreationModal extends LightningModal {

    flowApiName = "Employee_Create_Employee";


    handleStatusChange(event) {
        if (event.detail.status === 'FINISHED') {
            console.log('event.detail.status', event.detail.status)
            this.close('okay');
            window.location.reload();
        }
    }

}