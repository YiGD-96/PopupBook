import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { details } from './details';
import { useLocalized, useT } from './i18n';
import { tappedOutside } from './outsideTap';

/**
 * A story opened as a book: the spread rises up from the pop-up book toward the reader, pictures on the left page and the story as
 * running text on the right (stacked on phones). Plain HTML and CSS transitions, so it costs the 3D book nothing while it is open.
 */
export default function DetailBook({id,onClose,onOpen}:{id:string;onClose:()=>void;onOpen:(id:string)=>void}){
 const {t}=useT(),detail=useLocalized(details[id]),spread=detail?.spread;const heading=useRef<HTMLHeadingElement>(null);const [open,setOpen]=useState(false);const closing=useRef(0);
 // Mounted lying back, then raised on the next frame so the transition runs; closing lowers it again before it goes.
 useEffect(()=>{const frame=requestAnimationFrame(()=>setOpen(true));return()=>{cancelAnimationFrame(frame);window.clearTimeout(closing.current);};},[]);
 useEffect(()=>{if(open)heading.current?.focus({preventScroll:true});},[open,id]);
 const close=()=>{setOpen(false);closing.current=window.setTimeout(onClose,matchMedia('(prefers-reduced-motion: reduce)').matches?0:420);};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.stopPropagation();close();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 if(!detail||!spread)return null;
 return <div className={'detail-book-backdrop'+(open?' is-open':'')} onClick={e=>{if(tappedOutside(e))close();}}>
  <article className="detail-book" role="dialog" aria-modal="true" aria-labelledby="detail-book-title">
   <button className="detail-book-close" onClick={close} aria-label={t('책 닫기')}><X size={20}/></button>
   <section className="detail-book-page is-left" aria-label={t('사진과 그림')}>
    {spread.pictures.map((picture,index)=><figure key={picture.src} className={index===0?'is-main':'is-inset'}>
     <img src={picture.src} alt={picture.alt} decoding="async" onError={e=>{if(picture.fallback&&!e.currentTarget.src.endsWith(picture.fallback))e.currentTarget.src=picture.fallback;}}/>
     <figcaption>{picture.caption}</figcaption>
    </figure>)}
    <span className="detail-book-folio">{spread.folio[0]}</span>
   </section>
   <section className="detail-book-page is-right">
    <p className="detail-book-kicker">{detail.kicker}</p>
    <h2 id="detail-book-title" ref={heading} tabIndex={-1}>{detail.title}</h2>
    {spread.byline&&<p className="detail-book-byline">{spread.byline}</p>}
    <div className="detail-book-text">
     {spread.paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}
     {detail.quote&&<blockquote>“{detail.quote}”</blockquote>}
    </div>
    <footer>
     <a className="detail-book-link" href={detail.link.href} target="_blank" rel="noopener noreferrer">{detail.link.label}<ArrowUpRight size={15}/></a>
     {detail.related&&<nav aria-label={t('함께 보면 좋은 이야기')}>{detail.related.filter(r=>details[r]).map(r=><button key={r} onClick={()=>onOpen(r)}>{t(details[r].title)}</button>)}</nav>}
    </footer>
    <span className="detail-book-folio">{spread.folio[1]}</span>
   </section>
  </article>
 </div>;
}
