import { create } from 'zustand';
export type Phase = 'INIT'|'COVER'|'LOADING_PAGE'|'OPENING_POPUP'|'EXPLORING'|'DRAGGING_PAGE'|'TURNING_PAGE'|'ENDING'|'ERROR';
/** A pop-up card. `detail` makes it clickable: it opens that entry of src/details.ts in the side panel. `phone` places it in the
 *  standing book on phones (src/standingLayout.ts: x across, z depth from the binding, `lift` above the page for a card standing on
 *  another, like a dish on the table); without it the place is derived. On the open book `position[1]` is the card's foot. */
export type Layer = { id:string; src:string; position:[number,number,number]; size:[number,number]; interactive?:boolean; detail?:string; phone?:{x:number;z:number;size:[number,number];lift?:number} };
const clickable=(layer:Omit<Layer,'interactive'>&{detail:string}):Layer=>({...layer,interactive:true});
// Three chapters following the web magazine "당근을 따라, 구좌": the farmer, the people who cook, and menus & recipes.
// The first version's chapters are kept in _archive/scenes-v1. Sizes keep each texture's proportions (width : height).
export const scenes = [
 {id:'farmer',title:'구좌를 길러내는 묵묵한 방식',paper:'#ffe4cd',english:'01 · FARMER',intro:'검은 화산토와 겨울 바람이 키운 당근.\n밭에서 시작되는 이야기예요.',dialog:'“겨울을 제대로 맞아야 진짜 맛이 들어요.” 농부님과 당근 바구니를 눌러 보세요.',label:'농부님 이야기 보기',color:'#96a780',detail:'farmer',layers:[
  // Painted layers (GPT, art-src/gpt/page-1 → scripts/prepare-gpt-art.mjs): dusk over Gujwa, back to front. Sizes keep each texture's aspect.
  {id:'back',src:'farm-back',position:[0,.24,-1.7],size:[6.9,2.72]},
  // The windbreaks stand at the very front, inside the page, and frame the scene; the field comes forward and the rest gathers in the
  // middle in rows (pony and farmer, the low wall, the crate and lantern). The phone layout keeps the same rows.
  {id:'trees-left',src:'farm-trees-left',position:[-2.25,.29,2],size:[2,2.95],phone:{x:-1.53,z:2.95,size:[1.56,2.3]}},
  {id:'trees-right',src:'farm-trees-right',position:[2.3,.29,2],size:[1.81,2.95],phone:{x:1.6,z:2.95,size:[1.42,2.3]}},
  {id:'field',src:'farm-field',position:[0,.25,.45],size:[6.6,1.85],phone:{x:0,z:1.05,size:[4.63,1.29]}},
  {id:'pony',src:'char-pony',position:[-1.25,.255,.6],size:[1.4,1.15],phone:{x:-.55,z:1.2,size:[1.14,.94]}},
  clickable({id:'farmer',src:'char-farmer',position:[1.05,.27,.9],size:[1.3,2.37],detail:'farmer',phone:{x:.75,z:1.55,size:[1.14,2.08]}}),
  {id:'wall',src:'farm-wall',position:[-.2,.28,1.3],size:[2.6,.75],phone:{x:-.1,z:1.95,size:[2.4,.68]}},
  clickable({id:'crate',src:'farm-crate',position:[-.92,.285,1.72],size:[1.55,1.02],detail:'harvest',phone:{x:-.75,z:2.4,size:[1.44,.95]}}),
  clickable({id:'lantern',src:'farm-lantern',position:[1.55,.285,1.7],size:[.75,1.49],detail:'night-watch',phone:{x:1.25,z:2.3,size:[.6,1.2]}})
 ] as Layer[]},
 {id:'cooks',title:'구좌를 맛보는 다채로운 방식',paper:'#fff6e3',english:'02 · PEOPLE WHO COOK',intro:'구좌 당근으로 새로운 맛을 만드는\n식당 사장님들을 만났어요.',dialog:'세 곳의 식당이 구좌 당근으로 저마다의 한 접시를 만들어요. 가게를 눌러 이야기를 펼쳐 보세요.',label:'식당 이야기 보기',color:'#b89970',detail:'cook-01',layers:[
  // Painted layers (GPT, art-src/gpt/page-2 → scripts/prepare-gpt-art.mjs): a Gujwa seaside village in late morning, back to front.
  // The hackberry frames the scene at the front left, the basalt wall with the carrot cart at the front right; the three restaurants
  // stand in one row, each wholly on one page, so all of them show.
  {id:'back',src:'village-back',position:[0,.24,-1.7],size:[6.8,2.72]},
  {id:'tree-left',src:'village-tree-left',position:[-2.45,.29,2.05],size:[1.9,2.75],phone:{x:-1.53,z:2.95,size:[1.56,2.26]}},
  {id:'lane',src:'village-lane',position:[0,.25,-.75],size:[6.6,1.85],phone:{x:0,z:.6,size:[4.63,1.3]}},
  clickable({id:'shop-a',src:'shop-a',position:[-1.25,.255,-.05],size:[1.9,1.26],detail:'cook-01',phone:{x:-1.41,z:1.35,size:[1.8,1.19]}}),
  clickable({id:'shop-b',src:'shop-b',position:[1.08,.255,-.05],size:[1.9,1.27],detail:'cook-02',phone:{x:0,z:1.35,size:[1.8,1.2]}}),
  clickable({id:'shop-c',src:'shop-c',position:[2.66,.255,0],size:[1.25,1.27],detail:'cook-03',phone:{x:1.55,z:1.4,size:[1.32,1.34]}}),
  {id:'traveler',src:'char-traveler',position:[-.85,.275,1.2],size:[.7,1.5],phone:{x:-.55,z:2.2,size:[.66,1.42]}},
  {id:'front',src:'village-front',position:[2.05,.285,1.85],size:[2.2,1.02],phone:{x:1.2,z:2.8,size:[2.22,1.03]}}
 ] as Layer[]},
 {id:'recipes',title:'구좌를 요리하는 가장 쉬운 방식',paper:'#ffe9d2',english:'03 · MENU & RECIPE',intro:'식당의 당근 메뉴와\n집에서 따라 하는 레시피를 모았어요.',dialog:'접시마다 메뉴와 레시피가 담겨 있어요. 궁금한 요리를 눌러 보세요.',label:'레시피 보기',color:'#81a69c',detail:'recipe-01',layers:[
  // Painted layers (GPT, art-src/gpt/page-3 → scripts/prepare-gpt-art.mjs): an evening kitchen, back to front. The racks stand back by
  // the wall; the table runs along the very front and the food is set out on it: each dish stands just in front of the table card with
  // its foot on the painted tabletop (about 0.6–0.83 of the table's height), a raised back row and a lower front row in its gaps. Home
  // recipes on the left page, restaurant menus on the right, each dish wholly on its page.
  {id:'back',src:'kitchen-back',position:[0,.24,-1.7],size:[6.6,2.73]},
  {id:'rack-left',src:'kitchen-left',position:[-2.75,.26,-1],size:[1.42,2.5],phone:{x:-1.74,z:.45,size:[1.15,2.04]}},
  {id:'rack-right',src:'kitchen-right',position:[2.78,.26,-1],size:[1.33,2.5],phone:{x:1.77,z:.45,size:[1.08,2.04]}},
  {id:'table',src:'kitchen-table',position:[0,.27,1.55],size:[6.4,1.56],phone:{x:0,z:3.12,size:[4.6,1.12]}},
  clickable({id:'pickle',src:'dish-pickle',position:[-2.75,1.42,1.6],size:[.65,1.07],detail:'recipe-03',phone:{x:-1.78,z:3.17,size:[.6,.98],lift:.84}}),
  clickable({id:'soup',src:'dish-soup',position:[-1.45,1.42,1.6],size:[1.15,.78],detail:'recipe-02',phone:{x:-.95,z:3.17,size:[1.05,.71],lift:.84}}),
  clickable({id:'plate',src:'dish-plate',position:[1.45,1.42,1.6],size:[1.2,.83],detail:'menu-01',phone:{x:.95,z:3.17,size:[1.1,.76],lift:.84}}),
  clickable({id:'juice',src:'dish-juice',position:[2.7,1.42,1.6],size:[.8,1.15],detail:'menu-02',phone:{x:1.8,z:3.17,size:[.72,1.03],lift:.84}}),
  clickable({id:'rape',src:'dish-rape',position:[-2.3,1.25,1.68],size:[1.1,.81],detail:'recipe-01',phone:{x:-1.5,z:3.23,size:[1,.74],lift:.7}}),
  {id:'board',src:'kitchen-front',position:[0,1.25,1.68],size:[1.9,.68],phone:{x:0,z:3.23,size:[1.6,.57],lift:.7}},
  clickable({id:'burger',src:'dish-burger',position:[2.25,1.25,1.68],size:[1,.84],detail:'menu-03',phone:{x:1.5,z:3.23,size:[.95,.8],lift:.7}})
 ] as Layer[]}
];
type StoryState = {phase:Phase;chapter:number;dialog:boolean;detail:string|null;visited:number[];audioReady:boolean;introPagesTurned:number;error:string|null;fps:number;set:(patch:Partial<StoryState>)=>void};
export const useStory = create<StoryState>(set=>({phase:'INIT',chapter:0,dialog:false,detail:null,visited:[],audioReady:false,introPagesTurned:0,error:null,fps:0,set:patch=>set(patch)}));
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
 pageTurnLoad??=fetch('/media/page-turn.mp3').then(response=>response.arrayBuffer()).then(data=>ctx.decodeAudioData(data)).then(buffer=>{pageTurn=buffer;}).catch(()=>{pageTurnLoad=null;});
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
/** `reveal(standingFilmed)`: true when the intro played the phone film, which ends on the standing book. */
export interface Director {reveal:(standingFilmed?:boolean)=>void;go:(chapter:number)=>void;finish:()=>void;interact:(detail?:string)=>void;retry:()=>void;previewTurn:(direction:1|-1,progress:number)=>boolean;settleTurn:(commit:boolean)=>void}
