import { LightningElement, track, api } from 'lwc';
import getPricebooks from '@salesforce/apex/CustomerFlowController.getPricebooks';

export default class PricebookSelector extends LightningElement {
    @track pricebooks = [];
    @track selectedPricebookId;
    @api opportunityId;
    @api accountId
    @api email

    columns = [
        { label: 'Name', fieldName: 'Name' }
    ];

    connectedCallback() {
        console.log('accountId', this.accountId);
        console.log('opportunityId', this.opportunityId);
        console.log('email', this.email);
        getPricebooks().then(result => {
            this.pricebooks = result;
        });
    }

    handleSelection(event) {
        event.detail.selectedRows.forEach(element => {
            this.selectedPricebookId = element.Id;
        })
        console.log('selectedPricebookId', this.selectedPricebookId);

    }

    get isNextDisabled() {
        return !this.selectedPricebookId;
    }

    handleNext() {
        this.dispatchEvent(new CustomEvent('next', {
            detail: {
                pricebookId: this.selectedPricebookId,
                accountId: this.accountId,
                opportunityId: this.opportunityId,
                email: this.email
            }
        }));
    }
}