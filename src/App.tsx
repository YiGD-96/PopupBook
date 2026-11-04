import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowLeft, X, RotateCcw, MousePointer2, Check, LoaderCircle, ChevronsRight, ChevronDown, ChevronUp } from 'lucide-react';
import {SITE} from './site';
import { type Director, scenes, useStory, playSound, unlockAudio } from './story';
import { useBookGestures } from './useBookGestures';
import Intro,{type IntroReport} from './Intro';
import {canRevealReader,INTRO_PAGE_COUNT} from './introPlayback';
import {BOOK_FRAME_WIDTH,BOOK_FRAME_HEIGHT,FILM_SPAN,bookZoom} from './bookView';
import {STANDING_DROP,STANDING_QUERY,standingMediaSize} from './standingMedia';
import {artSource} from './artSource';
import DetailPanel from './DetailPanel';
import { prefetchChapterStories } from './storyPrefetch';
import DetailBook from './DetailBook';
import WebzineBook from './WebzineBook';
import { webzines } from './webzine';
import PosterBook from './PosterBook';
import FridgeBook from './FridgeBook';
import { zineView } from './zine';
import { posters } from './posters';
import Prologue from './Prologue';
import Guide from './Guide';
import TopControls from './TopControls';
import { useT } from './i18n';
import type { Lang } from './locale';
import { useOpeningPref } from './openingPref';
import { details } from './details';
import { noteStory, noteTurn, parseHash, track } from './analytics';
import { url } from './base.ts';
import { prefetchFirstSpread } from './artFetch';
import { useSoundPref } from './soundPref';
const Storybook = lazy(() => import('./Storybook'));
// Once the intro film has downloaded past its stopping point, the book's code (three.js) and the first spread's pictures start
// downloading (src/artFetch.ts, no three.js), and the code then prepares them (src/Storybook.tsx preloadBook). Not before: on a slow
// connection even the code, fetched as the film started, held the film up.
const loadBookCode = () => import('./Storybook');
const preloadBook = (chapter = 0) => { prefetchFirstSpread(chapter); void loadBookCode().then(module => module.preloadBook(chapter)).catch(() => {}); };

class CanvasBoundary extends Component<{children:ReactNode;onError:()=>void},{failed:boolean}> {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
// Asked once: the test makes (and drops) a WebGL context, ~12 ms that used to land on the frame where the film pauses.
let webglSupport:boolean|undefined;
function supportsWebGL() { return webglSupport??=testWebGL(); }
function testWebGL() {
  try {
    const canvas=document.createElement('canvas');
    const gl=canvas.getContext('webgl2')??canvas.getContext('webgl');
    if(!gl)return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}
function StaticBook({closed,onInteract}:{closed:boolean;onInteract:(detail?:string)=>void}) {
  const chapter=useStory(s=>s.chapter);
  if(closed)return <img className="static-cover" src={artSource('cover')} alt={SITE.title+' 그림책 표지'}/>;
  return <div className="static-spread" aria-label={scenes[chapter].title}>
    {scenes[chapter].layers.map((l,i)=><img key={l.id} src={artSource(l.src)} style={{width:(l.size[0]/7.2*100)+'%',left:(50+l.position[0]/7.2*100)+'%',bottom:(25+(2-l.position[2])*6)+'%',zIndex:i}} alt=""/>)}
    {scenes[chapter].layers.filter(l=>l.detail).map(l=><button key={l.id} className="static-hotspot" style={{left:(50+l.position[0]/7.2*100)+'%',bottom:(30+(2-l.position[2])*6)+'%'}} onClick={()=>onInteract(l.detail)} aria-label={l.detail}><MousePointer2 size={20}/></button>)}
  </div>;
}
/** Lamp light falling off into the dark room, over the film and the book alike (static; pointer-events none). */
function DeskAir(){
  return <div className="desk-air" aria-hidden="true"/>;
}
function Modal({title,children,onClose,className=''}:{title:string;children:ReactNode;onClose:()=>void;className?:string}) {
  const {t}=useT();
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
    <div className={"modal "+className} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
      <div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label={t('닫기')}><X size={21}/></button></div>
      {children}
    </div>
  </div>;
}
/** The closing note's words, whole per language (their line breaks and order differ); the key words carry the crayon highlight. */
// Each line says something of its own (the title invites, the line below says what the article holds, the button only goes): "article"
// and "read" appear once. `goLabel` is the button's full name for screen readers, since the visible word alone (바로 가기) says less.
const ENDING:Record<Lang,{title:ReactNode;from:ReactNode;go:string;goLabel:string;restart:string}>={
 ko:{title:<><span className="ending-mark">구좌 당근</span> 이야기를<br/><span className="ending-mark">기사</span>로 만나보세요.</>,from:<>밭에서 식탁까지,<br/>한 편에 담았어요.</>,go:'바로 가기',goLabel:'기사 바로 가기',restart:'처음으로'},
 en:{title:<>Read the story<br/>as an <span className="ending-mark">article</span>.</>,from:<>From field to table,<br/>all in one piece.</>,go:'Go now',goLabel:'Go to the article',restart:'Start over'},
 zh:{title:<><span className="ending-mark">旧左胡萝卜</span>的故事<br/>请在<span className="ending-mark">报道</span>中阅读。</>,from:<>从田间到餐桌，<br/>都写在这一篇里。</>,go:'立即前往',goLabel:'前往报道',restart:'回到开头'},
};
/** The ending card's paper and its cut-out mask (src/cinematic.css), fetched and decoded once the last chapter is reached, so the card
 *  comes up whole: before, its words could show a moment before the picture behind them. True once both are ready (or have failed). */
const ENDING_ART=['/media/ending-card.jpg','/media/ending-card-mask.png'];
function useEndingArt(wanted:boolean){
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    if(!wanted||ready)return;let live=true;
    void Promise.all(ENDING_ART.map(src=>{const image=new Image();image.src=url(src);return image.decode().catch(()=>{});})).then(()=>{if(live)setReady(true);});
    return()=>{live=false;};
  },[wanted,ready]);
  return ready;
}
/**
 * A link straight to a story (…#cooks/cook-03), on arriving (not a reload or back/forward): the story opens at once, with no opening
 * (film, prologue, guide) this visit, and the book loads quietly behind it at that story's spread, its cards already standing, so nothing
 * turns or rises behind the story and the reader finds the book ready when they close it. Read once as the page loads, and the story and
 * its spread are set before the first render, so nothing shows the first spread even for a frame.
 */
