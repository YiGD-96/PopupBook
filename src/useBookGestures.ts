import { useEffect, useRef, useState, type RefObject } from 'react';
import { noteTurn } from './analytics';
import { useStory, type Director } from './story';
import { commitDrag, dragProgress, wheelDelta } from './turnInput';
import { STANDING_QUERY } from './standingMedia';
/** `axis`: the drag's direction once it is clear. Sideways everywhere (left = next); on the phone's standing book also up and down, as
 *  its sheet swings: up = next, down = previous. */
type Gesture={pointer:number;x:number;y:number;width:number;axis:'x'|'y'|null;last:number;lastTime:number;velocity:number;direction:1|-1|null;progress:number};
export function useBookGestures(surface:RefObject<HTMLDivElement|null>,api:RefObject<Director|null>,blocked:boolean){
 const [dragging,setDragging]=useState(false);const [releaseReady,setReleaseReady]=useState(false);const blockedRef=useRef(blocked);blockedRef.current=blocked;
 useEffect(()=>{const element=surface.current;if(!element)return;let gesture:Gesture|null=null;let suppressUntil=0;let wheelSum=0;let wheelLast=0;let wheelLockedUntil=0;let frame=0;
 const down=(e:PointerEvent)=>{if(blockedRef.current||e.button!==0||!e.isPrimary||!['EXPLORING','ENDING'].includes(useStory.getState().phase))return;gesture={pointer:e.pointerId,x:e.clientX,y:e.clientY,width:element.clientWidth,axis:null,last:0,lastTime:e.timeStamp,velocity:0,direction:null,progress:0};};
 const move=(e:PointerEvent)=>{if(!gesture||gesture.pointer!==e.pointerId)return;if(Math.abs(element.clientWidth-gesture.width)>1){resize();return;}const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  if(!gesture.direction){
   const vertical=Math.abs(dy)>Math.abs(dx)*1.2;
   if(vertical&&Math.abs(dy)>12&&!matchMedia(STANDING_QUERY).matches){gesture=null;return;}
   if(Math.max(Math.abs(dx),Math.abs(dy))<10)return;
   gesture.axis=vertical?'y':'x';gesture.last=vertical?gesture.y:gesture.x;const direction=(vertical?dy:dx)<0?1:-1;const chapter=useStory.getState().chapter;if(chapter+direction<0||chapter+direction>2){gesture=null;return;}if(!api.current?.previewTurn(direction,0)){gesture=null;return;}gesture.direction=direction;element.setPointerCapture(e.pointerId);setDragging(true);}
  e.preventDefault();const along=gesture.axis==='y'?e.clientY:e.clientX,delta=gesture.axis==='y'?dy:dx,span=gesture.axis==='y'?element.clientHeight:element.clientWidth;
  const elapsed=Math.max(1,e.timeStamp-gesture.lastTime);const speed=-(along-gesture.last)*gesture.direction/elapsed;gesture.velocity=speed;gesture.last=along;gesture.lastTime=e.timeStamp;gesture.progress=dragProgress(delta,span,gesture.direction);setReleaseReady(commitDrag(gesture.progress,Math.max(0,speed)));cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(gesture?.direction)api.current?.previewTurn(gesture.direction,gesture.progress);});
 };
 const end=(e:PointerEvent)=>{if(!gesture||gesture.pointer!==e.pointerId)return;const g=gesture;gesture=null;cancelAnimationFrame(frame);if(g.direction){api.current?.previewTurn(g.direction,g.progress);const velocity=e.timeStamp-g.lastTime<100?g.velocity:0;noteTurn('drag');// iOS may cancel a touch it would otherwise have scrolled: decide on what the finger did, as for a lift.
  api.current?.settleTurn(commitDrag(g.progress,velocity));suppressUntil=performance.now()+450;wheelLockedUntil=performance.now()+650;setDragging(false);setReleaseReady(false);}if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);};
 // Safari can report the capture lost just before the finger lifts: wait a moment for that lift (end) before turning the page back.
 const lost=()=>{const g=gesture;if(!g?.direction)return;window.setTimeout(()=>{if(gesture!==g)return;settleLost();},80);};
 const settleLost=()=>{if(gesture?.direction){gesture=null;cancelAnimationFrame(frame);api.current?.settleTurn(false);setDragging(false);setReleaseReady(false);}};
 const resize=()=>{const pointer=gesture?.pointer;settleLost();gesture=null;if(pointer!==undefined&&element.hasPointerCapture(pointer))element.releasePointerCapture(pointer);};
 const click=(e:MouseEvent)=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}};
 const wheel=(e:WheelEvent)=>{if(blockedRef.current||e.ctrlKey||gesture)return;const now=performance.now();const idle=now-wheelLast;wheelLast=now;const phase=useStory.getState().phase;if(!['EXPLORING','ENDING','DRAGGING_PAGE','TURNING_PAGE','LOADING_PAGE','OPENING_POPUP'].includes(phase))return;const delta=wheelDelta(e.deltaX,e.deltaY,e.deltaMode,element.clientHeight);if(import.meta.env.DEV)element.dataset.lastWheel=String(delta);if(!delta)return;const direction=delta>0?1:-1;const chapter=useStory.getState().chapter;
  const reading=phase==='EXPLORING'||phase==='ENDING';
  if(reading&&(chapter+direction<0||chapter+direction>2)){wheelSum=0;return;}
  e.preventDefault();if(!reading||now<wheelLockedUntil||(wheelLockedUntil>0&&idle<240)){wheelSum=0;return;}
  if(idle>240||Math.sign(wheelSum)!==Math.sign(delta))wheelSum=0;wheelSum+=delta;
  if(Math.abs(wheelSum)>=65){wheelSum=0;wheelLockedUntil=now+1500;noteTurn('wheel');api.current?.go(chapter+direction);}
 };
 // While a drag is under way the browser must not scroll or bounce the page (iOS Safari does not always honour touch-action for that).
 const touchmove=(e:TouchEvent)=>{if(gesture)e.preventDefault();};element.addEventListener('touchmove',touchmove,{passive:false});
 element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move,{passive:false});element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);element.addEventListener('lostpointercapture',lost);element.addEventListener('click',click,true);element.addEventListener('wheel',wheel,{passive:false});window.addEventListener('resize',resize);
 return()=>{cancelAnimationFrame(frame);element.removeEventListener('touchmove',touchmove);if(gesture?.direction)api.current?.settleTurn(false);element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',end);element.removeEventListener('pointercancel',end);element.removeEventListener('lostpointercapture',lost);element.removeEventListener('click',click,true);element.removeEventListener('wheel',wheel);window.removeEventListener('resize',resize);};
 },[surface,api]);return {dragging,releaseReady};
}
