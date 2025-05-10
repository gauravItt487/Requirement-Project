import { LightningElement, track, wire } from 'lwc';
import getEmployees from '@salesforce/apex/EmployeeController.getEmployees';
import MyModal from 'c/showEmployeeCreationModal';

const columns = [
    {
        label: 'Employee Name', fieldName: 'nameUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'Name' },
            target: '_blank'
        }
    },
    { label: 'Employee Email', fieldName: 'Employee_Email__c' },
    { label: 'Employee Id', fieldName: 'Employee_Id__c' },
    { label: 'Designation', fieldName: 'Designation__c' },
    {
        label: 'Manager', fieldName: 'managerUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'managerName' },
            target: '_blank'
        }
    }

];


export default class ShowEmployeesRecordTable extends LightningElement {

    searcEmployeeName = '';
    @track employeeList;
    columns = columns


    @wire(getEmployees, { employeeName: '$searcEmployeeName' }) wiredEmployees(result) {
        if (result.data) {
            console.log('result', result.data)
            this.employeeList = result.data;
            this.employeeList = result.data.map(row => {
                return {
                    ...row,
                    nameUrl: `/${row.Id}`,
                    managerUrl: row.Manager__c ? `/${row.Manager__c}` : '',
                    managerName: row.Manager__r ? row.Manager__r.Name : ''
                };
            });
        }
        else if (result.error) {
            this.error = result.error;
        }
    }

    handleSearchNameChange(event) {
        window.clearTimeout(this.delayTimeout);
        const searcEmployeeName = event.target.value;
        this.delayTimeout = setTimeout(() => {
            this.searcEmployeeName = searcEmployeeName;
        }, 300);
    }

    async handleNewClick() {
        const result = await MyModal.open({
            size: 'medium'
        });

    }
}