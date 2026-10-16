import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowLeft, BookOpen, X, RotateCcw, MousePointer2, Check, Sparkles, Heart, LoaderCircle } from 'lucide-react';
import { type Director, scenes, useStory, playSound, unlockAudio } from './story';
import { useBookGestures } from './useBookGestures';
import Intro,{type IntroReport} from './Intro';
import {canRevealReader} from './introPlayback';
import {BOOK_FRAME_WIDTH,BOOK_FRAME_HEIGHT,bookZoom} from './bookView';
import {artSource} from './artSource';
const Storybook = lazy(() => import('./Storybook'));

class CanvasBoundary extends Component<{children:ReactNode;onError:()=>void},{failed:boolean}> {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function supportsWebGL() {
  try {
    const canvas=document.createElement('canvas');
    const gl=canvas.getContext('webgl2')??canvas.getContext('webgl');
    if(!gl)return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}
function StaticBook({closed,onInteract}:{closed:boolean;onInteract:()=>void}) {
  const chapter=useStory(s=>s.chapter);
  if(closed)return <img className="static-cover" src={artSource('cover')} alt="느린 제주 그림책 표지"/>;
  return <div className="static-spread" aria-label={scenes[chapter].title}>
    {scenes[chapter].layers.map((l,i)=><img key={l.id} src={artSource(l.src)} style={{width:(l.size[0]/7.2*100)+'%',left:(50+l.position[0]/7.2*100)+'%',bottom:(25+(2-l.position[2])*6)+'%',zIndex:i}} alt=""/>)}
    <button className="static-hotspot" onClick={onInteract} aria-label={scenes[chapter].label}><MousePointer2 size={20}/></button>
  </div>;
}
function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handler=(event:KeyboardEvent)=>{
      if(event.key==='Escape')onClose();
      if(event.key!=='Tab')return;
      const elements=ref.current?.querySelectorAll<HTMLElement>('button,input,select,[tabindex="0"]');
      if(!elements?.length)return;
      const first=elements[0],last=elements[elements.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    document.addEventListener('keydown',handler);
    return()=>{document.removeEventListener('keydown',handler);previous?.focus();};
  },[onClose]);
  return <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
      <div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="닫기"><X size={21}/></button></div>
      {children}
    </div>
  </div>;
}
export default function App() {
  const state=useStory();
  const {phase,chapter,dialog,audioReady}=state;
  const api=useRef<Director|null>(null);
  const [fallback,setFallback]=useState(()=>new URLSearchParams(window.location.search).get('view')==='paper');
  const [modal,setModal]=useState<'about'|null>(null);
  const [engineReady,setEngineReady]=useState(false);
  const [sceneMounted,setSceneMounted]=useState(false);
  const [introVisible,setIntroVisible]=useState(true);
  const [introLeaving,setIntroLeaving]=useState(false);
  const [chromeVisible,setChromeVisible]=useState(false);
  const [chromeVideoTime,setChromeVideoTime]=useState<number|null>(null);
  const [mediaFinished,setMediaFinished]=useState(false);
  const [introRun,setIntroRun]=useState(0);
  const [introReport,setIntroReport]=useState<IntroReport|null>(null);
  const [fallbackAttempt,setFallbackAttempt]=useState(0);
  const storyRef=useRef<HTMLHeadingElement>(null);
  const surfaceRef=useRef<HTMLDivElement>(null);
  const paperTurn=useRef<{direction:1|-1;progress:number}|null>(null);
  const {dragging}=useBookGestures(surfaceRef,api,modal!==null||introVisible);
  const closed=['INIT','COVER','CLOSED'].includes(phase);
  const coverMode=!introVisible&&(closed||['OPENING_BOOK','CLOSING_BOOK'].includes(phase));
  const intro=introVisible||closed||['OPENING_BOOK','CLOSING_BOOK'].includes(phase);
  const busy=!['COVER','CLOSED','EXPLORING','ENDING','ERROR'].includes(phase);
  const ending=phase==='ENDING';
  const scene=scenes[chapter];
  const closeModal=useCallback(()=>setModal(null),[]);

  function staticInteract(){
    const s=useStory.getState();
    if(s.phase!=='EXPLORING')return;
    s.set({dialog:true,visited:[...new Set([...s.visited,s.chapter])]});
    playSound('hello');
  }
  function staticDirector():Director {
    return {
      start:()=>{const s=useStory.getState();if(s.phase==='CLOSED'){s.set({phase:'EXPLORING',chapter:0,dialog:false});playSound('page');}},
      reveal:()=>{const s=useStory.getState();if(s.phase==='COVER')s.set({phase:'EXPLORING',chapter:0,dialog:false,introPagesTurned:10});},
      close:()=>{const s=useStory.getState();if(s.phase==='EXPLORING'&&s.chapter===0){s.set({phase:'CLOSED',dialog:false});playSound('page');}},
      go:n=>{const s=useStory.getState();if(['EXPLORING','ENDING'].includes(s.phase)&&n>=0&&n<3){s.set({phase:'EXPLORING',chapter:n,dialog:false});playSound('page');}},
      finish:()=>{const s=useStory.getState();if(s.phase==='EXPLORING'&&s.chapter===2)s.set({phase:'ENDING',dialog:false});},
      restart:()=>beginIntro(),
      interact:staticInteract,
      retry:()=>{useStory.getState().set({phase:'INIT',error:null});setFallbackAttempt(n=>n+1);},
      previewTurn:(direction,progress)=>{
        const s=useStory.getState();
        if(!['EXPLORING','DRAGGING_PAGE'].includes(s.phase)||s.chapter+direction<0||s.chapter+direction>2)return false;
        paperTurn.current={direction,progress};s.set({phase:'DRAGGING_PAGE'});return true;
      },
      settleTurn:commit=>{
        const s=useStory.getState();
        if(!paperTurn.current||s.phase!=='DRAGGING_PAGE')return;
        const target=s.chapter+paperTurn.current.direction;paperTurn.current=null;
        s.set({phase:'EXPLORING',...(commit?{chapter:target,dialog:false}:{})});
        if(commit)playSound('page');
      }
    };
  }
  function onFailure(){
    setFallback(true);setEngineReady(false);
    const s=useStory.getState();
    s.set({phase:['INIT','COVER','OPENING_BOOK'].includes(s.phase)?'INIT':s.phase==='ENDING'?'ENDING':s.phase==='CLOSED'?'CLOSED':'EXPLORING',error:null});
  }
  useEffect(()=>{
    if(!fallback||!sceneMounted)return;
    api.current=staticDirector();
    const s=useStory.getState();
    if(!['INIT','COVER'].includes(s.phase)){setEngineReady(true);return;}
    let active=true;setEngineReady(false);
    void Promise.all(['cover',...scenes[0].layers.map(l=>l.src)].map(name=>new Promise<void>((resolve,reject)=>{
      const image=new Image();image.onload=()=>resolve();image.onerror=()=>reject(new Error('책을 준비하지 못했어요. 연결을 확인해 주세요.'));image.src=artSource(name);
    }))).then(()=>{if(active){setEngineReady(true);s.set({phase:'COVER'});}}).catch(error=>{if(active)s.set({phase:'ERROR',error:error.message});});
    return()=>{active=false;};
  },[fallback,fallbackAttempt,sceneMounted]);
  const finishIntro=useCallback((report:IntroReport)=>{
    setIntroReport(report);setChromeVisible(true);
    if(new URLSearchParams(window.location.search).get('view')!=='paper'&&!supportsWebGL())setFallback(true);
    setMediaFinished(true);setSceneMounted(true);
  },[]);
  const showChrome=useCallback((time:number)=>{setChromeVisible(true);setChromeVideoTime(time);},[]);
  const beginIntro=useCallback(()=>{
    api.current=null;setEngineReady(false);setSceneMounted(false);setMediaFinished(false);setIntroLeaving(false);setIntroVisible(true);setIntroRun(n=>n+1);setIntroReport(null);setChromeVisible(false);setChromeVideoTime(null);
    useStory.getState().set({phase:'INIT',chapter:0,dialog:false,visited:[],error:null,introPagesTurned:0});
  },[]);
  useEffect(()=>{
    if(canRevealReader(mediaFinished,engineReady&&phase==='COVER'))api.current?.reveal();
  },[mediaFinished,engineReady,phase]);
  useEffect(()=>{
    if(!introVisible||phase!=='EXPLORING')return;
    setIntroLeaving(true);const timer=window.setTimeout(()=>setIntroVisible(false),280);
    return()=>window.clearTimeout(timer);
  },[phase,introVisible]);
  useEffect(()=>{
    document.addEventListener('pointerdown',unlockAudio,true);
    document.addEventListener('pointerup',unlockAudio,true);
    document.addEventListener('keydown',unlockAudio,true);
    return()=>{document.removeEventListener('pointerdown',unlockAudio,true);document.removeEventListener('pointerup',unlockAudio,true);document.removeEventListener('keydown',unlockAudio,true);};
  },[]);
  useEffect(()=>{if(phase==='EXPLORING'&&!introVisible)storyRef.current?.focus({preventScroll:true});},[phase,introVisible]);
  useEffect(()=>{
    const keys=(e:KeyboardEvent)=>{
      if(introVisible||modal!==null||(e.target instanceof HTMLElement&&['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName)))return;
      const s=useStory.getState();if(s.phase!=='EXPLORING')return;
      if(e.key==='ArrowRight'){e.preventDefault();s.chapter===2?api.current?.finish():api.current?.go(s.chapter+1);}
      if(e.key==='ArrowLeft'){e.preventDefault();s.chapter===0?api.current?.close():api.current?.go(s.chapter-1);}
    };
    window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys);
  },[modal,introVisible]);
  useEffect(()=>{document.body.classList.add('book-reading');window.scrollTo({top:0,behavior:'instant'});return()=>document.body.classList.remove('book-reading');},[]);
  useEffect(()=>{
    const surface=surfaceRef.current;if(!surface)return;
    const update=()=>{
      const zoom=bookZoom(surface.clientWidth,surface.clientHeight);
      surface.style.setProperty('--book-media-width',String(BOOK_FRAME_WIDTH*zoom)+'px');
      surface.style.setProperty('--book-media-height',String(BOOK_FRAME_HEIGHT*zoom)+'px');
    };
    update();const observer=new ResizeObserver(update);observer.observe(surface);return()=>observer.disconnect();
  },[]);

  const introText=phase==='INIT'?'책을 준비하고 있어요':phase==='CLOSING_BOOK'?'책을 살며시 닫아요':phase==='CLOSED'?'이 작은 여행은 언제나 여기 있어요':'당신의 작은 여행을 펼쳐요';
  return <div className={"app-shell reader-mode cinematic-reader"+(introVisible?" intro-active":"")}>
    {!introVisible&&<a className="skip-link" href="#main">이야기로 바로 가기</a>}
    {chromeVisible&&<header className="site-header">
      <a href="/" className="brand" aria-label="느린 제주 홈"><span className="brand-icon"><BookOpen size={24} strokeWidth={1.5}/><span/></span><span>느린 제주<span className="brand-en">SLOW JEJU</span></span></a>
      <div className="header-chapter" aria-label={(chapter+1)+'장 '+scene.title}><span>0{chapter+1} / 03</span><strong>{scene.title}</strong></div><nav aria-label="메인 메뉴"><button className="nav-link" onClick={()=>setModal('about')}>이야기 소개</button></nav>
    </header>}
    <main id="main"><section className={'hero '+(intro?'is-cover':'is-open')+(ending?' is-ending':'')} aria-label="제주 팝업북">
      {chromeVisible&&<div className="hero-copy">
        {coverMode?<div className="cover-intro"><span>A LITTLE PAPER JOURNEY</span><h1>한 장씩, 만나는 제주</h1><p role="status">{phase!=='CLOSED'&&<LoaderCircle size={14} className="spin"/>}{introText}</p>{phase==='CLOSED'&&<button className="primary-button reopen-button" onClick={()=>api.current?.start()}><BookOpen size={17}/> 책 다시 펼치기<ArrowRight size={17}/></button>}</div>:
        ending?<><span className="eyebrow"><Heart size={14}/> 오늘의 작은 여행을 마치며</span><h1>제주의 바람을,<br/><span className="hand-underline">당신의 하루에.</span></h1><p className="hero-description">잠시 쉬어 간 마음이 조금 가벼워졌나요?<br/>이 작은 풍경은 언제나 여기서 기다릴게요.</p><div className="ending-stamp"><Check size={15}/> 세 가지 풍경을 모두 만났어요</div><button className="primary-button" onClick={beginIntro}><RotateCcw size={18}/> 다시 여행하기<ArrowRight size={18}/></button></>:
        <><h1 className="sr-only" aria-label={scene.title} ref={storyRef} tabIndex={-1}>{scene.title}</h1>
          <div className={'narration '+(dialog?'has-dialog':'')}><span className="narration-label">{dialog?<><Sparkles size={14}/> 풍경이 들려주는 이야기</>:<><BookOpen size={14}/> 이 장의 이야기</>}</span><p aria-live="polite">{dialog?scene.dialog:'작은 풍경에도 이야기가 숨어 있어요. 종이 위의 친구를 눌러 이야기를 들어보세요.'}</p></div>
          <button className="interaction-button" disabled={phase!=='EXPLORING'||introVisible} onClick={()=>api.current?.interact()}>{state.visited.includes(chapter)?<Check size={16}/>:<MousePointer2 size={16}/>} {scene.label}</button>

        </>}
      </div>}
      <div className="book-stage">
        <div ref={surfaceRef} className={'canvas-wrap '+(dragging?'is-dragging':'')} data-phase={phase} data-fps={state.fps} data-intro-pages={state.introPagesTurned} data-audio-ready={audioReady} data-cover-hold-ms={introReport?.coverHoldMs} data-video-frames={introReport?.videoFrames} data-video-dropped-frames={introReport?.droppedFrames} data-video-failed={introReport?.mediaFailed} data-chrome-visible={chromeVisible} data-chrome-video-time={chromeVideoTime} aria-label={intro?'느린 제주 입체 그림책':(chapter+1)+'장 '+scene.title+' 입체 종이 풍경'}>
          {sceneMounted&&(fallback?<StaticBook closed={closed} onInteract={staticInteract}/>:<CanvasBoundary onError={onFailure}><Suspense fallback={null}><Storybook onReady={director=>{api.current=director;setEngineReady(true);}} onFailure={onFailure}/></Suspense></CanvasBoundary>)}
          {introVisible&&<Intro key={introRun} onFinished={finishIntro} onUnfolding={showChrome} leaving={introLeaving}/>}
        </div>
        {!introVisible&&!audioReady&&intro&&<p className="audio-hint">소리는 화면을 터치하면 함께 시작돼요</p>}
        {busy&&!intro&&phase!=='DRAGGING_PAGE'&&<div className="scene-loading" role="status"><LoaderCircle size={16} className="spin"/>{phase==='LOADING_PAGE'?'다음 풍경을 준비해요':phase==='TURNING_PAGE'?'책장을 넘겨요':'종이 속 제주가 깨어나요'}</div>}
        {chromeVisible&&!coverMode&&!ending&&<>
          <button className="reader-arrow reader-prev" aria-label={chapter===0?'첫 장에서 책 닫기':'이전 책장'} title={chapter===0?'책 닫기':'이전 책장'} disabled={busy||introVisible} onClick={()=>chapter===0?api.current?.close():api.current?.go(chapter-1)}><ArrowLeft size={24}/></button>
          <button className="reader-arrow reader-next" aria-label={chapter===2?'여행 마무리':'다음 책장'} title={chapter===2?'여행 마무리':'다음 책장'} disabled={busy||introVisible} onClick={()=>chapter===2?api.current?.finish():api.current?.go(chapter+1)}><ArrowRight size={24}/></button>

        </>}
        {phase==='ERROR'&&<div className="scene-error" role="alert"><p>{state.error}</p><button className="secondary-button" onClick={()=>api.current?.retry()}><RotateCcw size={16}/> 다시 시도</button></div>}
      </div>
    </section></main>
    {modal==='about'&&<Modal title="한 장씩, 마음에 닿는 여행" onClose={closeModal}><div className="about-art"><img src="/art/carrot.svg" alt="웃고 있는 당근 친구"/><span>안녕, 나는 당근이야!</span></div><p className="about-text">‘느린 제주’는 손끝으로 펼치는 작은 팝업북이에요. 구좌의 당근밭에서 출발해, 다정한 골목을 지나, 바다의 작은 등대에 도착합니다.</p><p className="about-text">종이 위의 친구와 풍경을 눌러보세요. 당신의 속도로 즐겨주세요. 첫 장에서는 책을 닫고 잠시 쉬어 갈 수 있어요.</p><div className="about-help"><MousePointer2 size={18}/><p>클릭하거나 터치해요.<br/><span>Tab과 Enter, 방향키로도 여행할 수 있어요.</span></p></div><button className="primary-button" onClick={closeModal}>책으로 돌아가기<ArrowRight size={18}/></button></Modal>}
  </div>;
}
