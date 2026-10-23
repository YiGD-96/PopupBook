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
const FILM_FORMATS={open:{width:2520,height:1404,codec:'av01.0.13M.08'},standing:{width:864,height:1920,codec:'av01.0.09M.08'}};
async function filmSource(standing:boolean){
 const media=standing?'-standing':'',format=FILM_FORMATS[standing?'standing':'open'],h264=url(`/media/book-opening${media}.mp4`);
 try{
  const info=await navigator.mediaCapabilities?.decodingInfo({type:'file',video:{contentType:`video/mp4; codecs="${format.codec}"`,width:format.width,height:format.height,bitrate:4e6,framerate:60}});
  return info?.supported&&info.smooth&&info.powerEfficient?url(`/media/book-opening${media}-av1.mp4`):h264;
 }catch{return h264;}
}
/** `standing`: the phone film played (or its open still showed), which ends on the standing book. */
export type IntroReport={coverHoldMs:number;videoFrames:number|null;droppedFrames:number|null;mediaFailed:boolean;standing:boolean};
/** How long the cover waits for a touch when the browser will not start the film by itself, before the book opens without it (ms). */
const TOUCH_WAIT=6000;
/** The film pauses this much before its cards start to rise (uiAt), so no card has lifted on the frame it stops on. */
const HOLD_BEFORE=.04;
/**
 * The live book is mounted this long before the film pauses (onNearEnd), while its pages still flip: its preparation (upload, shaders)
 * is then done by the pause, instead of running under the prologue's entrance and making it stutter. Only once the film is fully
 * downloaded, so it never competes with the film for bandwidth.
 */
const MOUNT_LEAD=2.2;
/** How far past its stopping point the film must have downloaded before the book's pictures may share the connection (s). */
const STOP_MARGIN=.3;
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
 const [waiting,setWaiting]=useState(false);
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
 // The film only plays up to where it stops on the open book (uiAt); the rest is the live book's. Once it is downloaded past that point
 // it is safe, and the book's own downloads (onBuffered) start: on a good connection about a second into the film, so the book is ready
 // about when the film stops. Waiting for the whole file kept the connection busy with frames that are never shown. On a connection too
 // slow for that, they start when the film ends, as the book mounts.
 const bufferedOnce=useRef(false);
 const buffered=useCallback((e:{currentTarget:HTMLVideoElement})=>{
  const v=e.currentTarget,ranges=v.buffered;if(bufferedOnce.current||!ranges.length||!(v.duration>0))return;
  const end=ranges.end(ranges.length-1);
  // Only once the film plays: started while the cover still shows, the book's code (three.js) was parsed just as the film should start.
  if(!v.paused&&end>=Math.min(v.duration-.1,uiAt+STOP_MARGIN)){bufferedOnce.current=true;onBuffered?.();}
 },[onBuffered,uiAt]);
 /** Stops the film on the open book, before its cards rise, and hands over: the live book waits under the prologue from here. */
 const hold=useCallback((element:HTMLVideoElement,time:number)=>{
  if(unfolded.current)return;unfolded.current=true;
  element.pause();onNearEnd?.();onUnfolding(time);finish();
 },[onNearEnd,onUnfolding,finish]);
 // The book opens by itself: a refused play (often only a play interrupted by the film's own load) is tried again. If the browser still
 // will not start it on its own (iOS Low Power Mode, some in-app browsers), it will on a touch: the cover waits for one, saying so, and
 // plays the film from it; with no touch after TOUCH_WAIT the film is skipped and the book opens without it.
 const attempts=useRef(0),replay=useRef<()=>void>(()=>{}),touchTried=useRef(false);
 const waitForTouch=useCallback(()=>{
  setWaiting(true);
  // Only these count as the reader's own gesture for starting media (pointerdown does not, on a touch screen).
  const types=['pointerup','touchend','keydown'];
  const clear=()=>{setWaiting(false);for(const type of types)window.removeEventListener(type,go,true);window.clearTimeout(timer);};
  const go=()=>{clear();replay.current();};
  for(const type of types)window.addEventListener(type,go,true);
  const timer=window.setTimeout(()=>{clear();setFailed(true);},TOUCH_WAIT);
 },[]);
 const play=useCallback(()=>{
  const element=video.current;if(!element)return;
  void element.play().then(()=>{
   // Frame-accurate where the browser reports presented frames; onTimeUpdate (a few times a second) stands in elsewhere.
   const watch=(_:number,frame:{mediaTime:number})=>{if(unfolded.current)return;if(frame.mediaTime>=uiAt-HOLD_BEFORE)hold(element,frame.mediaTime);else element.requestVideoFrameCallback(watch);};
   if('requestVideoFrameCallback' in element)element.requestVideoFrameCallback(watch);
  }).catch(()=>{if(attempts.current<2){attempts.current++;window.setTimeout(()=>replay.current(),350);}else if(!touchTried.current){touchTried.current=true;waitForTouch();}else setFailed(true);});
 },[hold,uiAt,waitForTouch]);
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
   onTimeUpdate={e=>{buffered(e);const element=e.currentTarget,time=element.currentTime;if(!nearEnd.current&&bufferedOnce.current&&time>=uiAt-MOUNT_LEAD){nearEnd.current=true;onNearEnd?.();}if(time>=uiAt-HOLD_BEFORE&&!unfolded.current){hold(element,time);return;}if(time<INTRO_COVER_HOLD)return;const page=Math.floor((time-INTRO_COVER_HOLD)*3);if(page!==soundPage.current){soundPage.current=page;playSound('flip');}}}
   onProgress={buffered} onCanPlayThrough={buffered} onEnded={finish} onError={()=>{setFailed(true);if(!bufferedOnce.current){bufferedOnce.current=true;onBuffered?.();}}}/>
  {waiting&&<p className="intro-touch" role="status">{t('화면을 누르면 시작해요')}</p>}
  {failed&&stage==='ready'&&<img className="intro-media" src={url(`/media/book-open${media}.webp`)} alt={t(SITE.title)+' — '+t('펼쳐진 그림책')}/>}
 </div>;
}
