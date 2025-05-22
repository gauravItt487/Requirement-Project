import { LightningElement, api, wire } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import jsPDFResource from '@salesforce/resourceUrl/jsPDF';
import uploadPDFToQuote from '@salesforce/apex/QuoteProductPdfController.uploadPDFToQuote';
import QuoteProductPdfController from '@salesforce/apex/QuoteProductPdfController.getQuoteLineItem';
import { getRecord, createRecord } from 'lightning/uiRecordApi';

import Contract_OBJECT from "@salesforce/schema/Contract";
import AccountId from "@salesforce/schema/Contract.AccountId";
import Status from "@salesforce/schema/Contract.Status";
import StartDate from "@salesforce/schema/Contract.StartDate";
import ContractTerm from "@salesforce/schema/Contract.ContractTerm";

import Order_OBJECT from "@salesforce/schema/Order";
import Order_AccountId from "@salesforce/schema/Order.AccountId";
import ContractId from "@salesforce/schema/Order.ContractId";
import Order_Status from "@salesforce/schema/Order.Status";
import Order_StartDate from "@salesforce/schema/Order.EffectiveDate";
import Order_Amount from "@salesforce/schema/Order.TotalAmount";



const fields = ['Quote.QuoteNumber', 'Quote.GrandTotal', 'Quote.TotalPrice'];

export default class QuoteProductPdf extends LightningElement() {

    @api quoteId;
    @api accountId;
    @api email
    totalAmount
    orderId
    products = [];  // Array to hold the product data
    grandtotal = 0;
    QuoteNumber;
    contentVersionId;
    buttonDisable = false;

    jsPDFInitialized = false;

    connectedCallback() {
        console.log('accountId', this.accountId);
    }



    @wire(getRecord, { recordId: '$quoteId', fields: fields })
    quote;

    get number() {
        return this.quote.data.fields.QuoteNumber.value
    }

    get subtotal() {
        this.totalAmount = this.quote.data.fields.GrandTotal.value
        return this.quote.data.fields.GrandTotal.value
    }

    get totalprice() {
        return this.quote.data.fields.TotalPrice.value
    }


    @wire(QuoteProductPdfController, {
        quoteId: "$quoteId",
    })
    quoteData({ data, error }) {
        console.log('quoteId', this.quoteId);
        if (data) {
            console.log('data' + JSON.stringify(data));
            this.products = data.map(product => ({
                productName: product.Product2.Name,
                quantity: product.Quantity,
                UnitPrice: product.UnitPrice,
                QuoteNum: product.Quote.QuoteNumber,
            }));
            console.log('products' + JSON.stringify(this.products));
            this.QuoteNumber = this.products[0].QuoteNum.toString();
        } else if (error) {
            console.log('Error value parse ' + JSON.stringify(error));
        }

    }


    renderedCallback() {
        if (!this.jsPDFInitialized) {
            this.jsPDFInitialized = true;
            loadScript(this, jsPDFResource)
                .then(() => {
                    console.log('jsPDF library loaded successfully');
                })
                .catch((error) => {
                    console.log('Error loading jsPDF library', JSON.stringify(error));
                });
        }
    }

