import { LightningElement, track, api } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import sendQuotePdf from '@salesforce/apex/CustomerFlowController.sendQuotePdf';


import Payment_Object from "@salesforce/schema/Payment_Details__c";
import Card_Number from "@salesforce/schema/Payment_Details__c.Card_Number__c";
import Amount from "@salesforce/schema/Payment_Details__c.Amount_Paid__c";
import CVV from "@salesforce/schema/Payment_Details__c.CVV__c";

export default class PaymentScreen extends LightningElement {
    @track cardnumber = '';
    @track cvv = '';
    @track amount = '';
    @api contentVersionId
    @api email

    connectedCallback() {
        console.log('connected', this.contentVersionId);
        console.log('email', this.email);
    }

    handleInputChange(event) {
        const field = event.target.name;
        this[field] = event.target.value;
    }

    handleSendQuotePDf() {
        sendQuotePdf({ fileId: this.contentVersionId, toAddress: this.email })
            .then((result) => {
                console.log('result', result);
            })
            .catch((error) => {
                console.log('error', error);
            })
    }

    handleNext() {
        if (this.cvv && this.cardnumber) {

            const fields = {};

            fields[Card_Number.fieldApiName] = this.cardnumber;
            //fields[Amount.fieldApiName] = this.amount;
            fields[CVV.fieldApiName] = this.cvv;


            const recordInput = {
                apiName: Payment_Object.objectApiName,
                fields: fields
            };

            createRecord(recordInput)
                .then((result) => {
                    console.log(result);
                    this.handleSendQuotePDf();
                    this.dispatchEvent(new CustomEvent('next', {
                        detail: {
                            cardnumber: this.cardnumber,
                            contentVersionId: this.contentVersionId
                        }
                    }));
                })

                .catch((error) => {
                    console.log(error);
                })

        } else {
            alert('Please fill in all required fields.');
        }
    }
}