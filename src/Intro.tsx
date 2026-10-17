import {useCallback,useEffect,useRef,useState} from 'react';
import {INTRO_COVER_HOLD,INTRO_UI_AT,STANDING_INTRO_UI_AT} from './introPlayback';
import {playSound} from './story';
import {SITE} from './site';
import {STANDING_QUERY} from './standingMedia';

/** `standing`: the phone film played (or its open still showed), which ends on the standing book. */
export type IntroReport={coverHoldMs:number;videoFrames:number|null;droppedFrames:number|null;mediaFailed:boolean;standing:boolean};
type Props={onFinished:(report:IntroReport)=>void;onUnfolding:(time:number)=>void;leaving:boolean};
export default function Intro({onFinished,onUnfolding,leaving}:Props){
 // Phones held upright get the portrait film of the standing book (scripts/render-intro.mjs --standing), chosen once per intro.
 const [standing]=useState(()=>typeof matchMedia==='function'&&matchMedia(STANDING_QUERY).matches);
 const media=standing?'-standing':'',uiAt=standing?STANDING_INTRO_UI_AT:INTRO_UI_AT;
 const video=useRef<HTMLVideoElement>(null);
 const started=useRef(false);
 const notified=useRef(false);
 const soundPage=useRef(-1);
 const shownAt=useRef<number|null>(null);
 const actualHold=useRef(0);
 const unfolded=useRef(false);
 const [coverReady,setCoverReady]=useState(false);
 const [holdFinished,setHoldFinished]=useState(false);
 const [stage,setStage]=useState<'cover'|'opening'|'ready'>('cover');
 const [manual,setManual]=useState(false);
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
 const play=useCallback(()=>{
  const element=video.current;if(!element)return;
  setManual(false);
  void element.play().catch(()=>{started.current=false;setManual(true);});
 },[]);
 useEffect(()=>{
  if(!holdFinished)return;
  if(failed){finish();return;}
  if(started.current)return;
  started.current=true;play();
 },[holdFinished,failed,finish,play]);
 return <div className={'intro-screen'+(standing?' is-standing':'')+(leaving?' is-leaving':'')} data-stage={stage} data-cover-hold-ms={holdDuration} aria-label={SITE.title+' 책을 펼치는 중'}>
  <img className="intro-cover intro-media" src={`/media/book-cover${media}.webp`} alt={SITE.title+' 그림책 표지 — '+SITE.coverAlt} onLoad={()=>setCoverReady(true)} onError={e=>{if(!e.currentTarget.src.endsWith('/art-raster/cover.webp'))e.currentTarget.src='/art-raster/cover.webp';else setCoverReady(true);}} hidden={stage!=='cover'}/>
  <video className={'intro-media intro-video'+(stage==='cover'?' is-waiting':'')} ref={video} src={`/media/book-opening${media}.mp4`} muted playsInline preload="auto" tabIndex={-1} aria-hidden="true"
   onPlaying={()=>{actualHold.current||=Math.round(performance.now()-(shownAt.current??performance.now()));setHoldDuration(actualHold.current);setStage('opening');}}
   onTimeUpdate={e=>{const time=e.currentTarget.currentTime;if(time>=uiAt&&!unfolded.current){unfolded.current=true;onUnfolding(time);}if(time<INTRO_COVER_HOLD)return;const page=Math.floor((time-INTRO_COVER_HOLD)*3);if(page!==soundPage.current){soundPage.current=page;playSound('flip');}}}
   onEnded={finish} onError={()=>setFailed(true)}/>
  {failed&&stage==='ready'&&<img className="intro-media" src={`/media/book-open${media}.webp`} alt={'펼쳐진 '+SITE.title+' 그림책'}/>}
  {manual&&<button className="primary-button intro-play" onClick={play}>책 펼치기</button>}
 </div>;
}
