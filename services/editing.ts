import {onlineRequest} from './online';
const pending=new Set<string>();
export const releaseAfterSave=(id:string)=>pending.add(id);
export async function releaseSavedEdits(){
 await Promise.all([...pending].map(async id=>{try{await onlineRequest('editing',{method:'POST',body:JSON.stringify({id,release:true})});pending.delete(id);}catch{/* A reserva expira automaticamente. */}}));
}
