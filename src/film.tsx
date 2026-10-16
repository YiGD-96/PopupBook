/**
 * The intro film, staged with the live book's own parts and rendered frame by frame by scripts/render-intro.mjs.
 * Because both use the same meshes, materials and camera, the film's last frame is the live book's first.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Canvas, advance, useThree } from '@react-three/fiber';
import { CanvasTexture, Color, DoubleSide, Euler, SRGBColorSpace, type BufferGeometry, type PerspectiveCamera, type Texture } from 'three';
import { loadScene, loadTexture } from './assets';
import { scenes } from './story';
import { artSource } from './artSource';
import { BOOK_CAMERA_POSITION, BOOK_FRAME_HEIGHT, BOOK_FRAME_WIDTH, BOOK_TARGET_Y, bookFov } from './bookView';
import { BOOK_BOARD, BOOK_PAGES, BOOK_SPINE, POPUP_SHADOW } from './bookStructure';
import { INTRO_DURATION, INTRO_PAGE_COUNT, INTRO_PAGES_START, INTRO_PAGE_STAGGER, INTRO_PAGE_TURN, INTRO_UI_AT } from './introPlayback';
import { BLOCK_X, BindingDetails, Board, FloorShadow, OPEN_BOOK_MATERIALS, PaperBlock, PrintedPage, TurningPage, createCardGeometry, createPopupShadowGeometry, createPopupShadowMaterial, popupShadowLean, useDisposable, type BookMaterials } from './bookParts';
import { BOOK_HINGE_Y, createBoardGeometry, createPaperBlockGeometry, createSpineGeometry, lightShade } from './bookGeometry';
import { splitPaperArt, type PaperPiece } from './paperAttachments';
import type { Layer } from './story';

const params=new URLSearchParams(location.search);
const FILM_WIDTH=Number(params.get('width')||968),FILM_HEIGHT=Math.round(FILM_WIDTH*BOOK_FRAME_HEIGHT/BOOK_FRAME_WIDTH/2)*2;
const clamp=(x:number)=>Math.max(0,Math.min(1,x)),smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x);},ease=(x:number)=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};

/** Everything the film shows at time t (seconds). The cover opens while the book is still settling, without a pause. */
function timeline(t:number){
 const lowering=ease(t/1.4),open=ease((t-.12)/1.43);
 // Pressed-flat sheets relax into their open swell as the first half lifts away.
 return {lowering,open,rootX:-BOOK_BOARD.x*(1-open),left:smooth((open-.5)/.5),swell:smooth(open/.55),
  tilt:1.04*(1-lowering),yaw:-.19*(1-lowering),lift:(BOOK_TARGET_Y+.08)*(1-lowering),scale:.88+.12*lowering,
  pages:Array.from({length:INTRO_PAGE_COUNT},(_,i)=>smooth((t-INTRO_PAGES_START-i*INTRO_PAGE_STAGGER)/INTRO_PAGE_TURN)),
  scenery:t>=INTRO_UI_AT?t-INTRO_UI_AT:-1};
}

// Writing for the fanned pages: a small Jeju travel journal, so the flip reads as a real book rather than blank paper.
const JOURNAL=[
 {title:'첫째 날 · 구좌',lines:['비행기 창밖으로 낮은 오름들이','차례로 지나가는 것을 보았다.','바람은 생각보다 부드러웠고,','당근밭 사이 돌담은 오래된','이야기처럼 구불구불 이어졌다.','','오늘은 서두르지 않기로 했다.'],art:'carrot'},
 {title:'',lines:['길가 작은 가게에서 귤 한 봉지를','샀다. 주인 할머니는 껍질이 얇은','것이 달다고 일러 주셨다.','','오후의 햇살이 밭고랑마다','천천히 내려앉았다. 걷다가 멈추고,','멈췄다가 다시 걸었다.','','바람 소리만 남은 길이 좋았다.']},
 {title:'둘째 날 · 마을',lines:['낮은 지붕 너머로 감귤나무가','고개를 내밀었다. 골목은 이름이','없어도 다정했다.','','담벼락 아래 고양이 한 마리가','나를 오래 바라보았다.'],art:'tree'},
 {title:'',lines:['저녁에는 바다 쪽으로 걸었다.','하늘이 분홍빛에서 보랏빛으로','바뀌는 동안 아무 말도 하지','않았다.','','작은 수첩에 오늘의 색을','적어 두었다. 귤빛, 돌빛, 바다빛.']},
 {title:'셋째 날 · 바다',lines:['등대까지 이어진 길은 짧았지만','한참을 머물렀다.','','파도는 같은 말을 여러 번','건네는 친구 같았다.','천천히 가도 괜찮다고.'],art:'lighthouse'},
 {title:'',lines:['돌아가는 길, 주머니 속에서','작은 조개껍데기를 발견했다.','','이 여행은 크지 않았지만','오래 기억될 것 같다.','','다음 장에는 무엇이 있을까.']},
];
const FONT="'Gowun Batang','Noto Serif KR','HANBatang',Batang,serif";
async function journalPages(){
 await Promise.all(['400','700'].map(weight=>document.fonts.load(`${weight} 30px ${FONT}`,'제주')));
 const image=async(src:string)=>{const img=new Image();img.src=src;await img.decode();return img;};
 const paper=await image(artSource('intro-pages'));const art:Record<string,HTMLImageElement>={};for(const name of ['carrot','tree','lighthouse'])art[name]=await image(artSource(name));
 return JOURNAL.map((page,index)=>{
  const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1205;const c=canvas.getContext('2d')!;
  c.drawImage(paper,0,0,900,1205);c.textBaseline='alphabetic';let y=150;
  if(page.title){c.fillStyle='rgba(122,128,96,.9)';c.font=`700 34px ${FONT}`;c.fillText(page.title,96,y);c.fillStyle='rgba(150,140,110,.55)';c.fillRect(96,y+22,120,2);y+=96;}else y+=10;
  c.fillStyle='rgba(84,74,58,.78)';c.font=`400 31px ${FONT}`;for(const line of page.lines){if(line)c.fillText(line,96,y);y+=58;}
  if(page.art){const img=art[page.art],h=page.art==='carrot'?250:300,w=h*img.width/img.height;// Multiplied into the paper so the art's light backing does not show as a pale box.
   c.globalCompositeOperation='multiply';c.globalAlpha=.9;c.drawImage(img,450-w/2,Math.min(1205-h-150,y+30),w,h);c.globalAlpha=1;c.globalCompositeOperation='source-over';}
  c.fillStyle='rgba(150,140,110,.8)';c.font=`400 22px Georgia,serif`;c.textAlign='center';c.fillText(`— ${String(index+3).padStart(2,'0')} —`,450,1140);
  const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;return texture;
 });
}