    generatePDF() {
        if (this.jsPDFInitialized) {
            const { jsPDF } = window.jspdf;

            const doc = new jsPDF();
            console.log('131');
            // Title (centered and bold)
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            const title = 'Quote';
            const pageWidth = doc.internal.pageSize.width;
            const titleWidth = doc.getTextWidth(title);
            const xTitlePosition = (pageWidth - titleWidth) / 2;
            doc.text(title, xTitlePosition, 10);
            console.log('140');
            // Invoice Details (left-aligned)
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text('Invoice Date: ' + new Date().toLocaleDateString(), 10, 20);
            doc.text('Quote Number: ' + this.QuoteNumber, 10, 30);
            console.log('146');
            // Table Header (bold)
            doc.setFont("helvetica", "bold");
            doc.text('Product Name', 10, 50);
            doc.text('Quantity', 60, 50);
            doc.text('Unit Price', 110, 50);
            doc.text('Total', 160, 50);
            console.log('154');
            let yPosition = 60;  // Starting Y position for rows
            this.products.forEach(product => {
                doc.setFont("helvetica", "normal");

                const quantity = product.Quantity || 0;
                const unitPrice = product.UnitPrice || 0;
                const total = product.quantity * product.UnitPrice;
                this.grandtotal += total;
                console.log('164');
                doc.text(product.productName.toString(), 10, yPosition);
                console.log('167');
                doc.text(product.quantity.toString(), 60, yPosition);
                console.log('169');
                doc.text('$' + product.UnitPrice.toFixed(2), 110, yPosition);
                doc.text('$' + total.toString(), 160, yPosition);
                console.log('total', total);
                yPosition += 10;
            });
            doc.text('Grand Total: ' + '$' + this.grandtotal, 10, yPosition);

            const footer = 'Thank you for your business!';
            const footerWidth = doc.getTextWidth(footer);
            const xFooterPosition = (pageWidth - footerWidth) / 2;
            const footerYPosition = yPosition + 10;
            doc.setFont("helvetica", "normal");
            doc.text(footer, xFooterPosition, footerYPosition);

            // Convert the PDF into a Blob
            const pdfOutput = doc.output('blob');
            const blobUrl = URL.createObjectURL(pdfOutput);
            console.log('pdf== ', JSON.stringify(blobUrl));

            // Convert the blob to base64 and upload
            this.blobToBase64(pdfOutput).then(base64Pdf => {
                console.log('base64Pdf', base64Pdf);
                uploadPDFToQuote({
                    quoteId: this.quoteId,
                    base64EncodedPDF: base64Pdf,
                    fileName: 'Quote_' + this.QuoteNumber + '.pdf'
                })
                    .then(response => {
                        console.log('File uploaded successfully: ' + response);
                        this.handleContractAndOrderCreation();
                        this.buttonDisable = true;
                        this.contentVersionId = response;
                        //this.dispatchEvent(new CustomEvent('next'));
                    })
                    .catch(error => {
                        console.error('Error uploading file: ' + error.body.message);
                    });
            }).catch(error => {
                console.error('Error converting blob to base64:', error);
            });
        } else {
            console.error('jsPDF is not initialized.');
        }
    }


    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result.split(',')[1]; // Get the Base64 part after the comma
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    handleContractAndOrderCreation() {

        const createRecordPromises = [];

        const today = new Date().toISOString().split('T')[0];
        console.log(today); // Output: "2025-05-18" (YYYY-MM-DD format)

        // Step 1: Create Quote
        const contractfields = {};
        contractfields[AccountId.fieldApiName] = this.accountId;
        contractfields[Status.fieldApiName] = 'Draft';
        contractfields[StartDate.fieldApiName] = today;
        contractfields[ContractTerm.fieldApiName] = 12;

        const contractInput = { apiName: Contract_OBJECT.objectApiName, fields: contractfields };

        return createRecord(contractInput)
            .then((record) => {
                const contractId = record.id;

                // Step 2: Create Quote Line Items
                const orderfields = {};
                orderfields[Order_AccountId.fieldApiName] = this.accountId;
                orderfields[ContractId.fieldApiName] = contractId;
                orderfields[Order_Status.fieldApiName] = 'Draft';
                orderfields[Order_StartDate.fieldApiName] = today;

                const orderInput = {
                    apiName: Order_OBJECT.objectApiName,
                    fields: orderfields
                };
                createRecordPromises.push(createRecord(orderInput));

                // Wait for all quote line items to be created
                return Promise.all(createRecordPromises);
            })
            .then(results => {
                const createdOrder = results.map(r => r.id);
                this.orderId = createdOrder[0]
                this.dispatchEvent(new CustomEvent('next', {
                    detail: {
                        totalAmount: this.totalAmount,
                        orderId: this.orderId,
                        contentVersionId: this.contentVersionId,
                        email: this.email
                    }
                }));
                console.log('order Id', this.orderId);
            })
            .catch(error => {
                console.error('Error in order creation:', error.body?.message || error);
                console.log('error', error);
            });

    }
}