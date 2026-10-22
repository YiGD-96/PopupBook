import { create } from 'zustand';
import { url } from './base.ts';
/** PROLOGUE: the book lies open with its cards folded flat under the prologue (src/Prologue.tsx), until the reader starts reading. */
export type Phase = 'INIT'|'COVER'|'LOADING_PAGE'|'PROLOGUE'|'OPENING_POPUP'|'EXPLORING'|'DRAGGING_PAGE'|'TURNING_PAGE'|'ENDING'|'ERROR';
/** A pop-up card. `detail` makes it clickable: it opens that entry of src/details.ts in the side panel. `phone` places it in the
 *  standing book on phones (src/standingLayout.ts: x across, z depth from the binding, `lift` above the page for a card standing on
 *  another, like a dish on the table); without it the place is derived. On the open book `position[1]` is the card's foot. */
/** `on`: the id of the card this one stands on (a dish on the table): it folds with that card instead of on its own (src/popupStack.ts). */
export type Layer = { id:string; src:string; position:[number,number,number]; size:[number,number]; interactive?:boolean; detail?:string; on?:string; phone?:{x:number;z:number;size:[number,number];lift?:number;/** Meets the flat page's side edge on purpose (no margin). */edge?:boolean}; /** Left out of the phone's standing book (the open book keeps it). */phoneHidden?:boolean; /** The least width of a clickable card's glow on the phone's standing book, in world units (src/cardHalo.ts): a card shown too small there to carry the usual rim. */glow?:number; /** Another picture for the phone's standing book (the card's own src is kept as its name). */phoneSrc?:string };
const clickable=(layer:Omit<Layer,'interactive'>&{detail:string}):Layer=>({...layer,interactive:true});
// Three chapters following the web magazine "당근을 따라, 구좌": the farmer, the people who cook, and menus & recipes.
// The first version's chapters are kept in _archive/scenes-v1. Sizes keep each texture's proportions (width : height).
export const scenes = [
 {id:'farmer',title:'구좌 당근, 맛의 시작',stage:'farm-floor-stage',halo:{color:'#ff9418',boost:2.4,rest:.7,seen:.32},paper:'#ffe4cd',english:'01 · FARMER',intro:'검은 화산토와 겨울 바람이 키운 당근.\n밭에서 시작되는 이야기예요.',dialog:'“겨울을 제대로 맞아야 진짜 맛이 들어요.” 농부님, 당근 상자, 헛간에 걸린 파리채와 손전등을 눌러 보세요.',label:'농부님 이야기 보기',color:'#96a780',detail:'farmer',layers:[
  // Painted layers (GPT, art-src/gpt/page-1/new → scripts/prepare-gpt-art.mjs), laid out after the sketch 전체화면.png: a sunny view over
  // Gujwa's oreum and wind turbines, and in front of it the farmyard. The page itself is the yard: one painting of a muddy path with
  // basalt rubble and three small boot prints, printed on the page
  // (scripts/farm-floor.mjs; on the phone the flat page carries it as its `stage` texture). The tool shed stands on the left page with the
  // fly swatter and torch for the night rounds on a free hook of its wall (glued to it, so it folds with the shed), the farmer and the
  // crate of carrots on the right.
  {id:'back',src:'farm-back',phoneSrc:'farm-back-phone',position:[0,.24,-1.7],size:[6.9,2.636]},
  {id:'shed',src:'farm-shed',position:[-1.8,.27,.45],size:[3.1,2.125],phone:{x:-1.1,z:1.3,size:[2.4,1.645]}},
  clickable({id:'swatter',on:'shed',src:'farm-swatter',glow:.1,position:[-2,.73,.49],size:[.42,.866],detail:'night-watch',phone:{x:-1.24,z:1.34,size:[.31,.639],lift:.39}}),
  // The carrot field in morning light behind a Jeju basalt wall (art-src/gpt/page-1/new/당근밭-제주현무암재배치-직각윤곽-1500x450.png)
  // runs behind the farmer and the crate from behind the shed to the right page's outer edge: the wall's lower right corner meets the
  // corner of the page as the reader sees it (open book: right end 3.42, a little inside the page's 3.55 width, since the page dips at
  // its outer edge and the card's foot stands above it; phone: 1.075 + 1.3 = 2.375, half the page's height).
  {id:'carrots',src:'farm-carrots',position:[1.27,.27,.3],size:[4.3,1.319],phone:{x:1.075,z:1.15,size:[2.6,.798],edge:true}},
  // The farmer has a contact shadow baked under his boots, so his card is a little taller: foot y = 0.255 minus that padding.
  clickable({id:'farmer',src:'char-farmer',position:[.75,.16,1.1],size:[1.227,2.45],detail:'farmer',phone:{x:.4,z:2.15,size:[1.102,2.2]}}),
  // A Jeju dog asleep at the farmer's feet (decor): beside his boots on the open book, in front of them on the phone. A soft shadow is baked
  // under it, so its foot is a little lower.
  {id:'dog',src:'farm-dog',position:[-.16,.21,1.38],size:[1.178,.781],phone:{x:.2,z:3.2,size:[1.368,.908]}},
  clickable({id:'crate',src:'farm-crate',position:[1.9,.285,1.68],size:[1.3,1.061],detail:'harvest',phone:{x:1.6,z:2.5,size:[1.1,.898]}})
 ] as Layer[]},
 {id:'cooks',title:'구좌 당근, 색다른 변신',stage:'village-floor-stage',paper:'#fff6e3',english:'02 · PEOPLE WHO COOK',intro:'구좌 당근으로 새로운 맛을 만드는\n식당 사장님들을 만났어요.',dialog:'세 곳의 식당이 구좌 당근으로 저마다의 한 접시를 만들어요. 가게를 눌러 이야기를 펼쳐 보세요.',label:'식당 이야기 보기',color:'#b89970',detail:'cook-01',layers:[
  // Painted layers (GPT, art-src/gpt/page-2 → scripts/prepare-gpt-art.mjs): a Gujwa seaside village in late morning, back to front. The page
  // itself is the street (a winding path of small cobbles printed on the page, scripts/create-pages.mjs; on the phone the flat
  // page carries it as its `stage` texture): the three real shops are drawn turned toward the middle of the street, buggercarrot at the left
  // end, manoa behind it, sonongroad at the right, and the traveler and a mother with her daughter and a stroller walk down the open middle,
  // where the painted sea shows at the end. Each shop is wholly on one page. A thing standing on the page has a contact shadow baked under its
  // foot, so its card is a little taller: foot y = 0.255 minus that padding.
  {id:'back',src:'village-back',position:[0,.24,-1.7],size:[6.8,2.72]},
  clickable({id:'shop-b',src:'manoa',position:[-1.02,.255,-1],size:[1.8,1.487],detail:'cook-02',phone:{x:-.25,z:.3,size:[1.9,1.569]}}),
  clickable({id:'shop-c',src:'buggercarrot',position:[-2.1,.255,1.6],size:[2.09,2.973],detail:'cook-03',phone:{x:-1.38,z:2.4,size:[1.85,2.632]}}),
  clickable({id:'shop-a',src:'sonongroad',position:[1.85,.255,.15],size:[3.24,2.813],detail:'cook-01',phone:{x:1.25,z:1.5,size:[2.1,1.823]}}),
  {id:'traveler',src:'char-traveler',position:[-1,.215,2],size:[.68,1.518],phoneHidden:true,phone:{x:-.75,z:2.4,size:[.55,1.228]}},
  {id:'family',src:'family-walk',position:[.95,.2,2.05],size:[1.8,1.55],phone:{x:.55,z:3.1,size:[1.5,1.29]}}
 ] as Layer[]},
 {id:'recipes',title:'구좌 당근, 식탁 위의 발견',stage:'kitchen-floor-stage',paper:'#ffe9d2',english:'03 · MENU & RECIPE',intro:'식당의 당근 메뉴와\n집에서 따라 하는 레시피를 모았어요.',dialog:'냉장고 문에 당근 뇨끼, 당근 김밥, 당근 치즈전 레시피가 붙어 있어요. 메모를 눌러 레시피 포스터를 보고, 빈 메모나 식탁 위 나만의 레시피 책을 눌러 여러분의 당근 레시피도 보내 주세요.',label:'레시피 보기',color:'#81a69c',detail:'poster-gnocchi',layers:[
  // Painted layers (GPT, art-src/gpt/page-3/new/new2 → scripts/prepare-gpt-art.mjs): a Jeju kitchen wall with a window on the evening sea, an
  // old fridge on the left page with four magnet notes on its door (glued to it, so they fold with it), and a low table at the right front with
  // the "나만의 레시피" book lying on its left end (glued to the table). The gnocchi, gimbap and cheese-jeon notes open their recipe posters
  // (src/PosterBook.tsx); the blank note and the book ask readers to send their own recipe. The fridge (a soft box) and the table (a soft oval) have contact shadows
  // baked under their feet, so their cards stand a little lower than the page.
  // The wall is cropped twice from one painting (scripts/prepare-gpt-art.mjs): from below the lamp's cord in the open book; on the phone all of
  // it, widened with its own plaster so it is barely zoomed. The floor is honey-oak boards printed on the page (scripts/kitchen-floor.mjs: both
  // pages in the open book, lighter under the printed words as on chapters 1–2; the `stage` floor on the phone). The fridge stands at the front of the left page, its feet just behind the
  // printed title, as tall as the open book allows (its top just below the chapter heading, and inside the frame while a page turns).
  {id:'back',src:'kitchen-back',phoneSrc:'kitchen-back-phone',position:[0,.24,-1.7],size:[6.45,2.952]},
  {id:'fridge',src:'kitchen-fridge',position:[-1.65,.144,1.55],size:[1.706,3.693],phone:{x:-1.05,z:2.2,size:[1.809,3.915]}},
  // The notes run down the door in a loose zigzag (left, right, left, further right), large, the first two overlapping at a corner; each
  // later one stands a hair in front so overlaps stack in reading order.
  clickable({id:'magnet-gnocchi',on:'fridge',src:'magnet-gnocchi',position:[-1.69,2.623,1.59],size:[.72,.627],detail:'poster-gnocchi',phone:{x:-1.175,z:2.24,size:[.66,.575],lift:2.725}}),
  clickable({id:'magnet-gimbap',on:'fridge',src:'magnet-gimbap',position:[-1.25,2.174,1.6],size:[.72,.626],detail:'poster-gimbap',phone:{x:-.655,z:2.25,size:[.66,.573],lift:2.275}}),
  clickable({id:'magnet-cheese-jeon',on:'fridge',src:'magnet-cheese-jeon',position:[-1.67,1.613,1.61],size:[.72,.627],detail:'poster-jeon',phone:{x:-1.145,z:2.26,size:[.66,.575],lift:1.755}}),
  clickable({id:'magnet-blank',on:'fridge',src:'magnet-blank',position:[-1.22,.998,1.62],size:[.72,.662],detail:'recipe-share',phone:{x:-.595,z:2.27,size:[.66,.607],lift:1.143}}),
  {id:'table',src:'kitchen-table-low',position:[1.75,.14,1.0],size:[2.7,1.563],phone:{x:1.0,z:2.55,size:[2.1,1.215]}},
  clickable({id:'recipe-book',on:'table',src:'my-recipe-book',position:[1.45,.7,1.1],size:[1.1,.801],detail:'recipe-share',phone:{x:.55,z:2.61,size:[.95,.692],lift:.47}})
 ] as Layer[]}
];
type StoryState = {phase:Phase;chapter:number;dialog:boolean;detail:string|null;visited:number[];audioReady:boolean;introPagesTurned:number;error:string|null;set:(patch:Partial<StoryState>)=>void};
export const useStory = create<StoryState>(set=>({phase:'INIT',chapter:0,dialog:false,detail:null,visited:[],audioReady:false,introPagesTurned:0,error:null,set:patch=>set(patch)}));
let audioContext:AudioContext|null=null;
let audioUnlock:Promise<void>|null=null;
export function unlockAudio(){
 if(audioContext?.state==='running')return;
 if(audioUnlock){void audioContext?.resume().catch(()=>{});return;}
 try{
  const AudioCtx=window.AudioContext??(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;
  audioContext??=new AudioCtx();
  audioContext.onstatechange=()=>useStory.getState().set({audioReady:audioContext?.state==='running'});
  audioUnlock=audioContext.resume().then(()=>{useStory.getState().set({audioReady:audioContext?.state==='running'});}).catch(()=>{}).finally(()=>{audioUnlock=null;});
  void loadPageTurn(audioContext);
 }catch{ /* Audio is optional on browsers without Web Audio. */ }
}
/** Pink noise (Paul Kellet's filter), made once per audio context: the raw material of every paper sound. */
let paperNoise:AudioBuffer|null=null;
function noiseFor(ctx:BaseAudioContext){
 if(paperNoise&&paperNoise.sampleRate===ctx.sampleRate)return paperNoise;
 const length=Math.floor(ctx.sampleRate*1.6),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
 let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
 for(let i=0;i<length;i++){const w=Math.random()*2-1;b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;data[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.11;b6=w*.115926;}
 return paperNoise=buffer;
}
/**
 * A sheet of heavy, fine paper turning, synthesized (no file to download): an airy swish that swells as the sheet travels, crisp grains
 * where the paper flexes as it lifts and settles, and a soft low landing. `length` is the turn in seconds; `level` scales it (the intro's
 * quick fanned pages are short and quiet).
 */
export function paperTurn(ctx:BaseAudioContext,length:number,level:number){
 const t0=ctx.currentTime+.01,noise=noiseFor(ctx),out=ctx.createGain();out.gain.value=level;out.connect(ctx.destination);
 const nodes:AudioNode[]=[out];
 const source=(offset:number,duration:number)=>{const n=ctx.createBufferSource();n.buffer=noise;n.start(t0+offset,Math.random()*(noise.duration-duration-.05),duration);nodes.push(n);return n;};
 // Swish: band-passed air whose pitch rises as the sheet sweeps up and falls as it comes down.
 const swish=source(0,length),band=ctx.createBiquadFilter(),air=ctx.createGain();band.type='bandpass';band.Q.value=.7;
 band.frequency.setValueAtTime(900,t0);band.frequency.exponentialRampToValueAtTime(2600,t0+length*.45);band.frequency.exponentialRampToValueAtTime(700,t0+length);
 air.gain.setValueAtTime(0,t0);air.gain.linearRampToValueAtTime(.05,t0+length*.12);air.gain.linearRampToValueAtTime(.085,t0+length*.45);air.gain.linearRampToValueAtTime(.03,t0+length*.8);air.gain.linearRampToValueAtTime(0,t0+length);
 swish.connect(band).connect(air).connect(out);nodes.push(band,air);
 // Grain: crisp high crackles, bunched where the paper bends (lifting off, settling down).
 const crisp=source(0,length),high=ctx.createBiquadFilter(),grains=ctx.createGain();high.type='highpass';high.frequency.value=4200;grains.gain.setValueAtTime(0,t0);
 const count=Math.round(6+length*10);
 const times=Array.from({length:count},(_,i)=>{const r=Math.random(),band=i%3;return length*(band===0?r*.25:band===1?.7+r*.25:.25+r*.45);}).sort((a,b)=>a-b);
 times.forEach(t=>{const at=t0+t,peak=.02+Math.random()*.045;grains.gain.setValueAtTime(0,at);grains.gain.linearRampToValueAtTime(peak,at+.004);grains.gain.exponentialRampToValueAtTime(.0001,at+.018+Math.random()*.03);});
 crisp.connect(high).connect(grains).connect(out);nodes.push(high,grains);
 // Landing: a soft, low pat as the sheet lies down.
 const land=source(length*.86,.2),low=ctx.createBiquadFilter(),pat=ctx.createGain();low.type='lowpass';low.frequency.value=520;
 const at=t0+length*.86;pat.gain.setValueAtTime(0,at);pat.gain.linearRampToValueAtTime(.09,at+.012);pat.gain.exponentialRampToValueAtTime(.0001,at+.16);
 land.connect(low).connect(pat).connect(out);nodes.push(low,pat);
 window.setTimeout(()=>nodes.forEach(node=>{try{node.disconnect();}catch{ /* already gone */ }}),(length+.4)*1000);
}
/** A real book page turning: a soft rustle as the sheet lifts, then a crisp flick as it lands (Voltiment555, "Book Flip Sounds",
 *  BookFlip9, CC0, opengameart.org/content/book-flip-sounds; trimmed and normalized to 14 KB). Fetched and decoded off the main thread
 *  once audio is unlocked; until then the synthesized turn above stands in. */
const PAGE_TURN_FLICK=.55;
let pageTurn:AudioBuffer|null=null,pageTurnLoad:Promise<void>|null=null;
function loadPageTurn(ctx:BaseAudioContext){
 pageTurnLoad??=fetch(url('/media/page-turn.mp3')).then(response=>response.arrayBuffer()).then(data=>ctx.decodeAudioData(data)).then(buffer=>{pageTurn=buffer;}).catch(()=>{pageTurnLoad=null;});
 return pageTurnLoad;
}
function playClip(ctx:BaseAudioContext,buffer:AudioBuffer,offset:number,level:number,rate:number,duration?:number){
 const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.playbackRate.value=rate;gain.gain.value=level;
 source.connect(gain).connect(ctx.destination);source.start(ctx.currentTime+.005,offset,duration);source.onended=()=>{source.disconnect();gain.disconnect();};
}
/** 'page': a page turn; 'flip': one of the intro film's quick fanned pages (the flick alone); 'hello': a soft chime when a story opens. */
export function playSound(kind:'page'|'flip'|'hello') {
 const emit=()=>{const ctx=audioContext;if(!ctx||ctx.state!=='running')return;
  try {
   // A touch of speed variation keeps repeated turns from sounding identical.
   if(kind==='page'){if(pageTurn)playClip(ctx,pageTurn,0,1.4,.97+Math.random()*.06);else paperTurn(ctx,1.1,3);return;}
   if(kind==='flip'){if(pageTurn)playClip(ctx,pageTurn,PAGE_TURN_FLICK,.7,1.02+Math.random()*.1,.5);else paperTurn(ctx,.42,2);return;}
   const gain=ctx.createGain();gain.connect(ctx.destination);gain.gain.setValueAtTime(.035,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.4);const osc=ctx.createOscillator();osc.type='sine';osc.frequency.setValueAtTime(523,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(784,ctx.currentTime+.3);osc.connect(gain);osc.start();osc.stop(ctx.currentTime+.4);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }catch{ /* Keep the book usable if audio is interrupted. */ }
 };
 if(audioContext?.state==='running')emit();else if(audioUnlock)void audioUnlock.then(emit);
}
/** `reveal(standingFilmed, hold)`: standingFilmed is true when the intro played the phone film, which ends on the standing book; with
 *  `hold` the book waits open with its cards flat (PROLOGUE) and `rise` stands them up when the reader starts. */
export interface Director {reveal:(standingFilmed?:boolean,hold?:boolean)=>void;rise:()=>void;go:(chapter:number)=>void;finish:()=>void;interact:(detail?:string)=>void;retry:()=>void;previewTurn:(direction:1|-1,progress:number)=>boolean;settleTurn:(commit:boolean)=>void;
 /** Where a clickable card is on screen (CSS pixels, viewport): the spread's main story card, or the one with `detail`. */
 locate?:(detail?:string)=>{x:number;y:number;width:number;height:number}|null;
 /** The spread's clickable cards blink again (after the reading guide). */
 highlight?:()=>void}
