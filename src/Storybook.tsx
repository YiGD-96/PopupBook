import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Canvas, advance, useFrame, useThree } from '@react-three/fiber';
import { Group, Mesh, Texture, PerspectiveCamera, Vector3, WebGLRenderTarget, type MeshBasicMaterial } from 'three';
import gsap from 'gsap';
import { loadTexture, loadScene, readyScene } from './assets';
import { type Director, type Layer, scenes, useStory, playSound } from './story';
import { PAGE_UPRIGHT, attachedPaperPose, pageReveal, popupFoldAngle, splitPaperArt, type PaperPiece } from './paperAttachments';
import { prepareBookRenderer } from './bookPreparation';
import { BOOK_TARGET_Y, BOOK_CAMERA_POSITION, bookZoom, bookFov } from './bookView';
import { INTRO_PAGE_COUNT } from './introPlayback';
import { ResolutionGovernor } from './framePacing';
import { flatLift, gluedParent, riseOrder, stackRanks } from './popupStack';
import { darkHalo, haloTone, idle, lightHalo, loadHalo, pulseHalos, restHalo, seenStories } from './cardHalo';
import { StandingCase, StandingGluedCard, StandingLayer } from './standingBook';
import { isBackdrop, standingPlacement } from './standingLayout';
import { STANDING_CAMERA_POSITION, STANDING_QUERY, STANDING_TARGET, standingFov } from './standingView';
import { STANDING_DROP } from './standingMedia';
import { CardHalo, DeskBackdrop, DeskFog, OPEN_BOOK_MATERIALS, OpenCase, cardMaterial, sheetMaterials, warmMaterials, PrintedPage, TurningPage, createCardGeometry, useDisposable, type BookMaterials } from './bookParts';
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
  // Standing, the picture is drawn a little low (room for the chapter title above), as the phone film is (App.tsx --standing-drop).
  if(standing){cam.position.set(...STANDING_CAMERA_POSITION);cam.fov=standingFov(size.width,size.height);cam.lookAt(...STANDING_TARGET);cam.setViewOffset(size.width,size.height,0,-STANDING_DROP,size.width,size.height);}
  else{cam.position.set(...BOOK_CAMERA_POSITION);cam.fov=bookFov(size.width,size.height);cam.lookAt(0,BOOK_TARGET_Y,0);cam.clearViewOffset();}
  cam.updateProjectionMatrix();gl.domElement.dataset.cameraZoom=String(bookZoom(size.width,size.height));gl.domElement.dataset.cameraFov=cam.fov.toFixed(3);gl.domElement.dataset.cameraX=String(cam.position.x);gl.domElement.dataset.shadows="off";gl.domElement.dataset.standing=String(standing);},[camera,size,gl,standing]);return null;
}
type CardProps={layer:Layer;piece:PaperPiece;texture:Texture;hinges:RefObject<Map<string,Group>>;onClick:(detail?:string)=>void;incoming?:boolean};
/** The card's face: its picture, the click that opens its story and the glow that marks it clickable. */
function CardFace({layer,piece,texture,onClick,incoming=false}:Omit<CardProps,'hinges'>){
 const phase=useStory(s=>s.phase);
 const geometry=useDisposable(()=>createCardGeometry(piece,layer.size[1]),[piece.width,piece.u0,piece.u1,layer.size[1]]);
 // Clickable cards glow (src/cardHalo.ts): a rim at rest, full when pointed at. They are wholly on one page, so the halo is the whole card's.
 const glows=!!layer.interactive&&piece.u0<1e-6&&piece.u1>1-1e-6,live=!incoming&&glows;
 return <>{glows&&<CardHalo layer={layer} texture={texture} width={piece.width} height={layer.size[1]} incoming={incoming}/>}<mesh geometry={geometry} material={cardMaterial(texture)} dispose={null} position={[0,layer.size[1]/2,0]} onClick={live?e=>{e.stopPropagation();if(phase==='EXPLORING'||phase==='ENDING')onClick(layer.detail);}:undefined} onPointerOver={live?()=>{if(phase==='EXPLORING'||phase==='ENDING'){document.body.style.cursor='pointer';lightHalo(texture);}}:undefined} onPointerOut={()=>{document.body.style.cursor='';if(live&&useStory.getState().detail!==layer.detail)restHalo(layer,texture);}}/></>;
}
/** A card standing on another (a dish on the table, `on` in src/story.ts): placed inside that card's hinge, it folds with it. */
function GluedCard({parent,parentPiece,...card}:CardProps&{parent:Layer;parentPiece:PaperPiece}){
 const {layer,piece,hinges,incoming=false}=card;const ref=useRef<Group>(null!);
 const key=`${incoming?'incoming:':''}${layer.id}:${piece.side}`;
 useEffect(()=>{const group=ref.current;group.userData.glued=true;hinges.current.set(key,group);return()=>{hinges.current.delete(key);};},[key,hinges]);
 return <group ref={ref} position={[piece.center-parentPiece.center,layer.position[1]-parent.position[1],layer.position[2]-parent.position[2]]}><CardFace {...card}/></group>;
}
function PaperLayer({layer,piece,texture,hinges,onClick,turn,progress,incoming=false,rank,children}:CardProps&{turn:Turn|null;progress:RefObject<{value:number}>;rank:number;children?:ReactNode}){
 const anchor=useRef<Group>(null!);const ref=useRef<Group>(null!);
 const key=`${incoming?'incoming:':''}${layer.id}:${piece.side}`;
 useEffect(()=>{const group=ref.current;hinges.current.set(key,group);return()=>{hinges.current.delete(key);};},[key,hinges]);
 useFrame(()=>{
  const root=anchor.current;root.userData.staged=incoming&&!turn;root.visible=!root.userData.staged;if(root.userData.staged)return;
  // The fold comes from the turn, or from the pop-up tween (openPopup) that drives the hinge directly; folded cards stack (popupStack).
  const p=turn?progress.current.value:0;if(turn)ref.current.rotation.x=popupFoldAngle(p,incoming);
  const y=layer.position[1]+flatLift(rank,ref.current.rotation.x);
  if(turn){
   const movingSide=turn.direction===1?'right':'left';const ridesSheet=incoming?piece.side!==movingSide:piece.side===movingSide;
   if(ridesSheet){const face:1|-1=piece.side==='right'?1:-1;const pose=attachedPaperPose(piece.center,y,layer.position[2],p,turn.direction,face);root.position.set(...pose.position);root.rotation.z=pose.rotation;
    // Cards on the turning sheet show only on the side of it that faces up: the old ones until it stands upright, the new ones after.
    root.visible=incoming?p>PAGE_UPRIGHT:p<PAGE_UPRIGHT;}
   else {root.position.set(piece.center,y+.018,layer.position[2]);root.rotation.z=0;const reveal=incoming?pageReveal(p,.5,.95):1-pageReveal(p,.45,.92);root.visible=reveal>.0001;}
  }else{root.position.set(piece.center,y+.018,layer.position[2]);root.rotation.z=0;}
 });
 return <group ref={anchor}><group ref={ref}><CardFace layer={layer} piece={piece} texture={texture} onClick={onClick} incoming={incoming}/>{children}</group></group>;
}
type SpreadShared={hinges:RefObject<Map<string,Group>>;onClick:(detail?:string)=>void;turn:Turn|null;progress:RefObject<{value:number}>};
/** A spread's cards: each card that stands on the page, with the cards glued onto it (same page side) inside its hinge. */
function spreadCards(target:number,art:Record<string,Texture>,shared:SpreadShared,incoming=false){
 const layers=scenes[target].layers,ranks=stackRanks(layers);
 const pieceOf=(layer:Layer,side:'left'|'right')=>splitPaperArt(layer.position[0],layer.size[0],side);
 return layers.flatMap(layer=>(['left','right'] as const).map(side=>{
  const piece=pieceOf(layer,side),parent=gluedParent(layer,layers);
  if(!piece||!art[layer.src]||(parent&&pieceOf(parent,side)))return null;
  const glued=layers.filter(child=>gluedParent(child,layers)===layer).map(child=>{const childPiece=pieceOf(child,side);return childPiece&&art[child.src]?<GluedCard key={child.id} layer={child} piece={childPiece} parent={layer} parentPiece={piece} texture={art[child.src]} hinges={shared.hinges} onClick={shared.onClick} incoming={incoming}/>:null;});
  return <PaperLayer key={`${target}-${layer.id}-${side}`} layer={layer} piece={piece} texture={art[layer.src]} {...shared} incoming={incoming} rank={ranks.get(layer.id)??0}>{glued}</PaperLayer>;
 }));
}
/** The phone's cards for a spread: each card on the flat page, with the cards glued onto it inside its hinge. */
function standingCards(target:number,art:Record<string,Texture>,shared:SpreadShared,incoming=false){
 const layers=scenes[target].layers.filter(l=>!isBackdrop(l)&&!l.phoneHidden),ranks=stackRanks(layers,l=>standingPlacement(l).z);
 return layers.map(layer=>{
  if(!art[layer.src]||gluedParent(layer,layers))return null;
  const glued=layers.filter(child=>gluedParent(child,layers)===layer&&art[child.src]).map(child=><StandingGluedCard key={child.id} layer={child} parent={layer} texture={art[child.src]} hinges={shared.hinges} onClick={shared.onClick} incoming={incoming}/>);
  return <StandingLayer key={`${target}-${layer.id}`} layer={layer} texture={art[layer.src]} {...shared} incoming={incoming} rank={ranks.get(layer.id)??0}>{glued}</StandingLayer>;
 });
}
function Book({onReady,onFailure}:{onReady:(director:Director)=>void;onFailure:()=>void}){
 const {gl,scene:world,camera}=useThree();const prepared=useRef(false);
 const hinges=useRef(new Map<string,Group>());const timeline=useRef<gsap.core.Timeline|null>(null);const pending=useRef<(()=>void)|null>(null);const generation=useRef(0);const mounted=useRef(true);const progress=useRef({value:0});const turnRef=useRef<Turn|null>(null);const incomingLoad=useRef<Promise<Record<string,Texture>>|null>(null);const [turn,setTurn]=useState<Turn|null>(null);const [staged,setStaged]=useState<{to:number;art:Record<string,Texture>}|null>(null);
 const [materials,setMaterials]=useState<BookMaterials>({});const [textures,setTextures]=useState<Record<string,Texture>>({});const [,setPaperShown]=useState(0);const paperRef=useRef<Record<string,Texture>>({});const chapter=useStory(s=>s.chapter);const frameCount=useRef({count:0,start:0});
 const standing=useStanding();const standingRef=useRef(standing);standingRef.current=standing;const stand=useRef({value:1});const lastSheet=useRef<{front:Texture;back:Texture;direction:1|-1}|null>(null);
 // Frames drawn per second, as data-fps on the canvas wrapper (for checks); written to the element, so React re-renders nothing.
 useFrame(({clock,gl})=>{frameCount.current.count++;if(clock.elapsedTime-frameCount.current.start>2){gl.domElement.closest('.canvas-wrap')?.setAttribute('data-fps',String(Math.round(frameCount.current.count/(clock.elapsedTime-frameCount.current.start))));frameCount.current={count:0,start:clock.elapsedTime};}});
 const animate=(fn:(tl:gsap.core.Timeline)=>void)=>new Promise<void>(resolve=>{pending.current=resolve;const tl=gsap.timeline({onComplete:()=>{timeline.current=null;pending.current=null;resolve();}});timeline.current=tl;fn(tl);});
 const renderWait=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 function clearTurn(){turnRef.current=null;setTurn(null);incomingLoad.current=null;progress.current.value=0;}
 function fail(error:unknown){if(!mounted.current)return;timeline.current?.kill();pending.current?.();generation.current++;clearTurn();hinges.current.forEach(h=>h.rotation.x=0);stand.current.value=1;console.error('StoryDirector',error);useStory.getState().set({phase:'ERROR',error:error instanceof Error?error.message:'책을 펼치는 중 잠시 멈췄어요. 다시 시도해 주세요.'});}
 // The printed pages are read from paperRef while rendering. `show` re-renders when pages arrive that are needed now; the preload of
 // the next chapter (warmChapter) only fills the ref, so it does not re-render the whole book while the reader looks at a spread.
 // The printed pages under each spread: the open book's only. The phone's standing book prints its painted floor instead and never shows
 // them, so it neither downloads nor uploads them (they were about 640 KB more to wait for before the first spread).
 async function preparePaper(target=0,show=true){
  if(standingRef.current)return;
  const entries=await Promise.all(['left','right'].map(async side=>{const name=`page-${target}-${side}`;return [name,paperRef.current[name]??await loadTexture(name)] as const;}));
  if(!mounted.current)return;const fresh=entries.some(([name])=>!paperRef.current[name]);
  paperRef.current={...paperRef.current,...Object.fromEntries(entries)};if(fresh&&show)setPaperShown(n=>n+1);
 }
 // A phone turned on its side shows the open book, which does print the pages: the spread's are fetched then.
 useEffect(()=>{if(!standing&&prepared.current)void preparePaper(useStory.getState().chapter);},[standing]);
 // Draws the first spread once off-screen so its first visible frame does not pay for any remaining GPU setup.
 function warmFirstFrame(){
  const target=new WebGLRenderTarget(128,128);target.texture.colorSpace=gl.outputColorSpace;const previousTarget=gl.getRenderTarget();
  try{gl.setRenderTarget(target);gl.render(world,camera);}finally{gl.setRenderTarget(previousTarget);target.dispose();}
 }
 /** Draws the staged cards once off-screen (they are hidden otherwise): their geometry is uploaded now, not during the turn. */
 function warmStaged(){
  const staged:Group[]=[];world.traverse(o=>{if(o.userData.staged&&!o.visible){o.visible=true;staged.push(o as Group);}});
  if(!staged.length)return;try{warmFirstFrame();}finally{staged.forEach(o=>{o.visible=false;});}
 }
 /** Whatever of a spread's pictures is not on the GPU yet goes up now (cheap for those already there), before its turn starts. */
 function ensureUploaded(target:number){
  const art=readyScene(target)??{};for(const texture of [...Object.values(art),...['left','right'].map(side=>paperRef.current[`page-${target}-${side}`]).filter(Boolean)])gl.initTexture(texture);
 }
 async function prepareStartup(token:number){
  useStory.getState().set({phase:'INIT',error:null});
  const [firstArt,,materialArt]=await Promise.all([loadScene(0),preparePaper(),Promise.all(OPEN_BOOK_MATERIALS.map(async name=>[name,await loadTexture('book-'+name)] as const)).then(entries=>Object.fromEntries(entries) as Record<string,Texture>)]);
  const active=()=>mounted.current&&token===generation.current;
  if(!active())return;setTextures(firstArt);setMaterials(materialArt);
  // The turning sheet's floor painting (a stage's `-sheet`) is only seen in a turn: it is uploaded after the book is ready, in the prologue.
  const sheetFloor=scenes[0].stage?firstArt[scenes[0].stage+'-sheet']:undefined;
  if(!await prepareBookRenderer(gl,[...Object.values(materialArt),...Object.values(firstArt).filter(t=>t!==sheetFloor),...Object.values(paperRef.current)],world,camera,active,undefined,warmFirstFrame))return;
  
  // The turning sheets' shaders exist before the first turn (otherwise the first turn would compile them on its first frame).
  if(materialArt.endpaper){const sheets=sheetMaterials(materialArt.endpaper);warmMaterials(gl,world,camera,sheets);sheets.forEach(m=>m.dispose());}
  warmMaterials(gl,world,camera,await prepareHalos(firstArt,0));if(!active())return;
  prepared.current=true;useStory.getState().set({phase:'COVER'});
  if(sheetFloor)window.setTimeout(()=>{if(active())gl.initTexture(sheetFloor);},600);
 }
 async function openPopup(target:number,token:number,alreadyOpen=false){
  useStory.getState().set({phase:'LOADING_PAGE',dialog:false,detail:null});const [art]=await Promise.all([loadScene(target),preparePaper(target)]);if(!mounted.current||token!==generation.current)return;
  setTextures(art);useStory.getState().set({chapter:target});setStaged(null);clearTurn();await renderWait();if(!mounted.current||token!==generation.current)return;
  if(!alreadyOpen){useStory.getState().set({phase:'OPENING_POPUP'});hinges.current.forEach(h=>{if(!h.userData.glued)h.rotation.x=-Math.PI/2;});const layers=scenes[target].layers,ranks=stackRanks(layers);await animate(tl=>layers.forEach(l=>{for(const side of ['left','right']){const hinge=hinges.current.get(`${l.id}:${side}`);if(hinge&&!hinge.userData.glued)tl.to(hinge.rotation,{x:0,duration:.72,ease:'back.out(1.05)'},riseOrder(ranks.get(l.id)??0,layers.length)*.13);}}));}
  if(!mounted.current||token!==generation.current)return;useStory.getState().set({phase:'EXPLORING'});pulseHalos(clickableCards(target));warmChapter(target+1,token);
 }
 /** While the reader looks at a spread, the next chapter's textures are fetched, decoded off-thread and uploaded one per few frames,
  * so turning the page does not pay for those uploads. Stops as soon as anything else starts. */
 /** A spread's clickable cards with their pictures (those already loaded). */
 function clickableCards(target:number){const art=readyScene(target)??{};return scenes[target].layers.filter(l=>l.interactive&&art[l.src]).map(layer=>({layer,texture:art[layer.src]}));}
 /** Makes and uploads a spread's halos ahead of time (startup, or while the reader looks at the previous spread). */
 async function prepareHalos(art:Record<string,Texture>,target:number){
  const materials:MeshBasicMaterial[]=[];
  for(const layer of scenes[target].layers.filter(l=>l.interactive&&art[l.src])){await idle();if(!mounted.current)break;const halo=await loadHalo(art[layer.src],haloTone(layer),...(standingRef.current?[Math.max(...standingPlacement(layer).size),layer.glow] as const:[Math.max(...layer.size)] as const));gl.initTexture(halo.texture);materials.push(halo.material);}
  return materials;
 }
 function warmChapter(target:number,token:number){
  if(target>=scenes.length)return;
  // Start once the cards have stood up and the turn's last frames are drawn, so decoding and uploads never share frames with them.
  window.setTimeout(()=>{if(mounted.current&&token===generation.current)void Promise.all([loadScene(target),preparePaper(target,false)]).then(([art])=>{
   const queue=[...Object.values(art),...['left','right'].map(side=>paperRef.current[`page-${target}-${side}`]).filter(Boolean)];
   // The halos come first (a turn soon after needs them most), then the pictures one upload at a time.
   const halosReady=prepareHalos(art,target);
   // Uploads go on while the landed spread's glow blinks (a page turned before they are done would stall at its start, which shows far
   // more than a hitch in a blink); the halos, a longer task each, wait for a still book (src/cardHalo.ts idle).
   const step=()=>{if(!mounted.current||token!==generation.current||useStory.getState().phase!=='EXPLORING')return;const texture=queue.shift();
    // Last, the next spread's card materials are bound to their (shared) shader program, so its first frame in a turn is cheap.
    if(!texture){const cards=scenes[target].layers.map(l=>art[l.src]).filter(Boolean).map(cardMaterial);void halosReady.then(async halos=>{if(!mounted.current||token!==generation.current||useStory.getState().phase!=='EXPLORING')return;warmMaterials(gl,world,camera,[...cards,...halos]);
     // Then the spread's cards are built and drawn once hidden, so the turn does not pay for building them in its first frames.
     setStaged({to:target,art});await renderWait();if(mounted.current&&token===generation.current&&useStory.getState().phase==='EXPLORING')warmStaged();});return;}
    gl.initTexture(texture);window.setTimeout(()=>requestAnimationFrame(step),100);};
   requestAnimationFrame(step);
  }).catch(()=>{});},700);
 }
 /** Folds every card flat on the page (a glued card folds with the card it stands on). */
 function foldCards(){hinges.current.forEach(h=>{if(!h.userData.glued)h.rotation.x=-Math.PI/2;});}
 /** The first spread's cards standing up on the timeline from `at` seconds, front to back (src/popupStack.ts riseOrder). */
 function riseCards(tl:gsap.core.Timeline,at=0){
  if(standingRef.current){const cards=scenes[0].layers.filter(l=>!isBackdrop(l)),ranks=stackRanks(cards,l=>standingPlacement(l).z);cards.forEach(l=>{const hinge=hinges.current.get(`${l.id}:right`);if(hinge&&!hinge.userData.glued)tl.to(hinge.rotation,{x:0,duration:.55,ease:'back.out(1.1)'},at+riseOrder(ranks.get(l.id)??0,cards.length)*.06);});return;}
  const layers=scenes[0].layers,ranks=stackRanks(layers);layers.forEach(l=>{for(const side of ['left','right']){const hinge=hinges.current.get(`${l.id}:${side}`);if(hinge&&!hinge.userData.glued)tl.to(hinge.rotation,{x:0,duration:.72,ease:'back.out(1.05)'},at+riseOrder(ranks.get(l.id)??0,layers.length)*.13);}});
 }
 function startReading(token:number){stand.current.value=1;useStory.getState().set({phase:'EXPLORING'});pulseHalos(clickableCards(0));warmChapter(1,token);}
 /** The cards stand up (and, `standUp`, the standing book's first half rises with them) and the reader may read. */
 async function standAndRise(standUp:boolean,token:number){
  useStory.getState().set({phase:'OPENING_POPUP'});
  await animate(tl=>{if(standUp)tl.to(stand.current,{value:1,duration:.8,ease:'power2.inOut'},0);riseCards(tl,standUp?.42:0);});
  if(!mounted.current||token!==generation.current)return;
  startReading(token);
 }
 // The intro film ends on this exact open spread (on phones, the phone film on the standing book), so revealing it is only a state change.
 // With `hold` the film has paused just before its cards rise: the book waits open with its cards flat under the prologue (PROLOGUE,
 // src/Prologue.tsx) and `rise` stands them up when the reader starts.
 const held=useRef(false);
 async function reveal(standingFilmed=false,hold=false){
  if(useStory.getState().phase!=='COVER'||!prepared.current)return;
  const token=++generation.current;hinges.current.forEach(h=>h.rotation.x=0);
  useStory.getState().set({phase:'LOADING_PAGE',chapter:0,dialog:false,detail:null,introPagesTurned:INTRO_PAGE_COUNT});
  // Only when the standing book follows the open book's film (the phone was turned during the intro) does it first lie open and stand
  // its first half up while the cards pop up.
  const standUp=standingRef.current&&!standingFilmed;
  if(standUp)stand.current.value=0;
  if(standUp||hold)foldCards();
  await renderWait();if(!mounted.current||token!==generation.current)return;
  // Drawn once now (nothing is drawn under the intro film otherwise), so the canvas shows the waiting book the moment the film fades.
  if(hold){held.current=standUp;useStory.getState().set({phase:'PROLOGUE'});advance(performance.now(),true);return;}
  if(standUp)await standAndRise(true,token);else startReading(token);
 }
 function rise(){if(useStory.getState().phase!=='PROLOGUE')return;const token=++generation.current;void standAndRise(held.current,token).catch(fail);}
 function configureTurn(target:number){
  for(const {texture} of clickableCards(useStory.getState().chapter))darkHalo(texture);for(const {texture} of clickableCards(target))darkHalo(texture,0);
  const state=useStory.getState();const info:Turn={from:state.chapter,to:target,direction:target>state.chapter?1:-1,incoming:readyScene(target)??{},restoreDialog:state.dialog};turnRef.current=info;setTurn(info);progress.current.value=0;
  const token=generation.current;const load=Promise.all([loadScene(target),preparePaper(target)]).then(([art])=>art);incomingLoad.current=load;
  void load.then(art=>{if(!mounted.current||token!==generation.current||turnRef.current!==info)return;info.incoming=art;setTurn({...info});}).catch(error=>{if(mounted.current&&token===generation.current&&turnRef.current===info)fail(error);});return info;
 }
 // The last spread's closing message (ENDING) still lets the reader page back.
 const readable=()=>{const s=useStory.getState();if(s.phase==='ENDING')s.set({phase:'EXPLORING'});return useStory.getState().phase==='EXPLORING';};
 async function go(target:number){
  if(target<0||target>=scenes.length||target===useStory.getState().chapter)return;if(!readable())return;
  const token=++generation.current;configureTurn(target);useStory.getState().set({phase:'LOADING_PAGE',dialog:false,detail:null});
  try{await incomingLoad.current;if(!mounted.current||token!==generation.current)return;ensureUploaded(target);useStory.getState().set({phase:'TURNING_PAGE'});await renderWait();playSound('page');await animate(tl=>tl.to(progress.current,{value:1,duration:1.35,ease:'power2.inOut'}));if(!mounted.current||token!==generation.current)return;await openPopup(target,token,true);}catch(e){if(token===generation.current)fail(e);}
 }
 function previewTurn(direction:1|-1,value:number){const s=useStory.getState();if(s.phase==='EXPLORING'||s.phase==='ENDING'){const target=s.chapter+direction;if(target<0||target>=scenes.length||(!standingRef.current&&!Object.keys(paperRef.current).length)||!readable())return false;generation.current++;configureTurn(target);s.set({phase:'DRAGGING_PAGE',dialog:false,detail:null});}if(useStory.getState().phase!=='DRAGGING_PAGE'||turnRef.current?.direction!==direction)return false;progress.current.value=Math.max(0,Math.min(1,value));return true;}
 async function settle(commit:boolean){
  if(useStory.getState().phase!=='DRAGGING_PAGE'||!turnRef.current)return;
  const info=turnRef.current,token=generation.current;useStory.getState().set({phase:'TURNING_PAGE'});
  try{
   if(commit){
    await incomingLoad.current;if(!mounted.current||token!==generation.current)return;ensureUploaded(info.to);playSound('page');
    await animate(tl=>tl.to(progress.current,{value:1,duration:Math.max(.35,(1-progress.current.value)*.9),ease:'power2.out'}));
    if(!mounted.current||token!==generation.current)return;await openPopup(info.to,token,true);
   }else{
    await animate(tl=>tl.to(progress.current,{value:0,duration:.35,ease:'power2.out'}));
    if(!mounted.current||token!==generation.current)return;clearTurn();hinges.current.forEach(h=>h.rotation.x=0);useStory.getState().set({phase:'EXPLORING',dialog:info.restoreDialog});for(const {layer,texture} of clickableCards(info.from))restHalo(layer,texture);
   }
  }catch(e){fail(e);}
 }
 /** Opens a story in the side panel: a clicked card's own detail, or (from the button) the chapter's main one; the card answers with a hop. */
 /** The on-screen box of a clickable card (for the reading guide, src/Guide.tsx): its picture's bounds (not its glow), projected, as it
  *  stands upright (measured with its hinge stood up for the moment, then put back), so a guide shown while the cards still rise points
  *  at where the card will be. Each picture's own corners are projected, not a box around the card in the world: on the phone the cards
  *  lean back, and that box's near corners reached below the card's foot (the farmer's frame came down over the dog). */
 function locate(detail?:string){
  const scene=scenes[useStory.getState().chapter];
  const layer=scene.layers.find(l=>l.interactive&&l.detail===(detail??scene.detail))??scene.layers.find(l=>l.interactive);if(!layer)return null;
  const group=hinges.current.get(`${layer.id}:right`)??hinges.current.get(`${layer.id}:left`);if(!group)return null;
  const fold=group.rotation.x,corners:Vector3[]=[];group.rotation.x=0;group.updateWorldMatrix(true,true);
  group.traverse(o=>{const mesh=o as Mesh;if(!mesh.isMesh||(mesh.material as MeshBasicMaterial).depthWrite===false)return;
   mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;if(!b)return;
   for(let i=0;i<8;i++)corners.push(new Vector3(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z).applyMatrix4(mesh.matrixWorld));});
  group.rotation.x=fold;group.updateWorldMatrix(false,true);
  if(!corners.length)return null;
  const rect=gl.domElement.getBoundingClientRect();let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const corner of corners){const p=corner.project(camera);
   const x=rect.left+(p.x+1)/2*rect.width,y=rect.top+(1-p.y)/2*rect.height;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  return {x:x0,y:y0,width:x1-x0,height:y1-y0};
 }
 // A card stays clickable under the closing message (ENDING): its story opens in place of the message.
 function interact(detail?:string){if(!readable())return;const state=useStory.getState();const scene=scenes[state.chapter],id=detail??scene.detail;state.set({dialog:true,detail:id,visited:[...new Set([...state.visited,state.chapter])]});playSound('hello');const layer=scene.layers.find(l=>l.detail===id)??scene.layers.find(l=>l.interactive);if(!layer)return;const target=hinges.current.get(`${layer.id}:right`)??hinges.current.get(`${layer.id}:left`);if(target)gsap.fromTo(target.scale,{x:1,y:1,z:1},{x:1.08,y:1.08,z:1.08,duration:.2,yoyo:true,repeat:1,overwrite:true,onComplete:()=>target.scale.set(1,1,1)});}
 function retry(){const state=useStory.getState();state.set({error:null});const token=++generation.current;if(!prepared.current)void prepareStartup(token).catch(error=>{if(mounted.current&&token===generation.current)fail(error);});else void openPopup(state.chapter,token,true).catch(fail);}
 // While a card's story is open its halo stays lit; closed, the card keeps the fainter rim of a story already read.
 useEffect(()=>useStory.subscribe((state,previous)=>{
  if(state.detail===previous.detail)return;
  const card=(detail:string|null)=>detail?clickableCards(state.chapter).find(c=>c.layer.detail===detail):undefined;
  if(previous.detail){seenStories.add(previous.detail);const c=card(previous.detail);if(c&&state.phase==='EXPLORING')restHalo(c.layer,c.texture);}
  const opened=card(state.detail);if(opened)lightHalo(opened.texture);
 }),[]);
 useEffect(()=>{mounted.current=true;const current=++generation.current;void prepareStartup(current).catch(error=>{if(mounted.current&&current===generation.current)fail(error);});const director:Director={reveal:(standingFilmed,hold)=>void reveal(standingFilmed,hold),rise,go:n=>void go(n),finish:()=>{if(useStory.getState().phase==='EXPLORING'&&useStory.getState().chapter===scenes.length-1)useStory.getState().set({phase:'ENDING',dialog:false});},interact,previewTurn,settleTurn:commit=>void settle(commit),retry,locate,highlight:()=>{if(useStory.getState().phase==='EXPLORING')pulseHalos(clickableCards(useStory.getState().chapter));}};onReady(director);return()=>{mounted.current=false;generation.current++;timeline.current?.kill();pending.current?.();hinges.current.forEach(g=>gsap.killTweensOf(g.scale));document.body.style.cursor='';};},[]);
 const paper=paperRef.current;
 // Under a turn, the page the sheet uncovers is the next spread's, once its picture is in: on the first turn to a spread it is still loading
 // for a moment, and the page stays the current one meanwhile (it used to be left out, so the floor vanished; the sheet waits too).
 const moving=turn!==null;const leftChapter=moving&&turn.direction===-1&&paper[`page-${turn.to}-left`]?turn.to:chapter;const rightChapter=moving&&turn.direction===1&&paper[`page-${turn.to}-right`]?turn.to:chapter;const front=moving?paper[`page-${turn.direction===1?turn.from:turn.to}-right`]:null;const back=moving?paper[`page-${turn.direction===1?turn.to:turn.from}-left`]:null;
 // The turning sheet keeps its last pictures between turns (hidden); before the first turn it holds the first spread's right page. It shows
 // only once this turn's own pictures are in: a turn started before the next spread's page had loaded used to show the last turn's (after
 // 1 → 2, chapter 1's dirt floor lying on the right page while 2 → 3 began).
 const sheetReady=moving&&!!front&&!!back;
 if(sheetReady)lastSheet.current={front,back,direction:turn.direction};
 else if(!lastSheet.current&&paper['page-0-right'])lastSheet.current={front:paper['page-0-right'],back:paper['page-0-right'],direction:1};
 const sheet=lastSheet.current;
 if(!materials.inside)return <Camera standing={standing}/>;
 if(standing){
  // The upright page shows the backdrop of the spread being uncovered (going back) or covered (going forward); the turning sheet's
  // other face carries the backdrop it uncovers or brings.
  // The flat page under the cards takes the spread's paper tone (src/story.ts `paper`); the sheet's paper face the one it turns over.
  const paperOf=(target:number)=>(scenes[target] as {paper?:string}).paper;
  const backdropOf=(target:number,art:Record<string,Texture>)=>{const layer=scenes[target].layers.find(isBackdrop);return layer?art[layer.src]:undefined;};
  // A spread's own floor for the flat page (`stage` in src/story.ts, with a '-sheet' twin laid out for the turning sheet), if it has one.
  const artOf=(target:number)=>target===chapter?textures:moving&&turn.to===target?turn.incoming:{};
  const stageOf=(target:number|undefined,suffix='')=>{if(target===undefined)return undefined;const name=(scenes[target] as {stage?:string}).stage;return name?artOf(target)[name+suffix]:undefined;};
  const stagesOf=(floorChapter:number,sheetChapter:number|undefined)=>({floor:stageOf(floorChapter),sheetFloor:stageOf(sheetChapter),sheetFace:stageOf(sheetChapter,'-sheet')});
  const upright=moving&&turn.direction===-1?backdropOf(turn.to,turn.incoming)??backdropOf(chapter,textures):backdropOf(chapter,textures);
  const sheet=moving?(turn.direction===1?backdropOf(turn.to,turn.incoming):backdropOf(chapter,textures)):undefined;
  return <><Camera standing/><DeskFog/><DeskBackdrop materials={materials}/>
   <StandingCase materials={materials} backdrop={upright} turnBackdrop={sheet} turning={moving?turn.direction:0} progress={progress} stand={stand}
    floor={paperOf(moving&&turn.direction===1?turn.to:chapter)} sheetFloor={moving?paperOf(turn.direction===1?turn.from:turn.to):undefined} stages={stagesOf(moving&&turn.direction===1?turn.to:chapter,moving?(turn.direction===1?turn.from:turn.to):undefined)}/>
   {/* One group, keyed by chapter: when a turn ends the incoming cards stay mounted and become the spread's own (no rebuild). */}
   <group>{standingCards(chapter,textures,{hinges,onClick:interact,turn,progress})}
   {turn&&turn.to!==chapter?standingCards(turn.to,turn.incoming,{hinges,onClick:interact,turn,progress},true):staged&&staged.to!==chapter?standingCards(staged.to,staged.art,{hinges,onClick:interact,turn:null,progress},true):null}</group>
   <ContextMonitor onFailure={onFailure}/></>;
 }
 return <><Camera/><DeskFog/><DeskBackdrop materials={materials}/><group>
 <OpenCase materials={materials}/>
 {paper[`page-${leftChapter}-left`]&&<PrintedPage texture={paper[`page-${leftChapter}-left`]} edge={materials['paper-edge']} left/>}{paper[`page-${rightChapter}-right`]&&<PrintedPage texture={paper[`page-${rightChapter}-right`]} edge={materials['paper-edge']}/>}
 {sheet&&<TurningPage front={sheet.front} back={sheet.back} progress={progress} direction={sheet.direction} visible={sheetReady}/>}
 {/* One group, keyed by chapter: when a turn ends the incoming cards stay mounted and become the spread's own (no rebuild). */}
 <group>{spreadCards(chapter,textures,{hinges,onClick:interact,turn,progress})}
 {turn&&turn.to!==chapter?spreadCards(turn.to,turn.incoming,{hinges,onClick:interact,turn,progress},true):staged&&staged.to!==chapter?spreadCards(staged.to,staged.art,{hinges,onClick:interact,turn:null,progress},true):null}</group>
 </group><ContextMonitor onFailure={onFailure}/></>;
}
/**
 * Paces drawing: the canvas runs frameloop="never" and this draws each frame itself (advance), in the frame it decides to. Full display rate while anything moves: startup, turns, pop-ups, drags and every
 * GSAP animation (the halos' glow included). While the reader just looks at a spread nothing moves, so nothing is drawn. Nothing is
 * drawn either while the text version covers the book.
 */
