import { useEffect, useRef, useState } from 'react';
import { Camera, Play, X } from 'lucide-react';
import { details } from './details';
import { useLocale, type Lang } from './locale';
import { posterSrc, posters } from './posters';
import './poster.css';

/**
 * A recipe poster from the kitchen wall as a book (src/posters.ts): it rises from the pop-up book like the shops' web-magazine pages
 * (src/WebzineBook.tsx). The right page is the poster in the reader's language (the language menu at the top right), printed to the page's
 * edges; the left page keeps a frame for a real photo or a video of the dish, empty until one is given. On phones the two pages run on as
 * one page that scrolls.
 */
const EMPTY:Record<Lang,string>={ko:'사진과 영상을 준비하고 있어요',en:'Photos and video are coming soon',zh:'照片和视频即将上线'};
const SCROLL:Record<Lang,string>={ko:'아래로 내려 보세요',en:'Scroll down',zh:'向下滑动'};
export default function PosterBook({id,onClose,onOpen}:{id:string;onClose:()=>void;onOpen:(id:string)=>void}){
 const detail=details[id],poster=posters[id];const lang=useLocale(s=>s.lang);
 const heading=useRef<HTMLHeadingElement>(null),sheet=useRef<HTMLElement>(null);const [open,setOpen]=useState(false);const closing=useRef(0);
 // Mounted lying back, then raised on the next frame so the transition runs; closing lowers it again before it goes.
 useEffect(()=>{const frame=requestAnimationFrame(()=>setOpen(true));return()=>{cancelAnimationFrame(frame);window.clearTimeout(closing.current);};},[]);
 useEffect(()=>{if(open)heading.current?.focus({preventScroll:true});},[open,id]);
 // Another language is another poster: start it from the top.
 useEffect(()=>{sheet.current?.scrollTo({top:0});},[lang]);
 const close=()=>{setOpen(false);closing.current=window.setTimeout(onClose,matchMedia('(prefers-reduced-motion: reduce)').matches?0:420);};
 // Escape closes; the arrow keys stay here instead of turning the pop-up book's pages behind it.
 useEffect(()=>{const key=(e:KeyboardEvent)=>{
  if(e.key==='Escape'){e.stopPropagation();close();}
  else if(e.key==='ArrowRight'||e.key==='ArrowLeft')e.stopPropagation();
 };window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);});
 if(!detail||!poster)return null;
 const title=poster.title[lang],media=poster.media;
 return <div className={'detail-book-backdrop'+(open?' is-open':'')} onClick={e=>{if(e.target===e.currentTarget)close();}}>
  <div className="poster-book" role="dialog" aria-modal="true" aria-labelledby="pb-title">
   <button className="wz-close" onClick={close} aria-label="책 닫기"><X size={20}/></button>
   <article className="pb-sheet" ref={sheet} tabIndex={-1}>
    <section className="pb-page is-left" aria-label="왼쪽 쪽">
     <header><span>03 · MENU &amp; RECIPE</span><h2 id="pb-title" ref={heading} tabIndex={-1} lang={lang}>{title}</h2></header>
     <figure className={'pb-media'+(media?'':' is-empty')}>
      {media?.kind==='image'&&<img src={media.src} alt={media.alt} decoding="async" draggable={false}/>}
      {media?.kind==='video'&&<video src={media.src} poster={media.poster} title={media.title} controls playsInline preload="none"/>}
      {!media&&<figcaption lang={lang}><span aria-hidden="true"><Camera size={22}/><Play size={20}/></span>{EMPTY[lang]}</figcaption>}
     </figure>
    </section>
    <section className="pb-page is-right" aria-label="오른쪽 쪽">
     <img src={posterSrc(poster,lang)} alt={`${title} 레시피 포스터`} width={1024} height={1536} decoding="async" draggable={false}/>
    </section>
   </article>
   <span className="pb-hint" aria-hidden="true" lang={lang}>{SCROLL[lang]}</span>
   {detail.related&&<nav className="wz-nav" aria-label="다른 레시피"><span className="wz-related">{detail.related.filter(r=>posters[r]).map(r=><button key={r} onClick={()=>onOpen(r)} lang={lang}>{posters[r].title[lang]}</button>)}</span></nav>}
  </div>
 </div>;
}