/** Re-bakes a part's light for its current turn about the binding axis, so a turning half is lit as it will be lying open. */
function useTurnedLight(geometry:BufferGeometry,angle:number){
 const normals=useMemo(()=>(geometry.getAttribute('normal').array as Float32Array).slice(),[geometry]);
 useMemo(()=>{const colors=geometry.getAttribute('color'),c=Math.cos(angle),s=Math.sin(angle);for(let i=0;i<colors.count;i++){const nx=normals[i*3],ny=normals[i*3+1],shade=Math.pow(lightShade(nx*c-ny*s,nx*s+ny*c,normals[i*3+2]),2.2);colors.setXYZ(i,shade,shade,shade);}colors.needsUpdate=true;},[geometry,normals,angle]);
}
function TurnedMesh({geometry,angle,position,maps}:{geometry:BufferGeometry;angle:number;position:[number,number,number];maps:(Texture|undefined)[]}){
 useTurnedLight(geometry,angle);
 return <mesh geometry={geometry} position={position}>{maps.map((map,i)=><meshBasicMaterial key={i} attach={`material-${i}`} map={map} vertexColors side={DoubleSide}/>)}</mesh>;
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
 const strip=useDisposable(()=>createPopupShadowGeometry(piece,layer.position[1]),[piece.center,piece.width,layer.position[1]]);
 const shadow=useDisposable(()=>createPopupShadowMaterial(texture),[texture]);
 const hinge=-(1-rise)*Math.PI/2,lean=popupShadowLean(hinge);shadow.uniforms.opacity.value=POPUP_SHADOW.opacity*lean;
 return <group position={[piece.center,layer.position[1]+.018,layer.position[2]]}>
  <group scale={[1,1,Math.max(.001,lean*POPUP_SHADOW.length*layer.size[1])]} visible={lean>.01}><mesh geometry={strip} material={shadow} renderOrder={-1}/></group>
  <group rotation={[hinge,0,0]}><mesh geometry={card} position={[0,layer.size[1]/2,0]}><meshBasicMaterial map={texture} transparent alphaTest={.025} side={DoubleSide} depthWrite/></mesh></group>
 </group>;
}
function FilmCamera(){
 const {camera,scene}=useThree();
 useEffect(()=>{const cam=camera as PerspectiveCamera;cam.aspect=FILM_WIDTH/FILM_HEIGHT;cam.fov=bookFov(FILM_WIDTH,FILM_HEIGHT);cam.position.set(...BOOK_CAMERA_POSITION);cam.lookAt(0,BOOK_TARGET_Y,0);cam.updateProjectionMatrix();scene.background=new Color('#ece6d6');},[camera,scene]);
 return null;
}
type Assets={materials:BookMaterials;journal:Texture[];paper:Record<string,Texture>;scenery:Record<string,Texture>};
function Film({assets,t,onCommit}:{assets:Assets;t:number;onCommit:(t:number)=>void}){
 const {materials,journal,paper,scenery}=assets;
 // The canvas has its own React renderer; the frame may only be drawn once this time has been committed there.
 useLayoutEffect(()=>onCommit(t),[t,onCommit]);const f=timeline(t);
 const progress=useRef(Array.from({length:INTRO_PAGE_COUNT},()=>({value:0})));f.pages.forEach((p,i)=>progress.current[i].value=p);
 const sceneryOn=f.scenery>=0;
 return <><FilmCamera/>
  <FloorShadow materials={materials} x={f.rootX+BOOK_BOARD.x} opacity={f.lowering}/><FloorShadow materials={materials} x={f.rootX-BOOK_BOARD.x} opacity={f.lowering*f.left}/>
  <group position={[f.rootX+BOOK_BOARD.x,-.08+f.lift,0]} rotation={new Euler(f.tilt,f.yaw,0,'YXZ')} scale={f.scale}><group position={[-BOOK_BOARD.x,.08,0]}>
   <Board materials={materials} x={BOOK_BOARD.x}/><PaperBlock materials={materials} x={BLOCK_X}/>
   <FoldingSpine materials={materials} fold={f.open}/>
   <PrintedPage texture={sceneryOn?paper['page-0-right']:journal[0]} edge={materials['paper-edge']} swell={f.swell}/>
   <FirstHalf materials={materials} angle={-(1-f.open)*Math.PI} swell={f.swell} page={sceneryOn?paper['page-0-left']:journal[1]}/>
   {/* The ribbon and headband are bound in from the start; the opening sheets uncover them. */}
   <BindingDetails materials={materials}/>
   {f.pages.map((p,i)=>p>0&&p<1?<TurningPage key={i} front={journal[(i*2+2)%journal.length]} back={journal[(i*2+3)%journal.length]} progress={{current:progress.current[i]}} direction={1} lift={.025+(INTRO_PAGE_COUNT-i)*.005}/>:null)}
   {sceneryOn&&scenes[0].layers.flatMap((layer,index)=>(['left','right'] as const).map(side=>{const piece=splitPaperArt(layer.position[0],layer.size[0],side);return piece?<Popup key={layer.id+side} layer={layer} piece={piece} texture={scenery[layer.src]} rise={smooth((f.scenery-index*.075)/.85)}/>:null;}))}
  </group></group>
 </>;
}
/** Everything the renderer records next to the movie, read from the same modules the live book uses. */
const FILM_META={width:FILM_WIDTH,height:FILM_HEIGHT,duration:INTRO_DURATION,uiRevealAt:INTRO_UI_AT,sceneryStartsAt:INTRO_UI_AT,pageCount:INTRO_PAGE_COUNT,
 worldWidth:BOOK_FRAME_WIDTH,worldHeight:BOOK_FRAME_HEIGHT,targetY:BOOK_TARGET_Y,camera:[...BOOK_CAMERA_POSITION],fov:bookFov(FILM_WIDTH,FILM_HEIGHT),projection:'perspective',renderer:'three.js (src/film.tsx)',
 background:'#ece6d6',board:BOOK_BOARD,pages:BOOK_PAGES,spine:BOOK_SPINE,shadows:false,bakedShadows:{floor:true,popups:POPUP_SHADOW}};
