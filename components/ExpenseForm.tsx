import React from 'react';
import type {Driver,Expense} from '../types';
import {ExpensesModal} from './ExpensesModal';
import {normalizeExpense} from '../lib/validation';
interface ExpenseFormProps {
 formType:'internal'|'external';drivers:Driver[];
 onSubmit:(expense:Omit<Expense,'id'|'type'> & {id?:string})=>void;
 onCancel:()=>void;initialData?:Expense|null;
}
export default function ExpenseForm({formType,drivers,onSubmit,onCancel,initialData}:ExpenseFormProps) {
 return <ExpensesModal isOpen type={formType} drivers={drivers} expense={initialData||null} onClose={onCancel} onSave={data=>{const {type,...expense}=normalizeExpense({...data,type:formType});onSubmit(expense);}}/>;
}
