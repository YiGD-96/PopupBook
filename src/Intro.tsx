import {useCallback,useEffect,useRef,useState} from 'react';
import {INTRO_COVER_HOLD,INTRO_UI_AT,STANDING_INTRO_UI_AT} from './introPlayback';
import {playSound} from './story';
import {SITE} from './site';
import {STANDING_QUERY} from './standingMedia';
import { url } from './base.ts';
import { useT } from './i18n';

/**
 * The film's file: AV1 (about half the bytes of H.264 at the same sharpness) where this browser decodes it smoothly and power-efficiently
 * (in hardware) at the film's size, otherwise H.264, which plays everywhere. Both are rendered by scripts/render-intro.mjs.
 */
const FILM_FORMATS={open:{width:2520,height:1404,codec:'av01.0.13M.08'},standing:{width:900,height:2000,codec:'av01.0.09M.08'}};
async function filmSource(standing:boolean){
 const media=standing?'-standing':'',format=FILM_FORMATS[standing?'standing':'open'],h264=url(`/media/book-opening${media}.mp4`);
 try{
  const info=await navigator.mediaCapabilities?.decodingInfo({type:'file',video:{contentType:`video/mp4; codecs="${format.codec}"`,width:format.width,height:format.height,bitrate:4e6,framerate:60}});
  return info?.supported&&info.smooth&&info.powerEfficient?url(`/media/book-opening${media}-av1.mp4`):h264;
 }catch{return h264;}
}
/** `standing`: the phone film played (or its open still showed), which ends on the standing book. */
export type IntroReport={coverHoldMs:number;videoFrames:number|null;droppedFrames:number|null;mediaFailed:boolean;standing:boolean};
/** The film pauses this much before its cards start to rise (uiAt), so no card has lifted on the frame it stops on. */
const HOLD_BEFORE=.04;
/**
 * The live book is mounted this long before the film pauses (onNearEnd), while its pages still flip: its preparation (upload, shaders)
 * is then done by the pause, instead of running under the prologue's entrance and making it stutter. Only once the film is fully
 * downloaded, so it never competes with the film for bandwidth.
 */
const MOUNT_LEAD=2.2;
/**
 * `onUnfolding` is called with the film's time when it pauses on the open book, just before its cards would rise; `onFinished` follows
 * at once (the rest of the film — the cards rising — is left to the live book, which stands them up after the prologue).
 */
