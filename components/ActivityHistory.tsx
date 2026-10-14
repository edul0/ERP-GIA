import { useEffect,useState } from 'react';
import {onlineRequest,onlineEnabled} from '../services/online';
type Entry={id:number;actor_name:string;entity:string;action:string;label:string;occurred_at:string};
export default function ActivityHistory(){
 const [open,setOpen]=useState(false),[rows,setRows]=useState<Entry[]>([]),[error,setError]=useState('');
 const load=()=>{setError('');void onlineRequest<Entry[]>('audit').then(setRows).catch(e=>setError(e.message));};
 useEffect(()=>{if(open)load();},[open]);
 if(!onlineEnabled)return null;
 const entities:Record<string,string>={expenses:'Ficha / NF',trucks:'Veículo',drivers:'Motorista',maintenance:'Manutenção'};
 const actions:Record<string,string>={created:'Cadastrou',updated:'Alterou',deleted:'Excluiu'};
 return <section className="surface mt-4"><button className="font-semibold text-brand-800" onClick={()=>setOpen(!open)} aria-expanded={open}>Histórico de atividades {open?'▴':'▾'}</button>{open&&<div className="mt-3"><p className="text-xs text-gray-500 mb-3">Atividades registradas a partir desta atualização. Até 200 eventos mais recentes.</p><button className="text-sm underline mb-3" onClick={load}>Atualizar histórico</button>{error&&<p role="alert">{error}</p>}<div className="overflow-x-auto"><table className="fleet-data-table"><thead><tr>{['Quando','Funcionário','Ação','Registro'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td className="p-3 whitespace-nowrap">{new Date(r.occurred_at).toLocaleString('pt-BR')}</td><td className="p-3">{r.actor_name}</td><td className="p-3">{actions[r.action]||r.action}</td><td className="p-3">{entities[r.entity]||r.entity}: {r.label||'Sem número'}</td></tr>)}</tbody></table></div>{!rows.length&&!error&&<p>Nenhuma atividade registrada ainda.</p>}</div>}</section>;
}