const HEARTBEAT_MS=1000;
function FramePacer({onDpr}:{onDpr:(dpr:number)=>void}){
 const get=useThree(s=>s.get);
 useEffect(()=>{
  let raf=0,last=0,drawnUnderIntro=false,lastMoving=0,dirty=3,lastSize=0;const governor=new ResolutionGovernor(get().viewport.dpr);
  const unsubscribe=useStory.subscribe(()=>{dirty=3;});const wake=()=>{dirty=3;};document.addEventListener('visibilitychange',wake);
  const tick=(now:number)=>{
   raf=requestAnimationFrame(tick);
   if(document.body.classList.contains('text-open'))return;
   const phase=useStory.getState().phase;
   // Under the intro film nothing is drawn while the book prepares, so the film and the preparation keep the GPU and the main thread;
   // once ready (COVER) one frame is drawn (it bakes the desk and puts the book on the canvas), then nothing until the film leaves.
   if(document.querySelector('.intro-screen:not(.is-leaving)')){if(phase!=='COVER'||drawnUnderIntro)return;drawnUnderIntro=true;}
   else drawnUnderIntro=false;
   // Still (reading a spread, nothing animating): nothing is drawn, except a few frames after anything changes (the story state, the
   // canvas size) and one a second as a safety net. Nothing on a still spread moves since the halos replaced the sway.
   const still=(phase==='EXPLORING'||phase==='ENDING'||phase==='PROLOGUE')&&!gsap.globalTimeline.getChildren(false,true,true).length;
   const canvas=get().gl.domElement,size=canvas.width*10000+canvas.height;if(size!==lastSize){lastSize=size;dirty=3;}
   if(still&&dirty<=0&&now-last<HEARTBEAT_MS)return;
   if(dirty>0)dirty--;
   const state=get(),start=performance.now();last=now;advance(now,true,state);
   // Frames in motion (drawn every refresh) tell the governor whether the GPU keeps up; see src/framePacing.ts.
   if(!still){const dpr=lastMoving?governor.sample(now-lastMoving,performance.now()-start):null;lastMoving=now;if(dpr)onDpr(dpr);state.gl.domElement.dataset.pacing=governor.last;}
   else lastMoving=0;
  };
  raf=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(raf);unsubscribe();document.removeEventListener('visibilitychange',wake);};
 },[get,onDpr]);
 return null;
}
function ContextMonitor({onFailure}:{onFailure:()=>void}){const {gl}=useThree();useEffect(()=>{const handler=(e:Event)=>{e.preventDefault();onFailure();};gl.domElement.addEventListener('webglcontextlost',handler);return()=>gl.domElement.removeEventListener('webglcontextlost',handler);},[gl,onFailure]);return null;}
/**
 * Starts the first spread's downloads while the intro film plays (App calls it once the film can play through): only network and
 * off-thread decoding, the GPU work still waits until the book mounts after the film. Without it the book began loading when the film
 * ended and the reader waited a further ~2.5 s on a 9 Mbps connection.
 */
