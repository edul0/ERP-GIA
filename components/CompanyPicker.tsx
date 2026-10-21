import {useId,useRef,useState,useEffect} from 'react';
import {Building2,Check,ChevronDown,Plus,Search} from 'lucide-react';
export default function CompanyPicker({value,names,onChange}:{value:string;names:string[];onChange:(value:string)=>void}){
 const id=useId(),[open,setOpen]=useState(false),[active,setActive]=useState(-1);
 const root=useRef<HTMLDivElement>(null),activeOption=useRef<HTMLButtonElement>(null);
 const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const query=normalize(value.trim());
 const matches=names.filter(name=>normalize(name).includes(query));
 const isNew=!!query&&!names.some(name=>normalize(name)===query);
 const options=[...matches,...(isNew?[value.trim()]:[])];
 const choose=(name:string)=>{onChange(name);setOpen(false);setActive(-1);};
 useEffect(()=>{activeOption.current?.scrollIntoView({block:'nearest'});},[active]);
 return <div className="company-picker sheet-field" ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)){setOpen(false);setActive(-1);}}}>
  <label htmlFor={id}>Firma</label>
  <div className="company-picker-control"><Building2 size={17} aria-hidden="true"/><input id={id} className="sheet-input" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={id+'-list'} aria-activedescendant={open&&active>=0?id+'-'+active:undefined} autoComplete="off" placeholder="Busque ou digite uma firma" value={value} onFocus={()=>setOpen(true)} onClick={()=>setOpen(true)} onChange={e=>{onChange(e.target.value);setOpen(true);setActive(-1);}} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);setActive(-1);}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);setActive(previous=>options.length?(previous<0?(e.key==='ArrowDown'?0:options.length-1):(previous+(e.key==='ArrowDown'?1:-1)+options.length)%options.length):-1);}else if(e.key==='Enter'&&open){e.preventDefault();const name=options[active>=0?active:0];if(name)choose(name);}}}/><ChevronDown size={15} aria-hidden="true"/></div>
  {open&&<div className="company-picker-panel"><div className="company-picker-heading"><span><Search size={13} aria-hidden="true"/> Firmas cadastradas</span><span>{matches.length}</span></div><div id={id+'-list'} role="listbox" aria-label="Firmas disponíveis" className="company-picker-list">{matches.map((name,index)=><button type="button" role="option" aria-selected={name===value} id={id+'-'+index} ref={active===index?activeOption:null} tabIndex={-1} key={name} className={'company-picker-option '+(active===index?'is-active':'')} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(name)}><span className="company-picker-avatar">{name.slice(0,2).toUpperCase()}</span><span>{name}</span>{name===value&&<Check size={15} aria-hidden="true"/>}</button>)}{isNew&&<button type="button" role="option" aria-selected="false" id={id+'-'+matches.length} ref={active===matches.length?activeOption:null} tabIndex={-1} className={'company-picker-option company-picker-create '+(active===matches.length?'is-active':'')} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(value.trim())}><Plus size={17} aria-hidden="true"/><span>Usar “{value.trim()}”</span></button>}{!options.length&&<p className="company-picker-empty">Digite o nome da primeira firma.</p>}</div><p className="company-picker-note">Novos nomes ficam disponíveis ao salvar a ficha.</p></div>}
 </div>;
}
