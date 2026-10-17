/**
 * The intro film, staged with the live book's own parts and rendered frame by frame by scripts/render-intro.mjs.
 * Because both use the same meshes, materials and camera, the film's last frame is the live book's first.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Canvas, advance, useThree } from '@react-three/fiber';
import { CanvasTexture, Color, DoubleSide, Euler, SRGBColorSpace, type PerspectiveCamera, type Texture } from 'three';
import { loadScene, loadTexture } from './assets';
import { scenes } from './story';
import { SITE } from './site';
import { artSource } from './artSource';
import { BOOK_CAMERA_POSITION, BOOK_FRAME_HEIGHT, BOOK_FRAME_WIDTH, BOOK_TARGET_Y, bookFov } from './bookView';
import { BOOK_BOARD, BOOK_PAGES, BOOK_SPINE } from './bookStructure';
import { INTRO_COVER_HOLD, INTRO_DURATION, INTRO_PAGE_COUNT, INTRO_PAGES_START, INTRO_PAGE_STAGGER, INTRO_PAGE_TURN, INTRO_UI_AT } from './introPlayback';
import { BLOCK_X, BindingDetails, Board, OPEN_BOOK_MATERIALS, PaperBlock, PrintedPage, TurningPage, createCardGeometry, useDisposable, type BookMaterials } from './bookParts';
import { BOOK_HINGE_Y, createBoardGeometry, createPaperBlockGeometry, createSpineGeometry } from './bookGeometry';
import { splitPaperArt, type PaperPiece } from './paperAttachments';
import type { Layer } from './story';
import { FILM_FONT as FONT, TurnedMesh, ease, smooth } from './filmParts';
import { StandingFilm, loadStandingAssets, standingFilmMeta, type StandingAssets } from './standingFilm';
import { STANDING_FILM_ASPECT } from './standingMedia';

const params=new URLSearchParams(location.search);
/** ?mode=standing films the phone intro (src/standingFilm.tsx), portrait; otherwise the open book's. */
const STANDING=params.get('mode')==='standing';
const FILM_WIDTH=Number(params.get('width')||(STANDING?720:968)),FILM_HEIGHT=Math.round(FILM_WIDTH*(STANDING?1/STANDING_FILM_ASPECT:BOOK_FRAME_HEIGHT/BOOK_FRAME_WIDTH)/2)*2;

/** Everything the film shows at time t (seconds). The closed book stands for INTRO_COVER_HOLD (the magazine's cover moving on it),
 *  then the cover opens while the book is still settling, without a pause. */
function timeline(t:number){
 const moving=t-INTRO_COVER_HOLD,lowering=ease(moving/1.4),open=ease((moving-.12)/1.43);
 // Pressed-flat sheets relax into their open swell as the first half lifts away.
 return {lowering,open,rootX:-BOOK_BOARD.x*(1-open),left:smooth((open-.5)/.5),swell:smooth(open/.55),
  tilt:1.04*(1-lowering),yaw:-.19*(1-lowering),lift:(BOOK_TARGET_Y+.08)*(1-lowering),scale:.88+.12*lowering,
  pages:Array.from({length:INTRO_PAGE_COUNT},(_,i)=>smooth((t-INTRO_PAGES_START-i*INTRO_PAGE_STAGGER)/INTRO_PAGE_TURN)),
  scenery:t>=INTRO_UI_AT?t-INTRO_UI_AT:-1};
}

