import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { LANGUAGES, useLocale } from './locale';
/** The language switch at the top right (src/locale.ts): always there, over the intro and the book alike. */
export default function LanguageMenu(){
 const lang=useLocale(s=>s.lang),choose=useLocale(s=>s.choose);
 const [open,setOpen]=useState(false);const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!open)return;
  const away=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);root.current?.querySelector('button')?.focus();}};
  document.addEventListener('pointerdown',away);document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('pointerdown',away);document.removeEventListener('keydown',key);};
 },[open]);
 const current=LANGUAGES.find(l=>l.code===lang)??LANGUAGES[0];
 return <div className="lang-menu" ref={root}>
  <button type="button" className="lang-button" aria-haspopup="listbox" aria-expanded={open} aria-label={'언어: '+current.label} onClick={()=>setOpen(o=>!o)}>
   <Languages size={12} aria-hidden="true"/><span>{current.short}</span><ChevronDown size={11} aria-hidden="true"/>
  </button>
  {open&&<ul className="lang-list" role="listbox" aria-label="언어 선택">
   {LANGUAGES.map(l=><li key={l.code} role="option" aria-selected={l.code===lang}>
    <button type="button" onClick={()=>{choose(l.code);setOpen(false);}}><span lang={l.code}>{l.label}</span>{l.code===lang&&<Check size={14} aria-hidden="true"/>}</button>
   </li>)}
  </ul>}
 </div>;
}
