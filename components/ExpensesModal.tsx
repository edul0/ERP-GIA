import React, {useEffect, useState} from 'react';
import { localDateKey } from '../lib/finance';
import { emptySaleSheet } from '../lib/saleSheet';
import { saleSheetReport } from '../lib/report';
import { Expense, Driver, Truck } from '../types';
import SaleSheetFields from './SaleSheetFields';
import AttachmentFields from './AttachmentFields';

interface ExpensesModalProps {
 trucks?: Truck[]; isOpen: boolean; type: 'internal' | 'external'; isAdmin?: boolean;
 drivers: Driver[]; expense: Expense | null; onClose: () => void; onSave: (data: Partial<Expense>) => void;
}
export const ExpensesModal: React.FC<ExpensesModalProps> = ({isOpen,type,drivers,trucks=[],expense,onClose,onSave}) => {
 const initial = (): Partial<Expense> => expense ? {...expense, saleSheet: expense.saleSheet || emptySaleSheet()} : {
  date:localDateKey(), driverId:drivers[0]?.id || '', licensePlate:'', invoice:'', freightValue:0, seguro:0,
  destination:'', type, thirdPartyFreight:0, fueling:0, entryOdometer:0, exitOdometer:0, driverExpenses:0, toll:0, saleSheet:emptySaleSheet()
 };
 const [formData,setFormData]=useState<Partial<Expense>>(initial);
 const [error,setError]=useState('');const [uploading,setUploading]=useState(false);
 useEffect(()=>{if(isOpen){setFormData(initial());setError('');}},[expense,isOpen,type]);
 if(!isOpen)return null;
 const field=(key:'date'|'invoice'|'licensePlate'|'freightValue'|'seguro',label:string,numeric=false)=><label className="block text-sm font-medium">{label}<input className="w-full border rounded p-2 mt-1" type={key==='date'?'date':numeric?'number':'text'} required={key==='date'||key==='licensePlate'} min={numeric?0:undefined} step={numeric?'.01':undefined} list={key==='licensePlate'?'registered-vehicles':undefined} value={formData[key]??''} onChange={e=>setFormData(previous=>({...previous,[key]:numeric?Number(e.target.value):e.target.value}))}/></label>;
 return <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" aria-labelledby="sheet-title" className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden"><header className="p-4 border-b flex justify-between items-center"><h2 id="sheet-title" className="font-bold">{expense?'Editar ficha':'Nova ficha'} — {type==='internal'?'Frota interna':'Frota externa'}</h2><button type="button" aria-label="Fechar ficha" onClick={onClose}>✕</button></header><form className="p-5 space-y-5 max-h-[80dvh] overflow-y-auto" onSubmit={e=>{e.preventDefault();if(uploading)return;setError('');try{onSave({...formData,type,destination:formData.saleSheet?.city?.trim() || formData.destination || ''});}catch(err){setError(err instanceof Error?err.message:'Confira os dados da ficha.');}}}>{error && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded">{error}</p>}<div className="grid md:grid-cols-2 gap-3">{field('date','Data')}{field('invoice','Nº NF')}</div><SaleSheetFields value={formData.saleSheet} date={formData.date} onChange={saleSheet=>setFormData(previous=>({...previous,saleSheet}))}/><section className="border rounded-xl p-4 space-y-3"><h3 className="font-bold">Dados do motorista</h3><div className="grid md:grid-cols-2 gap-3"><label className="block text-sm font-medium">Motorista<select required className="w-full border rounded p-2 mt-1" value={formData.driverId||''} onChange={e=>setFormData(previous=>({...previous,driverId:e.target.value}))}><option value="">Selecione</option>{drivers.map(driver=><option key={driver.id} value={driver.id}>{driver.name}</option>)}</select></label>{field('licensePlate','Placa')}{field('seguro','Valor do seguro (R$)',true)}{field('freightValue','Valor total do frete (R$)',true)}</div><datalist id="registered-vehicles">{trucks.map(truck=><option key={truck.id} value={truck.plate}>{truck.model}</option>)}</datalist></section><AttachmentFields value={formData.attachments} onBusy={setUploading} onChange={attachments=>setFormData(previous=>({...previous,attachments}))}/><footer className="border-t pt-4 flex flex-wrap justify-end gap-3"><button type="button" className="px-4 py-2 text-brand-700 font-bold" onClick={async()=>{try{const pdf=await saleSheetReport(formData,drivers.find(d=>d.id===formData.driverId)?.name||'');pdf.save('ficha-venda.pdf');}catch{setError('Não foi possível imprimir a ficha.');}}}>Imprimir ficha</button><button type="button" onClick={onClose}>Cancelar</button><button type="submit" disabled={uploading} className="px-4 py-2 bg-brand-600 text-white rounded-lg disabled:opacity-50">{uploading?'Enviando anexo…':'Salvar ficha'}</button></footer></form></div></div>;
};
