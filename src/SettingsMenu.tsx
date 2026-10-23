import { useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { LANGUAGES, useLocale } from './locale';
import { useOpeningPref } from './openingPref';
import { useT } from './i18n';
/**
 * The settings, behind a gear at the top right (always there, over the intro and the book alike): the book's language (src/locale.ts)
 * and whether the opening plays on each visit (src/openingPref.ts; "다음부터 보지 않기" during the opening turns it off, this turns it back on).
 */
export default function SettingsMenu(){
 const lang=useLocale(s=>s.lang),choose=useLocale(s=>s.choose);
 const skip=useOpeningPref(s=>s.skip),setSkip=useOpeningPref(s=>s.setSkip);const {t}=useT();
 const [open,setOpen]=useState(false);const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!open)return;
  const away=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);root.current?.querySelector<HTMLButtonElement>('.settings-button')?.focus();}};
  document.addEventListener('pointerdown',away);document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('pointerdown',away);document.removeEventListener('keydown',key);};
 },[open]);
 return <div className="settings-menu" ref={root}>
  <button type="button" className="top-pill settings-button" aria-label={t('설정')} title={t('설정')} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(o=>!o)}>
   <Settings size={15} aria-hidden="true"/>
  </button>
  {open&&<div className="settings-panel" role="dialog" aria-label={t('설정')}>
   <p className="settings-title">{t('설정')}</p>
   <section className="settings-section">
    <h3>{t('언어')}</h3>
    <div className="settings-langs" role="radiogroup" aria-label={t('언어')}>
     {LANGUAGES.map(l=><button key={l.code} type="button" role="radio" aria-checked={l.code===lang} className={l.code===lang?'is-on':''} lang={l.code} onClick={()=>choose(l.code)}>{l.label}</button>)}
    </div>
   </section>
   <section className="settings-section">
    <h3>{t('시작 화면')}</h3>
    <label className="settings-switch">
     <span><strong>{t('시작 영상 보기')}</strong><small>{t('책이 펼쳐지는 영상과 읽는 법 안내')}</small></span>
     <input type="checkbox" role="switch" checked={!skip} onChange={e=>setSkip(!e.target.checked)}/><i aria-hidden="true"/>
    </label>
   </section>
  </div>}
 </div>;
}
