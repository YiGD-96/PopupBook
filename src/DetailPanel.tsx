import { useEffect, useRef } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { details } from './details';
import { useLocalized, useT } from './i18n';

/** The story behind a clicked pop-up object: a panel beside the book on wide screens, a sheet from the bottom on phones. */
export default function DetailPanel({id,onClose,onOpen}:{id:string;onClose:()=>void;onOpen:(id:string)=>void}){
 const {t,lang}=useT(),detail=useLocalized(details[id]);const heading=useRef<HTMLHeadingElement>(null);const body=useRef<HTMLDivElement>(null);
 useEffect(()=>{heading.current?.focus({preventScroll:true});body.current?.scrollTo({top:0});},[id]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.stopPropagation();onClose();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[onClose]);
 if(!detail)return null;
 // A story drawn as one picture (details.ts `sheet`): the picture fills the panel and its buttons are real links laid over it; an
 // English or Chinese reader gets that language's picture and its own button boxes (`byLang`).
 if(detail.sheet){const sheet=detail.sheet,drawn=lang==='ko'?undefined:sheet.byLang?.[lang];return <aside className="detail-panel is-sheet" aria-labelledby="detail-title" key={id}>
  <button className="detail-close" onClick={onClose} aria-label={t('이야기 닫기')}><X size={20}/></button>
  <h2 id="detail-title" className="sr-only" ref={heading} tabIndex={-1}>{detail.title}</h2>
  <figure className="detail-sheet"><img src={drawn?.src??sheet.src} alt={sheet.alt} width={sheet.width} height={sheet.height} decoding="async" draggable={false}/>
   {sheet.links.map((link,i)=>{const action=detail.actions?.find(a=>a.label===link.label),box=drawn?.boxes[i]??link.box;return action&&<a key={link.label} className="detail-sheet-link" href={action.href} target={action.href.startsWith('http')?'_blank':undefined} rel="noopener noreferrer" aria-label={link.label} style={{left:box[0]+'%',top:box[1]+'%',width:box[2]+'%',height:box[3]+'%'}}/>;})}
  </figure>
 </aside>;}
 return <aside className="detail-panel" aria-labelledby="detail-title" key={id}>
  <button className="detail-close" onClick={onClose} aria-label={t('이야기 닫기')}><X size={20}/></button>
  <div className="detail-body" ref={body}>
   <p className="detail-kicker">{detail.kicker}</p>
   <h2 id="detail-title" ref={heading} tabIndex={-1}>{detail.title}</h2>
   <p className="detail-lead">{detail.lead}</p>
   {detail.quote&&<blockquote>“{detail.quote}”</blockquote>}
   {detail.facts&&<dl className="detail-facts">{detail.facts.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
   {detail.ingredients&&<section><h3>{t('재료')}</h3><table className="detail-ingredients"><tbody>{detail.ingredients.map(([k,v])=><tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody></table></section>}
   {detail.list&&<section><h3>{detail.list.title}</h3>{detail.list.ordered?<ol>{detail.list.items.map(item=><li key={item}>{item}</li>)}</ol>:<ul>{detail.list.items.map(item=><li key={item}>{item}</li>)}</ul>}</section>}
   {detail.tip&&<p className="detail-tip"><strong>TIP</strong> {detail.tip}</p>}
   {detail.note&&<p className="detail-note">{detail.note}</p>}
   {detail.actions&&detail.actions.length>0&&<div className="detail-actions">{detail.actions.map(action=><a key={action.href} className="detail-link" href={action.href} target={action.href.startsWith('http')?'_blank':undefined} rel="noopener noreferrer">{action.label}<ArrowUpRight size={17}/></a>)}</div>}
   <a className={detail.actions&&detail.actions.length>0?"detail-link is-quiet":"detail-link"} href={detail.link.href} target="_blank" rel="noopener noreferrer">{detail.link.label}<ArrowUpRight size={17}/></a>
   {detail.related&&<nav className="detail-related" aria-label={t('함께 보면 좋은 이야기')}><h3>{t('함께 보면 좋은 이야기')}</h3>{detail.related.filter(r=>details[r]).map(r=><button key={r} onClick={()=>onOpen(r)}><span>{details[r].kicker.split(' — ')[0]}</span>{t(details[r].title)}</button>)}</nav>}
  </div>
 </aside>;
}
