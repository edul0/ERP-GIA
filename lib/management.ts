import type {Expense} from '../types';
import {saleTotals} from './saleSheet';
import {sumMoney} from './finance';
export function sheetIssues(expense:Expense):string[] {
 const sheet=expense.saleSheet;
 if(!sheet)return [];
 const issues:string[]=[];
 if(!expense.invoice.trim())issues.push('NF não informada');
 if(!sheet.company.trim())issues.push('Firma não informada');
 if(!sheet.products.length)issues.push('Sem produtos');
 const totals=saleTotals(sheet);
 if(totals.payable<0)issues.push('Descontos maiores que os produtos');
 if(sheet.invoiceValue>0 && totals.gross>0 && Math.abs(sheet.invoiceValue-totals.payable)>.01)issues.push('Conferir NF e total dos produtos');
 if(sheet.freightPerBox>0 && Math.abs(totals.freight-expense.freightValue)>.01)issues.push('Conferir frete por caixa e frete contratado');
 return issues;
}
export function managementSummary(expenses:Expense[]) {
 const sheets=expenses.filter(expense=>expense.saleSheet);
 return {sheets,boxes:sheets.reduce((sum,e)=>sum+saleTotals(e.saleSheet!).boxes,0),sales:sumMoney(sheets,e=>saleTotals(e.saleSheet!).gross),discounts:sumMoney(sheets,e=>saleTotals(e.saleSheet!).discounts),payable:sumMoney(sheets,e=>saleTotals(e.saleSheet!).payable),freight:sumMoney(sheets,e=>e.freightValue),review:sheets.filter(e=>sheetIssues(e).length>0)};
}
