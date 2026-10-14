import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { Group, Mesh, Texture, OrthographicCamera, DoubleSide } from 'three';
import gsap from 'gsap';
import { loadTexture, loadScene, preloadScene } from './assets';
import { Director, Layer, scenes, useStory, playSound } from './story';

function Camera(){
 const {camera,size}=useThree();const isCover=useStory(s=>s.phase==='COVER'||s.phase==='INIT');const reduce=useStory(s=>s.reduceMotion);
 useEffect(()=>{const cam=camera as OrthographicCamera;cam.lookAt(0,isCover?0:.7,0);const tween=gsap.to(cam,{zoom:Math.min(size.width/(isCover?6.35:10.3),size.height/8.2),duration:reduce?.015:.7,ease:'power2.inOut',onUpdate:()=>cam.updateProjectionMatrix()});return()=>{tween.kill();};},[camera,size,isCover,reduce]);return null;
}
function PaperLayer({layer,texture,hinges,onClick}:{layer:Layer;texture:Texture;hinges:React.RefObject<Map<string,Group>>;onClick:()=>void}){
 const ref=useRef<Group>(null!);const mesh=useRef<Mesh>(null!);const phase=useStory(s=>s.phase);const reduce=useStory(s=>s.reduceMotion);const chapter=useStory(s=>s.chapter);const dialog=useStory(s=>s.dialog);
 useEffect(()=>{const group=ref.current;hinges.current.set(layer.id,group);group.rotation.x=-Math.PI/2;return()=>{hinges.current.delete(layer.id);};},[layer.id,hinges]);
 useFrame(({clock})=>{if(layer.id==='carrot'&&!reduce&&phase==='EXPLORING')mesh.current.rotation.z=Math.sin(clock.elapsedTime*1.5)*.025;});
 return <group ref={ref} position={layer.position}><mesh ref={mesh} position={[0,layer.size[1]/2,0]} renderOrder={3} onClick={layer.interactive?e=>{e.stopPropagation();if(phase==='EXPLORING')onClick();}:undefined} onPointerOver={layer.interactive?()=>{document.body.style.cursor=phase==='EXPLORING'?'pointer':'default';}:undefined} onPointerOut={()=>{document.body.style.cursor='default';}}><planeGeometry args={layer.size}/><meshBasicMaterial map={texture} transparent alphaTest={.025} side={DoubleSide} depthWrite={false}/></mesh>{layer.interactive&&chapter===2&&dialog&&<mesh position={[0,2.07,.025]}><circleGeometry args={[.19,32]}/><meshBasicMaterial color="#fff5b4" transparent opacity={.9}/></mesh>}</group>;
}
function Book({onReady,onFailure}:{onReady:(director:Director)=>void;onFailure:()=>void}){
 const root=useRef<Group>(null!);const cover=useRef<Group>(null!);const page=useRef<Group>(null!);const hinges=useRef(new Map<string,Group>());const timeline=useRef<gsap.core.Timeline|null>(null);const generation=useRef(0);const mounted=useRef(true);
 const [coverTexture,setCoverTexture]=useState<Texture>();const [textures,setTextures]=useState<Record<string,Texture>>({});const chapter=useStory(s=>s.chapter);const phase=useStory(s=>s.phase);const quality=useStory(s=>s.quality);const [opened,setOpened]=useState(false);const openedRef=useRef(false);const frameCount=useRef({count:0,start:0});
 useFrame(({clock})=>{frameCount.current.count++;if(clock.elapsedTime-frameCount.current.start>2){useStory.getState().set({fps:Math.round(frameCount.current.count/(clock.elapsedTime-frameCount.current.start))});frameCount.current={count:0,start:clock.elapsedTime};}});
 const duration=(d:number)=>useStory.getState().reduceMotion?.015:d;
 const animate=(fn:(tl:gsap.core.Timeline)=>void)=>new Promise<void>(resolve=>{const tl=gsap.timeline({onComplete:()=>{timeline.current=null;resolve();}});timeline.current=tl;fn(tl);});
 const renderWait=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 function fail(error:unknown){console.error('StoryDirector',error);if(mounted.current)useStory.getState().set({phase:'ERROR',error:error instanceof Error?error.message:'책을 펼치는 중 잠시 멈췄어요. 다시 시도해 주세요.'});}
 async function openPopup(target:number,token:number){
  const state=useStory.getState();state.set({phase:'LOADING_PAGE',dialog:false});
  const art=await loadScene(target);if(!mounted.current||token!==generation.current)return;
  setTextures(art);state.set({chapter:target});await renderWait();if(!mounted.current||token!==generation.current)return;
  state.set({phase:'OPENING_POPUP'});
  await animate(tl=>{scenes[target].layers.forEach((l,i)=>{const hinge=hinges.current.get(l.id);if(hinge)tl.to(hinge.rotation,{x:0,duration:duration(.68),ease:'back.out(1.05)'},duration(i*.14));});});
  if(!mounted.current||token!==generation.current)return;state.set({phase:'EXPLORING'});preloadScene(target+1);
 }
 async function start(){if(useStory.getState().phase!=='COVER')return;const token=++generation.current;useStory.getState().set({phase:'OPENING_BOOK'});playSound('page');try{await animate(tl=>{tl.to(cover.current.rotation,{z:Math.PI,duration:duration(1.05),ease:'power2.inOut'}).to(root.current.position,{x:0,duration:duration(1.05)},0);});if(!mounted.current||token!==generation.current)return;setOpened(true);openedRef.current=true;await openPopup(0,token);}catch(e){fail(e);}}
 async function go(target:number){if(useStory.getState().phase!=='EXPLORING'||target<0||target>=3||target===useStory.getState().chapter)return;const token=++generation.current;const reverse=target<useStory.getState().chapter;useStory.getState().set({phase:'CLOSING_POPUP',dialog:false});try{await animate(tl=>{[...hinges.current.values()].reverse().forEach((h,i)=>tl.to(h.rotation,{x:-Math.PI/2,duration:duration(.4),ease:'power2.in'},duration(i*.05)));});if(!mounted.current||token!==generation.current)return;useStory.getState().set({phase:'TURNING_PAGE'});playSound('page');page.current.rotation.z=reverse?Math.PI:0;await animate(tl=>tl.to(page.current.rotation,{z:reverse?0:Math.PI,duration:duration(.75),ease:'power2.inOut'}));if(!mounted.current||token!==generation.current)return;page.current.rotation.z=0;await openPopup(target,token);}catch(e){fail(e);}}
 function restart(){if(!['ENDING','EXPLORING','ERROR'].includes(useStory.getState().phase))return;generation.current++;timeline.current?.kill();hinges.current.forEach(g=>g.rotation.x=-Math.PI/2);cover.current.rotation.z=0;root.current.position.x=-1.8;setOpened(false);openedRef.current=false;setTextures({});useStory.getState().set({phase:'COVER',chapter:0,dialog:false,visited:[],error:null});}
 function interact(){const state=useStory.getState();if(state.phase!=='EXPLORING')return;state.set({dialog:true,visited:[...new Set([...state.visited,state.chapter])]});playSound('hello');const target=hinges.current.get(scenes[state.chapter].layers.find(l=>l.interactive)!.id);if(target&&!state.reduceMotion){gsap.fromTo(target.scale,{x:1,y:1,z:1},{x:1.08,y:1.08,z:1.08,duration:.2,yoyo:true,repeat:1,onComplete:()=>target.scale.set(1,1,1)});}}
 useEffect(()=>{mounted.current=true;const current=++generation.current;loadTexture('cover').then(t=>{if(!mounted.current||current!==generation.current)return;setCoverTexture(t);useStory.getState().set({phase:'COVER'});}).catch(fail);const director:Director={start:()=>void start(),go:n=>void go(n),finish:()=>{if(useStory.getState().phase==='EXPLORING'&&useStory.getState().chapter===2)useStory.getState().set({phase:'ENDING',dialog:false});},restart,interact,retry:()=>{const state=useStory.getState();state.set({error:null});if(!openedRef.current){restart();loadTexture('cover').then(t=>{if(!mounted.current)return;setCoverTexture(t);state.set({phase:'COVER'});}).catch(fail);}else void openPopup(state.chapter,++generation.current).catch(fail);}};onReady(director);return()=>{mounted.current=false;generation.current++;timeline.current?.kill();hinges.current.forEach(g=>gsap.killTweensOf(g.scale));document.body.style.cursor='default';};},[]);
 const turning=phase==='TURNING_PAGE';
 return <><Camera/><ambientLight intensity={2.1}/><directionalLight position={[-3,9,4]} intensity={2.7}/><group ref={root} position={[-1.8,0,0]} rotation={[0,-.16,0]}>
  <mesh position={[1.8,-.13,0]}><boxGeometry args={[3.75,.14,4.95]}/><meshStandardMaterial color="#b97056" roughness={1}/></mesh>
  <mesh position={[1.8,-.025,0]}><boxGeometry args={[3.55,.16,4.75]}/><meshStandardMaterial color="#e9dfca" roughness={1}/></mesh>
  {opened&&<><mesh position={[-1.8,-.13,0]}><boxGeometry args={[3.75,.14,4.95]}/><meshStandardMaterial color="#b97056" roughness={1}/></mesh><mesh position={[-1.8,-.025,0]}><boxGeometry args={[3.55,.16,4.75]}/><meshStandardMaterial color="#e9dfca" roughness={1}/></mesh><mesh position={[-1.8,.095,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[3.55,4.75]}/><meshStandardMaterial color="#f9f3df" roughness={1}/></mesh></>}
  <mesh position={[1.8,.095,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[3.55,4.75]}/><meshStandardMaterial color="#fbf5e4" roughness={1}/></mesh>
  <group ref={cover} position={[0,.13,0]} visible={!opened}><mesh position={[1.8,0,0]}><boxGeometry args={[3.75,.1,4.95]}/><meshStandardMaterial color="#dfa185" roughness={.9}/></mesh>{coverTexture&&<mesh position={[1.8,.056,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[3.75,4.95]}/><meshBasicMaterial map={coverTexture}/></mesh>}</group>
  {opened&&<mesh position={[0,.16,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.045,4.75]}/><meshBasicMaterial color="#d9cdb3" transparent opacity={.6}/></mesh>}
  <group ref={page} position={[0,.19,0]} visible={turning}><mesh position={[1.8,0,0]}><boxGeometry args={[3.55,.025,4.75]}/><meshStandardMaterial color="#f8f0da" side={DoubleSide}/></mesh></group>
  <group visible={!turning}>{opened&&scenes[chapter].layers.map(l=>textures[l.src]&&<PaperLayer key={`${chapter}-${l.id}`} layer={l} texture={textures[l.src]} hinges={hinges} onClick={interact}/>)}</group>
 </group>{quality!=='low'&&<ContactShadows position={[0,-.22,0]} opacity={.3} scale={16} blur={2.9} far={8} resolution={quality==='high'?512:256} color="#827452"/>}<ContextMonitor onFailure={onFailure}/></>;
}
function ContextMonitor({onFailure}:{onFailure:()=>void}){const {gl}=useThree();useEffect(()=>{const handler=(e:Event)=>{e.preventDefault();onFailure();};gl.domElement.addEventListener('webglcontextlost',handler);return()=>gl.domElement.removeEventListener('webglcontextlost',handler);},[gl,onFailure]);return null;}
export default function Storybook({onReady,onFailure}:{onReady:(director:Director)=>void;onFailure:()=>void}){
 const quality=useStory(s=>s.quality);return <Canvas orthographic camera={{position:[3.6,10.5,12],zoom:70,near:.1,far:70}} dpr={quality==='low'?1:quality==='high'?Math.min(window.devicePixelRatio,2):Math.min(window.devicePixelRatio,1.5)} gl={{antialias:quality!=='low',alpha:true}}><Book onReady={onReady} onFailure={onFailure}/></Canvas>;
}