// Writing for the fanned pages: notes following the carrot from field to table, as in the magazine "당근을 따라, 구좌".
const JOURNAL=[
 {title:'첫째 장 · 구좌의 밭',lines:['검은 화산토는 물 빠짐이 좋아','당근 뿌리가 땅속 깊이','곧게 내린다.','','겨울 눈보라를 맞으면 당근은','당분을 뿌리로 밀어 넣는다.'],art:'char-farmer'},
 {title:'',lines:['“겨울을 제대로 맞아야','진짜 맛이 들어요.”','','농약 대신 랜턴과 파리채를 들고','밤마다 밭고랑을 살피는 농부.','','“생으로 먹어보세요.”']},
 {title:'둘째 장 · 구좌의 식탁',lines:['곁들임이던 채소가','한 접시의 주인공이 된다.','','수프가 되고, 버거가 되고,','커피와도 어우러진다.'],art:'shop-b'},
 {title:'',lines:['구좌 당근으로 새로운 맛을 만드는','식당 사장님들을 만났다.','','익숙한 재료로 만드는','새로운 맛, 그리고','계절을 식탁에 올리는 사람들.']},
 {title:'셋째 장 · 구좌의 부엌',lines:['집에서도 쉽게 따라 하는','당근 레시피.','','라페, 수프, 피클.','한 입 베어 물면','익숙했던 맛이 새로워진다.'],art:'dish-soup'},
 {title:'',lines:['평범한 채소 하나를 따라간 길.','','그 길에서 제주를 이루는','또 하나의 색과 맛을','발견할 수 있었다.','','당근을 따라, 구좌.']},
];
async function journalPages(){
 await Promise.all(['400','700'].map(weight=>document.fonts.load(`${weight} 30px ${FONT}`,'제주')));
 const image=async(src:string)=>{const img=new Image();img.src=src;await img.decode();return img;};
 const paper=await image(artSource('intro-pages'));const art:Record<string,HTMLImageElement>={};for(const name of ['char-farmer','shop-b','dish-soup'])art[name]=await image(artSource(name));
 const toTexture=(canvas:HTMLCanvasElement)=>{const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;return texture;};
 const pages=JOURNAL.map((page,index)=>{
  const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1205;const c=canvas.getContext('2d')!;
  c.drawImage(paper,0,0,900,1205);c.textBaseline='alphabetic';let y=150;
  if(page.title){c.fillStyle='rgba(122,128,96,.9)';c.font=`700 34px ${FONT}`;c.fillText(page.title,96,y);c.fillStyle='rgba(150,140,110,.55)';c.fillRect(96,y+22,120,2);y+=96;}else y+=10;
  c.fillStyle='rgba(84,74,58,.78)';c.font=`400 31px ${FONT}`;for(const line of page.lines){if(line)c.fillText(line,96,y);y+=58;}
  if(page.art){const img=art[page.art],h=page.art==='char-farmer'?300:240,w=h*img.width/img.height;// Multiplied into the paper so the art's light backing does not show as a pale box.
   c.globalCompositeOperation='multiply';c.globalAlpha=.9;c.drawImage(img,450-w/2,Math.min(1205-h-150,y+30),w,h);c.globalAlpha=1;c.globalCompositeOperation='source-over';}
  c.fillStyle='rgba(150,140,110,.8)';c.font=`400 22px Georgia,serif`;c.textAlign='center';c.fillText(`— ${String(index+3).padStart(2,'0')} —`,450,1140);
  return toTexture(canvas);
 });
 // The title page: the first left page, seen as the cover opens (after JOURNAL in the returned list).
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1205;const c=canvas.getContext('2d')!;
 c.drawImage(paper,0,0,900,1205);c.textAlign='center';c.textBaseline='alphabetic';
 c.fillStyle='rgba(150,140,110,.85)';c.font=`400 20px Georgia,serif`;c.fillText(SITE.label.split('').join(String.fromCharCode(8202)),450,470);
 c.fillStyle='rgba(84,74,58,.85)';c.font=`700 54px ${FONT}`;c.fillText(SITE.title,450,560);
 c.fillStyle='rgba(150,140,110,.55)';c.fillRect(420,600,60,2);
 c.fillStyle='rgba(84,74,58,.7)';c.font=`400 26px ${FONT}`;c.fillText(SITE.name,450,660);
 return [...pages,toTexture(canvas)];
}

/** The first half of the book — front cover, its half of the text block and the first printed sheet — turns as one piece about the
 * binding, like a real hardback. At angle 0 it is exactly the live book's left half; at −π it lies face down on the second half. */
