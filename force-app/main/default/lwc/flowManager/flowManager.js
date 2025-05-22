import { LightningElement, track, api } from 'lwc';

export default class FlowManager extends LightningElement {
    pricebookId;
    accountId
    opportunityId
    quoteId
    orderId
    contentVersionId
    email;
    @track currentScreen = {
        customerDetails: true,
        pricebookSelection: false,
        productSelection: false,
        quoteReview: false,
        orderDetails: false,
        payment: false,
        thankYou: false,
    };

    handleNext(event) {

        this.pricebookId = event.detail.pricebookId;
        this.accountId = event.detail.accountId;
        this.opportunityId = event.detail.opportunityId;
        this.quoteId = event.detail.quoteId;
        this.orderId = event.detail.orderId;
        this.contentVersionId = event.detail.contentVersionId;
        this.email = event.detail.email
        console.log('this.email', this.email)
        console.log('this.pricebookId', this.pricebookId)
        console.log('this.opportunityId', this.opportunityId)

        const keys = Object.keys(this.currentScreen);
        const currentIndex = keys.findIndex(key => this.currentScreen[key]);
        if (currentIndex >= 0 && currentIndex < keys.length - 1) {
            this.currentScreen[keys[currentIndex]] = false;
            this.currentScreen[keys[currentIndex + 1]] = true;
        }
    }

    handlePaymentDone() {
        this.currentScreen.payment = false;
        this.currentScreen.finalConfirmation = true;
    }
}