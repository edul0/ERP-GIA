import type {Expense} from '../types';
export interface CompanyProfile { name:string; city:string; state:string; }
const keyFor=(name:string)=>name.trim().replace(/\s+/g,' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export function companyNames(expenses:Expense[]):string[]{
 const names=new Map<string,string>();
 for(const expense of expenses){
  const name=(expense.saleSheet?.company||expense.clientName||'').trim().replace(/\s+/g,' ');
  const key=keyFor(name);
  if(name&&!names.has(key))names.set(key,name);
 }
 return [...names.values()].sort((a,b)=>a.localeCompare(b,'pt-BR'));
}

export function companyProfiles(expenses:Expense[]):Record<string,CompanyProfile>{
 const profiles:Record<string,CompanyProfile>={};
 for(const expense of [...expenses].sort((a,b)=>a.date.localeCompare(b.date))){
  const name=(expense.saleSheet?.company||expense.clientName||'').trim().replace(/\s+/g,' ');
  const city=(expense.saleSheet?.city||expense.destination||'').trim();
  if(name&&city&&!profiles[keyFor(name)]) profiles[keyFor(name)]={name,city,state:(expense.saleSheet?.state||'').trim()};
 }
 return profiles;
}
