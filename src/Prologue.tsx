import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useT } from './i18n';
import type { Lang } from './locale';
import { url } from './base.ts';
/**
 * The prologue: once the intro film has opened the book (and paused, its cards still flat), the room dims and this tells the reader
 * what the book is. "책장 속으로" closes it and the cards stand up (Director.rise); how to read is shown on the book itself after that
 * (src/Guide.tsx). The button waits until the live book is ready behind it (phase PROLOGUE).
 * Taken in at a glance: the magazine's logo, the title, one line of what is inside, the button, set large with room between them.
 */
/** The words, whole per language: the subject coloured in the title; marked like a highlighter, the three things the chapters show, in
 *  their order (word order differs between the languages, so each is written out). "몬딱 담았수다" is Jeju for "we packed it all in". */
const WORDS:Record<Lang,{title:ReactNode;text:ReactNode}>={
 ko:{title:<><em>구좌 당근</em>, <span className="prologue-keep">몬딱 담았수다</span></>,
  text:<>구좌 당근이 <mark>자라는 이야기</mark>부터 <mark>색다른 먹거리</mark>, <br/>함께 만들어가는 <mark>오늘의 한 상</mark>까지</>},
 en:{title:<><em>Gujwa carrots</em>, <span className="prologue-keep">all packed in</span></>,
  text:<>From <mark>how Gujwa carrots grow</mark> to <mark>new ways to eat them</mark>, <br/>and <mark>today's table</mark> we set together</>},
 zh:{title:<><em>旧左胡萝卜</em>，满满装进来了</>,
  text:<>从旧左胡萝卜<mark>生长的故事</mark>到<mark>别样的美食</mark>，<br/>再到一起准备的<mark>今日餐桌</mark></>},
};
export default function Prologue({ready,closing,onStart}:{ready:boolean;closing:boolean;onStart:()=>void}){
 const start=useRef<HTMLButtonElement>(null);const {lang,t}=useT();const words=WORDS[lang];
 useEffect(()=>{if(ready)start.current?.focus({preventScroll:true});},[ready]);
 return <div className={'prologue'+(closing?' is-closing':'')} role="dialog" aria-modal="true" aria-labelledby="prologue-title">
  <div className="prologue-card">
   <img className="prologue-logo" src={url('/media/logo.webp')} alt="carrot" width={268} height={80}/>
   <h2 id="prologue-title">{words.title}</h2>
   <p className="prologue-text">{words.text}</p>
   <button ref={start} type="button" className="primary-button prologue-start" disabled={!ready} onClick={onStart}>
    {ready?<>{t('책장 속으로')}<ArrowRight size={20} aria-hidden="true"/></>:<><LoaderCircle size={18} className="spin" aria-hidden="true"/>{t('책을 준비하고 있어요')}</>}
   </button>
  </div>
 </div>;
}
