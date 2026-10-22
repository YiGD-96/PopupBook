import { useEffect, useRef } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { SITE } from './site';
import { scenes } from './story';
/**
 * The prologue: once the intro film has opened the book (and paused, its cards still flat), the room dims and this tells the reader
 * what the book is. "책장 속으로" closes it and the cards stand up (Director.rise); how to read is shown on the book itself after that
 * (src/Guide.tsx). The button waits until the live book is ready behind it (phase PROLOGUE).
 * Few words on purpose: readers take in a title and a line or two before they act, and each further block stands between them and the
 * button. So: the title, a short invitation, the contents (the three chapters), the button.
 */
export default function Prologue({ready,closing,onStart}:{ready:boolean;closing:boolean;onStart:()=>void}){
 const start=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(ready)start.current?.focus({preventScroll:true});},[ready]);
 return <div className={'prologue'+(closing?' is-closing':'')} role="dialog" aria-modal="true" aria-labelledby="prologue-title">
  <div className="prologue-card">
   <span className="prologue-kicker">Prologue · {SITE.label}</span>
   {/* Coloured: the subject and the two promises; marked like a highlighter: the three things the chapters show, in their order. */}
   <h2 id="prologue-title">오늘 한 끼, <em>구좌 당근</em></h2>
   <p className="prologue-lead">우리 집 식탁을 <em>더 건강하게</em>,<br/>매일의 한 끼를 <em>더 간편하게</em>.</p>
   <p className="prologue-text">구좌 당근이 <mark>자라는 이야기</mark>부터 <mark>색다른 먹거리</mark>,<br/>함께 만들어가는 <mark>오늘의 한 상</mark>까지.</p>
   <p className="prologue-call"><strong>구좌에서 우리 집 식탁으로</strong>, 지금 만나보세요.</p>
   <ol className="prologue-chapters" aria-label="목차">{scenes.map((scene,index)=><li key={scene.id}><span>0{index+1}</span>{scene.title}</li>)}</ol>
   <button ref={start} type="button" className="primary-button prologue-start" disabled={!ready} onClick={onStart}>
    {ready?<>책장 속으로<ArrowRight size={18} aria-hidden="true"/></>:<><LoaderCircle size={16} className="spin" aria-hidden="true"/>책을 준비하고 있어요</>}
   </button>
  </div>
 </div>;
}
