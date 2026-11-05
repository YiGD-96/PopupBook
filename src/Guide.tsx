import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { STANDING_QUERY } from './standingMedia';
import { useT } from './i18n';
/**
 * The reading guide, in two steps right after the prologue (each time the reader presses "책장 속으로"). Step 1 spotlights a glowing card with an arrow ("press
 * the glowing pictures"); one tap anywhere shows that card's real story window as a preview (GuidePeek below), and the next tap points step 2 at the page arrow ("turn the page") — on a phone it shows the page being swiped
 * up instead (the arrows are the second way there); another tap and it is gone. It only
 * dims and points: the spotlight is a box-shadow and the arrow bobs with a CSS transform, so the book underneath keeps still.
 */
export type GuideRect={x:number;y:number;width:number;height:number};

const PAD=12,GAP=58,BUBBLE_H=92;
/** `onSwipe`: on a phone, step 2's own gesture (a swipe up, or down to go back) closes the guide and turns the page, as it shows. */
export default function Guide({step,locate,onNext,onSwipe}:{step:1|2;locate:()=>GuideRect|null;onNext:()=>void;onSwipe?:(direction:1|-1)=>void}){
 const {t}=useT();
 const phone=typeof matchMedia==='function'&&matchMedia(STANDING_QUERY).matches;
 // Step 1's tap brings up the spotlit card's real story as a preview (src/App.tsx, GuidePeek); step 2's ends the guide.
 const advance=onNext;
 const start=useRef<{x:number;y:number}|null>(null);
 const swipeEnd=(e:React.PointerEvent)=>{const from=start.current;start.current=null;if(!from||!onSwipe||!phone||step!==2)return false;
  const dy=e.clientY-from.y;if(Math.abs(dy)<48||Math.abs(dy)<Math.abs(e.clientX-from.x))return false;
  onNext();onSwipe(dy<0?1:-1);return true;};
 const [rect,setRect]=useState<GuideRect|null>(()=>locate());
 // `floor`: how far down the bubble may reach: above the skip bar at the bottom while it shows (src/App.tsx .opening-skip), which on a
 // phone, its height cut by the browser's bars, the bubble under the card used to cover.
 const measureView=()=>{const skip=document.querySelector('.opening-skip')?.getBoundingClientRect();return {w:window.innerWidth,h:window.innerHeight,floor:(skip&&skip.height?skip.top:window.innerHeight)-12};};
 const [view,setView]=useState(measureView);
 const update=useCallback(()=>{setRect(locate());setView(measureView());},[locate]);
 // The bubble's own height (two lines in some languages), measured after it is laid out; BUBBLE_H until then.
 const bubbleRef=useRef<HTMLDivElement>(null);const [bubbleH,setBubbleH]=useState(BUBBLE_H);
 useLayoutEffect(()=>{const h=bubbleRef.current?.offsetHeight;if(h&&Math.abs(h-bubbleH)>1)setBubbleH(h);});
 // It can open while the cards are still standing up; `locate` gives the card's upright place, so the spotlight is where it ends at once.
 // Measured before the step is painted, so the new words never show for a frame at the old place.
 useLayoutEffect(()=>{update();window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update);},[update,step]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(['Enter',' ','Escape'].includes(e.key)){e.preventDefault();e.stopPropagation();advance();}};window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[advance]);

 // On a phone the page turns first of all by a swipe up (down goes back); step 2 shows that gesture over the book, not the arrow.
 const swipe=phone&&step===2;
 const copy=step===1
  ?{title:t('빛나는 그림을 눌러 보세요'),text:t('그림마다 이야기가 숨어 있어요')}
  :swipe?{title:t('위로 밀어 책장을 넘겨요'),text:t('아래로 밀면 앞 장으로 · 아래 화살표로도 넘길 수 있어요')}
  :{title:t('화살표를 눌러 책장을 넘겨요'),text:t('옆으로 끌어도 넘어가요')};
 // The bubble sits below the target when there is room, otherwise above; the arrow runs from the bubble to the target's edge.
 const width=Math.min(280,view.w-32);
 // The spotlight keeps inside the screen and stays centred on its target (the page arrow sits near the edge on a phone): near an edge
 // it narrows on both sides alike.
 // A card's box ends at its foot, with no margin below: the card stands on the page there, and the picture's own ground shadow already
 // reaches past the figure (with the margin the farmer's frame came well below his boots).
 const spot=!swipe&&rect&&(()=>{const foot=step===1?0:PAD,cx=rect.x+rect.width/2,cy=rect.y+(rect.height+foot-PAD)/2;
  const hw=Math.max(8,Math.min(rect.width/2+PAD,cx-4,view.w-4-cx)),hh=Math.max(8,Math.min((rect.height+PAD+foot)/2,cy-4,view.h-4-cy));
  return {x:cx-hw,y:cy-hh,width:hw*2,height:hh*2};})();
 const below=!spot||spot.y+spot.height+GAP+bubbleH<view.floor;
 const centre=spot?spot.x+spot.width/2:view.w/2;
 const bubble={x:Math.max(16,Math.min(view.w-16-width,centre-width/2)),y:spot?(below?spot.y+spot.height+GAP:spot.y-GAP-bubbleH):swipe?Math.min(view.h*.66,view.floor-bubbleH):view.h/2-bubbleH/2};
 const from={x:Math.max(bubble.x+24,Math.min(bubble.x+width-24,centre)),y:below?bubble.y-6:bubble.y+bubbleH+6};
 const to=spot&&{x:centre,y:below?spot.y+spot.height+4:spot.y-4};
 const bend=to?Math.max(-60,Math.min(60,(to.x-from.x)*.5+(to.x>view.w/2?-28:28))):0;
 return <div className="guide" role="dialog" aria-modal="true" aria-live="polite" aria-label={copy.title} onPointerDown={e=>{start.current={x:e.clientX,y:e.clientY};}} onPointerUp={e=>{if(swipeEnd(e))e.preventDefault();}} onClick={e=>{if(e.defaultPrevented)return;advance();}}>
  {spot?<div className="guide-spot" style={{left:spot.x,top:spot.y,width:spot.width,height:spot.height}}/>:<div className="guide-dim"/>}
  {to&&<svg key={`arrow-${step}`} className="guide-arrow guide-step" width={view.w} height={view.h} aria-hidden="true">
   <defs><marker id="guide-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>
   <g className={below?'is-up':'is-down'}><path d={`M${from.x} ${from.y} Q${(from.x+to.x)/2+bend} ${(from.y+to.y)/2} ${to.x} ${to.y}`} markerEnd="url(#guide-head)"/></g>
  </svg>}
  {swipe&&<div key="swipe" className="guide-swipe guide-step" style={{top:view.h*.3}} aria-hidden="true">
   <svg className="guide-swipe-chevron" viewBox="0 0 24 12"><path d="M3 10L12 3l9 7"/></svg><span className="guide-swipe-track"/><span className="guide-swipe-dot"/>
  </div>}
  <div key={`bubble-${step}`} ref={bubbleRef} className="guide-bubble guide-step" style={{left:bubble.x,top:bubble.y,width,minHeight:BUBBLE_H}}>
   <strong>{copy.title}</strong><span>{copy.text}</span>
   <span className="guide-dots" aria-label={`${step} / 2`}><i className={step===1?'is-on':''}/><i className={step===2?'is-on':''}/></span>
  </div>
 </div>;
}