const STORY_LINK=(()=>{
  const navigation=(performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming|undefined)?.type;
  const link=navigation==='reload'||navigation==='back_forward'?null:parseHash(window.location.hash);
  if(!link?.detail)return null;
  const chapter=link.chapter??Math.max(0,scenes.findIndex(scene=>scene.layers.some(layer=>layer.detail===link.detail)));
  useStory.getState().set({chapter,detail:link.detail});
  return {detail:link.detail,chapter};
})();
/**
 * A link to a later spread (…#cooks, #recipes, #ending), on arriving (not a reload or back/forward): the book opens at that spread, with no
 * opening (film, prologue, guide) and no turn from the first spread. Its number, or null; set in the story before the first render, as above.
 */
const CHAPTER_LINK=(()=>{
  const navigation=(performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming|undefined)?.type;
  const link=navigation==='reload'||navigation==='back_forward'?null:parseHash(window.location.hash);
  if(!link||link.detail||link.chapter===null||link.chapter<1)return null;
  useStory.getState().set({chapter:link.chapter});
  return link.chapter;
})();
/**
 * The opening plays only for our own channels (utm_source kakao, direct, threads or blog, or none at all: a visit typed in or bookmarked);
 * every other source, the ads first, goes straight to the book as with 건너뛰기, since most ad visitors left during the film (GA4, Nov 2026).
 */
const OPENING_SOURCES=['kakao','direct','threads','blog'];
const SOURCE_SKIPS_OPENING=(()=>{
  const source=new URLSearchParams(window.location.search).get('utm_source')?.trim().toLowerCase();
  return !!source&&!OPENING_SOURCES.includes(source);
})();
/**
 * Phones held upright have no opening film and no prologue ("책장 속으로"): the book opens straight to reading and the reading guide comes up
 * (still skipped by 다음부터 보지 않기, a story link or an ad source, like the rest of the opening). Judged once, as the page loads.
 */
