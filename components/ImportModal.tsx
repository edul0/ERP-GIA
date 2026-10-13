import React,{useRef,useState} from 'react';
import type {Expense,Driver} from '../types';
import {downloadCSV} from '../lib/csv';
import {sheetCSVRows,importSheetCSV} from '../lib/sheetCSV';
interface ImportModalProps {isOpen:boolean;type:'internal'|'external';drivers:Driver[];onClose:()=>void;onImport:(data:Omit<Expense,'id'>[])=>void}
export const ImportModal:React.FC<ImportModalProps>=({isOpen,type,drivers,onClose,onImport})=>{
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);const input=useRef<HTMLInputElement>(null);
 if(!isOpen)return null;
 return <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-labelledby="csv-title" className="bg-white rounded-xl p-5 w-full max-w-lg space-y-4"><h2 id="csv-title" className="font-bold text-lg">Importar fichas CSV</h2><p className="text-sm">Use o modelo com os campos do papel. Informe o nome do motorista cadastrado. Datas: AAAA-MM-DD ou DD/MM/AAAA. Valores: 120,50.</p>{error && <p role="alert" className="text-red-700">{error}</p>}<button className="border rounded px-4 py-2" onClick={()=>downloadCSV('modelo-ficha.csv',sheetCSVRows([],drivers).slice(0,1))}>Baixar modelo CSV</button><label className="block">Selecionar CSV<input disabled={busy} type="file" accept=".csv" ref={input} className="block mt-2 w-full" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setError('');setBusy(true);try{if(file.size>2097152)throw new Error('Use arquivos de até 2 MB.');const rows=importSheetCSV(await file.text(),drivers,type);if(rows.length>500)throw new Error('Importe até 500 fichas por arquivo.');onImport(rows);onClose();}catch(err){setError(err instanceof Error?err.message:'Não foi possível importar.');}finally{setBusy(false);if(input.current)input.current.value='';}}}/></label><button disabled={busy} onClick={onClose}>Fechar</button></section></div>;
};