/**
 * Between the guide's steps: the real story window of the card it pointed at (`children`, the same view a press opens), shown as a preview
 * rather than opened: scaled down and risen only halfway from the bottom of the screen, so it reads as "this is what opens" while the guide
 * stays in charge. It takes no clicks (inert); one tap anywhere, or Enter / Space / Escape, slides it back down and the guide goes on.
 * It used to open the story for real, covering the screen, and readers found it hard to get back out of the guide.
 */
export function GuidePeek({children,onDone}:{children:ReactNode;onDone:()=>void}){
 const {t}=useT();const [leaving,setLeaving]=useState(false);const left=useRef(false);
 const done=useCallback(()=>{if(left.current)return;left.current=true;setLeaving(true);
  window.setTimeout(onDone,matchMedia('(prefers-reduced-motion: reduce)').matches?0:360);},[onDone]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(['Enter',' ','Escape'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();done();}};
  window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[done]);
 const title=t('그림을 누르면 이렇게 열려요');
 return <div className={'guide guide-peek'+(leaving?' is-leaving':'')} role="dialog" aria-modal="true" aria-label={title} onClick={done}>
  <div className="guide-dim"/>
  <div className="guide-peek-window" aria-hidden="true" inert>{children}</div>
  <div className="guide-bubble guide-step guide-peek-bubble">
   <strong>{title}</strong><span>{t('화면을 누르면 다음 안내로 넘어가요')}</span>
   <span className="guide-dots" aria-label="1 / 2"><i className="is-on"/><i/></span>
  </div>
 </div>;
}
