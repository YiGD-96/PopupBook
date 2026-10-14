import { useEffect, useRef, useState, type RefObject } from 'react';
import { useStory, type Director } from './story';
import { commitDrag, dragProgress, wheelDelta } from './turnInput';
type Gesture={pointer:number;x:number;y:number;width:number;lastX:number;lastTime:number;velocity:number;direction:1|-1|null;progress:number};
export function useBookGestures(surface:RefObject<HTMLDivElement|null>,api:RefObject<Director|null>,blocked:boolean){
 const [dragging,setDragging]=useState(false);const [releaseReady,setReleaseReady]=useState(false);const blockedRef=useRef(blocked);blockedRef.current=blocked;
 useEffect(()=>{const element=surface.current;if(!element)return;let gesture:Gesture|null=null;let suppressUntil=0;let wheelSum=0;let wheelLast=0;let wheelLockedUntil=0;let frame=0;
 const down=(e:PointerEvent)=>{if(blockedRef.current||e.button!==0||!e.isPrimary||useStory.getState().phase!=='EXPLORING')return;gesture={pointer:e.pointerId,x:e.clientX,y:e.clientY,width:element.clientWidth,lastX:e.clientX,lastTime:e.timeStamp,velocity:0,direction:null,progress:0};};
 const move=(e:PointerEvent)=>{if(!gesture||gesture.pointer!==e.pointerId)return;if(Math.abs(element.clientWidth-gesture.width)>1){resize();return;}const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  if(!gesture.direction){if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)*1.2){gesture=null;return;}if(Math.abs(dx)<10)return;const direction=dx<0?1:-1;const chapter=useStory.getState().chapter;if(chapter+direction<0||chapter+direction>2){gesture=null;return;}if(!api.current?.previewTurn(direction,0)){gesture=null;return;}gesture.direction=direction;element.setPointerCapture(e.pointerId);setDragging(true);}
  e.preventDefault();const elapsed=Math.max(1,e.timeStamp-gesture.lastTime);const speed=-(e.clientX-gesture.lastX)*gesture.direction/elapsed;gesture.velocity=speed;gesture.lastX=e.clientX;gesture.lastTime=e.timeStamp;gesture.progress=dragProgress(dx,element.clientWidth,gesture.direction);setReleaseReady(commitDrag(gesture.progress,Math.max(0,speed)));cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(gesture?.direction)api.current?.previewTurn(gesture.direction,gesture.progress);});
 };
 const end=(e:PointerEvent)=>{if(!gesture||gesture.pointer!==e.pointerId)return;const g=gesture;gesture=null;cancelAnimationFrame(frame);if(g.direction){api.current?.previewTurn(g.direction,g.progress);const velocity=e.timeStamp-g.lastTime<100?g.velocity:0;api.current?.settleTurn(e.type==='pointerup'&&commitDrag(g.progress,velocity));suppressUntil=performance.now()+450;wheelLockedUntil=performance.now()+650;setDragging(false);setReleaseReady(false);}if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);};
 const lost=()=>{if(gesture?.direction){gesture=null;cancelAnimationFrame(frame);api.current?.settleTurn(false);setDragging(false);setReleaseReady(false);}};
 const resize=()=>{const pointer=gesture?.pointer;lost();gesture=null;if(pointer!==undefined&&element.hasPointerCapture(pointer))element.releasePointerCapture(pointer);};
 const click=(e:MouseEvent)=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}};
 const wheel=(e:WheelEvent)=>{if(blockedRef.current||e.ctrlKey||gesture)return;const now=performance.now();const idle=now-wheelLast;wheelLast=now;const phase=useStory.getState().phase;if(!['EXPLORING','DRAGGING_PAGE','CLOSING_POPUP','TURNING_PAGE','LOADING_PAGE','OPENING_POPUP'].includes(phase))return;const delta=wheelDelta(e.deltaX,e.deltaY,e.deltaMode,element.clientHeight);if(import.meta.env.DEV)element.dataset.lastWheel=String(delta);if(!delta)return;const direction=delta>0?1:-1;const chapter=useStory.getState().chapter;
  if(phase==='EXPLORING'&&(chapter+direction<0||chapter+direction>2)){wheelSum=0;return;}
  e.preventDefault();if(phase!=='EXPLORING'||now<wheelLockedUntil||(wheelLockedUntil>0&&idle<240)){wheelSum=0;return;}
  if(idle>240||Math.sign(wheelSum)!==Math.sign(delta))wheelSum=0;wheelSum+=delta;
  if(Math.abs(wheelSum)>=65){wheelSum=0;wheelLockedUntil=now+1500;api.current?.go(chapter+direction);}
 };
 element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move,{passive:false});element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);element.addEventListener('lostpointercapture',lost);element.addEventListener('click',click,true);element.addEventListener('wheel',wheel,{passive:false});window.addEventListener('resize',resize);
 return()=>{cancelAnimationFrame(frame);if(gesture?.direction)api.current?.settleTurn(false);element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',end);element.removeEventListener('pointercancel',end);element.removeEventListener('lostpointercapture',lost);element.removeEventListener('click',click,true);element.removeEventListener('wheel',wheel);window.removeEventListener('resize',resize);};
 },[surface,api]);return {dragging,releaseReady};
}