/** `skip`: the reader skipped the opening (src/App.tsx): the film stops and hands over at once, as when it cannot play. */
type Props={onFinished:(report:IntroReport)=>void;onUnfolding:(time:number)=>void;onBuffered?:()=>void;onNearEnd?:()=>void;leaving:boolean;skip?:boolean};
export default function Intro({onFinished,onUnfolding,onBuffered,onNearEnd,leaving,skip=false}:Props){
 const nearEnd=useRef(false);
 // Phones held upright get the portrait film of the standing book (scripts/render-intro.mjs --standing), chosen once per intro.
 const [standing]=useState(()=>typeof matchMedia==='function'&&matchMedia(STANDING_QUERY).matches);const {t}=useT();
 const media=standing?'-standing':'',uiAt=standing?STANDING_INTRO_UI_AT:INTRO_UI_AT;
 const video=useRef<HTMLVideoElement>(null);
 const [src,setSrc]=useState<string|null>(null);
 useEffect(()=>{let live=true;void filmSource(standing).then(source=>{if(live)setSrc(source);});return()=>{live=false;};},[standing]);
 const started=useRef(false);
 const notified=useRef(false);
 const soundPage=useRef(-1);
 const shownAt=useRef<number|null>(null);
 const actualHold=useRef(0);
 const unfolded=useRef(false);
 const [coverReady,setCoverReady]=useState(false);
 const [holdFinished,setHoldFinished]=useState(false);
 const [stage,setStage]=useState<'cover'|'opening'|'ready'>('cover');
 const [failed,setFailed]=useState(false);
 const [holdDuration,setHoldDuration]=useState(0);
 const finish=useCallback(()=>{
  if(notified.current)return;
  const quality=video.current?.getVideoPlaybackQuality?.();
  notified.current=true;setStage('ready');onFinished({coverHoldMs:actualHold.current,videoFrames:quality?.totalVideoFrames??null,droppedFrames:quality?.droppedVideoFrames??null,mediaFailed:failed,standing});
 },[onFinished,failed,standing]);
 // The still is the film's first frame and the cover hold is inside the film, so playback starts once the still has painted.
 useEffect(()=>{
  if(!coverReady)return;
  let secondFrame=0;
  const firstFrame=requestAnimationFrame(()=>{secondFrame=requestAnimationFrame(()=>{
   shownAt.current??=performance.now();setHoldFinished(true);
  });});
  return()=>{cancelAnimationFrame(firstFrame);cancelAnimationFrame(secondFrame);};
 },[coverReady]);
 // The film is fully downloaded: the book's own downloads (onBuffered) can start without taking bandwidth from it. On a connection too
 // slow for that, they start when the film ends, as the book mounts.
 const bufferedOnce=useRef(false);
 const buffered=useCallback((e:{currentTarget:HTMLVideoElement})=>{
  const v=e.currentTarget,ranges=v.buffered;if(bufferedOnce.current||!ranges.length||!(v.duration>0))return;
  if(ranges.end(ranges.length-1)>=v.duration-.1){bufferedOnce.current=true;onBuffered?.();}
 },[onBuffered]);
 /** Stops the film on the open book, before its cards rise, and hands over: the live book waits under the prologue from here. */
 const hold=useCallback((element:HTMLVideoElement,time:number)=>{
  if(unfolded.current)return;unfolded.current=true;
  element.pause();onNearEnd?.();onUnfolding(time);finish();
 },[onNearEnd,onUnfolding,finish]);
 // The book opens by itself: a refused play (often only a play interrupted by the film's own load) is tried again, and if the browser
 // still will not play it (iOS Low Power Mode, say), the film is skipped and the book opens without it. No button to press.
 const attempts=useRef(0),replay=useRef<()=>void>(()=>{});
 const play=useCallback(()=>{
  const element=video.current;if(!element)return;
  void element.play().then(()=>{
   // Frame-accurate where the browser reports presented frames; onTimeUpdate (a few times a second) stands in elsewhere.
   const watch=(_:number,frame:{mediaTime:number})=>{if(unfolded.current)return;if(frame.mediaTime>=uiAt-HOLD_BEFORE)hold(element,frame.mediaTime);else element.requestVideoFrameCallback(watch);};
   if('requestVideoFrameCallback' in element)element.requestVideoFrameCallback(watch);
  }).catch(()=>{if(attempts.current<2){attempts.current++;window.setTimeout(()=>replay.current(),350);}else setFailed(true);});
 },[hold,uiAt]);
 replay.current=play;
 useEffect(()=>{if(!skip)return;video.current?.pause();finish();},[skip,finish]);
 useEffect(()=>{
  if(!holdFinished||(!src&&!failed))return;
  if(failed){finish();return;}
  if(started.current)return;
  started.current=true;play();
 },[holdFinished,src,failed,finish,play]);
 return <div className={'intro-screen'+(standing?' is-standing':'')+(leaving?' is-leaving':'')} data-stage={stage} data-cover-hold-ms={holdDuration} aria-label={t(SITE.title)+' — '+t('책을 펼치는 중')}>
  <img className="intro-cover intro-media" src={url(`/media/book-cover${media}.webp`)} alt={t(SITE.title)+' — '+t(SITE.coverAlt)} onLoad={()=>setCoverReady(true)} onError={e=>{if(!e.currentTarget.src.endsWith('/art-raster/cover.webp'))e.currentTarget.src=url('/art-raster/cover.webp');else setCoverReady(true);}} hidden={stage!=='cover'}/>
  <video className={'intro-media intro-video'+(stage==='cover'?' is-waiting':'')} ref={video} src={src??undefined} muted playsInline preload="auto" tabIndex={-1} aria-hidden="true"
   onPlaying={()=>{actualHold.current||=Math.round(performance.now()-(shownAt.current??performance.now()));setHoldDuration(actualHold.current);setStage('opening');}}
   onTimeUpdate={e=>{const element=e.currentTarget,time=element.currentTime;if(!nearEnd.current&&bufferedOnce.current&&time>=uiAt-MOUNT_LEAD){nearEnd.current=true;onNearEnd?.();}if(time>=uiAt-HOLD_BEFORE&&!unfolded.current){hold(element,time);return;}if(time<INTRO_COVER_HOLD)return;const page=Math.floor((time-INTRO_COVER_HOLD)*3);if(page!==soundPage.current){soundPage.current=page;playSound('flip');}}}
   onProgress={buffered} onCanPlayThrough={buffered} onEnded={finish} onError={()=>{setFailed(true);onBuffered?.();}}/>
  {failed&&stage==='ready'&&<img className="intro-media" src={url(`/media/book-open${media}.webp`)} alt={t(SITE.title)+' — '+t('펼쳐진 그림책')}/>}
 </div>;
}
