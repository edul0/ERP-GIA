import type {UserData} from './data';
export function mergeCompanyData(base:UserData,local:UserData,remote:UserData):UserData {
 const result={...remote};
 for(const key of ['expenses','drivers','trucks','maintenance','trackingData'] as const){
  const identity=(item:any)=>item.id||item.driverId;
  const map=(items:any[])=>new Map(items.map(item=>[identity(item),item]));
  const before=map(base[key]),mine=map(local[key]),theirs=map(remote[key]),merged:any[]=[];
  for(const id of new Set([...before.keys(),...mine.keys(),...theirs.keys()])){
   const old=before.get(id),a=mine.get(id),b=theirs.get(id);
   const changedA=JSON.stringify(a)!==JSON.stringify(old),changedB=JSON.stringify(b)!==JSON.stringify(old);
   if(changedA&&changedB&&JSON.stringify(a)!==JSON.stringify(b))throw new Error(`O mesmo registro foi alterado por outro funcionário (${a?.invoice||a?.plate||a?.name||id}). Suas alterações continuam na tela. Confira com o responsável antes de substituir.`);
   const value=changedA?a:b;if(value)merged.push(value);
  }
  (result as any)[key]=merged;
 }
 return result;
}
