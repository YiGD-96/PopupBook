import { create } from 'zustand';
export type Phase = 'INIT'|'COVER'|'LOADING_PAGE'|'OPENING_POPUP'|'EXPLORING'|'DRAGGING_PAGE'|'CLOSING_POPUP'|'TURNING_PAGE'|'ENDING'|'ERROR';
export type Layer = { id:string; src:string; position:[number,number,number]; size:[number,number]; interactive?:boolean };
export const scenes = [
 {id:'gujwa',title:'당근밭의 아침',place:'제주 구좌',english:'A MORNING IN GUJWA',intro:'햇살이 내려앉은 당근밭.\n작은 당근 친구와 첫 인사를 나눠요.',dialog:'“안녕! 나는 당근이야. 오늘은 조금 천천히 걸어볼까? 바람이 들려주는 이야기를 함께 들어봐.”',label:'당근 친구에게 인사하기',hint:'당근 친구를 톡, 눌러보세요',color:'#96a780',layers:[
  {id:'hills',src:'hills',position:[0,.24,-1.65],size:[7.1,2.5]},
  {id:'field',src:'field',position:[0,.25,-.5],size:[7,1.4]},
  {id:'wall',src:'wall',position:[-.55,.26,.25],size:[5.7,.8]},
  {id:'flowers',src:'flowers',position:[.1,.27,1.5],size:[6.3,1.15]},
  {id:'carrot',src:'carrot',position:[.7,.28,.95],size:[1.05,1.35],interactive:true}
 ] as Layer[]},
 {id:'village',title:'골목에 머무는 오후',place:'제주 마을',english:'AN AFTERNOON IN THE VILLAGE',intro:'낮은 돌담 너머로 번지는 귤 향기.\n오늘은 이름 없는 골목도 좋아요.',dialog:'“서두르지 않아도 괜찮아. 이 골목에서는 바람도 쉬어 가거든. 나무 아래서 잠깐 귤 향기를 맡아봐.”',label:'감귤나무의 이야기 듣기',hint:'감귤나무를 톡, 눌러보세요',color:'#b89970',layers:[
  {id:'village',src:'village',position:[0,.24,-1.5],size:[7.1,2.55]},
  {id:'alley',src:'alley',position:[0,.25,-.05],size:[7,1.45]},
  {id:'tree',src:'tree',position:[1.8,.26,.45],size:[1.9,2.5],interactive:true},
  {id:'flowers',src:'flowers',position:[-1.5,.27,1.55],size:[3.3,.8]},
  {id:'carrot',src:'carrot',position:[-.6,.28,.9],size:[.8,1.05]}
 ] as Layer[]},
 {id:'coast',title:'바다가 건네는 인사',place:'제주 해안',english:'A MOMENT BY THE SEA',intro:'이야기의 끝에서 만난 푸른 바다.\n마음에 작은 빛 하나를 담아가요.',dialog:'“멀리 가지 않아도 새로운 풍경은 있어. 오늘의 작은 여행이 너의 하루에도 오래도록 따뜻한 빛이 되기를.”',label:'등대의 작은 빛 켜기',hint:'등대를 톡, 눌러보세요',color:'#81a69c',layers:[
  {id:'sea',src:'sea',position:[0,.24,-1.65],size:[7.2,2.35]},
  {id:'coast',src:'coast',position:[0,.25,-.15],size:[7.1,1.65]},
  {id:'lighthouse',src:'lighthouse',position:[1.6,.26,.3],size:[1.4,2.8],interactive:true},
  {id:'grasses',src:'grasses',position:[0,.27,1.7],size:[6.8,1]},
  {id:'carrot',src:'carrot',position:[-1.05,.28,1],size:[.8,1.1]}
 ] as Layer[]}
];
type StoryState = {phase:Phase;chapter:number;dialog:boolean;visited:number[];audioReady:boolean;introPagesTurned:number;error:string|null;fps:number;set:(patch:Partial<StoryState>)=>void};
export const useStory = create<StoryState>(set=>({phase:'INIT',chapter:0,dialog:false,visited:[],audioReady:false,introPagesTurned:0,error:null,fps:0,set:patch=>set(patch)}));
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
 }catch{ /* Audio is optional on browsers without Web Audio. */ }
}
export function playSound(kind:'page'|'hello') {
 const emit=()=>{const ctx=audioContext;if(!ctx||ctx.state!=='running')return;
  try {const gain=ctx.createGain();gain.connect(ctx.destination);gain.gain.setValueAtTime(.035,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.4);const osc=ctx.createOscillator();osc.type='sine';osc.frequency.setValueAtTime(kind==='hello'?523:280,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(kind==='hello'?784:140,ctx.currentTime+.3);osc.connect(gain);osc.start();osc.stop(ctx.currentTime+.4);osc.onended=()=>{osc.disconnect();gain.disconnect();};}catch{ /* Keep the book usable if audio is interrupted. */ }
 };
 if(audioContext?.state==='running')emit();else if(audioUnlock)void audioUnlock.then(emit);
}
export interface Director {reveal:()=>void;go:(chapter:number)=>void;finish:()=>void;interact:()=>void;retry:()=>void;previewTurn:(direction:1|-1,progress:number)=>boolean;settleTurn:(commit:boolean)=>void}