function FirstHalf({materials,angle,swell,page}:{materials:BookMaterials;angle:number;swell:number;page:Texture}){
 const board=useDisposable(()=>createBoardGeometry(true),[]),block=useDisposable(()=>createPaperBlockGeometry(),[]);
 const edge=materials['paper-edge'],endpaper=materials.endpaper;
 return <group position={[0,BOOK_HINGE_Y,0]} rotation={[0,0,angle]}><group position={[0,-BOOK_HINGE_Y,0]}>
  <TurnedMesh geometry={board} angle={angle} position={[-BOOK_BOARD.x,BOOK_BOARD.y,0]} maps={[materials.inside,materials.cover,materials['cloth-side']]}/>
  <TurnedMesh geometry={block} angle={angle} position={[-BLOCK_X,BOOK_PAGES.y,0]} maps={[edge,edge,endpaper,endpaper,edge,edge]}/>
  <PrintedPage texture={page} edge={edge} left swell={swell}/>
 </group></group>;
}
/** The spine band follows the first half from the closed C around the stacked halves to the flat open spine (the live book's own). */
function FoldingSpine({materials,fold}:{materials:BookMaterials;fold:number}){
 const geometry=useDisposable(()=>createSpineGeometry(fold),[fold]);
 return <mesh geometry={geometry}><meshBasicMaterial map={materials['cloth-side']} vertexColors side={DoubleSide}/></mesh>;
}
function Popup({layer,piece,texture,rise}:{layer:Layer;piece:PaperPiece;texture:Texture;rise:number}){
 const card=useDisposable(()=>createCardGeometry(piece,layer.size[1]),[piece.width,piece.u0,piece.u1,layer.size[1]]);
 const hinge=-(1-rise)*Math.PI/2;
 return <group position={[piece.center,layer.position[1]+.018,layer.position[2]]}>
  <group rotation={[hinge,0,0]}><mesh geometry={card} position={[0,layer.size[1]/2,0]}><meshBasicMaterial map={texture} transparent alphaTest={.025} side={DoubleSide} depthWrite/></mesh></group>
 </group>;
}
function FilmCamera(){
 const {camera,scene}=useThree();
 useEffect(()=>{const cam=camera as PerspectiveCamera;cam.aspect=FILM_WIDTH/FILM_HEIGHT;cam.fov=bookFov(FILM_WIDTH,FILM_HEIGHT);cam.position.set(...BOOK_CAMERA_POSITION);cam.lookAt(0,BOOK_TARGET_Y,0);cam.updateProjectionMatrix();scene.background=new Color('#ece6d6');},[camera,scene]);
 return null;
}
type Assets={materials:BookMaterials;journal:Texture[];paper:Record<string,Texture>;scenery:Record<string,Texture>;coverFrame:(time:number)=>Promise<void>;standing?:StandingAssets};
function Film({assets,t,onCommit}:{assets:Assets;t:number;onCommit:(t:number)=>void}){
 const {materials,journal,paper,scenery}=assets;
 // The canvas has its own React renderer; the frame may only be drawn once this time has been committed there.
 useLayoutEffect(()=>onCommit(t),[t,onCommit]);const f=timeline(t);
 const progress=useRef(Array.from({length:INTRO_PAGE_COUNT},()=>({value:0})));f.pages.forEach((p,i)=>progress.current[i].value=p);
 const sceneryOn=f.scenery>=0;
 // One stack of sheets: each turning sheet starts as the right page that is showing and lands as the left page that stays, so no
 // page ever swaps its picture. Under the lifted sheets lies the next one's front; the last sheet uncovers (and its back is) the first spread.
 const last=INTRO_PAGE_COUNT-1,front=(i:number)=>i>last?paper['page-0-right']:journal[(i*2)%JOURNAL.length];
 const back=(i:number)=>i===last?paper['page-0-left']:journal[(i*2+1)%JOURNAL.length];
 const started=f.pages.filter(p=>p>0).length,landed=f.pages.filter(p=>p>=1).length;
 const rightPage=front(started),leftPage=landed?back(landed-1):journal[JOURNAL.length];
 return <><FilmCamera/>
  <group position={[f.rootX+BOOK_BOARD.x,-.08+f.lift,0]} rotation={new Euler(f.tilt,f.yaw,0,'YXZ')} scale={f.scale}><group position={[-BOOK_BOARD.x,.08,0]}>
   <Board materials={materials} x={BOOK_BOARD.x}/><PaperBlock materials={materials} x={BLOCK_X}/>
   <FoldingSpine materials={materials} fold={f.open}/>
   <PrintedPage texture={rightPage} edge={materials['paper-edge']} swell={f.swell}/>
   <FirstHalf materials={materials} angle={-(1-f.open)*Math.PI} swell={f.swell} page={leftPage}/>
   {/* The ribbon and headband are bound in from the start; the opening sheets uncover them. */}
   <BindingDetails materials={materials}/>
   {f.pages.map((p,i)=>p>0&&p<1?<TurningPage key={i} front={front(i)} back={back(i)} progress={{current:progress.current[i]}} direction={1} lift={.025+(INTRO_PAGE_COUNT-i)*.005}/>:null)}
   {sceneryOn&&scenes[0].layers.flatMap((layer,index)=>(['left','right'] as const).map(side=>{const piece=splitPaperArt(layer.position[0],layer.size[0],side);return piece?<Popup key={layer.id+side} layer={layer} piece={piece} texture={scenery[layer.src]} rise={smooth((f.scenery-index*.075)/.85)}/>:null;}))}
  </group></group>
 </>;
}
function StandingRoll({assets,standing,t,onCommit}:{assets:Assets;standing:StandingAssets;t:number;onCommit:(t:number)=>void}){
 useLayoutEffect(()=>onCommit(t),[t,onCommit]);
 return <StandingFilm materials={assets.materials} assets={standing} t={t} width={FILM_WIDTH} height={FILM_HEIGHT}/>;
}
/** Everything the renderer records next to the movie, read from the same modules the live book uses. */
const FILM_META=STANDING?standingFilmMeta(FILM_WIDTH,FILM_HEIGHT):{width:FILM_WIDTH,height:FILM_HEIGHT,duration:INTRO_DURATION,coverHold:INTRO_COVER_HOLD,uiRevealAt:INTRO_UI_AT,sceneryStartsAt:INTRO_UI_AT,pageCount:INTRO_PAGE_COUNT,
 worldWidth:BOOK_FRAME_WIDTH,worldHeight:BOOK_FRAME_HEIGHT,targetY:BOOK_TARGET_Y,camera:[...BOOK_CAMERA_POSITION],fov:bookFov(FILM_WIDTH,FILM_HEIGHT),projection:'perspective',renderer:'three.js (src/film.tsx)',
 background:'#ece6d6',board:BOOK_BOARD,pages:BOOK_PAGES,spine:BOOK_SPINE,shadows:false,bakedShadows:false};
