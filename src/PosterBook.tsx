import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Camera, Play, X } from 'lucide-react';
import { track } from './analytics';
import { details } from './details';
import { useLocale, type Lang } from './locale';
import { photoSrc, posterSrc, posters, shortsEmbed, shortsThumb, shortsUrl } from './posters';
import { useLocalized, useT } from './i18n';
import './poster.css';
import { tappedOutside } from './outsideTap';

/**
 * A recipe poster from the kitchen wall as a book (src/posters.ts): it rises from the pop-up book like the shops' web-magazine pages
 * (src/WebzineBook.tsx). The right page is the poster in the reader's language (the language menu at the top right), printed to the page's
 * edges. The left page is the dish as it really turned out, laid out like a scrapbook: the YouTube Short of it being made in an upright,
 * phone-shaped frame, and beside it the photo of the plate as a taped polaroid with a line under it. The Short is only YouTube's still and
 * a play button until the reader presses it; then the player loads in the frame (youtube-nocookie), so opening the book costs nothing
 * extra. On phones the two pages run on as one page that scrolls.
 * Both the player and the "open on YouTube" link send this site's address as the referrer, so YouTube Studio lists the views under
 * External (and Embedded) with this site's domain; a click on the link is also counted here as `shorts_open`.
 */
const EMPTY:Record<Lang,string>={ko:'사진과 영상을 준비하고 있어요',en:'Photos and video are coming soon',zh:'照片和视频即将上线'};
const SCROLL:Record<Lang,string>={ko:'아래로 내려 보세요',en:'Scroll down',zh:'向下滑动'};
const MADE:Record<Lang,string>={ko:'직접 만들어 본 한 접시와 만드는 과정',en:'The dish as we made it, and how',zh:'我们亲手做的一盘，以及制作过程'};
const WATCH:Record<Lang,string>={ko:'쇼츠로 만드는 과정 보기',en:'Watch the Short',zh:'观看制作短视频'};
const ON_YOUTUBE:Record<Lang,string>={ko:'YouTube에서 보기',en:'Open on YouTube',zh:'在 YouTube 上观看'};
export default function PosterBook({id,onClose,onOpen}:{id:string;onClose:()=>void;onOpen:(id:string)=>void}){
 const detail=useLocalized(details[id]),poster=posters[id];const lang=useLocale(s=>s.lang);const {t}=useT();
 const heading=useRef<HTMLHeadingElement>(null),sheet=useRef<HTMLElement>(null);const [open,setOpen]=useState(false);const [playing,setPlaying]=useState(false);const closing=useRef(0);
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
 const title=poster.title[lang],caption=poster.caption[lang],shorts=poster.shorts;
 return <div className={'detail-book-backdrop'+(open?' is-open':'')} onClick={e=>{if(tappedOutside(e))close();}}>
  <div className="poster-book" role="dialog" aria-modal="true" aria-labelledby="pb-title">
   <button className="wz-close" onClick={close} aria-label={t('책 닫기')}><X size={20}/></button>
   <article className="pb-sheet" ref={sheet} tabIndex={-1}>
    <section className="pb-page is-left" aria-label={t('왼쪽 쪽')}>
     <header><span>03 · MENU &amp; RECIPE</span><h2 id="pb-title" ref={heading} tabIndex={-1} lang={lang}>{title}</h2></header>
     {shorts||poster.photo?<>
      <p className="pb-made" lang={lang}>{MADE[lang]}</p>
      <div className="pb-real">
       {shorts&&<figure className="pb-shorts">
        <div className="pb-shorts-frame">
         {playing?<iframe src={shortsEmbed(shorts)} title={`${title} — YouTube Shorts`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>
          :<button type="button" className="pb-shorts-cover" onClick={()=>{setPlaying(true);track('shorts_play',{story:id});}} aria-label={WATCH[lang]}>
           <img src={shortsThumb(shorts)} alt="" decoding="async" draggable={false}/><span className="pb-shorts-tag">Shorts</span><span className="pb-play" aria-hidden="true"><Play size={26} fill="currentColor"/></span>
          </button>}
        </div>
        <figcaption><a href={shortsUrl(shorts)} target="_blank" rel="noopener" referrerPolicy="strict-origin-when-cross-origin" onClick={()=>track('shorts_open',{story:id})} lang={lang}>{ON_YOUTUBE[lang]}<ArrowUpRight size={13}/></a></figcaption>
       </figure>}
       {poster.photo&&<figure className="pb-polaroid"><img src={photoSrc(poster)} alt={caption} width={900} height={1200} decoding="async" draggable={false}/><figcaption lang={lang}>{caption}</figcaption></figure>}
      </div>
     </>:<figure className="pb-media is-empty"><figcaption lang={lang}><span aria-hidden="true"><Camera size={22}/><Play size={20}/></span>{EMPTY[lang]}</figcaption></figure>}
    </section>
    <section className="pb-page is-right" aria-label={t('오른쪽 쪽')}>
     <img src={posterSrc(poster,lang)} alt={`${title} — ${t('레시피 포스터')}`} width={1024} height={1536} decoding="async" draggable={false}/>
    </section>
   </article>
   <span className="pb-hint" aria-hidden="true" lang={lang}>{SCROLL[lang]}</span>
   {detail.related&&<nav className="wz-nav" aria-label={t('다른 레시피')}><span className="wz-related">{detail.related.filter(r=>posters[r]).map(r=><button key={r} onClick={()=>onOpen(r)} lang={lang}>{posters[r].title[lang]}</button>)}</span></nav>}
  </div>
 </div>;
}
