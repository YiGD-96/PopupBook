import { useEffect, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Group, Mesh, Texture, PerspectiveCamera, WebGLRenderTarget, DoubleSide } from 'three';
import gsap from 'gsap';
import { loadTexture, loadScene, readyScene } from './assets';
import { type Director, type Layer, scenes, useStory, playSound } from './story';
import { attachedPaperPose, pageReveal, popupFoldAngle, splitPaperArt, type PaperPiece } from './paperAttachments';
import { prepareBookRenderer } from './bookPreparation';
import { BOOK_TARGET_Y, BOOK_CAMERA_POSITION, bookZoom, bookFov } from './bookView';
import { INTRO_PAGE_COUNT } from './introPlayback';
import { StandingCase, StandingLayer } from './standingBook';
import { isBackdrop } from './standingLayout';
import { STANDING_CAMERA_POSITION, STANDING_QUERY, STANDING_TARGET, standingFov } from './standingView';
import { OPEN_BOOK_MATERIALS, OpenCase, PrintedPage, TurningPage, createCardGeometry, useDisposable, type BookMaterials } from './bookParts';
type Turn={from:number;to:number;direction:1|-1;incoming:Record<string,Texture>;restoreDialog:boolean};
/** Phones held upright show the standing book (src/standingBook.tsx); the story director below is the same for both. */
function useStanding(){
 const [standing,setStanding]=useState(()=>typeof matchMedia==='function'&&matchMedia(STANDING_QUERY).matches);
 useEffect(()=>{const query=matchMedia(STANDING_QUERY),update=()=>setStanding(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 return standing;
}
function Camera({standing=false}:{standing?:boolean}){
 const {camera,size,gl}=useThree();
 useEffect(()=>{const cam=camera as PerspectiveCamera;cam.aspect=size.width/size.height;
  if(standing){cam.position.set(...STANDING_CAMERA_POSITION);cam.fov=standingFov(size.width,size.height);cam.lookAt(...STANDING_TARGET);}
  else{cam.position.set(...BOOK_CAMERA_POSITION);cam.fov=bookFov(size.width,size.height);cam.lookAt(0,BOOK_TARGET_Y,0);}
  cam.updateProjectionMatrix();gl.domElement.dataset.cameraZoom=String(bookZoom(size.width,size.height));gl.domElement.dataset.cameraFov=cam.fov.toFixed(3);gl.domElement.dataset.cameraX=String(cam.position.x);gl.domElement.dataset.shadows="off";gl.domElement.dataset.standing=String(standing);},[camera,size,gl,standing]);return null;
}
function PaperLayer({layer,piece,texture,hinges,onClick,turn,progress,incoming=false}:{layer:Layer;piece:PaperPiece;texture:Texture;hinges:RefObject<Map<string,Group>>;onClick:(detail?:string)=>void;turn:Turn|null;progress:RefObject<{value:number}>;incoming?:boolean}){
 const anchor=useRef<Group>(null!);const ref=useRef<Group>(null!);const mesh=useRef<Mesh>(null!);const phase=useStory(s=>s.phase);
 const key=`${incoming?'incoming:':''}${layer.id}:${piece.side}`;
 const geometry=useDisposable(()=>createCardGeometry(piece,layer.size[1]),[piece.width,piece.u0,piece.u1,layer.size[1]]);
 useEffect(()=>{const group=ref.current;hinges.current.set(key,group);return()=>{hinges.current.delete(key);};},[key,hinges]);
 useFrame(({clock})=>{
  const root=anchor.current;root.visible=true;
  if(turn){
   const p=progress.current.value;const movingSide=turn.direction===1?'right':'left';const ridesSheet=incoming?piece.side!==movingSide:piece.side===movingSide;
   if(ridesSheet){const face:1|-1=piece.side==='right'?1:-1;const pose=attachedPaperPose(piece.center,layer.position[1],layer.position[2],p,turn.direction,face);root.position.set(...pose.position);root.rotation.z=pose.rotation;root.visible=incoming?p>.35:p<.99999;}
   else {root.position.set(piece.center,layer.position[1]+.018,layer.position[2]);root.rotation.z=0;const reveal=incoming?pageReveal(p,.5,.95):1-pageReveal(p,.45,.92);root.visible=reveal>.0001;}
   ref.current.rotation.x=popupFoldAngle(p,incoming);
  }else{root.position.set(piece.center,layer.position[1]+.018,layer.position[2]);root.rotation.z=0;}
  // Clickable cards sway a little, each on its own beat, so the reader can tell which ones open a story.
  mesh.current.rotation.z=layer.interactive&&phase==='EXPLORING'?Math.sin(clock.elapsedTime*1.5+layer.position[0]*1.7)*.025:0;
 });
 return <group ref={anchor}><group ref={ref}><mesh ref={mesh} geometry={geometry} position={[0,layer.size[1]/2,0]} onClick={!incoming&&layer.interactive?e=>{e.stopPropagation();if(phase==='EXPLORING')onClick(layer.detail);}:undefined} onPointerOver={!incoming&&layer.interactive?()=>{if(phase==='EXPLORING')document.body.style.cursor='pointer';}:undefined} onPointerOut={()=>{document.body.style.cursor='';}}><meshBasicMaterial map={texture} transparent alphaTest={.025} side={DoubleSide} depthWrite/></mesh></group></group>;
}
function Book({onReady,onFailure}:{onReady:(director:Director)=>void;onFailure:()=>void}){
 const {gl,scene:world,camera}=useThree();const prepared=useRef(false);
 const hinges=useRef(new Map<string,Group>());const timeline=useRef<gsap.core.Timeline|null>(null);const pending=useRef<(()=>void)|null>(null);const generation=useRef(0);const mounted=useRef(true);const progress=useRef({value:0});const turnRef=useRef<Turn|null>(null);const incomingLoad=useRef<Promise<Record<string,Texture>>|null>(null);const [turn,setTurn]=useState<Turn|null>(null);
 const [materials,setMaterials]=useState<BookMaterials>({});const [textures,setTextures]=useState<Record<string,Texture>>({});const [paper,setPaper]=useState<Record<string,Texture>>({});const paperRef=useRef<Record<string,Texture>>({});const chapter=useStory(s=>s.chapter);const frameCount=useRef({count:0,start:0});
 const standing=useStanding();const standingRef=useRef(standing);standingRef.current=standing;const stand=useRef({value:1});
 useFrame(({clock})=>{frameCount.current.count++;if(clock.elapsedTime-frameCount.current.start>2){useStory.getState().set({fps:Math.round(frameCount.current.count/(clock.elapsedTime-frameCount.current.start))});frameCount.current={count:0,start:clock.elapsedTime};}});
 const animate=(fn:(tl:gsap.core.Timeline)=>void)=>new Promise<void>(resolve=>{pending.current=resolve;const tl=gsap.timeline({onComplete:()=>{timeline.current=null;pending.current=null;resolve();}});timeline.current=tl;fn(tl);});
 const renderWait=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 function clearTurn(){turnRef.current=null;setTurn(null);incomingLoad.current=null;progress.current.value=0;}
 function fail(error:unknown){if(!mounted.current)return;timeline.current?.kill();pending.current?.();generation.current++;clearTurn();hinges.current.forEach(h=>h.rotation.x=0);stand.current.value=1;console.error('StoryDirector',error);useStory.getState().set({phase:'ERROR',error:error instanceof Error?error.message:'책을 펼치는 중 잠시 멈췄어요. 다시 시도해 주세요.'});}
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
  useStory.getState().set({phase:'LOADING_PAGE',dialog:false,detail:null});const [art]=await Promise.all([loadScene(target),preparePaper(target)]);if(!mounted.current||token!==generation.current)return;
  setTextures(art);useStory.getState().set({chapter:target});clearTurn();await renderWait();if(!mounted.current||token!==generation.current)return;
  if(!alreadyOpen){useStory.getState().set({phase:'OPENING_POPUP'});hinges.current.forEach(h=>h.rotation.x=-Math.PI/2);await animate(tl=>scenes[target].layers.forEach((l,i)=>{for(const side of ['left','right']){const hinge=hinges.current.get(`${l.id}:${side}`);if(hinge)tl.to(hinge.rotation,{x:0,duration:.72,ease:'back.out(1.05)'},i*.13);}}));}
  if(!mounted.current||token!==generation.current)return;useStory.getState().set({phase:'EXPLORING'});warmChapter(target+1,token);
 }
 /** While the reader looks at a spread, the next chapter's textures are fetched, decoded off-thread and uploaded one per few frames,
  * so turning the page does not pay for those uploads. Stops as soon as anything else starts. */
 function warmChapter(target:number,token:number){
  if(target>=scenes.length)return;
  void Promise.all([loadScene(target),preparePaper(target)]).then(([art])=>{
   const queue=[...Object.values(art),...['left','right'].map(side=>paperRef.current[`page-${target}-${side}`]).filter(Boolean)];
   const step=()=>{if(!mounted.current||token!==generation.current||useStory.getState().phase!=='EXPLORING')return;const texture=queue.shift();if(!texture)return;gl.initTexture(texture);window.setTimeout(()=>requestAnimationFrame(step),150);};
   requestAnimationFrame(step);
  }).catch(()=>{});
 }
 // The intro film ends on this exact open spread (on phones, the phone film on the standing book), so revealing it is only a state change.
 async function reveal(standingFilmed=false){
  if(useStory.getState().phase!=='COVER'||!prepared.current)return;
  const token=++generation.current;hinges.current.forEach(h=>h.rotation.x=0);
  useStory.getState().set({phase:'LOADING_PAGE',chapter:0,dialog:false,detail:null,introPagesTurned:INTRO_PAGE_COUNT});
  // Only when the standing book follows the open book's film (the phone was turned during the intro) does it first lie open and stand
  // its first half up while the cards pop up.
  const standUp=standingRef.current&&!standingFilmed;
  if(standUp){stand.current.value=0;hinges.current.forEach(h=>h.rotation.x=-Math.PI/2);}
  await renderWait();if(!mounted.current||token!==generation.current)return;
  if(standUp){
   useStory.getState().set({phase:'OPENING_POPUP'});
   await animate(tl=>{tl.to(stand.current,{value:1,duration:.8,ease:'power2.inOut'},0);scenes[0].layers.forEach((l,i)=>{const hinge=hinges.current.get(`${l.id}:right`);if(hinge)tl.to(hinge.rotation,{x:0,duration:.55,ease:'back.out(1.1)'},.42+i*.06);});});
   if(!mounted.current||token!==generation.current)return;
  }
  stand.current.value=1;useStory.getState().set({phase:'EXPLORING'});warmChapter(1,token);
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
  const token=++generation.current;configureTurn(target);useStory.getState().set({phase:'LOADING_PAGE',dialog:false,detail:null});
  try{await incomingLoad.current;if(!mounted.current||token!==generation.current)return;useStory.getState().set({phase:'TURNING_PAGE'});await renderWait();playSound('page');await animate(tl=>tl.to(progress.current,{value:1,duration:1.35,ease:'power2.inOut'}));if(!mounted.current||token!==generation.current)return;await openPopup(target,token,true);}catch(e){if(token===generation.current)fail(e);}
 }
 function previewTurn(direction:1|-1,value:number){const s=useStory.getState();if(s.phase==='EXPLORING'||s.phase==='ENDING'){const target=s.chapter+direction;if(target<0||target>=scenes.length||!Object.keys(paperRef.current).length||!readable())return false;generation.current++;configureTurn(target);s.set({phase:'DRAGGING_PAGE',dialog:false,detail:null});}if(useStory.getState().phase!=='DRAGGING_PAGE'||turnRef.current?.direction!==direction)return false;progress.current.value=Math.max(0,Math.min(1,value));return true;}
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
 /** Opens a story in the side panel: a clicked card's own detail, or (from the button) the chapter's main one; the card answers with a hop. */
 function interact(detail?:string){const state=useStory.getState();if(state.phase!=='EXPLORING')return;const scene=scenes[state.chapter],id=detail??scene.detail;state.set({dialog:true,detail:id,visited:[...new Set([...state.visited,state.chapter])]});playSound('hello');const layer=scene.layers.find(l=>l.detail===id)??scene.layers.find(l=>l.interactive);if(!layer)return;const target=hinges.current.get(`${layer.id}:right`)??hinges.current.get(`${layer.id}:left`);if(target)gsap.fromTo(target.scale,{x:1,y:1,z:1},{x:1.08,y:1.08,z:1.08,duration:.2,yoyo:true,repeat:1,overwrite:true,onComplete:()=>target.scale.set(1,1,1)});}
 function retry(){const state=useStory.getState();state.set({error:null});const token=++generation.current;if(!prepared.current)void prepareStartup(token).catch(error=>{if(mounted.current&&token===generation.current)fail(error);});else void openPopup(state.chapter,token,true).catch(fail);}
 useEffect(()=>{mounted.current=true;const current=++generation.current;void prepareStartup(current).catch(error=>{if(mounted.current&&current===generation.current)fail(error);});const director:Director={reveal:standingFilmed=>void reveal(standingFilmed),go:n=>void go(n),finish:()=>{if(useStory.getState().phase==='EXPLORING'&&useStory.getState().chapter===scenes.length-1)useStory.getState().set({phase:'ENDING',dialog:false});},interact,previewTurn,settleTurn:commit=>void settle(commit),retry};onReady(director);return()=>{mounted.current=false;generation.current++;timeline.current?.kill();pending.current?.();hinges.current.forEach(g=>gsap.killTweensOf(g.scale));document.body.style.cursor='';};},[]);
 const moving=turn!==null;const leftChapter=moving&&turn.direction===-1?turn.to:chapter;const rightChapter=moving&&turn.direction===1?turn.to:chapter;const front=moving?paper[`page-${turn.direction===1?turn.from:turn.to}-right`]:null;const back=moving?paper[`page-${turn.direction===1?turn.to:turn.from}-left`]:null;
 if(!materials.inside)return <Camera standing={standing}/>;
 if(standing){
  // The upright page shows the backdrop of the spread being uncovered (going back) or covered (going forward); the turning sheet's
  // other face carries the backdrop it uncovers or brings.
  // The flat page under the cards takes the spread's paper tone (src/story.ts `paper`); the sheet's paper face the one it turns over.
  const paperOf=(target:number)=>(scenes[target] as {paper?:string}).paper;
  const backdropOf=(target:number,art:Record<string,Texture>)=>{const layer=scenes[target].layers.find(isBackdrop);return layer?art[layer.src]:undefined;};
  const upright=moving&&turn.direction===-1?backdropOf(turn.to,turn.incoming)??backdropOf(chapter,textures):backdropOf(chapter,textures);
  const sheet=moving?(turn.direction===1?backdropOf(turn.to,turn.incoming):backdropOf(chapter,textures)):undefined;
  return <><Camera standing/>
   <StandingCase materials={materials} backdrop={upright} turnBackdrop={sheet} turning={moving?turn.direction:0} progress={progress} stand={stand}
    floor={paperOf(moving&&turn.direction===1?turn.to:chapter)} sheetFloor={moving?paperOf(turn.direction===1?turn.from:turn.to):undefined}/>
   <group>{scenes[chapter].layers.filter(l=>!isBackdrop(l)).map(l=>textures[l.src]?<StandingLayer key={`${chapter}-${l.id}`} layer={l} texture={textures[l.src]} hinges={hinges} onClick={interact} turn={turn} progress={progress}/>:null)}</group>
   <group>{turn&&scenes[turn.to].layers.filter(l=>!isBackdrop(l)).map(l=>turn.incoming[l.src]?<StandingLayer key={`incoming-${turn.to}-${l.id}`} layer={l} texture={turn.incoming[l.src]} hinges={hinges} onClick={interact} turn={turn} progress={progress} incoming/>:null)}</group>
   <ContextMonitor onFailure={onFailure}/></>;
 }
 return <><Camera/><group>
 <OpenCase materials={materials}/>
 {paper[`page-${leftChapter}-left`]&&<PrintedPage texture={paper[`page-${leftChapter}-left`]} edge={materials['paper-edge']} left/>}{paper[`page-${rightChapter}-right`]&&<PrintedPage texture={paper[`page-${rightChapter}-right`]} edge={materials['paper-edge']}/>}
 {moving&&front&&back&&<TurningPage front={front} back={back} progress={progress} direction={turn.direction}/>}
 <group>{scenes[chapter].layers.flatMap(l=>(['left','right'] as const).map(side=>{const piece=splitPaperArt(l.position[0],l.size[0],side);return piece&&textures[l.src]?<PaperLayer key={`${chapter}-${l.id}-${side}`} layer={l} piece={piece} texture={textures[l.src]} hinges={hinges} onClick={interact} turn={turn} progress={progress}/>:null;}))}</group>
 <group>{turn&&scenes[turn.to].layers.flatMap(l=>(['left','right'] as const).map(side=>{const piece=splitPaperArt(l.position[0],l.size[0],side);return piece&&turn.incoming[l.src]?<PaperLayer key={`incoming-${turn.to}-${l.id}-${side}`} layer={l} piece={piece} texture={turn.incoming[l.src]} hinges={hinges} onClick={interact} turn={turn} progress={progress} incoming/>:null;}))}</group>
 </group><ContextMonitor onFailure={onFailure}/></>;
}
function ContextMonitor({onFailure}:{onFailure:()=>void}){const {gl}=useThree();useEffect(()=>{const handler=(e:Event)=>{e.preventDefault();onFailure();};gl.domElement.addEventListener('webglcontextlost',handler);return()=>gl.domElement.removeEventListener('webglcontextlost',handler);},[gl,onFailure]);return null;}
export default function Storybook({onReady,onFailure}:{onReady:(director:Director)=>void;onFailure:()=>void}){return <Canvas flat shadows={false} camera={{position:[...BOOK_CAMERA_POSITION],fov:30,near:.1,far:70}} dpr={Math.min(window.devicePixelRatio,2)} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}}><Book onReady={onReady} onFailure={onFailure}/></Canvas>;}