/** The magazine's moving cover: one finished cover texture per film frame, written by render-intro.mjs from the frames
 *  scripts/capture-site-cover.mjs records. Without them the cover keeps its still texture. */
const COVER_FRAMES='/intro-cache/cover-texture/';
async function coverMotion(){
 try{const meta=await (await fetch(COVER_FRAMES+'meta.json')).json() as {fps:number;frames:number};return meta.frames>0?meta:null;}catch{return null;}
}
function coverFramePlayer(cover:Texture,motion:{fps:number;frames:number}|null){
 let shown=-1;
 return async(time:number)=>{
  if(!motion)return;
  const index=Math.min(motion.frames-1,Math.max(0,Math.round(time*motion.fps)));if(index===shown)return;shown=index;
  const blob=await (await fetch(`${COVER_FRAMES}${String(index).padStart(4,'0')}.webp`)).blob();
  // Same orientation as assets.ts bitmap textures (flipped while decoding, texture.flipY false).
  const bitmap=await createImageBitmap(blob,{imageOrientation:'flipY',premultiplyAlpha:'none'});
  (cover.image as ImageBitmap|undefined)?.close?.();cover.image=bitmap;cover.needsUpdate=true;
 };
}
declare global{interface Window{__film?:{ready:boolean;meta:typeof FILM_META;render:(t:number)=>Promise<string>;error?:string}}}
function FilmRoot(){
 const [assets,setAssets]=useState<Assets|null>(null);const [t,setT]=useState(0);const canvas=useRef<HTMLCanvasElement>(null);const committed=useRef(-1);const onCommit=useMemo(()=>(time:number)=>{committed.current=time;},[]);
 useEffect(()=>{(async()=>{
  const names=[...OPEN_BOOK_MATERIALS,'cover'];
  if(STANDING){
   const [entries,standing,motion]=await Promise.all([Promise.all(names.map(async n=>[n,await loadTexture('book-'+n)] as const)),loadStandingAssets(),coverMotion()]);
   const materials:BookMaterials=Object.fromEntries(entries);
   setAssets({materials,journal:[],paper:{},scenery:standing.scenery,standing,coverFrame:coverFramePlayer(materials.cover!,motion)});return;
  }
  const [entries,journal,left,right,scenery,motion]=await Promise.all([Promise.all(names.map(async n=>[n,await loadTexture('book-'+n)] as const)),journalPages(),loadTexture('page-0-left'),loadTexture('page-0-right'),loadScene(0),coverMotion()]);
  const materials:BookMaterials=Object.fromEntries(entries);
  setAssets({materials,journal,paper:{'page-0-left':left,'page-0-right':right},scenery,coverFrame:coverFramePlayer(materials.cover!,motion)});
 })().catch(error=>{window.__film={ready:false,meta:FILM_META,render:async()=>'',error:String(error)};});},[]);
 useEffect(()=>{if(!assets)return;
  const render=async(time:number)=>{await assets.coverFrame(time);flushSync(()=>setT(time));while(committed.current!==time)await new Promise(resolve=>setTimeout(resolve,0));advance(performance.now());return canvas.current!.toDataURL('image/png');};
  // Two warm-up frames upload every texture and compile every program before the first captured frame.
  void (async()=>{await render(FILM_META.uiRevealAt+.5);await render(1.5);window.__film={ready:true,meta:FILM_META,render};})();
 },[assets]);
 return <Canvas ref={canvas} frameloop="never" flat dpr={1} style={{width:FILM_WIDTH,height:FILM_HEIGHT}} gl={{antialias:true,alpha:false,preserveDrawingBuffer:true}} camera={{position:[...BOOK_CAMERA_POSITION],fov:30,near:.1,far:70}}>{assets&&(assets.standing?<StandingRoll assets={assets} standing={assets.standing} t={t} onCommit={onCommit}/>:<Film assets={assets} t={t} onCommit={onCommit}/>)}</Canvas>;
}
createRoot(document.getElementById('root')!).render(<FilmRoot/>);
