import { useEffect, useState } from 'react';
interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<{outcome:string}>; }
export default function InstallApp() {
 const [prompt,setPrompt]=useState<InstallPrompt|null>(null);
 useEffect(()=>{
  const ready=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPrompt);};
  const installed=()=>setPrompt(null);
  window.addEventListener('beforeinstallprompt',ready);window.addEventListener('appinstalled',installed);
  return ()=>{window.removeEventListener('beforeinstallprompt',ready);window.removeEventListener('appinstalled',installed);};
 },[]);
 if(!prompt)return null;
 return <button type="button" className="px-3 py-2 text-sm font-semibold rounded-lg border border-brand-600 text-brand-700" onClick={async()=>{await prompt.prompt();await prompt.userChoice;setPrompt(null);}}>Instalar ERP GIA</button>;
}
