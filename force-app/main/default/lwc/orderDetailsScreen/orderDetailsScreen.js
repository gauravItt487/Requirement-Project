import { LightningElement, wire, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

const fields = ['Order.OrderNumber'];

export default class OrderDetailsScreen extends LightningElement {

    @api orderId;
    @api contentVersionId
    @api email

    connectedCallback() {
        console.log('connectedCallback in order screen', this.contentVersionId);
    }

    @wire(getRecord, { recordId: '$orderId', fields: fields })
    order;

    get number() {
        return this.order.data.fields.OrderNumber.value
    }

    handleNext() {

        this.dispatchEvent(new CustomEvent('next', {
            detail: {
                orderId: this.orderId,
                contentVersionId: this.contentVersionId,
                email: this.email
            }
        }));

    }

}