import {useEffect,useState} from 'react';
export default function SyncStatus({saving,dirty,ready,error,lastSaved}:{saving:boolean;dirty:boolean;ready:boolean;error:string;lastSaved:Date|null}){
 const [online,setOnline]=useState(navigator.onLine);
 useEffect(()=>{const update=()=>setOnline(navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
 const status=!online?'Sem conexão':saving?'Salvando na nuvem…':error?'Salvamento pendente':!ready?'Carregando base…':dirty?'Aguardando salvamento':'Salvo na nuvem';
 return <div className="data-status mb-5" role="status"><span>Base da empresa • compartilhada{lastSaved&&<small className="block">Última confirmação: {lastSaved.toLocaleTimeString('pt-BR')}</small>}</span><strong>{status}</strong></div>;
}
