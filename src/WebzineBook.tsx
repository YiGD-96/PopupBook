import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { details } from './details';
import { webzines, type WzBlock, type WzFlow, type WzMenu } from './webzine';

/**
 * A story as the web magazine's pages (the farmer's, or a shop's) (src/webzine.ts, laid out like the mockup 웹진 2페이지 시안): it rises from the pop-up book like
 * the farmer's story (src/DetailBook.tsx), and the reader turns through its spreads inside it. Plain HTML and CSS (Pretendard), so it costs
 * the 3D book nothing while it is open. On wide screens a spread is sized in container units so it scales as one picture, like the mockup;
 * on phones the two pages stack and the words keep a readable size.
 */
/** `text` with `mark` (a phrase of it) set in the accent colour. */
const marked=(text:string,mark?:string)=>{const at=mark?text.indexOf(mark):-1;return at<0?text:<>{text.slice(0,at)}<em className="wz-mark">{mark}</em>{text.slice(at+mark!.length)}</>;};
const Flow=({items}:{items:WzFlow[]})=><>{items.map((item,i)=>'q' in item?<blockquote key={i} className="wz-quote"><p>{item.q}</p></blockquote>:<p key={i} className="wz-p">{marked(item.p,item.strong)}</p>)}</>;
const Photo=({src,alt}:{src:string;alt:string})=><img src={src} alt={alt} decoding="async" draggable={false}/>;
const Menu=({menu}:{menu:WzMenu})=><div className={'wz-menu is-'+(menu.shape??'wide')+(menu.flip?' is-flip':'')}><Photo src={menu.img} alt={menu.alt}/><div><h4>{menu.title}</h4><p>{menu.text}</p></div></div>;
function Block({block,first}:{block:WzBlock;first:boolean}){
 switch(block.t){
  case 'h1':return <h2 className="wz-h1" id={first?'wz-title':undefined}>{block.lines.map((line,i)=><span key={line} className={i===block.accent?'is-accent':undefined}>{marked(line,block.mark)}</span>)}</h2>;
  case 'season':return <p className="wz-season">{block.text}</p>;
  case 'sub':return <p className="wz-sub">{block.text}</p>;
  case 'eyebrow':return <p className="wz-eyebrow">{block.text}</p>;
  case 'hero':return <figure className="wz-hero" style={{width:block.width?`${block.width*100}%`:undefined,'--focus':block.focus} as CSSProperties}><Photo src={block.img} alt={block.alt}/>{block.caption&&<figcaption>{block.caption}</figcaption>}</figure>;
  case 'side':return <div className="wz-side" style={{gridTemplateColumns:`minmax(0,1fr) ${block.column}`,'--aspect':block.aspect,'--focus':block.focus} as CSSProperties}><div>{block.body.map((inner,i)=><Block key={i} block={inner} first={false}/>)}</div><figure><Photo src={block.img} alt={block.alt}/>{block.caption&&<figcaption>{block.caption}</figcaption>}</figure></div>;
  case 'cutout':return <figure className="wz-cutout"><Photo src={block.img} alt={block.alt}/></figure>;
  case 'rows':return <div className={'wz-rows'+(block.pairs?' is-pairs':'')}>{block.items.map(item=><div key={item.term}>{item.n&&<b>{item.n}</b>}<strong>{item.term}</strong><span>{item.text}</span></div>)}</div>;
  case 'lead':return <div className="wz-lead">{block.head&&<strong>{block.head}</strong>}<p>{block.text}</p></div>;
  case 'h2':return <h3 className="wz-h2">{block.n&&<><b>{block.n}</b> </>}{block.text}</h3>;
  case 'photoText':return <div className={'wz-photo-text is-'+block.shape}><figure><Photo src={block.img} alt={block.alt}/></figure><div><Flow items={block.column}/></div></div>;
  case 'flow':return <div className={'wz-flow'+(block.tight?' is-tight':'')}><Flow items={block.items}/></div>;
  case 'menu':return <Menu menu={block.menu}/>;
  case 'menus':return <div className="wz-menus">{block.items.map(menu=><Menu key={menu.title} menu={menu}/>)}</div>;
  case 'caption':return <div className={'wz-captions'+(block.cards?' is-cards':'')}>{block.items.map(item=><div key={item.title}><h4>{item.title}</h4><p>{item.text}</p></div>)}</div>;
  case 'rule':return <hr className="wz-rule"/>;
 }
}
export default function WebzineBook({id,onClose}:{id:string;onClose:()=>void;onOpen?:(id:string)=>void}){
 const detail=details[id],zine=webzines[id];const heading=useRef<HTMLDivElement>(null);const sheet=useRef<HTMLElement>(null);const [open,setOpen]=useState(false);const closing=useRef(0);
 const [index,setIndex]=useState(0);const [direction,setDirection]=useState<1|-1>(1);const last=(zine?.spreads.length??1)-1;
 // Mounted lying back, then raised on the next frame so the transition runs; closing lowers it again before it goes.
 useEffect(()=>{const frame=requestAnimationFrame(()=>setOpen(true));return()=>{cancelAnimationFrame(frame);window.clearTimeout(closing.current);};},[]);
 useEffect(()=>{if(open)heading.current?.focus({preventScroll:true});},[open,id]);
 // A new spread starts at the top (on phones the sheet scrolls inside the book).
 useEffect(()=>{sheet.current?.scrollTo({top:0});},[index]);
 const close=()=>{setOpen(false);closing.current=window.setTimeout(onClose,matchMedia('(prefers-reduced-motion: reduce)').matches?0:420);};
 const turn=(step:1|-1)=>{const next=Math.max(0,Math.min(last,index+step));if(next===index)return;setDirection(step);setIndex(next);};
 // Escape closes; the arrow keys turn this book's spreads instead of the pop-up book's pages behind it.
 useEffect(()=>{const key=(e:KeyboardEvent)=>{
  if(e.key==='Escape'){e.stopPropagation();close();}
  else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.stopPropagation();e.preventDefault();turn(e.key==='ArrowRight'?1:-1);}
 };window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);});
 if(!detail||!zine)return null;
 const spread=zine.spreads[index];
 const withMedia=(blocks:WzBlock[])=>blocks.some(block=>['photoText','hero','menu','menus','side','cutout'].includes(block.t))?' has-media':'';
 return <div className={'detail-book-backdrop'+(open?' is-open':'')} onClick={e=>{if(e.target===e.currentTarget)close();}}>
  <div className="webzine-book" role="dialog" aria-modal="true" aria-labelledby="wz-title">
   <button className="wz-close" onClick={close} aria-label="책 닫기"><X size={20}/></button>
   <article className="wz-sheet" ref={sheet}>
    <div className="wz-inner">
     <header className="wz-bar"><span>{zine.kicker}</span><i aria-hidden="true"/><em aria-hidden="true">{(zine.label??['People','Who Cook'])[0]}<br/>{(zine.label??['People','Who Cook'])[1]}</em></header>
     <div key={index} className={'wz-spread '+(direction===1?'is-next':'is-prev')} ref={heading} tabIndex={-1}>
      <section className={'wz-page is-left'+withMedia(spread.left)+(spread.dense==='left'?' is-dense':'')} aria-label="왼쪽 쪽">{spread.left.map((block,i)=><Block key={i} block={block} first={index===0&&i===spread.left.findIndex(b=>b.t==='h1')}/>)}</section>
      <section className={'wz-page is-right'+withMedia(spread.right)+(spread.dense==='right'?' is-dense':'')} aria-label="오른쪽 쪽">{spread.right.map((block,i)=><Block key={i} block={block} first={false}/>)}</section>
     </div>
     <div className="wz-end">
      <span aria-live="polite">{index+1} / {last+1}</span>
      {index>0&&<button onClick={()=>turn(-1)}><ChevronLeft size={16}/>이전 쪽</button>}
      {index<last?<button className="is-next" onClick={()=>turn(1)}>다음 쪽으로<ChevronRight size={16}/></button>:<button className="is-next" onClick={close}>이야기 닫기<X size={16}/></button>}
     </div>
    </div>
   </article>
   <nav className="wz-nav" aria-label="웹진 쪽 넘기기">
    <button onClick={()=>turn(-1)} disabled={index===0} aria-label="이전 쪽"><ChevronLeft size={18}/></button>
    <span aria-live="polite">{index+1} / {last+1}</span>
    <button onClick={()=>turn(1)} disabled={index===last} aria-label="다음 쪽"><ChevronRight size={18}/></button>
   </nav>
  </div>
 </div>;
}
