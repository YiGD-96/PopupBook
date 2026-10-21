import { useEffect, useRef } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { SITE } from './site';
import { scenes } from './story';
/**
 * The prologue: once the intro film has opened the book (and paused, its cards still flat), the room dims and this tells the reader
 * what the book is. "책장 속으로" closes it and the cards stand up (Director.rise); how to read is shown on the book itself after that
 * (src/Guide.tsx). The button waits until the live book is ready behind it (phase PROLOGUE).
 * Few words on purpose: readers take in a title and a line or two before they act, and each further block stands between them and the
 * button. So: the title, the magazine's own line, one line that promises it is short, the contents (three chapters), the button.
 */
export default function Prologue({ready,closing,onStart}:{ready:boolean;closing:boolean;onStart:()=>void}){
 const start=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(ready)start.current?.focus({preventScroll:true});},[ready]);
 return <div className={'prologue'+(closing?' is-closing':'')} role="dialog" aria-modal="true" aria-labelledby="prologue-title">
  <div className="prologue-card">
   <span className="prologue-kicker">Prologue · {SITE.label}</span>
   <h2 id="prologue-title">{SITE.title}</h2>
   <p className="prologue-lead">{SITE.tagline[0]}<br/>{SITE.tagline[1]}<em>{SITE.tagline[2]}</em>{SITE.tagline[3]}</p>
   <p className="prologue-text">밭에서 식탁까지, 짧은 세 장면으로 만나요.</p>
   <ol className="prologue-chapters" aria-label="목차">{scenes.map((scene,index)=><li key={scene.id}><span>0{index+1}</span>{scene.title}</li>)}</ol>
   <button ref={start} type="button" className="primary-button prologue-start" disabled={!ready} onClick={onStart}>
    {ready?<>책장 속으로<ArrowRight size={18} aria-hidden="true"/></>:<><LoaderCircle size={16} className="spin" aria-hidden="true"/>책을 준비하고 있어요</>}
   </button>
  </div>
 </div>;
}
