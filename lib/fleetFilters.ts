import type {Expense,Driver} from '../types';
export function filterFleet(expenses:Expense[],drivers:Driver[],filters:{query:string;driver:string;plate:string;from:string;to:string}){
 const normalized=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const query=normalized(filters.query.trim());
 return expenses.filter(e=>(!filters.from||e.date>=filters.from)&&(!filters.to||e.date<=filters.to)&&(!filters.driver||e.driverId===filters.driver)&&(!filters.plate||e.licensePlate===filters.plate)&&(!query||normalized([e.invoice,e.licensePlate,e.saleSheet?.company,drivers.find(d=>d.id===e.driverId)?.name,e.saleSheet?.farm].join(' ')).includes(query)));
}
