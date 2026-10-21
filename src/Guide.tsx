import { useCallback, useEffect, useState } from 'react';
import { STANDING_QUERY } from './standingMedia';
/**
 * The reading guide, in two steps right after the prologue (each time the reader presses "책장 속으로"). Step 1 spotlights a glowing card with an arrow ("press
 * the glowing pictures"); one tap anywhere and step 2 points at the page arrow ("turn the page"); another tap and it is gone. It only
 * dims and points: the spotlight is a box-shadow and the arrow bobs with a CSS transform, so the book underneath keeps still.
 */
export type GuideRect={x:number;y:number;width:number;height:number};

const PAD=12,GAP=58,BUBBLE_H=92;
export default function Guide({step,locate,onNext}:{step:1|2;locate:()=>GuideRect|null;onNext:()=>void}){
 const [rect,setRect]=useState<GuideRect|null>(()=>locate());
 const [view,setView]=useState(()=>({w:window.innerWidth,h:window.innerHeight}));
 const update=useCallback(()=>{setRect(locate());setView({w:window.innerWidth,h:window.innerHeight});},[locate]);
 // It can open while the cards are still standing up; `locate` gives the card's upright place, so the spotlight is where it ends at once.
 useEffect(()=>{update();window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update);},[update,step]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(['Enter',' ','Escape'].includes(e.key)){e.preventDefault();e.stopPropagation();onNext();}};window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[onNext]);
 const phone=typeof matchMedia==='function'&&matchMedia(STANDING_QUERY).matches;
 const copy=step===1
  ?{title:'빛나는 그림을 눌러 보세요',text:'그림마다 이야기가 숨어 있어요'}
  :{title:phone?'옆으로 넘기거나 위로 밀어요':'화살표를 눌러 책장을 넘겨요',text:phone?'다음 장면이 펼쳐져요':'옆으로 끌어도 넘어가요'};
 // The bubble sits below the target when there is room, otherwise above; the arrow runs from the bubble to the target's edge.
 const width=Math.min(280,view.w-32);
 // The spotlight keeps inside the screen and stays centred on its target (the page arrow sits near the edge on a phone): near an edge
 // it narrows on both sides alike.
 const spot=rect&&(()=>{const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
  const hw=Math.max(8,Math.min(rect.width/2+PAD,cx-4,view.w-4-cx)),hh=Math.max(8,Math.min(rect.height/2+PAD,cy-4,view.h-4-cy));
  return {x:cx-hw,y:cy-hh,width:hw*2,height:hh*2};})();
 const below=!spot||spot.y+spot.height+GAP+BUBBLE_H<view.h-12;
 const centre=spot?spot.x+spot.width/2:view.w/2;
 const bubble={x:Math.max(16,Math.min(view.w-16-width,centre-width/2)),y:spot?(below?spot.y+spot.height+GAP:spot.y-GAP-BUBBLE_H):view.h/2-BUBBLE_H/2};
 const from={x:Math.max(bubble.x+24,Math.min(bubble.x+width-24,centre)),y:below?bubble.y-6:bubble.y+BUBBLE_H+6};
 const to=spot&&{x:centre,y:below?spot.y+spot.height+4:spot.y-4};
 const bend=to?Math.max(-60,Math.min(60,(to.x-from.x)*.5+(to.x>view.w/2?-28:28))):0;
 return <div className="guide" role="dialog" aria-modal="true" aria-live="polite" aria-label={copy.title} onClick={onNext}>
  {spot?<div className="guide-spot" style={{left:spot.x,top:spot.y,width:spot.width,height:spot.height}}/>:<div className="guide-dim"/>}
  {to&&<svg className="guide-arrow" width={view.w} height={view.h} aria-hidden="true">
   <defs><marker id="guide-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>
   <g className={below?'is-up':'is-down'}><path d={`M${from.x} ${from.y} Q${(from.x+to.x)/2+bend} ${(from.y+to.y)/2} ${to.x} ${to.y}`} markerEnd="url(#guide-head)"/></g>
  </svg>}
  <div className="guide-bubble" style={{left:bubble.x,top:bubble.y,width,minHeight:BUBBLE_H}}>
   <strong>{copy.title}</strong><span>{copy.text}</span>
   <span className="guide-dots" aria-label={`${step} / 2`}><i className={step===1?'is-on':''}/><i className={step===2?'is-on':''}/></span>
  </div>
 </div>;
}