const PHONE=typeof matchMedia==='function'&&matchMedia(STANDING_QUERY).matches;
export default function App() {
  const state=useStory();const {lang,t}=useT();
  const {phase,chapter,audioReady}=state;
  const api=useRef<Director|null>(null);
  const [fallback,setFallback]=useState(()=>new URLSearchParams(window.location.search).get('view')==='paper');
  const [modal,setModal]=useState<'about'|null>(null);
  const [engineReady,setEngineReady]=useState(false);
  const [sceneMounted,setSceneMounted]=useState(false);
  const storyLink=STORY_LINK;
  // The book opens straight to reading behind that story only the first time; a restart (처음으로) plays the opening as usual.
  const storyFirst=useRef(!!STORY_LINK);
  const [introVisible,setIntroVisible]=useState(!storyLink);
  const [introLeaving,setIntroLeaving]=useState(false);
  const [chromeVisible,setChromeVisible]=useState(!!storyLink);
  const [chromeVideoTime,setChromeVideoTime]=useState<number|null>(null);
  const [mediaFinished,setMediaFinished]=useState(false);
  const [introRun,setIntroRun]=useState(0);
  const [introReport,setIntroReport]=useState<IntroReport|null>(null);
  const [fallbackAttempt,setFallbackAttempt]=useState(0);
  // The prologue (src/Prologue.tsx) covers the open book from the moment the film pauses until the reader starts; the reader UI appears as it closes.
  const [prologue,setPrologue]=useState<'none'|'open'|'closing'>('none');
  // Skipping the opening (film, prologue and guide): now with 건너뛰기, or every visit once "다음부터 보지 않기" is ticked (src/openingPref.ts:
  // saved at once in this browser; "시작 영상 보기" in the settings turns it back on). A restart (처음부터 다시 보기) still plays it.
  const soundOn=useSoundPref(s=>s.on);
  const [skipOpening,setSkipOpening]=useState(()=>useOpeningPref.getState().skip||!!storyLink||CHAPTER_LINK!==null||SOURCE_SKIPS_OPENING||PHONE);const rememberSkip=useOpeningPref(s=>s.skip),setRememberSkip=useOpeningPref(s=>s.setSkip);
  const skipOpeningRef=useRef(skipOpening);skipOpeningRef.current=skipOpening;
  // Skipped for its utm_source (not by the reader's own choice): the film never plays, so GA4 hears intro_skip (method 'source'), not
  // intro_complete. Only this first opening; a restart plays and reports as usual.
  const sourceSkip=useRef(SOURCE_SKIPS_OPENING&&!storyLink&&CHAPTER_LINK===null&&!useOpeningPref.getState().skip);
  // A link to a later spread skips the opening too (intro_skip, method 'link'), and the book is fetched at once.
  const linkSkip=useRef(CHAPTER_LINK!==null&&!useOpeningPref.getState().skip);
  useEffect(()=>{if(CHAPTER_LINK!==null)preloadBook(CHAPTER_LINK);},[]);
  // On a phone the film is never played either: GA4 hears intro_skip (method 'phone') once, and the guide follows the book's opening.
  const phoneSkip=useRef(PHONE&&!SOURCE_SKIPS_OPENING&&!storyLink&&CHAPTER_LINK===null&&!useOpeningPref.getState().skip);
  const guideOnOpen=useRef(PHONE&&!SOURCE_SKIPS_OPENING&&!storyLink&&CHAPTER_LINK===null&&!useOpeningPref.getState().skip);
  // The two-step reading guide (src/Guide.tsx): 0 closed, 1 the glowing cards, 2 the page arrow. It follows every "책장 속으로".
  const [guide,setGuide]=useState<0|1|2>(0);const guidePending=useRef(false);
  // A spread still loading 1.2 s after the turn was asked for (a slow connection): only then is it worth a word.
  const [slowLoad,setSlowLoad]=useState(false);
  useEffect(()=>{if(phase!=='LOADING_PAGE'){setSlowLoad(false);return;}const timer=window.setTimeout(()=>setSlowLoad(true),1200);return()=>window.clearTimeout(timer);},[phase]);
  // The stories this spread's cards open have their first pictures fetched while the reader looks at it (src/storyPrefetch.ts).
  useEffect(()=>phase==='EXPLORING'?prefetchChapterStories(chapter):undefined,[phase,chapter]);
  const storyRef=useRef<HTMLHeadingElement>(null);
  const surfaceRef=useRef<HTMLDivElement>(null);
  const paperTurn=useRef<{direction:1|-1;progress:number}|null>(null);
  const {dragging}=useBookGestures(surfaceRef,api,modal!==null||introVisible||prologue!=='none'||guide!==0);
  const closed=['INIT','COVER'].includes(phase);
  const coverMode=!introVisible&&closed;
  const intro=introVisible||closed;
  const busy=!['COVER','PROLOGUE','EXPLORING','ENDING','ERROR'].includes(phase);
  const ending=phase==='ENDING';
  const endingArt=useEndingArt(chapter===scenes.length-1);
  const scene=scenes[chapter];
  const closeModal=useCallback(()=>setModal(null),[]);
  const closeDetail=useCallback(()=>useStory.getState().set({detail:null}),[]);
  const openDetail=useCallback((id:string)=>{noteStory('related');useStory.getState().set({detail:id});},[]);
  // A shared link (#cooks, #recipes/recipe-02, #ending) opens that spread or story once the intro has handed over to the book.
  // The book as text (built into index.html by src/seo.ts): for reading without the pictures, for screen readers and for crawlers.
  useEffect(()=>{
    const text=document.getElementById('book-text');if(!text)return;
    const close=()=>{if(text.hidden)return;text.hidden=true;document.body.classList.remove('text-open');};
    const click=(e:MouseEvent)=>{if((e.target as Element|null)?.closest('[data-close-text]'))close();};
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape')close();};
    text.addEventListener('click',click);document.addEventListener('keydown',key);
    return()=>{text.removeEventListener('click',click);document.removeEventListener('keydown',key);};
  },[]);
  // A link with a hash (a shared spread or story) opens it after the intro. A reload or back/forward only returns to the address the book
  // itself kept up to date, so the reader starts again from the first spread instead of watching the book turn to where they were.
  const navigation=(performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming|undefined)?.type;
  const deepLink=useRef<ReturnType<typeof parseHash>|null>(storyLink||navigation==='reload'||navigation==='back_forward'?null:parseHash(window.location.hash));const [linkTick,setLinkTick]=useState(0);
  // The story opens on the first render, at its spread; the book is mounted only once the story is up and the browser is idle (its code,
  // pictures, uploads and shaders then run while the reader reads, not during the story's own opening), and needs no film to finish.
  useEffect(()=>{
    if(!storyLink)return;let idle=0;
    const timer=window.setTimeout(()=>{
      const mount=()=>{preloadBook(storyLink.chapter);setMediaFinished(true);setIntroReport({coverHoldMs:0,videoFrames:null,droppedFrames:null,mediaFailed:false,standing:true});
        if(new URLSearchParams(window.location.search).get('view')!=='paper'&&!supportsWebGL())setFallback(true);setSceneMounted(true);};
      if('requestIdleCallback' in window)idle=window.requestIdleCallback(mount,{timeout:1500});else mount();
    },700);
    return()=>{window.clearTimeout(timer);if(idle)window.cancelIdleCallback(idle);};
  },[storyLink]);

  function staticInteract(detail?:string){
    const s=useStory.getState();
    if(s.phase!=='EXPLORING')return;
    s.set({dialog:true,detail:detail??scenes[s.chapter].detail,visited:[...new Set([...s.visited,s.chapter])]});
    playSound('hello');
  }
  function staticDirector():Director {
    return {
      reveal:(_,hold)=>{const s=useStory.getState();if(s.phase==='COVER')s.set({phase:hold?'PROLOGUE':'EXPLORING',chapter:0,dialog:false,introPagesTurned:INTRO_PAGE_COUNT});},
      rise:()=>{const s=useStory.getState();if(s.phase==='PROLOGUE')s.set({phase:'EXPLORING'});},
      go:n=>{const s=useStory.getState();if(['EXPLORING','ENDING'].includes(s.phase)&&n>=0&&n<3){s.set({phase:'EXPLORING',chapter:n,dialog:false,detail:null});playSound('page');}},
      finish:()=>{const s=useStory.getState();if(s.phase==='EXPLORING'&&s.chapter===2)s.set({phase:'ENDING',dialog:false});},
      interact:staticInteract,
      retry:()=>{useStory.getState().set({phase:'INIT',error:null});setFallbackAttempt(n=>n+1);},
      previewTurn:(direction,progress)=>{
        const s=useStory.getState();
        if(!['EXPLORING','ENDING','DRAGGING_PAGE'].includes(s.phase)||s.chapter+direction<0||s.chapter+direction>2)return false;
        paperTurn.current={direction,progress};s.set({phase:'DRAGGING_PAGE'});return true;
      },
      settleTurn:commit=>{
        const s=useStory.getState();
        if(!paperTurn.current||s.phase!=='DRAGGING_PAGE')return;
        const target=s.chapter+paperTurn.current.direction;paperTurn.current=null;
        s.set({phase:'EXPLORING',...(commit?{chapter:target,dialog:false,detail:null}:{})});
        if(commit)playSound('page');
      }
    };
  }
  function onFailure(){
    setFallback(true);setEngineReady(false);
    const s=useStory.getState();
    s.set({phase:['INIT','COVER'].includes(s.phase)?'INIT':s.phase==='ENDING'?'ENDING':'EXPLORING',error:null});
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
  const mountEarly=useCallback(()=>{if(new URLSearchParams(window.location.search).get('view')!=='paper'&&supportsWebGL())setSceneMounted(true);},[]);
  // The film pauses on the open book: the prologue comes up over it while the live book takes the film's place underneath.
  const finishIntro=useCallback((report:IntroReport)=>{
    setIntroReport(report);setPrologue(skipOpeningRef.current?'none':'open');
    if(sourceSkip.current){sourceSkip.current=false;track('intro_skip',{method:'source'});}
    else if(linkSkip.current){linkSkip.current=false;track('intro_skip',{method:'link'});}
    else if(phoneSkip.current){phoneSkip.current=false;track('intro_skip',{method:'phone'});}
    else track('intro_complete',{layout:report.standing?'standing':'open',dropped_frames:report.droppedFrames??undefined,media_failed:report.mediaFailed});
    if(new URLSearchParams(window.location.search).get('view')!=='paper'&&!supportsWebGL())setFallback(true);
    setMediaFinished(true);setSceneMounted(true);
  },[]);
  const showChrome=useCallback((time:number)=>{setChromeVideoTime(time);},[]);
  // After "책장 속으로" the guide comes up while the prologue fades and the cards stand up (nothing else open).
  useEffect(()=>{
   if(!guidePending.current||!(phase==='OPENING_POPUP'||phase==='EXPLORING')||prologue==='open'||introVisible||modal!==null||state.detail)return;
   const timer=window.setTimeout(()=>{if(!guidePending.current)return;guidePending.current=false;setGuide(1);track('guide_start');},150);return()=>window.clearTimeout(timer);
  },[phase,prologue,introVisible,modal,state.detail]);
  const locateCard=useCallback(()=>api.current?.locate?.()??null,[]);
  // The visible arrow (its icon), not the button's wider hit area, which runs off the screen edge on a phone: a square centred on it.
  const locateArrow=useCallback(()=>{const icon=document.querySelector('.reader-next svg')??document.querySelector('.reader-next');const r=icon?.getBoundingClientRect();if(!r||!r.width)return null;
   const size=Math.max(36,r.width+12),cx=r.x+r.width/2,cy=r.y+r.height/2;return {x:cx-size/2,y:cy-size/2,width:size,height:size};},[]);
  // Closing the guide, the spread's glowing cards blink again, so the reader's eye goes straight back to them.
  // Step 2's swipe on a phone turns the page the way it shows (up: the next spread or the closing card; down: the previous one).
  const guideSwipe=useCallback((direction:1|-1)=>{const s=useStory.getState();noteTurn('drag');
   if(direction>0){if(s.chapter===scenes.length-1)api.current?.finish();else api.current?.go(s.chapter+1);}else if(s.chapter>0)api.current?.go(s.chapter-1);},[]);
  const nextGuide=useCallback(()=>setGuide(step=>{if(step===1)return 2;track('guide_done');window.setTimeout(()=>api.current?.highlight?.(),150);return 0;}),[]);
  // "책장 속으로": the prologue fades, the reader UI arrives and the cards stand up.
  const startReading=useCallback(()=>{
    if(useStory.getState().phase!=='PROLOGUE')return;
    track('prologue_start');guidePending.current=true;setPrologue('closing');setChromeVisible(true);api.current?.rise();
    window.setTimeout(()=>setPrologue('none'),520);
  },[]);
  // Skipped, the book opens to reading as soon as it is ready under the (skipped) prologue: the cards stand up, no guide.
  useEffect(()=>{if(!skipOpening||phase!=='PROLOGUE')return;setPrologue('none');setChromeVisible(true);
    // On a phone the guide still comes up as the cards stand (the same hand-over as after "책장 속으로").
    if(guideOnOpen.current){guideOnOpen.current=false;guidePending.current=true;}
    api.current?.rise();},[skipOpening,phase]);
  const skipNow=useCallback(()=>{track('intro_skip',{remember:rememberSkip,method:'button'});guidePending.current=false;setGuide(0);setSkipOpening(true);},[rememberSkip]);
  const beginIntro=useCallback(()=>{
    setSkipOpening(PHONE);guideOnOpen.current=PHONE;track('restart');api.current=null;setEngineReady(false);setSceneMounted(false);setMediaFinished(false);setIntroLeaving(false);setIntroVisible(true);setIntroRun(n=>n+1);setIntroReport(null);setChromeVisible(false);setChromeVideoTime(null);setPrologue('none');
    useStory.getState().set({phase:'INIT',chapter:0,dialog:false,visited:[],error:null,introPagesTurned:0});
  },[]);
  // After the film the book waits under the prologue (hold); behind a story link's story it opens straight to reading, as it was filmed
  // standing, with nothing to animate.
  useEffect(()=>{
    if(!canRevealReader(mediaFinished,engineReady&&phase==='COVER'))return;
    const behindStory=storyFirst.current;storyFirst.current=false;
    api.current?.reveal(behindStory?true:introReport?.standing,!behindStory);
  },[mediaFinished,engineReady,phase,introReport,storyLink]);
  useEffect(()=>{
    if(!introVisible||!(phase==='EXPLORING'||phase==='PROLOGUE'))return;
    setIntroLeaving(true);const timer=window.setTimeout(()=>setIntroVisible(false),280);
    return()=>window.clearTimeout(timer);
  },[phase,introVisible]);
  useEffect(()=>{
    document.addEventListener('pointerdown',unlockAudio,true);
    document.addEventListener('pointerup',unlockAudio,true);
    document.addEventListener('keydown',unlockAudio,true);
    return()=>{document.removeEventListener('pointerdown',unlockAudio,true);document.removeEventListener('pointerup',unlockAudio,true);document.removeEventListener('keydown',unlockAudio,true);};
  },[]);
  useEffect(()=>{if(phase==='EXPLORING'&&!introVisible&&prologue==='none')storyRef.current?.focus({preventScroll:true});},[phase,introVisible,prologue]);
  useEffect(()=>{
    const link=deepLink.current;if(!link||introVisible||phase!=='EXPLORING')return;
    if(link.chapter!==null&&link.chapter!==chapter){noteTurn('link');api.current?.go(link.chapter);return;}
    deepLink.current=null;
    if(link.ending)api.current?.finish();
    else if(link.detail){noteStory('link');useStory.getState().set({detail:link.detail});}
  },[phase,chapter,introVisible,linkTick]);
  useEffect(()=>{
    // A hash typed or pasted while reading takes the reader there too.
    const follow=()=>{deepLink.current=parseHash(window.location.hash);setLinkTick(n=>n+1);};
    window.addEventListener('hashchange',follow);return()=>window.removeEventListener('hashchange',follow);
  },[]);
  useEffect(()=>{
    const keys=(e:KeyboardEvent)=>{
      if(introVisible||modal!==null||guide!==0||document.body.classList.contains('text-open')||(e.target instanceof HTMLElement&&['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName)))return;
      const s=useStory.getState();
      // The first spread is the start of the story: there is no going back to the cover from here.
      if(['ArrowRight','ArrowLeft'].includes(e.key))noteTurn('key');
      if(e.key==='ArrowRight'&&s.phase==='EXPLORING'){e.preventDefault();s.chapter===2?api.current?.finish():api.current?.go(s.chapter+1);}
      if(e.key==='ArrowLeft'&&['EXPLORING','ENDING'].includes(s.phase)&&s.chapter>0){e.preventDefault();api.current?.go(s.chapter-1);}
    };
    window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys);
  },[modal,introVisible]);
  useEffect(()=>{document.body.classList.add('book-reading');window.scrollTo({top:0,behavior:'instant'});return()=>document.body.classList.remove('book-reading');},[]);
  // Before the first paint (a layout effect): the cover still is often cached and shows at once, and painted before its size was set it
  // stood centred and full height, then jumped about 60 px down to the film's place a moment later (a slow phone showed it for ~0.2 s).
  useLayoutEffect(()=>{
    const surface=surfaceRef.current;if(!surface)return;
    const update=()=>{
      const zoom=bookZoom(surface.clientWidth,surface.clientHeight);
      // The desktop film shows desk around the frame (FILM_SPAN); at the frame's scale it lines up with the live camera.
      surface.style.setProperty('--book-media-width',String(BOOK_FRAME_WIDTH*FILM_SPAN.x*zoom)+'px');
      surface.style.setProperty('--book-media-height',String(BOOK_FRAME_HEIGHT*FILM_SPAN.y*zoom)+'px');
      const standing=standingMediaSize(surface.clientWidth,surface.clientHeight);
      surface.style.setProperty('--standing-media-width',String(standing.width)+'px');
      surface.style.setProperty('--standing-media-height',String(standing.height)+'px');
      // The standing book is drawn this far below the centre (Storybook.tsx Camera); the film and the page arrows move with it.
      surface.parentElement?.style.setProperty('--standing-drop',(matchMedia(STANDING_QUERY).matches?STANDING_DROP:0)+'px');
    };
    update();const observer=new ResizeObserver(update);observer.observe(surface);return()=>observer.disconnect();
  },[]);

  const introText=t(phase==='INIT'?'책을 준비하고 있어요':'당신의 작은 여행을 펼쳐요');
  const detailOpen=!!state.detail&&!introVisible&&!ending;
  return <div className={"app-shell reader-mode cinematic-reader"+(introVisible?" intro-active":"")+(detailOpen?" has-detail":"")}>
    {!introVisible&&<a className="skip-link" href="#main">{t('이야기로 바로 가기')}</a>}
    {/* While the film plays and while the reading guide shows, not over the prologue (its own button goes on into the book). */}
    {(PHONE?guide!==0:(introVisible||guide!==0)&&!skipOpening)&&<div className="opening-skip">
      <label className="opening-remember"><input type="checkbox" checked={rememberSkip} onChange={e=>setRememberSkip(e.target.checked)}/><i aria-hidden="true"><Check size={11} strokeWidth={3}/></i>{t('다음부터 보지 않기')}</label>
      <span className="opening-skip-rule" aria-hidden="true"/>
      <button type="button" className="opening-skip-button" onClick={skipNow}>{t('건너뛰기')}<ChevronsRight size={15} aria-hidden="true"/></button>
    </div>}
    {/* Top right, side by side: the contents (once the reader's header shows) and the language switch, as two matching pills. */}
    <div className="top-actions">
      {chromeVisible&&<nav aria-label={t('메인 메뉴')}><button className="top-pill" onClick={()=>{setModal('about');track('about_open');}}>{t('목차')}</button></nav>}
      <TopControls/>
    </div>
    {chromeVisible&&<header className="site-header">
      <a href={url("/")} className="brand" aria-label={t(SITE.name)+' — '+t('홈으로')}><img className="brand-logo" src={url("/media/logo.webp")} alt="carrot" width={87} height={26}/><span className="brand-name">{t(SITE.name)}</span></a>
    </header>}
    {/* The spread's title, on its own above the book, with a dot per chapter (the one being read lit). Read by screen readers from the h1 below. */}
    {chromeVisible&&!ending&&<div className="chapter-title" key={chapter} aria-hidden="true"><span>{scene.english}</span><strong>{t(scene.title)}</strong><div className="chapter-dots">{scenes.map((item,index)=><i key={item.id} className={index===chapter?'is-on':''}/>)}</div></div>}
    <main id="main"><section className={'hero '+(intro?'is-cover':'is-open')+(ending?' is-ending':'')} aria-label={t(SITE.title)+' — '+t('팝업북')}>
      {chromeVisible&&<div className={'hero-copy'+(ending&&!endingArt?' is-waiting':'')}>
        {coverMode?<div className="cover-intro"><span>{SITE.label}</span><h1>{SITE.title}</h1><p role="status"><LoaderCircle size={14} className="spin"/>{introText}</p></div>:
        ending?<><h1>{ENDING[lang].title}</h1><p className="hero-description">{ENDING[lang].from}</p><a className="primary-button ending-link" href={SITE.article} target="_blank" rel="noreferrer" aria-label={`${ENDING[lang].goLabel} ${t('(새 창에서 열림)')}`}>{ENDING[lang].go}<ArrowRight size={21}/></a><button className="secondary-button ending-restart" onClick={beginIntro}><RotateCcw size={18}/>{ENDING[lang].restart}</button></>:
        <><h1 className="sr-only" aria-label={t(scene.title)} ref={storyRef} tabIndex={-1}>{t(scene.title)}</h1>

        </>}
      </div>}
      <div className="book-stage">
        <div ref={surfaceRef} className={'canvas-wrap '+(dragging?'is-dragging':'')} data-phase={phase} data-intro-pages={state.introPagesTurned} data-audio-ready={audioReady} data-cover-hold-ms={introReport?.coverHoldMs} data-video-frames={introReport?.videoFrames} data-video-dropped-frames={introReport?.droppedFrames} data-video-failed={introReport?.mediaFailed} data-chrome-visible={chromeVisible} data-chrome-video-time={chromeVideoTime} aria-label={intro?SITE.title+' 입체 그림책':(chapter+1)+'장 '+scene.title+' 입체 종이 풍경'}>
          {sceneMounted&&(fallback?<StaticBook closed={closed} onInteract={staticInteract}/>:<CanvasBoundary onError={onFailure}><Suspense fallback={null}><Storybook onReady={director=>{api.current=director;setEngineReady(true);}} onFailure={onFailure}/></Suspense></CanvasBoundary>)}
          <DeskAir/>
          {introVisible&&<Intro key={introRun} onFinished={finishIntro} onUnfolding={showChrome} onBuffered={preloadBook} onNearEnd={mountEarly} leaving={introLeaving} skip={skipOpening}/>}
        </div>
        {!introVisible&&!audioReady&&intro&&soundOn&&!state.detail&&<p className="audio-hint">{t('소리는 화면을 터치하면 함께 시작돼요')}</p>}
        {/* No indicator while a page turns (it made turns feel slower); only a next spread still loading after a while says so. */}
        {slowLoad&&prologue==='none'&&guide===0&&<div className="scene-loading" role="status"><LoaderCircle size={16} className="spin"/>{t('다음 풍경을 준비해요')}</div>}
        {chromeVisible&&!coverMode&&<>
          <button className="reader-arrow reader-prev" aria-label={t('이전 책장')} title={t('이전 책장')} disabled={busy||introVisible||chapter===0} onClick={()=>api.current?.go(chapter-1)}><ArrowLeft size={24}/></button>
          {!ending&&<button className="reader-arrow reader-next" aria-label={t(chapter===2?'여행 마무리':'다음 책장')} title={t(chapter===2?'여행 마무리':'다음 책장')} disabled={busy||introVisible} onClick={()=>chapter===2?api.current?.finish():api.current?.go(chapter+1)}><ArrowRight size={24}/></button>}
          {/* The phone's upright book (no side arrows there, src/cinematic.css): swiping, or this pair below it, the previous page above the
              next (on the last page it brings up the closing card); the previous one only past the first page, the next one hidden while the
              closing card shows, each keeping its place when the other is hidden. */}
          <div className="reader-vnav">
            {<button className={'reader-arrow reader-up'+(chapter>0?'':' is-none')} aria-hidden={chapter===0||undefined} tabIndex={chapter>0?undefined:-1} aria-label={t('이전 책장')} title={t('이전 책장')} disabled={busy||introVisible||chapter===0} onClick={()=>{noteTurn('arrow');api.current?.go(chapter-1);}}><ChevronUp size={30}/></button>}
            {<button className={'reader-arrow reader-down'+(ending?' is-none':'')} aria-hidden={ending||undefined} tabIndex={ending?-1:undefined} aria-label={t(chapter===2?'여행 마무리':'다음 책장')} title={t(chapter===2?'여행 마무리':'다음 책장')} disabled={busy||introVisible||ending} onClick={()=>{noteTurn('arrow');if(chapter===2)api.current?.finish();else api.current?.go(chapter+1);}}><ChevronDown size={30}/></button>}
          </div>

        </>}
        {phase==='ERROR'&&<div className="scene-error" role="alert"><p>{state.error&&t(state.error)}</p><button className="secondary-button" onClick={()=>api.current?.retry()}><RotateCcw size={16}/> {t('다시 시도')}</button></div>}
      </div>
    </section></main>
    {prologue!=='none'&&<Prologue ready={phase==='PROLOGUE'||prologue==='closing'} closing={prologue==='closing'} onStart={startReading}/>}
    {guide!==0&&<Guide step={guide} locate={guide===1?locateCard:locateArrow} onNext={nextGuide} onSwipe={guideSwipe}/>}
    {detailOpen&&state.detail&&(zineView(state.detail)?<FridgeBook key="fridge" id={state.detail} onClose={closeDetail} onOpen={openDetail}/>:webzines[state.detail]?<WebzineBook key={state.detail} id={state.detail} onClose={closeDetail} onOpen={openDetail}/>:posters[state.detail]?<PosterBook key={state.detail} id={state.detail} onClose={closeDetail} onOpen={openDetail}/>:details[state.detail]?.spread?<DetailBook key={state.detail} id={state.detail} onClose={closeDetail} onOpen={openDetail}/>:<DetailPanel id={state.detail} onClose={closeDetail} onOpen={openDetail}/>)}
    {/* The contents ("목차" in the header): the three chapters, each one a way in; the one being read is marked. */}
    {modal==='about'&&<Modal title={t('목차')} className="contents-modal" onClose={closeModal}>
      <p className="contents-lead">{t(SITE.title)} · {t('세 장면')}</p>
      <ol className="contents-list">{scenes.map((item,index)=><li key={item.id}>
        <button type="button" className={index===chapter?'is-current':''} aria-current={index===chapter?'page':undefined} onClick={()=>{closeModal();if(index!==chapter){noteTurn('link');api.current?.go(index);}}}>
          <span className="contents-no">0{index+1}</span>
          <span className="contents-body"><small>{item.english}</small><strong>{t(item.title)}</strong><em>{t(item.intro).replace(/\n/g,' ')}</em></span>
          {index===chapter?<span className="contents-here">{t('읽는 중')}</span>:<ArrowRight size={18} aria-hidden="true"/>}
        </button>
      </li>)}</ol>
    </Modal>}
  </div>;
}
