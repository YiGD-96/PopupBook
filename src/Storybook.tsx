import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { Group, Mesh, Texture, PlaneGeometry, OrthographicCamera, DoubleSide, FrontSide, BackSide } from 'three';
import gsap from 'gsap';
import { loadTexture, loadScene, preloadScene, readyScene } from './assets';
import { type Director, type Layer, scenes, useStory, playSound } from './story';
import { createPaperGeometry, updatePaperGeometry } from './paperGeometry';
import { attachedPaperPose, pageReveal, splitPaperArt, type PaperPiece } from './paperAttachments';
type Turn={from:number;to:number;direction:1|-1;incoming:Record<string,Texture>;restoreDialog:boolean};
function Camera(){
 const {camera,size}=useThree();const isCover=useStory(s=>s.phase==='COVER'||s.phase==='INIT');const moving=useStory(s=>s.phase==='DRAGGING_PAGE'||s.phase==='TURNING_PAGE');const reduce=useStory(s=>s.reduceMotion);
 useEffect(()=>{const cam=camera as OrthographicCamera;cam.lookAt(0,isCover?0:.8,0);const tween=gsap.to(cam,{zoom:Math.min(size.width/(isCover?6.35:moving?9.6:9.1),size.height/(isCover?8.2:moving?6.7:6.05)),duration:reduce?.015:moving?.28:.55,ease:'power2.inOut',onUpdate:()=>cam.updateProjectionMatrix()});return()=>{tween.kill();};},[camera,size,isCover,moving,reduce]);return null;
}
function PaperLayer({layer,piece,texture,hinges,onClick,turn,progress,incoming=false,startOpen=false,sceneChapter}:{layer:Layer;piece:PaperPiece;texture:Texture;hinges:RefObject<Map<string,Group>>;onClick:()=>void;turn:Turn|null;progress:RefObject<{value:number}>;incoming?:boolean;startOpen?:boolean;sceneChapter:number}){
 const anchor=useRef<Group>(null!);const ref=useRef<Group>(null!);const mesh=useRef<Mesh>(null!);const phase=useStory(s=>s.phase);const reduce=useStory(s=>s.reduceMotion);const dialog=useStory(s=>s.dialog);const initialOpen=useRef(startOpen);
 const key=`${incoming?'incoming:':''}${layer.id}:${piece.side}`;
 const geometry=useMemo(()=>{const g=new PlaneGeometry(piece.width,layer.size[1]);const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setX(i,piece.u0+(piece.u1-piece.u0)*uv.getX(i));return g;},[piece.width,piece.u0,piece.u1,layer.size[1]]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useEffect(()=>{const group=ref.current;hinges.current.set(key,group);group.rotation.x=initialOpen.current?0:-Math.PI/2;return()=>{hinges.current.delete(key);};},[key,hinges]);
 useFrame(({clock})=>{
  const root=anchor.current;root.visible=true;
  if(turn){
   const p=progress.current.value;const movingSide=turn.direction===1?'right':'left';const ridesSheet=incoming?piece.side!==movingSide:piece.side===movingSide;
   if(ridesSheet){const face:1|-1=piece.side==='right'?1:-1;const pose=attachedPaperPose(piece.center,layer.position[1],layer.position[2],p,turn.direction,face);root.position.set(...pose.position);root.rotation.z=pose.rotation;ref.current.rotation.x=incoming?0:-Math.PI/2*pageReveal(p,.75,1);root.visible=incoming?p>.35:p<.99999;}
   else {root.position.set(piece.center,layer.position[1]+.018,layer.position[2]);root.rotation.z=0;const reveal=incoming?pageReveal(p,.5,.95):1-pageReveal(p,.45,.92);ref.current.rotation.x=-Math.PI/2*(1-reveal);root.visible=reveal>.0001;}
  }else{root.position.set(piece.center,layer.position[1]+.018,layer.position[2]);root.rotation.z=0;}
  mesh.current.rotation.z=layer.id==='carrot'&&!reduce&&phase==='EXPLORING'?Math.sin(clock.elapsedTime*1.5)*.025:0;
 });
 return <group ref={anchor}><group ref={ref}><mesh ref={mesh} geometry={geometry} position={[0,layer.size[1]/2,0]} onClick={!incoming&&layer.interactive?e=>{e.stopPropagation();if(phase==='EXPLORING')onClick();}:undefined} onPointerOver={!incoming&&layer.interactive?()=>{if(phase==='EXPLORING')document.body.style.cursor='pointer';}:undefined} onPointerOut={()=>{document.body.style.cursor='';}}><meshBasicMaterial map={texture} transparent alphaTest={.025} side={DoubleSide} depthWrite/></mesh>{!incoming&&layer.interactive&&sceneChapter===2&&dialog&&<mesh position={[0,2.07,.025]}><circleGeometry args={[.19,32]}/><meshBasicMaterial color="#fff5b4" transparent opacity={.9}/></mesh>}</group></group>;
}
function PrintedPage({texture,left=false}:{texture:Texture;left?:boolean}){
 const geometry=useMemo(()=>{const g=createPaperGeometry();if(left){g.scale(-1,1,1);const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setX(i,1-uv.getX(i));g.computeVertexNormals();}return g;},[left]);useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry} receiveShadow><meshStandardMaterial map={texture} color="#e5d6b8" side={DoubleSide} roughness={1}/></mesh>;
}
function TurningPage({front,back,progress,direction}:{front:Texture;back:Texture;progress:RefObject<{value:number}>;direction:1|-1}){
 const geometry=useMemo(()=>createPaperGeometry(),[]);const mirrored=useMemo(()=>{const t=back.clone();t.repeat.x=-1;t.offset.x=1;t.needsUpdate=true;return t;},[back]);useEffect(()=>()=>geometry.dispose(),[geometry]);useEffect(()=>()=>mirrored.dispose(),[mirrored]);useFrame(()=>updatePaperGeometry(geometry,progress.current.value,direction));
 return <group position={[0,.018,0]}><mesh geometry={geometry} castShadow renderOrder={4}><meshStandardMaterial map={front} color="#e5d6b8" side={FrontSide} roughness={1}/></mesh><mesh geometry={geometry} castShadow renderOrder={4}><meshStandardMaterial map={mirrored} color="#e5d6b8" side={BackSide} roughness={1}/></mesh></group>;
}
function PaperStack({x}:{x:number}){return <group><mesh position={[x,-.09,0]} receiveShadow><boxGeometry args={[3.57,.26,4.78]}/><meshStandardMaterial color="#e8dbc2" roughness={1}/></mesh>{Array.from({length:6},(_,i)=><mesh key={i} position={[x,-.195+i*.042,2.394]}><boxGeometry args={[3.57,.006,.012]}/><meshBasicMaterial color={i%2?'#cfc0a4':'#f8efd9'}/></mesh>)}</group>;}
function Book({onReady,onFailure}:{onReady:(director:Director)=>void;onFailure:()=>void}){
 const root=useRef<Group>(null!);const cover=useRef<Group>(null!);const hinges=useRef(new Map<string,Group>());const timeline=useRef<gsap.core.Timeline|null>(null);const pending=useRef<(()=>void)|null>(null);const generation=useRef(0);const mounted=useRef(true);const progress=useRef({value:0});const turnRef=useRef<Turn|null>(null);const incomingLoad=useRef<Promise<Record<string,Texture>>|null>(null);const initialOpen=useRef(false);const [turn,setTurn]=useState<Turn|null>(null);
 const [coverTexture,setCoverTexture]=useState<Texture>();const [textures,setTextures]=useState<Record<string,Texture>>({});const [paper,setPaper]=useState<Record<string,Texture>>({});const paperRef=useRef<Record<string,Texture>>({});const chapter=useStory(s=>s.chapter);const phase=useStory(s=>s.phase);const quality=useStory(s=>s.quality);const [opened,setOpened]=useState(false);const openedRef=useRef(false);const frameCount=useRef({count:0,start:0});
 useFrame(({clock})=>{frameCount.current.count++;if(clock.elapsedTime-frameCount.current.start>2){useStory.getState().set({fps:Math.round(frameCount.current.count/(clock.elapsedTime-frameCount.current.start))});frameCount.current={count:0,start:clock.elapsedTime};}});
 const duration=(d:number)=>useStory.getState().reduceMotion?.015:d;
 const animate=(fn:(tl:gsap.core.Timeline)=>void)=>new Promise<void>(resolve=>{pending.current=resolve;const tl=gsap.timeline({onComplete:()=>{timeline.current=null;pending.current=null;resolve();}});timeline.current=tl;fn(tl);});
 const renderWait=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 function clearTurn(){turnRef.current=null;setTurn(null);incomingLoad.current=null;progress.current.value=0;}
 function fail(error:unknown){if(!mounted.current)return;timeline.current?.kill();pending.current?.();generation.current++;clearTurn();hinges.current.forEach(h=>h.rotation.x=0);console.error('StoryDirector',error);useStory.getState().set({phase:'ERROR',error:error instanceof Error?error.message:'책을 펼치는 중 잠시 멈췄어요. 다시 시도해 주세요.'});}
 async function preparePaper(){if(Object.keys(paperRef.current).length===6)return;const entries=await Promise.all(scenes.flatMap((_,i)=>['left','right'].map(async side=>[`page-${i}-${side}`,await loadTexture(`page-${i}-${side}`)])));if(!mounted.current)return;paperRef.current=Object.fromEntries(entries);setPaper(paperRef.current);}
 async function openPopup(target:number,token:number,alreadyOpen=false){
  useStory.getState().set({phase:'LOADING_PAGE',dialog:false});const [art]=await Promise.all([loadScene(target),preparePaper()]);if(!mounted.current||token!==generation.current)return;
  initialOpen.current=alreadyOpen;setTextures(art);useStory.getState().set({chapter:target});clearTurn();await renderWait();if(!mounted.current||token!==generation.current)return;
  if(!alreadyOpen){useStory.getState().set({phase:'OPENING_POPUP'});await animate(tl=>scenes[target].layers.forEach((l,i)=>{for(const side of ['left','right']){const hinge=hinges.current.get(`${l.id}:${side}`);if(hinge)tl.to(hinge.rotation,{x:0,duration:duration(.72),ease:'back.out(1.05)'},duration(i*.13));}}));}
  if(!mounted.current||token!==generation.current)return;useStory.getState().set({phase:'EXPLORING'});preloadScene(target+1);
 }
 async function start(){if(useStory.getState().phase!=='COVER')return;const token=++generation.current;useStory.getState().set({phase:'OPENING_BOOK'});playSound('page');try{await animate(tl=>{tl.to(cover.current.rotation,{z:Math.PI,duration:duration(1.2),ease:'power2.inOut'}).to(root.current.position,{x:0,duration:duration(1.2)},0);});if(!mounted.current||token!==generation.current)return;setOpened(true);openedRef.current=true;await openPopup(0,token);}catch(e){fail(e);}}
 function configureTurn(target:number){
  const state=useStory.getState();const info:Turn={from:state.chapter,to:target,direction:target>state.chapter?1:-1,incoming:readyScene(target)??{},restoreDialog:state.dialog};turnRef.current=info;setTurn(info);progress.current.value=0;
  const token=generation.current;const load=loadScene(target);incomingLoad.current=load;
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
 function restart(){if(!['ENDING','EXPLORING','ERROR'].includes(useStory.getState().phase))return;generation.current++;timeline.current?.kill();pending.current?.();hinges.current.forEach(g=>g.rotation.x=-Math.PI/2);cover.current.rotation.z=0;root.current.position.x=-1.8;setOpened(false);openedRef.current=false;setTextures({});clearTurn();useStory.getState().set({phase:'COVER',chapter:0,dialog:false,visited:[],error:null});}
 function interact(){const state=useStory.getState();if(state.phase!=='EXPLORING')return;state.set({dialog:true,visited:[...new Set([...state.visited,state.chapter])]});playSound('hello');const id=scenes[state.chapter].layers.find(l=>l.interactive)!.id;const target=hinges.current.get(`${id}:right`)??hinges.current.get(`${id}:left`);if(target&&!state.reduceMotion)gsap.fromTo(target.scale,{x:1,y:1,z:1},{x:1.08,y:1.08,z:1.08,duration:.2,yoyo:true,repeat:1,overwrite:true,onComplete:()=>target.scale.set(1,1,1)});}
 useEffect(()=>{mounted.current=true;const current=++generation.current;loadTexture('cover').then(t=>{if(!mounted.current||current!==generation.current)return;setCoverTexture(t);useStory.getState().set({phase:'COVER'});}).catch(fail);const director:Director={start:()=>void start(),go:n=>void go(n),finish:()=>{if(useStory.getState().phase==='EXPLORING'&&useStory.getState().chapter===2)useStory.getState().set({phase:'ENDING',dialog:false});},restart,interact,previewTurn,settleTurn:commit=>void settle(commit),retry:()=>{const state=useStory.getState();state.set({error:null});if(!openedRef.current){restart();loadTexture('cover').then(t=>{if(!mounted.current)return;setCoverTexture(t);state.set({phase:'COVER'});}).catch(fail);}else void openPopup(state.chapter,++generation.current).catch(fail);}};onReady(director);return()=>{mounted.current=false;generation.current++;timeline.current?.kill();pending.current?.();hinges.current.forEach(g=>gsap.killTweensOf(g.scale));document.body.style.cursor='';};},[]);
 const moving=turn!==null;const leftChapter=moving&&turn.direction===-1?turn.to:chapter;const rightChapter=moving&&turn.direction===1?turn.to:chapter;const front=moving?paper[`page-${turn.direction===1?turn.from:turn.to}-right`]:null;const back=moving?paper[`page-${turn.direction===1?turn.to:turn.from}-left`]:null;
 return <><Camera/><ambientLight intensity={.95}/><directionalLight position={[-4,8,5]} intensity={1.65} castShadow={quality!=='low'} shadow-mapSize={[1024,1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={7} shadow-camera-bottom={-6} shadow-camera-far={25} shadow-bias={-.0001} shadow-normalBias={.035}/><group ref={root} position={[-1.8,0,0]} rotation={[0,-.12,0]}>
 <mesh position={[1.8,-.25,0]}><boxGeometry args={[3.76,.12,4.97]}/><meshStandardMaterial color="#b97056" roughness={1}/></mesh><PaperStack x={1.8}/>
 {opened&&<><mesh position={[-1.8,-.25,0]}><boxGeometry args={[3.76,.12,4.97]}/><meshStandardMaterial color="#b97056" roughness={1}/></mesh><PaperStack x={-1.8}/>{paper[`page-${leftChapter}-left`]&&<PrintedPage texture={paper[`page-${leftChapter}-left`]} left/>}{paper[`page-${rightChapter}-right`]&&<PrintedPage texture={paper[`page-${rightChapter}-right`]}/>}<mesh position={[0,.072,2.6]} rotation={[-Math.PI/2,0,-.035]}><planeGeometry args={[.14,1.1]}/><meshStandardMaterial color="#c1876e" side={DoubleSide}/></mesh></>}
 <group ref={cover} position={[0,.22,0]} visible={!opened}><mesh position={[1.8,0,0]}><boxGeometry args={[3.76,.1,4.97]}/><meshStandardMaterial color="#dfa185" roughness={.9}/></mesh>{coverTexture&&<mesh position={[1.8,.056,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[3.76,4.97]}/><meshBasicMaterial map={coverTexture}/></mesh>}</group>
 {moving&&front&&back&&<TurningPage front={front} back={back} progress={progress} direction={turn.direction}/>}
 <group>{opened&&scenes[chapter].layers.flatMap(l=>(['left','right'] as const).map(side=>{const piece=splitPaperArt(l.position[0],l.size[0],side);return piece&&textures[l.src]?<PaperLayer key={`${chapter}-${l.id}-${side}`} layer={l} piece={piece} texture={textures[l.src]} hinges={hinges} onClick={interact} turn={turn} progress={progress} startOpen={initialOpen.current} sceneChapter={chapter}/>:null;}))}</group>
 <group>{opened&&turn&&scenes[turn.to].layers.flatMap(l=>(['left','right'] as const).map(side=>{const piece=splitPaperArt(l.position[0],l.size[0],side);return piece&&turn.incoming[l.src]?<PaperLayer key={`incoming-${turn.to}-${l.id}-${side}`} layer={l} piece={piece} texture={turn.incoming[l.src]} hinges={hinges} onClick={interact} turn={turn} progress={progress} incoming startOpen sceneChapter={turn.to}/>:null;}))}</group>
 </group>{quality!=='low'&&<ContactShadows position={[0,-.32,0]} opacity={.38} scale={16} blur={2.6} far={8} resolution={quality==='high'?512:256} color="#827452"/>}<ContextMonitor onFailure={onFailure}/></>;
}
function ContextMonitor({onFailure}:{onFailure:()=>void}){const {gl}=useThree();useEffect(()=>{const handler=(e:Event)=>{e.preventDefault();onFailure();};gl.domElement.addEventListener('webglcontextlost',handler);return()=>gl.domElement.removeEventListener('webglcontextlost',handler);},[gl,onFailure]);return null;}
export default function Storybook({onReady,onFailure}:{onReady:(director:Director)=>void;onFailure:()=>void}){const quality=useStory(s=>s.quality);return <Canvas shadows={quality!=='low'} orthographic camera={{position:[2.7,8.7,12],zoom:70,near:.1,far:70}} dpr={quality==='low'?1:quality==='high'?Math.min(window.devicePixelRatio,2):Math.min(window.devicePixelRatio,1.5)} gl={{antialias:quality!=='low',alpha:true}}><Book onReady={onReady} onFailure={onFailure}/></Canvas>;}
