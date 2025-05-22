import { LightningElement, track, api } from 'lwc';
import getProducts from '@salesforce/apex/CustomerFlowController.getProducts';
import { refreshApex } from "@salesforce/apex";
import { createRecord, updateRecord } from 'lightning/uiRecordApi';
import Quote_Line_Item_OBJECT from "@salesforce/schema/QuoteLineItem";
import QuoteId from "@salesforce/schema/QuoteLineItem.QuoteId";
import UnitPrice from "@salesforce/schema/QuoteLineItem.UnitPrice";
import Quantity from "@salesforce/schema/QuoteLineItem.Quantity";
import PricebookEntryId from "@salesforce/schema/QuoteLineItem.PricebookEntryId";
import Product2Id from "@salesforce/schema/QuoteLineItem.Product2Id";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import Quote_OBJECT from "@salesforce/schema/Quote";
import Name from "@salesforce/schema/Quote.Name";
import Pricebook2Id from "@salesforce/schema/Quote.Pricebook2Id";
import OpportunityId from "@salesforce/schema/Quote.OpportunityId";



export default class ProductSelection extends LightningElement {
    @track products = [];
    @track selectedProducts = [];
    @track selectedProductsTotalQuantity = [];
    @track productQuantities = {};
    @api pricebookId;
    @api accountId;
    @api opportunityId;
    quoteId;
    @api email
    draftValues = [];

    columns = [
        {
            label: 'Name', fieldName: 'name',
            type: 'text',
            typeAttributes: {
                label: { fieldName: 'Product2.Name' },
                target: '_blank'
            }
        },
        { label: 'Price', fieldName: 'UnitPrice', editable: true },
        {
            label: 'Quantity',
            fieldName: 'Quantity',
            type: 'number',
            editable: true,
            cellAttributes: { alignment: 'left' },
            typeAttributes: {
                minimum: 1
            }
        }
    ];

    connectedCallback() {
        console.log('pricebookId', this.pricebookId);
        console.log('opportunityId', this.opportunityId);

        getProducts({ pricebookId: this.pricebookId }).then(result => {
            console.log('result', result)
            this.products = result.map(p => ({ ...p, Quantity: 1, name: `${p.Product2.Name}` }));
            console.log('this.products', JSON.stringify(this.products))

        });
    }

    async handleSave(event) {
        console.log('event.detail.draftValues', JSON.stringify(event.detail.draftValues))
        // Convert datatable draft values into record objects
        // const records = event.detail.draftValues.slice().map((draftValue) => {
        //     const fields = Object.assign({}, draftValue);
        //     return { fields };
        // });
        const records = event.detail.draftValues.map(draft => ({
            fields: {
                ...draft  // includes Id and all editable fields
            }
        }));

        console.log('records', JSON.stringify(records))

        // Clear all datatable draft values
        this.draftValues = [];

        try {
            console.log('inside try')
            // Update all records in parallel thanks to the UI API
            const recordUpdatePromises = records.map((record) => updateRecord(record));
            console.log('inside try---1', recordUpdatePromises)
            await Promise.all(recordUpdatePromises);
            console.log('inside try---2', recordUpdatePromises)

            // Report success with a toast
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Success",
                    message: "Contacts updated",
                    variant: "success"
                })
            );

            // Display fresh data in the datatable
            await refreshApex(this.products);
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Error updating or reloading contacts",
                    message: error,
                    variant: "error"
                })
            );
        }
    }


    handleQuantityChange(event) {
        const changedValues = event.detail.draftValues;

        changedValues.forEach(draft => {
            const index = this.products.findIndex(p => p.Id === draft.Id);
            if (index !== -1) {
                const quantity = Math.max(1, Number(draft.Quantity));
                this.products[index].Quantity = quantity;

                // Also update selectedProducts if present
                const selectedIndex = this.selectedProducts.findIndex(p => p.Id === draft.Id);
                if (selectedIndex !== -1) {
                    this.selectedProducts[selectedIndex].Quantity = quantity;
                }
            }
        });

        this.products = [...this.products]; // refresh UI
    }

    handleRowSelection(event) {
        this.selectedProducts = event.detail.selectedRows;
        this.selectedProductsTotalQuantity = event.detail.selectedRows.map(p => p.Product2.Total_Quantity__c);
        console.log('this.selectedProductsTotalQuantity', JSON.stringify(this.selectedProductsTotalQuantity))


        this.selectedProducts.forEach(p => {
            console.log('datatype of Id', typeof (p.Id))
            console.log('datatype of unitprice', typeof (p.UnitPrice))
            console.log('datatype of Id', typeof (p.Quantity))
        });
        console.log('this.selectedProducts', JSON.stringify(this.selectedProducts))
    }
    handleNext() {

        const invalidSelections = this.selectedProducts.filter(product => {
            const selectedQty = product.Quantity;
            const availableQty = product.Product2.Total_Quantity__c;
            return selectedQty > availableQty;
        });

        console.log('invalidSelections.length', invalidSelections.length)


        if (invalidSelections.length !== 0) {
            const invalidNames = invalidSelections.map(p => p.Product2.Name).join(', ');
            const errorMsg = `The following products exceed available quantity: ${invalidNames}`;

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Quantity Exceeded',
                    message: errorMsg,
                    variant: 'error',
                    mode: 'sticky'
                })
            );
            return; // Stop processing
        }

        const createRecordPromises = [];

        // Step 1: Create Quote
        const quoteFields = {};
        quoteFields[Name.fieldApiName] = 'Test Quote';
        quoteFields[Pricebook2Id.fieldApiName] = this.pricebookId; // replace with your actual Pricebook2Id
        quoteFields[OpportunityId.fieldApiName] = this.opportunityId; // replace with your actual OpportunityId

        const quoteInput = { apiName: Quote_OBJECT.objectApiName, fields: quoteFields };

        return createRecord(quoteInput)
            .then((record) => {
                const quoteId = record.id;
                this.quoteId = quoteId; // Store for later use if needed

                // Step 2: Create Quote Line Items
                this.selectedProducts.forEach((product) => {
                    if (product) {
                        const lineFields = {};
                        lineFields[QuoteId.fieldApiName] = quoteId;
                        lineFields[UnitPrice.fieldApiName] = product.UnitPrice;
                        lineFields[PricebookEntryId.fieldApiName] = product.Id; // This should be PricebookEntryId
                        lineFields[Product2Id.fieldApiName] = product.Product2Id;
                        lineFields[Quantity.fieldApiName] = product.Quantity;

                        const lineItemInput = {
                            apiName: Quote_Line_Item_OBJECT.objectApiName,
                            fields: lineFields
                        };

                        createRecordPromises.push(createRecord(lineItemInput));
                    }
                });

                // Wait for all quote line items to be created
                return Promise.all(createRecordPromises);
            })
            .then(results => {
                const createdLineItemIds = results.map(r => r.id);
                this.dispatchEvent(new CustomEvent('next', {
                    detail: {
                        quoteId: this.quoteId,
                        accountId: this.accountId,
                        email: this.email
                    }
                }));
                console.log('Created Quote Line Items:', createdLineItemIds);
            })
            .catch(error => {
                console.error('Error in quote/line item creation:', error.body?.message || error);
            });
    }
}