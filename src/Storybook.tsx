import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Group, Mesh, Texture, PlaneGeometry, OrthographicCamera, WebGLRenderTarget, DoubleSide, FrontSide, BackSide } from 'three';
import gsap from 'gsap';
import { loadTexture, loadScene, preloadScene, readyScene } from './assets';
import { type Director, type Layer, scenes, useStory, playSound } from './story';
import { createPaperGeometry, updatePaperGeometry } from './paperGeometry';
import { attachedPaperPose, pageReveal, popupFoldAngle, splitPaperArt, type PaperPiece } from './paperAttachments';
import { prepareBookRenderer } from './bookPreparation';
import { BOOK_TARGET_Y, BOOK_CAMERA_POSITION, bookZoom } from './bookView';
import {BOOK_BOARD,BOOK_PAGES,COVER_ART_Y,COVER_HINGE_Y} from './bookStructure';
type Turn={from:number;to:number;direction:1|-1;incoming:Record<string,Texture>;restoreDialog:boolean};
function Camera(){
 const {camera,size,gl}=useThree();
 useEffect(()=>{const cam=camera as OrthographicCamera;cam.lookAt(0,BOOK_TARGET_Y,0);cam.zoom=bookZoom(size.width,size.height);cam.updateProjectionMatrix();gl.domElement.dataset.cameraZoom=String(cam.zoom);gl.domElement.dataset.cameraX=String(cam.position.x);gl.domElement.dataset.shadows="off";},[camera,size,gl]);return null;
}
function PaperLayer({layer,piece,texture,hinges,onClick,turn,progress,incoming=false,startOpen=false,sceneChapter}:{layer:Layer;piece:PaperPiece;texture:Texture;hinges:RefObject<Map<string,Group>>;onClick:()=>void;turn:Turn|null;progress:RefObject<{value:number}>;incoming?:boolean;startOpen?:boolean;sceneChapter:number}){
 const anchor=useRef<Group>(null!);const ref=useRef<Group>(null!);const mesh=useRef<Mesh>(null!);const phase=useStory(s=>s.phase);const dialog=useStory(s=>s.dialog);const initialOpen=useRef(startOpen);
 const key=`${incoming?'incoming:':''}${layer.id}:${piece.side}`;
 const geometry=useMemo(()=>{const g=new PlaneGeometry(piece.width,layer.size[1]);const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setX(i,piece.u0+(piece.u1-piece.u0)*uv.getX(i));return g;},[piece.width,piece.u0,piece.u1,layer.size[1]]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useEffect(()=>{const group=ref.current;hinges.current.set(key,group);group.rotation.x=initialOpen.current?0:-Math.PI/2;return()=>{hinges.current.delete(key);};},[key,hinges]);
 useFrame(({clock})=>{
  const root=anchor.current;root.visible=true;
  if(turn){
   const p=progress.current.value;const movingSide=turn.direction===1?'right':'left';const ridesSheet=incoming?piece.side!==movingSide:piece.side===movingSide;
   if(ridesSheet){const face:1|-1=piece.side==='right'?1:-1;const pose=attachedPaperPose(piece.center,layer.position[1],layer.position[2],p,turn.direction,face);root.position.set(...pose.position);root.rotation.z=pose.rotation;root.visible=incoming?p>.35:p<.99999;}
   else {root.position.set(piece.center,layer.position[1]+.018,layer.position[2]);root.rotation.z=0;const reveal=incoming?pageReveal(p,.5,.95):1-pageReveal(p,.45,.92);root.visible=reveal>.0001;}
   ref.current.rotation.x=popupFoldAngle(p,incoming);
  }else{root.position.set(piece.center,layer.position[1]+.018,layer.position[2]);root.rotation.z=0;}
  mesh.current.rotation.z=layer.id==='carrot'&&phase==='EXPLORING'?Math.sin(clock.elapsedTime*1.5)*.025:0;
 });
 return <group ref={anchor}><group ref={ref}><mesh ref={mesh} geometry={geometry} position={[0,layer.size[1]/2,0]} onClick={!incoming&&layer.interactive?e=>{e.stopPropagation();if(phase==='EXPLORING')onClick();}:undefined} onPointerOver={!incoming&&layer.interactive?()=>{if(phase==='EXPLORING')document.body.style.cursor='pointer';}:undefined} onPointerOut={()=>{document.body.style.cursor='';}}><meshBasicMaterial map={texture} transparent alphaTest={.025} side={DoubleSide} depthWrite/></mesh>{!incoming&&layer.interactive&&sceneChapter===2&&dialog&&<mesh position={[0,2.07,.025]}><circleGeometry args={[.19,32]}/><meshBasicMaterial color="#fff5b4" transparent opacity={.9}/></mesh>}</group></group>;
}
function PrintedPage({texture,left=false}:{texture:Texture;left?:boolean}){
 const geometry=useMemo(()=>{const g=createPaperGeometry();if(left){g.scale(-1,1,1);const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setX(i,1-uv.getX(i));g.computeVertexNormals();}return g;},[left]);useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry}><meshBasicMaterial map={texture} side={DoubleSide}/></mesh>;
}
function TurningPage({front,back,progress,direction}:{front:Texture;back:Texture;progress:RefObject<{value:number}>;direction:1|-1}){
 const geometry=useMemo(()=>createPaperGeometry(),[]);const mirrored=useMemo(()=>{const t=back.clone();t.repeat.x=-1;t.offset.x=1;t.needsUpdate=true;return t;},[back]);useEffect(()=>()=>geometry.dispose(),[geometry]);useEffect(()=>()=>mirrored.dispose(),[mirrored]);useFrame(()=>updatePaperGeometry(geometry,progress.current.value,direction));
 return <group position={[0,.018,0]}><mesh geometry={geometry} renderOrder={4}><meshBasicMaterial map={front} side={FrontSide}/></mesh><mesh geometry={geometry} renderOrder={4}><meshBasicMaterial map={mirrored} side={BackSide}/></mesh></group>;
}
function BookBoard({x,materials,cover=false}:{x:number;materials:Record<string,Texture>;cover?:boolean}){
 const faces=['cloth-side','cloth-side','cloth','cloth-side','cover-edge','cover-edge'];
 return <mesh position={[x,cover?0:BOOK_BOARD.y,0]}><boxGeometry args={[BOOK_BOARD.width,BOOK_BOARD.thickness,BOOK_BOARD.depth]}/>{faces.map((face,index)=><meshBasicMaterial key={index} attach={'material-'+index} map={materials[face]} color={materials[face]?'#ffffff':'#ae765b'}/>)}</mesh>;
}
function PaperStack({x,materials}:{x:number;materials:Record<string,Texture>}){
 const faces=['paper-edge','paper-edge','endpaper','endpaper','paper-edge','paper-edge'];
 return <mesh position={[x,BOOK_PAGES.y,0]}><boxGeometry args={[BOOK_PAGES.width,BOOK_PAGES.thickness,BOOK_PAGES.depth]}/>{faces.map((face,index)=><meshBasicMaterial key={index} attach={'material-'+index} map={materials[face]} color={materials[face]?'#ffffff':'#e8dbc2'}/>)}</mesh>;
}
function Book({onReady,onFailure}:{onReady:(director:Director)=>void;onFailure:()=>void}){
 const {gl,scene:world,camera}=useThree();const prepared=useRef(false);
 const pagesRoot=useRef<Group>(null!);const popupRoot=useRef<Group>(null!);
 const root=useRef<Group>(null!);const cover=useRef<Group>(null!);const hinges=useRef(new Map<string,Group>());const timeline=useRef<gsap.core.Timeline|null>(null);const pending=useRef<(()=>void)|null>(null);const generation=useRef(0);const mounted=useRef(true);const progress=useRef({value:0});const turnRef=useRef<Turn|null>(null);const incomingLoad=useRef<Promise<Record<string,Texture>>|null>(null);const initialOpen=useRef(false);const [turn,setTurn]=useState<Turn|null>(null);
 const [coverTexture,setCoverTexture]=useState<Texture>();const [materials,setMaterials]=useState<Record<string,Texture>>({});const [textures,setTextures]=useState<Record<string,Texture>>({});const [paper,setPaper]=useState<Record<string,Texture>>({});const paperRef=useRef<Record<string,Texture>>({});const chapter=useStory(s=>s.chapter);const phase=useStory(s=>s.phase);const [opened,setOpened]=useState(false);const openedRef=useRef(false);const frameCount=useRef({count:0,start:0});
 useFrame(({clock})=>{frameCount.current.count++;if(clock.elapsedTime-frameCount.current.start>2){useStory.getState().set({fps:Math.round(frameCount.current.count/(clock.elapsedTime-frameCount.current.start))});frameCount.current={count:0,start:clock.elapsedTime};}});
 const duration=(d:number)=>d;
 const animate=(fn:(tl:gsap.core.Timeline)=>void)=>new Promise<void>(resolve=>{pending.current=resolve;const tl=gsap.timeline({onComplete:()=>{timeline.current=null;pending.current=null;resolve();}});timeline.current=tl;fn(tl);});
 const renderWait=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 function clearTurn(){turnRef.current=null;setTurn(null);incomingLoad.current=null;progress.current.value=0;}
 function fail(error:unknown){if(!mounted.current)return;timeline.current?.kill();pending.current?.();generation.current++;clearTurn();hinges.current.forEach(h=>h.rotation.x=0);console.error('StoryDirector',error);useStory.getState().set({phase:'ERROR',error:error instanceof Error?error.message:'책을 펼치는 중 잠시 멈췄어요. 다시 시도해 주세요.'});}
 async function preparePaper(target=0){
  const entries=await Promise.all(['left','right'].map(async side=>{const name=`page-${target}-${side}`;return [name,paperRef.current[name]??await loadTexture(name)] as const;}));
  if(!mounted.current)return;paperRef.current={...paperRef.current,...Object.fromEntries(entries)};setPaper(paperRef.current);
 }
 function warmFirstFrame(){
  const target=new WebGLRenderTarget(128,128);target.texture.colorSpace=gl.outputColorSpace;const previousTarget=gl.getRenderTarget();const position=root.current.position.clone();
  const groups=[pagesRoot.current,popupRoot.current];const visibility=groups.map(g=>g.visible);const coverVisible=cover.current.visible;
  try{root.current.position.x=0;groups.forEach(g=>g.visible=true);cover.current.visible=false;gl.setRenderTarget(target);gl.render(world,camera);}
  finally{gl.setRenderTarget(previousTarget);root.current.position.copy(position);groups.forEach((g,i)=>g.visible=visibility[i]);cover.current.visible=coverVisible;target.dispose();}
 }
 async function prepareStartup(token:number){
  useStory.getState().set({phase:'INIT',error:null});
  const [coverArt,firstArt,,materialArt]=await Promise.all([loadTexture('book-cover'),loadScene(0),preparePaper(),Promise.all(['cloth','cloth-side','cover-edge','paper-edge','endpaper'].map(async name=>[name,await loadTexture('book-'+name)] as const)).then(entries=>Object.fromEntries(entries) as Record<string,Texture>)]);
  const active=()=>mounted.current&&token===generation.current;
  if(!active())return;setCoverTexture(coverArt);setTextures(firstArt);setMaterials(materialArt);
  if(!await prepareBookRenderer(gl,[coverArt,...Object.values(materialArt),...Object.values(firstArt),...Object.values(paperRef.current)],world,camera,active,undefined,warmFirstFrame))return;
  prepared.current=true;useStory.getState().set({phase:'COVER'});
 }
 async function openPopup(target:number,token:number,alreadyOpen=false){
  useStory.getState().set({phase:'LOADING_PAGE',dialog:false});const [art]=await Promise.all([loadScene(target),preparePaper(target)]);if(!mounted.current||token!==generation.current)return;
  initialOpen.current=alreadyOpen;setTextures(art);useStory.getState().set({chapter:target});clearTurn();await renderWait();if(!mounted.current||token!==generation.current)return;
  if(!alreadyOpen){useStory.getState().set({phase:'OPENING_POPUP'});await animate(tl=>scenes[target].layers.forEach((l,i)=>{for(const side of ['left','right']){const hinge=hinges.current.get(`${l.id}:${side}`);if(hinge)tl.to(hinge.rotation,{x:0,duration:duration(.72),ease:'back.out(1.05)'},duration(i*.13));}}));}
  if(!mounted.current||token!==generation.current)return;useStory.getState().set({phase:'EXPLORING'});preloadScene(target+1);
 }
 async function reveal(){
  if(useStory.getState().phase!=='COVER'||!prepared.current)return;
  const token=++generation.current;initialOpen.current=true;root.current.position.x=0;cover.current.rotation.z=Math.PI;
  hinges.current.forEach(h=>h.rotation.x=0);setOpened(true);openedRef.current=true;
  useStory.getState().set({phase:'LOADING_PAGE',chapter:0,dialog:false,introPagesTurned:10});
  await renderWait();if(!mounted.current||token!==generation.current)return;
  useStory.getState().set({phase:'EXPLORING'});preloadScene(1);
 }
 async function start(){
  const state=useStory.getState();if(state.phase!=='CLOSED')return;
  const token=++generation.current;state.set({phase:'OPENING_BOOK'});playSound('page');
  try{await animate(tl=>tl.to(cover.current.rotation,{z:Math.PI,duration:.95,ease:'power2.inOut'}).to(root.current.position,{x:0,duration:.95},0));
   if(!mounted.current||token!==generation.current)return;setOpened(true);openedRef.current=true;await openPopup(0,token);
  }catch(e){fail(e);}
 }
 async function close(){const state=useStory.getState();if(state.phase!=='EXPLORING'||state.chapter!==0)return;const token=++generation.current;state.set({phase:'CLOSING_BOOK',dialog:false});playSound('page');try{
  await animate(tl=>{hinges.current.forEach(h=>tl.to(h.rotation,{x:-Math.PI/2,duration:.45,ease:'power2.inOut'},0));});if(!mounted.current||token!==generation.current)return;
  await animate(tl=>tl.to(cover.current.rotation,{z:0,duration:.95,ease:'power2.inOut'}).to(root.current.position,{x:-1.8,duration:.95},0));if(!mounted.current||token!==generation.current)return;
  setOpened(false);openedRef.current=false;initialOpen.current=false;state.set({phase:'CLOSED'});
 }catch(e){fail(e);}}
 function configureTurn(target:number){
  const state=useStory.getState();const info:Turn={from:state.chapter,to:target,direction:target>state.chapter?1:-1,incoming:readyScene(target)??{},restoreDialog:state.dialog};turnRef.current=info;setTurn(info);progress.current.value=0;
  const token=generation.current;const load=Promise.all([loadScene(target),preparePaper(target)]).then(([art])=>art);incomingLoad.current=load;
  void load.then(art=>{if(!mounted.current||token!==generation.current||turnRef.current!==info)return;info.incoming=art;setTurn({...info});}).catch(error=>{if(mounted.current&&token===generation.current&&turnRef.current===info)fail(error);});return info;
 }
 async function go(target:number){
  if(target<0||target>=3)return;if(useStory.getState().phase==='ENDING')useStory.getState().set({phase:'EXPLORING'});if(useStory.getState().phase!=='EXPLORING'||target===useStory.getState().chapter)return;
  const token=++generation.current;configureTurn(target);useStory.getState().set({phase:'LOADING_PAGE',dialog:false});
  try{await incomingLoad.current;if(!mounted.current||token!==generation.current)return;useStory.getState().set({phase:'TURNING_PAGE'});await renderWait();playSound('page');await animate(tl=>tl.to(progress.current,{value:1,duration:duration(1.35),ease:'power2.inOut'}));if(!mounted.current||token!==generation.current)return;await openPopup(target,token,true);}catch(e){if(token===generation.current)fail(e);}
 }
 function previewTurn(direction:1|-1,value:number){const s=useStory.getState();if(s.phase==='EXPLORING'){const target=s.chapter+direction;if(target<0||target>=3||!Object.keys(paperRef.current).length)return false;generation.current++;configureTurn(target);s.set({phase:'DRAGGING_PAGE',dialog:false});}if(useStory.getState().phase!=='DRAGGING_PAGE'||turnRef.current?.direction!==direction)return false;progress.current.value=Math.max(0,Math.min(1,value));return true;}
 async function settle(commit:boolean){
  if(useStory.getState().phase!=='DRAGGING_PAGE'||!turnRef.current)return;
  const info=turnRef.current,token=generation.current;useStory.getState().set({phase:'TURNING_PAGE'});
  try{
   if(commit){
    await incomingLoad.current;if(!mounted.current||token!==generation.current)return;playSound('page');
    await animate(tl=>tl.to(progress.current,{value:1,duration:duration(Math.max(.35,(1-progress.current.value)*.9)),ease:'power2.out'}));
    if(!mounted.current||token!==generation.current)return;await openPopup(info.to,token,true);
   }else{
    await animate(tl=>tl.to(progress.current,{value:0,duration:duration(.35),ease:'power2.out'}));
    if(!mounted.current||token!==generation.current)return;clearTurn();hinges.current.forEach(h=>h.rotation.x=0);useStory.getState().set({phase:'EXPLORING',dialog:info.restoreDialog});
   }
  }catch(e){fail(e);}
 }
 function restart(){if(!['ENDING','EXPLORING','ERROR'].includes(useStory.getState().phase))return;generation.current++;timeline.current?.kill();pending.current?.();hinges.current.forEach(g=>g.rotation.x=-Math.PI/2);cover.current.rotation.z=0;root.current.position.x=-1.8;setOpened(false);openedRef.current=false;initialOpen.current=false;setTextures(readyScene(0)??{});clearTurn();useStory.getState().set({phase:'COVER',chapter:0,dialog:false,visited:[],error:null});}
 function interact(){const state=useStory.getState();if(state.phase!=='EXPLORING')return;state.set({dialog:true,visited:[...new Set([...state.visited,state.chapter])]});playSound('hello');const id=scenes[state.chapter].layers.find(l=>l.interactive)!.id;const target=hinges.current.get(`${id}:right`)??hinges.current.get(`${id}:left`);if(target)gsap.fromTo(target.scale,{x:1,y:1,z:1},{x:1.08,y:1.08,z:1.08,duration:.2,yoyo:true,repeat:1,overwrite:true,onComplete:()=>target.scale.set(1,1,1)});}
 useEffect(()=>{mounted.current=true;const current=++generation.current;void prepareStartup(current).catch(error=>{if(mounted.current&&current===generation.current)fail(error);});const director:Director={start:()=>void start(),reveal:()=>void reveal(),close:()=>void close(),go:n=>void go(n),finish:()=>{if(useStory.getState().phase==='EXPLORING'&&useStory.getState().chapter===2)useStory.getState().set({phase:'ENDING',dialog:false});},restart,interact,previewTurn,settleTurn:commit=>void settle(commit),retry:()=>{const state=useStory.getState();state.set({error:null});if(!openedRef.current){if(prepared.current)restart();else{const token=++generation.current;void prepareStartup(token).catch(error=>{if(mounted.current&&token===generation.current)fail(error);});}}else void openPopup(state.chapter,++generation.current).catch(fail);}};onReady(director);return()=>{mounted.current=false;generation.current++;timeline.current?.kill();pending.current?.();hinges.current.forEach(g=>gsap.killTweensOf(g.scale));document.body.style.cursor='';};},[]);
 const moving=turn!==null;const leftChapter=moving&&turn.direction===-1?turn.to:chapter;const rightChapter=moving&&turn.direction===1?turn.to:chapter;const front=moving?paper[`page-${turn.direction===1?turn.from:turn.to}-right`]:null;const back=moving?paper[`page-${turn.direction===1?turn.to:turn.from}-left`]:null;
 return <><Camera/><group ref={root} position={[-1.8,0,0]}>
 <BookBoard x={1.8} materials={materials}/><PaperStack x={1.8} materials={materials}/>
 {paper[`page-${leftChapter}-left`]&&<group ref={pagesRoot} visible={opened}><BookBoard x={-1.8} materials={materials}/><PaperStack x={-1.8} materials={materials}/><PrintedPage texture={paper[`page-${leftChapter}-left`]} left/>{paper[`page-${rightChapter}-right`]&&<PrintedPage texture={paper[`page-${rightChapter}-right`]}/>}<mesh position={[0,.072,2.6]} rotation={[-Math.PI/2,0,-.035]}><planeGeometry args={[.14,1.1]}/><meshBasicMaterial color="#c1876e" side={DoubleSide}/></mesh></group>}
 <group ref={cover} position={[0,COVER_HINGE_Y,0]} visible={!opened||phase==='CLOSING_BOOK'}><BookBoard x={1.8} materials={materials} cover/>{coverTexture&&<mesh position={[1.8,COVER_ART_Y,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[BOOK_BOARD.width,BOOK_BOARD.depth]}/><meshBasicMaterial map={coverTexture}/></mesh>}</group>
 {moving&&front&&back&&<TurningPage front={front} back={back} progress={progress} direction={turn.direction}/>}
 <group ref={popupRoot} visible={opened}>{scenes[chapter].layers.flatMap(l=>(['left','right'] as const).map(side=>{const piece=splitPaperArt(l.position[0],l.size[0],side);return piece&&textures[l.src]?<PaperLayer key={`${chapter}-${l.id}-${side}`} layer={l} piece={piece} texture={textures[l.src]} hinges={hinges} onClick={interact} turn={turn} progress={progress} startOpen={initialOpen.current} sceneChapter={chapter}/>:null;}))}</group>
 <group>{opened&&turn&&scenes[turn.to].layers.flatMap(l=>(['left','right'] as const).map(side=>{const piece=splitPaperArt(l.position[0],l.size[0],side);return piece&&turn.incoming[l.src]?<PaperLayer key={`incoming-${turn.to}-${l.id}-${side}`} layer={l} piece={piece} texture={turn.incoming[l.src]} hinges={hinges} onClick={interact} turn={turn} progress={progress} incoming startOpen sceneChapter={turn.to}/>:null;}))}</group>
 </group><ContextMonitor onFailure={onFailure}/></>;
}
function ContextMonitor({onFailure}:{onFailure:()=>void}){const {gl}=useThree();useEffect(()=>{const handler=(e:Event)=>{e.preventDefault();onFailure();};gl.domElement.addEventListener('webglcontextlost',handler);return()=>gl.domElement.removeEventListener('webglcontextlost',handler);},[gl,onFailure]);return null;}
export default function Storybook({onReady,onFailure}:{onReady:(director:Director)=>void;onFailure:()=>void}){return <Canvas flat shadows={false} orthographic camera={{position:[...BOOK_CAMERA_POSITION],zoom:70,near:.1,far:70}} dpr={Math.min(window.devicePixelRatio,2)} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}}><Book onReady={onReady} onFailure={onFailure}/></Canvas>;}
