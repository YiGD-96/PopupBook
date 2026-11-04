/**
 * The game's sounds, synthesized (nothing to download): short blips, each kind rate-limited so a crowd of hits doesn't turn into noise.
 * They follow the book's own sound setting (src/soundPref.ts), so a reader who muted the book is not surprised here.
 */
import { useSoundPref } from '../soundPref.ts';
import type { Sfx } from './engine.ts';

let ctx:AudioContext|null=null;
export function unlockSfx(){
 try{const AudioCtx=window.AudioContext??(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;ctx??=new AudioCtx();void ctx.resume().catch(()=>{});}
 catch{ /* No Web Audio: the game is silent. */ }
}
const GAP:Record<Sfx,number>={hit:.06,gem:.05,kill:.07,coin:.08,hurt:.25,level:.3,chest:.5,heal:.4,boss:1,buy:.15};
const last:Partial<Record<Sfx,number>>={};
function tone(at:number,freq:number,to:number,dur:number,type:OscillatorType,vol:number){
 const c=ctx!,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);o.frequency.exponentialRampToValueAtTime(to,at+dur);
 g.gain.setValueAtTime(vol,at);g.gain.exponentialRampToValueAtTime(.0001,at+dur);o.connect(g).connect(c.destination);o.start(at);o.stop(at+dur+.02);
 o.onended=()=>{o.disconnect();g.disconnect();};
}
export function playSfx(kind:Sfx){
 if(!ctx||ctx.state!=='running'||!useSoundPref.getState().on)return;
 const t=ctx.currentTime;if((last[kind]??-9)+GAP[kind]>t)return;last[kind]=t;
 switch(kind){
  case 'hit':tone(t,260,180,.05,'square',.012);break;
  case 'kill':tone(t,520,300,.06,'triangle',.02);break;
  case 'gem':tone(t,900+Math.random()*200,1500,.05,'sine',.025);break;
  case 'coin':tone(t,1250,1250,.05,'square',.015);tone(t+.05,1660,1660,.08,'square',.015);break;
  case 'hurt':tone(t,180,80,.18,'sawtooth',.04);break;
  case 'heal':tone(t,520,1040,.3,'sine',.04);break;
  case 'buy':tone(t,660,660,.07,'triangle',.05);tone(t+.08,990,990,.12,'triangle',.05);break;
  case 'level':[523,659,784,1047].forEach((f,i)=>tone(t+i*.07,f,f,.16,'triangle',.05));break;
  case 'chest':[392,523,659,784,1047,1319].forEach((f,i)=>tone(t+i*.08,f,f,.2,'triangle',.05));break;
  case 'boss':tone(t,110,55,1.2,'sawtooth',.06);tone(t+.2,82,41,1.2,'sawtooth',.05);break;
 }
}
