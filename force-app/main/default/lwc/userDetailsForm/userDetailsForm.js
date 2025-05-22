import { LightningElement, track } from 'lwc';
import createAccountOpportunity from '@salesforce/apex/CustomerFlowController.createAccountOpportunity';

export default class UserDetailsForm extends LightningElement {
    @track name = '';
    @track email = '';
    @track mobile = '';

    handleInputChange(event) {
        const field = event.target.name;
        this[field] = event.target.value;
    }

    handleNext() {
        if (this.name && this.email && this.mobile) {
            createAccountOpportunity({
                name: this.name,
                email: this.email,
                mobile: this.mobile
            })
                .then(result => {
                    console.log('result.opportunityId', result.opportunityId)
                    console.log('email', this.email)
                    this.dispatchEvent(new CustomEvent('next', {
                        detail: {
                            accountId: result.accountId,
                            opportunityId: result.opportunityId,
                            email: this.email
                        }
                    }));
                })
                .catch(error => {
                    console.error('Error creating records', error);
                });
        } else {
            alert('Please fill in all required fields.');
        }
    }
}