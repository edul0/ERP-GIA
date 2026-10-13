import React, {useState} from 'react';
import UserManagement from './UserManagement';
import type { User } from '../types';
import {onlineRequest} from '../services/online';
export default function OnlineUserManagement({initialUsers,currentUser}:{initialUsers:User[];currentUser:User}) {
 const [users,setUsers]=useState(initialUsers); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
 const save=async(input:Partial<User>&{disable?:boolean})=>{if(busy)return;setBusy(true);setMessage('');try{await onlineRequest('users',{method:'POST',body:JSON.stringify(input)});const data=await onlineRequest<{users:User[]}>('data');setUsers(data.users);setMessage('Acesso atualizado online. Ao trocar sua própria senha, saia e entre novamente.');}catch(err){setMessage(err instanceof Error?err.message:'Não foi possível atualizar o acesso.');throw err;}finally{setBusy(false);}};
 return <section>{message && <p role="status" className="p-3 bg-green-50 rounded mb-3">{message}</p>}<fieldset disabled={busy}><UserManagement users={users} currentUser={currentUser} onAddUser={(username,password,role)=>save({username,password,role})} onUpdateUser={user=>save(user)} onDeleteUser={id=>{void save({id,disable:true}).catch(()=>{});}}/></fieldset></section>;
}