export function preloadBook(){
 const standing=typeof matchMedia==='function'&&matchMedia(STANDING_QUERY).matches;
 void Promise.all([loadScene(0),...(standing?[]:['left','right'].map(side=>loadTexture(`page-0-${side}`))),...OPEN_BOOK_MATERIALS.map(name=>loadTexture('book-'+name))]).catch(()=>{});
}
/** A tap on the book that hits no picture closes what floats over it without a backdrop: the closing message (ENDING), which hands the
 *  last spread back, and a story's side panel (src/DetailPanel.tsx). The story books have their own backdrop (src/outsideTap.ts). */
function closeOnMiss(){const s=useStory.getState();if(s.phase==='ENDING')s.set({phase:'EXPLORING'});else if(s.detail&&s.phase==='EXPLORING')s.set({detail:null});}
export default function Storybook({onReady,onFailure}:{onReady:(director:Director)=>void;onFailure:()=>void}){
 // The canvas resolution lives here: R3F re-applies the dpr prop on every render, so the governor's choice (FramePacer) is the prop.
 // Drawn at the screen's own sharpness up to 2× (a large screen at 3× costs too much), and up to 3× on a phone held upright: its canvas is
 // small (an iPhone at 3× draws about what a laptop does at 1.5×), and at 2× the browser stretched the picture and blurred the small
 // handwriting on the cards (chapter 3's fridge notes). FramePacer still steps it down if frames come late.
 const [dpr,setDpr]=useState(()=>Math.min(window.devicePixelRatio,typeof matchMedia==='function'&&matchMedia(STANDING_QUERY).matches?3:2));
 return <Canvas frameloop="never" flat shadows={false} camera={{position:[...BOOK_CAMERA_POSITION],fov:30,near:.1,far:70}} dpr={dpr} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onPointerMissed={closeOnMiss}><FramePacer onDpr={setDpr}/><Book onReady={onReady} onFailure={onFailure}/></Canvas>;}