declare global{interface Window{__film?:{ready:boolean;meta:typeof FILM_META;render:(t:number)=>Promise<string>;error?:string}}}
function FilmRoot(){
 const [assets,setAssets]=useState<Assets|null>(null);const [t,setT]=useState(0);const canvas=useRef<HTMLCanvasElement>(null);const committed=useRef(-1);const onCommit=useMemo(()=>(time:number)=>{committed.current=time;},[]);
 useEffect(()=>{(async()=>{
  const names=[...OPEN_BOOK_MATERIALS,'cover'];
  const [entries,journal,left,right,scenery]=await Promise.all([Promise.all(names.map(async n=>[n,await loadTexture('book-'+n)] as const)),journalPages(),loadTexture('page-0-left'),loadTexture('page-0-right'),loadScene(0)]);
  setAssets({materials:Object.fromEntries(entries),journal,paper:{'page-0-left':left,'page-0-right':right},scenery});
 })().catch(error=>{window.__film={ready:false,meta:FILM_META,render:async()=>'',error:String(error)};});},[]);
 useEffect(()=>{if(!assets)return;
  const render=async(time:number)=>{flushSync(()=>setT(time));while(committed.current!==time)await new Promise(resolve=>setTimeout(resolve,0));advance(performance.now());return canvas.current!.toDataURL('image/png');};
  // Two warm-up frames upload every texture and compile every program before the first captured frame.
  void (async()=>{await render(INTRO_UI_AT+.5);await render(1.5);window.__film={ready:true,meta:FILM_META,render};})();
 },[assets]);
 return <Canvas ref={canvas} frameloop="never" flat dpr={1} style={{width:FILM_WIDTH,height:FILM_HEIGHT}} gl={{antialias:true,alpha:false,preserveDrawingBuffer:true}} camera={{position:[...BOOK_CAMERA_POSITION],fov:30,near:.1,far:70}}>{assets&&<Film assets={assets} t={t} onCommit={onCommit}/>}</Canvas>;
}
createRoot(document.getElementById('root')!).render(<FilmRoot/>);
