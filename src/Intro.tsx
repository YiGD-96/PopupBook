import {useCallback,useEffect,useRef,useState} from 'react';
import {coverTimeRemaining,INTRO_UI_AT} from './introPlayback';
import {playSound} from './story';

export type IntroReport={coverHoldMs:number;videoFrames:number|null;droppedFrames:number|null;mediaFailed:boolean};
type Props={onFinished:(report:IntroReport)=>void;onUnfolding:(time:number)=>void;leaving:boolean};
export default function Intro({onFinished,onUnfolding,leaving}:Props){
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
  notified.current=true;setStage('ready');onFinished({coverHoldMs:actualHold.current,videoFrames:quality?.totalVideoFrames??null,droppedFrames:quality?.droppedVideoFrames??null,mediaFailed:failed});
 },[onFinished,failed]);
 useEffect(()=>{
  if(!coverReady)return;
  let timer=0,secondFrame=0;
  const firstFrame=requestAnimationFrame(()=>{secondFrame=requestAnimationFrame(()=>{
   const now=performance.now();shownAt.current??=now;
   timer=window.setTimeout(()=>setHoldFinished(true),coverTimeRemaining(shownAt.current,now));
  });});
  return()=>{cancelAnimationFrame(firstFrame);cancelAnimationFrame(secondFrame);window.clearTimeout(timer);};
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
 return <div className={'intro-screen'+(leaving?' is-leaving':'')} data-stage={stage} data-cover-hold-ms={holdDuration} aria-label="느린 제주 책을 펼치는 중">
  <img className="intro-cover intro-media" src="/media/book-cover.webp" alt="느린 제주 그림책 표지" onLoad={()=>setCoverReady(true)} onError={e=>{if(!e.currentTarget.src.endsWith('/art/cover.svg'))e.currentTarget.src='/art/cover.svg';else setCoverReady(true);}} hidden={stage!=='cover'}/>
  <video className={'intro-media intro-video'+(stage==='cover'?' is-waiting':'')} ref={video} src="/media/book-opening.mp4" muted playsInline preload="auto" tabIndex={-1} aria-hidden="true"
   onPlaying={()=>{actualHold.current||=Math.round(performance.now()-(shownAt.current??performance.now()));setHoldDuration(actualHold.current);setStage('opening');playSound('page');}}
   onTimeUpdate={e=>{const time=e.currentTarget.currentTime;if(time>=INTRO_UI_AT&&!unfolded.current){unfolded.current=true;onUnfolding(time);}const page=Math.floor(time*3);if(page!==soundPage.current){soundPage.current=page;playSound('page');}}}
   onEnded={finish} onError={()=>setFailed(true)}/>
  {failed&&stage==='ready'&&<img className="intro-media" src="/media/book-open.webp" alt="펼쳐진 제주 그림책"/>}
  {manual&&<button className="primary-button intro-play" onClick={play}>책 펼치기</button>}
 </div>;
}
