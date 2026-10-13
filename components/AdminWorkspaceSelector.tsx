import React,{useEffect,useState} from 'react';
import {onlineRequest,getWorkspaceOwner} from '../services/online';
export default function AdminWorkspaceSelector({onChange,busy}:{onChange:(id:string)=>void;busy:boolean}) {
 const [owners,setOwners]=useState<{id:string;username:string}[]>([]);const [error,setError]=useState('');
 useEffect(()=>{let active=true;onlineRequest<{id:string;username:string}[]>('workspaces').then(data=>{if(active)setOwners(data);}).catch(()=>{if(active)setError('Não foi possível listar as bases reais.');});return()=>{active=false;};},[]);
 return <label className="block text-sm mb-4">Dados reais de<select className="border rounded p-2 ml-3" disabled={busy} value={getWorkspaceOwner()} onChange={e=>onChange(e.target.value)}><option value="">Selecione</option>{owners.map(owner=><option key={owner.id} value={owner.id}>{owner.username}</option>)}</select>{error && <span className="text-red-700 ml-3">{error}</span>}</label>;
}
