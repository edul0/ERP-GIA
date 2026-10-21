import type {Expense} from '../types';
export function companyNames(expenses:Expense[]):string[]{
 const names=new Map<string,string>();
 for(const expense of expenses){
  const name=(expense.saleSheet?.company||expense.clientName||'').trim().replace(/\s+/g,' ');
  const key=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  if(name&&!names.has(key))names.set(key,name);
 }
 return [...names.values()].sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
