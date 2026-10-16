import { useEffect, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Group, Mesh, Texture, PerspectiveCamera, WebGLRenderTarget, DoubleSide } from 'three';
import gsap from 'gsap';
import { loadTexture, loadScene, preloadScene, readyScene } from './assets';
import { type Director, type Layer, scenes, useStory, playSound } from './story';
import { attachedPaperPose, pageReveal, popupFoldAngle, splitPaperArt, type PaperPiece } from './paperAttachments';
import { prepareBookRenderer } from './bookPreparation';
import { BOOK_TARGET_Y, BOOK_CAMERA_POSITION, bookZoom, bookFov } from './bookView';
import { POPUP_SHADOW } from './bookStructure';
import { INTRO_PAGE_COUNT } from './introPlayback';
import { OPEN_BOOK_MATERIALS, OpenCase, PrintedPage, TurningPage, createCardGeometry, createPopupShadowGeometry, createPopupShadowMaterial, popupShadowLean, useDisposable, type BookMaterials } from './bookParts';
type Turn={from:number;to:number;direction:1|-1;incoming:Record<string,Texture>;restoreDialog:boolean};
function Camera(){
 const {camera,size,gl}=useThree();
 useEffect(()=>{const cam=camera as PerspectiveCamera;cam.aspect=size.width/size.height;cam.fov=bookFov(size.width,size.height);cam.lookAt(0,BOOK_TARGET_Y,0);cam.updateProjectionMatrix();gl.domElement.dataset.cameraZoom=String(bookZoom(size.width,size.height));gl.domElement.dataset.cameraFov=cam.fov.toFixed(3);gl.domElement.dataset.cameraX=String(cam.position.x);gl.domElement.dataset.shadows="off";},[camera,size,gl]);return null;
}
function PaperLayer({layer,piece,texture,hinges,onClick,turn,progress,incoming=false,sceneChapter}:{layer:Layer;piece:PaperPiece;texture:Texture;hinges:RefObject<Map<string,Group>>;onClick:()=>void;turn:Turn|null;progress:RefObject<{value:number}>;incoming?:boolean;sceneChapter:number}){
 const anchor=useRef<Group>(null!);const ref=useRef<Group>(null!);const mesh=useRef<Mesh>(null!);const shadow=useRef<Group>(null!);const phase=useStory(s=>s.phase);const dialog=useStory(s=>s.dialog);
 const key=`${incoming?'incoming:':''}${layer.id}:${piece.side}`;
 const geometry=useDisposable(()=>createCardGeometry(piece,layer.size[1]),[piece.width,piece.u0,piece.u1,layer.size[1]]);
 const shadowGeometry=useDisposable(()=>createPopupShadowGeometry(piece,layer.position[1]),[piece.center,piece.width,piece.u0,piece.u1,layer.position[1]]);const shadowMaterial=useDisposable(()=>createPopupShadowMaterial(texture),[texture]);
 useEffect(()=>{const group=ref.current;hinges.current.set(key,group);return()=>{hinges.current.delete(key);};},[key,hinges]);
 useFrame(({clock})=>{
  const root=anchor.current;root.visible=true;
  if(turn){
   const p=progress.current.value;const movingSide=turn.direction===1?'right':'left';const ridesSheet=incoming?piece.side!==movingSide:piece.side===movingSide;
   if(ridesSheet){const face:1|-1=piece.side==='right'?1:-1;const pose=attachedPaperPose(piece.center,layer.position[1],layer.position[2],p,turn.direction,face);root.position.set(...pose.position);root.rotation.z=pose.rotation;root.visible=incoming?p>.35:p<.99999;}
   else {root.position.set(piece.center,layer.position[1]+.018,layer.position[2]);root.rotation.z=0;const reveal=incoming?pageReveal(p,.5,.95):1-pageReveal(p,.45,.92);root.visible=reveal>.0001;}
   ref.current.rotation.x=popupFoldAngle(p,incoming);
  }else{root.position.set(piece.center,layer.position[1]+.018,layer.position[2]);root.rotation.z=0;}
  mesh.current.rotation.z=layer.id==='carrot'&&phase==='EXPLORING'?Math.sin(clock.elapsedTime*1.5)*.025:0;
  // The shadow shortens and fades as the card folds flat, so it needs no animation of its own.
  const lean=popupShadowLean(ref.current.rotation.x);shadow.current.visible=lean>.01;shadow.current.scale.z=Math.max(.001,lean*POPUP_SHADOW.length*layer.size[1]);shadowMaterial.uniforms.opacity.value=POPUP_SHADOW.opacity*lean;
 });
 return <group ref={anchor}><group ref={shadow}><mesh geometry={shadowGeometry} material={shadowMaterial} renderOrder={-1}/></group><group ref={ref}><mesh ref={mesh} geometry={geometry} position={[0,layer.size[1]/2,0]} onClick={!incoming&&layer.interactive?e=>{e.stopPropagation();if(phase==='EXPLORING')onClick();}:undefined} onPointerOver={!incoming&&layer.interactive?()=>{if(phase==='EXPLORING')document.body.style.cursor='pointer';}:undefined} onPointerOut={()=>{document.body.style.cursor='';}}><meshBasicMaterial map={texture} transparent alphaTest={.025} side={DoubleSide} depthWrite/></mesh>{!incoming&&layer.interactive&&sceneChapter===2&&dialog&&<mesh position={[0,2.07,.025]}><circleGeometry args={[.19,32]}/><meshBasicMaterial color="#fff5b4" transparent opacity={.9}/></mesh>}</group></group>;
}
function Book({onReady,onFailure}:{onReady:(director:Director)=>void;onFailure:()=>void}){
 const {gl,scene:world,camera}=useThree();const prepared=useRef(false);
 const hinges=useRef(new Map<string,Group>());const timeline=useRef<gsap.core.Timeline|null>(null);const pending=useRef<(()=>void)|null>(null);const generation=useRef(0);const mounted=useRef(true);const progress=useRef({value:0});const turnRef=useRef<Turn|null>(null);const incomingLoad=useRef<Promise<Record<string,Texture>>|null>(null);const [turn,setTurn]=useState<Turn|null>(null);
 const [materials,setMaterials]=useState<BookMaterials>({});const [textures,setTextures]=useState<Record<string,Texture>>({});const [paper,setPaper]=useState<Record<string,Texture>>({});const paperRef=useRef<Record<string,Texture>>({});const chapter=useStory(s=>s.chapter);const frameCount=useRef({count:0,start:0});
 useFrame(({clock})=>{frameCount.current.count++;if(clock.elapsedTime-frameCount.current.start>2){useStory.getState().set({fps:Math.round(frameCount.current.count/(clock.elapsedTime-frameCount.current.start))});frameCount.current={count:0,start:clock.elapsedTime};}});
 const animate=(fn:(tl:gsap.core.Timeline)=>void)=>new Promise<void>(resolve=>{pending.current=resolve;const tl=gsap.timeline({onComplete:()=>{timeline.current=null;pending.current=null;resolve();}});timeline.current=tl;fn(tl);});
 const renderWait=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 function clearTurn(){turnRef.current=null;setTurn(null);incomingLoad.current=null;progress.current.value=0;}
 function fail(error:unknown){if(!mounted.current)return;timeline.current?.kill();pending.current?.();generation.current++;clearTurn();hinges.current.forEach(h=>h.rotation.x=0);console.error('StoryDirector',error);useStory.getState().set({phase:'ERROR',error:error instanceof Error?error.message:'책을 펼치는 중 잠시 멈췄어요. 다시 시도해 주세요.'});}
 async function preparePaper(target=0){
  const entries=await Promise.all(['left','right'].map(async side=>{const name=`page-${target}-${side}`;return [name,paperRef.current[name]??await loadTexture(name)] as const;}));
  if(!mounted.current)return;paperRef.current={...paperRef.current,...Object.fromEntries(entries)};setPaper(paperRef.current);
 }
 // Draws the first spread once off-screen so its first visible frame does not pay for any remaining GPU setup.
 function warmFirstFrame(){
  const target=new WebGLRenderTarget(128,128);target.texture.colorSpace=gl.outputColorSpace;const previousTarget=gl.getRenderTarget();
  try{gl.setRenderTarget(target);gl.render(world,camera);}finally{gl.setRenderTarget(previousTarget);target.dispose();}
 }
 async function prepareStartup(token:number){
  useStory.getState().set({phase:'INIT',error:null});
  const [firstArt,,materialArt]=await Promise.all([loadScene(0),preparePaper(),Promise.all(OPEN_BOOK_MATERIALS.map(async name=>[name,await loadTexture('book-'+name)] as const)).then(entries=>Object.fromEntries(entries) as Record<string,Texture>)]);
  const active=()=>mounted.current&&token===generation.current;
  if(!active())return;setTextures(firstArt);setMaterials(materialArt);
  if(!await prepareBookRenderer(gl,[...Object.values(materialArt),...Object.values(firstArt),...Object.values(paperRef.current)],world,camera,active,undefined,warmFirstFrame))return;
  prepared.current=true;useStory.getState().set({phase:'COVER'});
 }
 async function openPopup(target:number,token:number,alreadyOpen=false){
  useStory.getState().set({phase:'LOADING_PAGE',dialog:false});const [art]=await Promise.all([loadScene(target),preparePaper(target)]);if(!mounted.current||token!==generation.current)return;
  setTextures(art);useStory.getState().set({chapter:target});clearTurn();await renderWait();if(!mounted.current||token!==generation.current)return;
  if(!alreadyOpen){useStory.getState().set({phase:'OPENING_POPUP'});hinges.current.forEach(h=>h.rotation.x=-Math.PI/2);await animate(tl=>scenes[target].layers.forEach((l,i)=>{for(const side of ['left','right']){const hinge=hinges.current.get(`${l.id}:${side}`);if(hinge)tl.to(hinge.rotation,{x:0,duration:.72,ease:'back.out(1.05)'},i*.13);}}));}
  if(!mounted.current||token!==generation.current)return;useStory.getState().set({phase:'EXPLORING'});preloadScene(target+1);
 }
 // The intro film ends on this exact open spread, so revealing it is only a state change.
 async function reveal(){
  if(useStory.getState().phase!=='COVER'||!prepared.current)return;
  const token=++generation.current;hinges.current.forEach(h=>h.rotation.x=0);
  useStory.getState().set({phase:'LOADING_PAGE',chapter:0,dialog:false,introPagesTurned:INTRO_PAGE_COUNT});
  await renderWait();if(!mounted.current||token!==generation.current)return;
  useStory.getState().set({phase:'EXPLORING'});preloadScene(1);
 }
 function configureTurn(target:number){
  const state=useStory.getState();const info:Turn={from:state.chapter,to:target,direction:target>state.chapter?1:-1,incoming:readyScene(target)??{},restoreDialog:state.dialog};turnRef.current=info;setTurn(info);progress.current.value=0;
  const token=generation.current;const load=Promise.all([loadScene(target),preparePaper(target)]).then(([art])=>art);incomingLoad.current=load;
  void load.then(art=>{if(!mounted.current||token!==generation.current||turnRef.current!==info)return;info.incoming=art;setTurn({...info});}).catch(error=>{if(mounted.current&&token===generation.current&&turnRef.current===info)fail(error);});return info;
 }
 // The last spread's closing message (ENDING) still lets the reader page back.
 const readable=()=>{const s=useStory.getState();if(s.phase==='ENDING')s.set({phase:'EXPLORING'});return useStory.getState().phase==='EXPLORING';};
 async function go(target:number){
  if(target<0||target>=scenes.length||target===useStory.getState().chapter)return;if(!readable())return;
  const token=++generation.current;configureTurn(target);useStory.getState().set({phase:'LOADING_PAGE',dialog:false});
  try{await incomingLoad.current;if(!mounted.current||token!==generation.current)return;useStory.getState().set({phase:'TURNING_PAGE'});await renderWait();playSound('page');await animate(tl=>tl.to(progress.current,{value:1,duration:1.35,ease:'power2.inOut'}));if(!mounted.current||token!==generation.current)return;await openPopup(target,token,true);}catch(e){if(token===generation.current)fail(e);}
 }
 function previewTurn(direction:1|-1,value:number){const s=useStory.getState();if(s.phase==='EXPLORING'||s.phase==='ENDING'){const target=s.chapter+direction;if(target<0||target>=scenes.length||!Object.keys(paperRef.current).length||!readable())return false;generation.current++;configureTurn(target);s.set({phase:'DRAGGING_PAGE',dialog:false});}if(useStory.getState().phase!=='DRAGGING_PAGE'||turnRef.current?.direction!==direction)return false;progress.current.value=Math.max(0,Math.min(1,value));return true;}
 async function settle(commit:boolean){
  if(useStory.getState().phase!=='DRAGGING_PAGE'||!turnRef.current)return;
  const info=turnRef.current,token=generation.current;useStory.getState().set({phase:'TURNING_PAGE'});
  try{
   if(commit){
    await incomingLoad.current;if(!mounted.current||token!==generation.current)return;playSound('page');
    await animate(tl=>tl.to(progress.current,{value:1,duration:Math.max(.35,(1-progress.current.value)*.9),ease:'power2.out'}));
    if(!mounted.current||token!==generation.current)return;await openPopup(info.to,token,true);
   }else{
    await animate(tl=>tl.to(progress.current,{value:0,duration:.35,ease:'power2.out'}));
    if(!mounted.current||token!==generation.current)return;clearTurn();hinges.current.forEach(h=>h.rotation.x=0);useStory.getState().set({phase:'EXPLORING',dialog:info.restoreDialog});
   }
  }catch(e){fail(e);}
 }
 function interact(){const state=useStory.getState();if(state.phase!=='EXPLORING')return;state.set({dialog:true,visited:[...new Set([...state.visited,state.chapter])]});playSound('hello');const id=scenes[state.chapter].layers.find(l=>l.interactive)!.id;const target=hinges.current.get(`${id}:right`)??hinges.current.get(`${id}:left`);if(target)gsap.fromTo(target.scale,{x:1,y:1,z:1},{x:1.08,y:1.08,z:1.08,duration:.2,yoyo:true,repeat:1,overwrite:true,onComplete:()=>target.scale.set(1,1,1)});}
 function retry(){const state=useStory.getState();state.set({error:null});const token=++generation.current;if(!prepared.current)void prepareStartup(token).catch(error=>{if(mounted.current&&token===generation.current)fail(error);});else void openPopup(state.chapter,token,true).catch(fail);}
 useEffect(()=>{mounted.current=true;const current=++generation.current;void prepareStartup(current).catch(error=>{if(mounted.current&&current===generation.current)fail(error);});const director:Director={reveal:()=>void reveal(),go:n=>void go(n),finish:()=>{if(useStory.getState().phase==='EXPLORING'&&useStory.getState().chapter===scenes.length-1)useStory.getState().set({phase:'ENDING',dialog:false});},interact,previewTurn,settleTurn:commit=>void settle(commit),retry};onReady(director);return()=>{mounted.current=false;generation.current++;timeline.current?.kill();pending.current?.();hinges.current.forEach(g=>gsap.killTweensOf(g.scale));document.body.style.cursor='';};},[]);
 const moving=turn!==null;const leftChapter=moving&&turn.direction===-1?turn.to:chapter;const rightChapter=moving&&turn.direction===1?turn.to:chapter;const front=moving?paper[`page-${turn.direction===1?turn.from:turn.to}-right`]:null;const back=moving?paper[`page-${turn.direction===1?turn.to:turn.from}-left`]:null;
 if(!materials.inside)return <Camera/>;
 return <><Camera/><group>
 <OpenCase materials={materials}/>
 {paper[`page-${leftChapter}-left`]&&<PrintedPage texture={paper[`page-${leftChapter}-left`]} edge={materials['paper-edge']} left/>}{paper[`page-${rightChapter}-right`]&&<PrintedPage texture={paper[`page-${rightChapter}-right`]} edge={materials['paper-edge']}/>}
 {moving&&front&&back&&<TurningPage front={front} back={back} progress={progress} direction={turn.direction}/>}
 <group>{scenes[chapter].layers.flatMap(l=>(['left','right'] as const).map(side=>{const piece=splitPaperArt(l.position[0],l.size[0],side);return piece&&textures[l.src]?<PaperLayer key={`${chapter}-${l.id}-${side}`} layer={l} piece={piece} texture={textures[l.src]} hinges={hinges} onClick={interact} turn={turn} progress={progress} sceneChapter={chapter}/>:null;}))}</group>
 <group>{turn&&scenes[turn.to].layers.flatMap(l=>(['left','right'] as const).map(side=>{const piece=splitPaperArt(l.position[0],l.size[0],side);return piece&&turn.incoming[l.src]?<PaperLayer key={`incoming-${turn.to}-${l.id}-${side}`} layer={l} piece={piece} texture={turn.incoming[l.src]} hinges={hinges} onClick={interact} turn={turn} progress={progress} incoming sceneChapter={turn.to}/>:null;}))}</group>
 </group><ContextMonitor onFailure={onFailure}/></>;
}
function ContextMonitor({onFailure}:{onFailure:()=>void}){const {gl}=useThree();useEffect(()=>{const handler=(e:Event)=>{e.preventDefault();onFailure();};gl.domElement.addEventListener('webglcontextlost',handler);return()=>gl.domElement.removeEventListener('webglcontextlost',handler);},[gl,onFailure]);return null;}
export default function Storybook({onReady,onFailure}:{onReady:(director:Director)=>void;onFailure:()=>void}){return <Canvas flat shadows={false} camera={{position:[...BOOK_CAMERA_POSITION],fov:30,near:.1,far:70}} dpr={Math.min(window.devicePixelRatio,2)} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}}><Book onReady={onReady} onFailure={onFailure}/></Canvas>;}
