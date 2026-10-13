import React,{useState} from 'react';
import type {Expense,Driver,Truck} from '../types';
import {ExpensesModal} from './ExpensesModal';
import {currency,displayDate} from '../lib/finance';
import {saleSheetReport} from '../lib/report';
interface ExpensesListProps {
 expenses:Expense[];drivers:Driver[];trucks:Truck[];type:'internal'|'external';isAdmin?:boolean;
 onAddExpense:(expense:Omit<Expense,'id'>)=>void;onUpdateExpense:(expense:Expense)=>void;
 onDeleteExpense:(id:string)=>void;onImportExpenses:(expenses:Omit<Expense,'id'>[])=>void;
 showToast:(message:string,duration?:number)=>void;
 onBulkUpdate:(updates:Expense[],additions:Omit<Expense,'id'>[],deletions:string[])=>void;
}
export const ExpensesList:React.FC<ExpensesListProps>=({expenses,drivers,trucks,type,isAdmin,onAddExpense,onUpdateExpense,showToast})=>{
 const [open,setOpen]=useState(false);const [editing,setEditing]=useState<Expense|null>(null);
 return <section className="surface space-y-4"><div className="flex justify-between items-center gap-3"><h2 className="font-bold text-xl">Fichas — {type==='internal'?'Frota interna':'Frota externa'}</h2><button className="bg-brand-600 text-white px-4 py-2 rounded-lg" onClick={()=>{setEditing(null);setOpen(true);}}>Nova ficha</button></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{['Data','Firma','Nº NF','Motorista','Placa','Valor total do frete',''].map((label,index)=><th className="border-b p-3" key={index}>{label}</th>)}</tr></thead><tbody>{[...expenses].sort((a,b)=>b.date.localeCompare(a.date)).map(expense=><tr key={expense.id} className="border-b"><td className="p-3 whitespace-nowrap">{displayDate(expense.date)}</td><td className="p-3">{expense.saleSheet?.company||expense.clientName||'—'}</td><td className="p-3">{expense.invoice||'—'}</td><td className="p-3">{drivers.find(driver=>driver.id===expense.driverId)?.name||'—'}</td><td className="p-3 whitespace-nowrap">{expense.licensePlate}</td><td className="p-3 whitespace-nowrap">{currency(expense.freightValue)}</td><td className="p-3"><div className="flex gap-3"><button className="text-brand-700 underline" onClick={()=>{setEditing(expense);setOpen(true);}}>Abrir</button><button className="text-brand-700 underline" onClick={async()=>{try{const pdf=await saleSheetReport(expense,drivers.find(driver=>driver.id===expense.driverId)?.name||'');pdf.save('ficha-venda.pdf');}catch{showToast('Não foi possível imprimir a ficha.');}}}>Imprimir</button></div></td></tr>)}</tbody></table>{expenses.length===0 && <p className="py-5 text-gray-500">Nenhuma ficha cadastrada.</p>}</div>{open && <ExpensesModal isOpen type={type} isAdmin={isAdmin} trucks={trucks} drivers={drivers} expense={editing} onClose={()=>setOpen(false)} onSave={data=>{if(editing)onUpdateExpense({...data,id:editing.id} as Expense);else onAddExpense(data as Omit<Expense,'id'>);setOpen(false);}}/>}</section>;
};
