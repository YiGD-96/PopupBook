/**
 * The standing book (phones in portrait, src/standingLayout.ts): the open book's own parts turned so the binding runs across the screen,
 * the first half standing at 90° with the backdrop printed on its page, the cards standing on the flat second page, and a sheet that
 * swings up to turn the spread. The story director (src/Storybook.tsx) is shared with the open book.
 */
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { BackSide, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, Mesh, type MeshBasicMaterial, type Texture } from 'three';
import { BOOK_BOARD, BOOK_PAGES } from './bookStructure';
import { BOOK_HINGE_Y, createBoardGeometry, createPaperBlockGeometry, createSpineGeometry, relightTurned } from './bookGeometry';
import { PAGE_WIDTH, createPageSkirt, createPaperGeometry, pageShade } from './paperGeometry';
import { lightShade } from './bookGeometry';
import { BLOCK_X, BindingDetails, Board, CardHalo, cardMaterial, textureView, PaperBlock, PrintedPage, Surface, createCardGeometry, useDisposable, type BookMaterials } from './bookParts';
import { UPRIGHT_LEAN, UPRIGHT_SCALE, backdropCrop, standingFoldIn, standingFoldOut, standingPlacement, standingSheetPoint, standingSheetProgress, surfaceY } from './standingLayout';
import { type Layer, useStory } from './story';
import { flatLift } from './popupStack';
import { lightHalo, restHalo } from './cardHalo';

const UP=-Math.PI/2,COLUMNS=32,ROWS=10;
const linear=(v:number)=>Math.pow(v,2.2);
/** Texture coordinates for a sheet seen standing: across the binding (world x) and up the page, so a painting reads upright. */
function standingUv(geometry:BufferGeometry,columns:number,rows:number){
 const uv=geometry.getAttribute('uv');
 for(let r=0;r<=rows;r++)for(let c=0;c<=columns;c++)uv.setXY(r*(columns+1)+c,1-r/rows,c/columns);
 uv.needsUpdate=true;return geometry;
}
/** The backdrop cropped to cover the upright page; shares the painting's upload. */
export function cropBackdrop(texture:Texture){
 const image=texture.image as {width:number;height:number}|undefined;const crop=backdropCrop(image?image.width/image.height:2.5);
 return textureView(texture,t=>{t.repeat.set(...crop.repeat);t.offset.set(...crop.offset);});
}
function useBackdrop(texture:Texture|undefined){
 const cropped=useMemo(()=>texture?cropBackdrop(texture):null,[texture]);
 useEffect(()=>()=>cropped?.dispose(),[cropped]);return cropped;
}
/** The upright page's sheet and its page-edge wall as the live book shows them (swell 1); the phone intro film (src/standingFilm.tsx)
 *  presses them flat while the book is closed. */
export function createStandingPage(swell=1){const g=createPaperGeometry(COLUMNS,ROWS,swell);g.scale(-1,1,1);g.computeVertexNormals();return standingUv(g,COLUMNS,ROWS);}
export function createStandingSkirt(swell=1){const g=createPageSkirt(BOOK_PAGES.y-BOOK_PAGES.thickness/2,lightShade,24,swell);g.scale(-1,1,1);return g;}
/** The cloth spine at a fold (0.5 is the standing book's 90°), at the resolution the live book uses. */
export const createStandingSpine=(fold:number)=>createSpineGeometry(fold,32);
/** The first half of the case standing: its board, its half of the text block and its page (the backdrop), turned up about the binding.
 *  `stand` (0 lying open → 1 standing) is animated only when the book first stands up after the intro film. */
/**
 * The upright half's page stack is thinned toward its printed page: what the reader sees of it is the band of page edges across the top
 * of the standing page, and a thick grey band drew the eye. The page itself stays put (so the turning sheet still lands on it); the stack
 * and the board come up to it, fully at the top and not at all near the binding, so the spine still meets the boards.
 * The phone intro film shows the full stack, so the stack thins with the book's settle (useSettle).
 */
export const UPRIGHT_STACK=.15;
const STACK_TOP=BOOK_PAGES.y+BOOK_PAGES.thickness/2;
function thinStack(geometry:BufferGeometry,base:Float32Array,offset:[number,number],amount:number){
 const position=geometry.getAttribute('position'),array=position.array as Float32Array;
 for(let i=0;i<array.length;i+=3){
  const x=base[i]+offset[0],y=base[i+1]+offset[1],t=Math.max(0,Math.min(1,(-x/PAGE_WIDTH-.12)/.45)),reach=1-(1-UPRIGHT_STACK)*amount*t*t*(3-2*t);
  array[i+1]=y<STACK_TOP?STACK_TOP-(STACK_TOP-y)*reach-offset[1]:base[i+1];
 }
 position.needsUpdate=true;geometry.computeBoundingSphere();
}
function StandingHalf({materials,backdrop,stand,settle}:{materials:BookMaterials;backdrop:Texture|null;stand:RefObject<{value:number}>;settle:RefObject<{value:number}>}){
 const board=useDisposable(()=>{const g=createBoardGeometry(true);relightTurned(g,UP);return g;},[]);
 const block=useDisposable(()=>{const g=createPaperBlockGeometry();relightTurned(g,UP);return g;},[]);
 const page=useDisposable(()=>createStandingPage(),[]),skirt=useDisposable(()=>createStandingSkirt(),[]);
 const pivot=useRef<Group>(null!);
 // The stack's thinning follows `settle` (src/standingBook.tsx useSettle); the untouched vertices it is applied to.
 const applied=useRef(-1);
 const bases=useMemo(()=>[board,block,skirt].map(g=>Float32Array.from(g.getAttribute('position').array as Float32Array)),[board,block,skirt]);
 useFrame(()=>{const amount=settle.current.value;if(amount===applied.current)return;applied.current=amount;
  thinStack(board,bases[0],[-BOOK_BOARD.x,BOOK_BOARD.y],amount);thinStack(block,bases[1],[-BLOCK_X,BOOK_PAGES.y],amount);thinStack(skirt,bases[2],[0,0],amount);});
 // Shortened to UPRIGHT_SCALE as it stands (the outward axis, before the turn), so it is full size only while lying open; settled, it
 // leans back by UPRIGHT_LEAN (a smaller turn from lying open).
 useFrame(()=>{const s=stand.current.value;pivot.current.rotation.z=UP*s+UPRIGHT_LEAN*settle.current.value;pivot.current.scale.x=1+(UPRIGHT_SCALE-1)*s;});
 const edge=materials['paper-edge'],endpaper=materials.endpaper;
 return <group position={[0,BOOK_HINGE_Y,0]}><group ref={pivot}><group position={[0,-BOOK_HINGE_Y,0]}>
  <mesh geometry={board} position={[-BOOK_BOARD.x,BOOK_BOARD.y,0]}><Surface attach="material-0" map={materials.inside}/><Surface attach="material-1" map={materials['cloth-side']}/><Surface attach="material-2" map={materials['cloth-side']}/></mesh>
  <mesh geometry={block} position={[-BLOCK_X,BOOK_PAGES.y,0]}>{[edge,edge,endpaper,endpaper,edge,edge].map((map,i)=><meshBasicMaterial key={i} attach={`material-${i}`} map={map} vertexColors side={DoubleSide}/>)}</mesh>
  {/* The painting is laid over the paper, so its cut edges (and any see-through part) show paper. */}
  <mesh geometry={page}><Surface map={endpaper}/></mesh>{backdrop&&<mesh geometry={page} renderOrder={1}><meshBasicMaterial map={backdrop} vertexColors transparent forceSinglePass side={DoubleSide} depthWrite={false}/></mesh>}<mesh geometry={skirt}><Surface map={edge} fallback="#e8dbc2"/></mesh>
 </group></group></group>;
}
/**
 * The live book's settle (0 → 1): the upright half leans back by UPRIGHT_LEAN and its page stack thins (UPRIGHT_STACK). It starts at 0,
 * as the phone intro film ends, and eases to 1 just after the film hands over; a book shown later (turning the phone, say) starts settled.
 */
function useSettle(){
 const settle=useRef({value:['EXPLORING','ENDING'].includes(useStory.getState().phase)?1:0});
 useEffect(()=>{
  if(settle.current.value>=1)return;
  const unsubscribe=useStory.subscribe(state=>{if(state.phase==='EXPLORING'&&settle.current.value<1){unsubscribe();gsap.to(settle.current,{value:1,duration:.8,delay:.35,ease:'sine.inOut'});}});
  return unsubscribe;
 },[]);
 return settle;
}
/** The cloth spine around the fold. Built for a few fold steps only (it is costly), swapped while the book stands up and settles. */
function StandingSpine({materials,stand,settle}:{materials:BookMaterials;stand:RefObject<{value:number}>;settle:RefObject<{value:number}>}){
 // Folds: lying open (1), standing up (.75, .5 = 90°), then settling back to 90° + UPRIGHT_LEAN in two steps.
 const leaned=.5+UPRIGHT_LEAN/Math.PI;
 const steps=useMemo(()=>[1,.75,.5,(.5+leaned)/2,leaned].map(createStandingSpine),[leaned]);useEffect(()=>()=>steps.forEach(g=>g.dispose()),[steps]);
 const mesh=useRef<Mesh>(null!);
 useFrame(()=>{const s=stand.current.value,t=settle.current.value,geometry=steps[s<=.35?0:s<=.8?1:t<.3?2:t<.75?3:4];if(mesh.current.geometry!==geometry)mesh.current.geometry=geometry;});
 return <mesh ref={mesh} geometry={steps[4]}><Surface map={materials['cloth-side']} fallback="#ac705b"/></mesh>;
}
/** The sheet that turns the spread: lying as the lower page it shows paper, standing it shows the next backdrop on its other face. */
export function createStandingSheetGeometry(){
 const g=new BufferGeometry(),positions:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
 for(let r=0;r<=ROWS;r++)for(let c=0;c<=COLUMNS;c++){positions.push(...standingSheetPoint(c/COLUMNS,r/ROWS,0));uv.push(1-r/ROWS,c/COLUMNS);const s=linear(pageShade(c/COLUMNS));colors.push(s,s,s);}
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLUMNS;c++){const a=r*(COLUMNS+1)+c,b=a+1,d=a+COLUMNS+2,e=a+COLUMNS+1;indices.push(a,e,b,b,e,d);}
 g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.setIndex(indices);return g;
}
/** Bends the turning sheet to q (0 lying as the lower page, 1 standing). */
export function poseStandingSheet(geometry:BufferGeometry,q:number,open=Math.PI/2){
 const position=geometry.getAttribute('position');
 for(let r=0;r<=ROWS;r++)for(let c=0;c<=COLUMNS;c++)position.setXYZ(r*(COLUMNS+1)+c,...standingSheetPoint(c/COLUMNS,r/ROWS,q,open));
 position.needsUpdate=true;geometry.computeBoundingSphere();
}
function StandingSheet({paper,paperTint,backdrop,progress,direction,settle}:{paper?:Texture;paperTint?:string;backdrop:Texture|null;progress:RefObject<{value:number}>;direction:1|-1;settle:RefObject<{value:number}>}){
 const geometry=useDisposable(createStandingSheetGeometry,[]);
 const group=useRef<Group>(null!);
 useFrame(()=>{
  const s=standingSheetProgress(progress.current.value),q=direction===1?s:1-s;group.current.visible=q>.002;if(!group.current.visible)return;
  poseStandingSheet(geometry,q,Math.PI/2+UPRIGHT_LEAN*settle.current.value);
 });
 return <group ref={group} visible={false}><mesh geometry={geometry} renderOrder={4}><meshBasicMaterial map={paper} color={paperTint??'#ffffff'} vertexColors side={DoubleSide}/></mesh>{backdrop&&<mesh geometry={geometry} renderOrder={5}><meshBasicMaterial map={backdrop} vertexColors transparent side={BackSide} depthWrite={false}/></mesh>}</group>;
}
/** The case: the second half lying open (its page the flat stage), the first half standing with the backdrop, the spine around the fold.
 *  Drawn in the open book's frame and turned −90° about y, so the binding runs across the screen and the flat page reaches the reader. */
/** `floor` tones the flat page to the spread's paper (src/story.ts `paper`); `sheetFloor` the turning sheet's paper face. */
export function StandingCase({materials,backdrop,turnBackdrop,turning,progress,stand,floor,sheetFloor}:{materials:BookMaterials;backdrop?:Texture;turnBackdrop?:Texture;turning:1|-1|0;progress:RefObject<{value:number}>;stand:RefObject<{value:number}>;floor?:string;sheetFloor?:string}){
 const upright=useBackdrop(backdrop),sheetBack=useBackdrop(turnBackdrop),settle=useSettle();
 // Turning forward, the flat page still shows the spread being turned until the sheet starts to lift and uncovers the next one, so the
 // floor never changes tone while the old cards stand on it (or before the sheet that carries the old tone has appeared).
 const page=useRef<Group>(null!),tones=useMemo(()=>({floor:new Color(floor??'#ffffff'),sheet:new Color(sheetFloor??'#ffffff')}),[floor,sheetFloor]);
 useFrame(()=>{const material=(page.current?.children[0] as Mesh|undefined)?.material as MeshBasicMaterial|undefined;if(!material?.map)return;
  material.color.copy(turning===1&&standingSheetProgress(progress.current.value)<=0?tones.sheet:tones.floor);});
 return <group rotation={[0,-Math.PI/2,0]}>
  <Board materials={materials} x={BOOK_BOARD.x}/><PaperBlock materials={materials} x={BLOCK_X}/>
  {materials.endpaper&&<group ref={page}><PrintedPage texture={materials.endpaper} edge={materials['paper-edge']} tint={floor}/></group>}
  <BindingDetails materials={materials}/><StandingSpine materials={materials} stand={stand} settle={settle}/>
  <StandingHalf materials={materials} backdrop={upright} stand={stand} settle={settle}/>
  {turning!==0&&<StandingSheet paper={materials.endpaper} paperTint={sheetFloor} backdrop={sheetBack} progress={progress} direction={turning} settle={settle}/>}
 </group>;
}
type StandingTurn={direction:1|-1}|null;
/** A pop-up card standing on the flat page at its phone placement; it folds back flat to turn the page and stands up again after. */
type StandingCardProps={layer:Layer;texture:Texture;hinges:RefObject<Map<string,Group>>;onClick:(detail?:string)=>void;incoming?:boolean};
/** The card's face on the phone: its picture, its click, and the glow that marks it clickable. */
function StandingFace({layer,texture,onClick,incoming=false}:Omit<StandingCardProps,'hinges'>){
 const place=standingPlacement(layer),phase=useStory(s=>s.phase);
 const geometry=useDisposable(()=>createCardGeometry({center:0,width:place.size[0],u0:0,u1:1,side:'right'},place.size[1]),[place.size[0],place.size[1]]);
 // Clickable cards glow (src/cardHalo.ts) instead of swaying.
 const glows=!!layer.interactive,live=!incoming&&glows;
 return <>{glows&&<CardHalo layer={layer} texture={texture} width={place.size[0]} height={place.size[1]} incoming={incoming}/>}<mesh geometry={geometry} material={cardMaterial(texture)} dispose={null} position={[0,place.size[1]/2,0]} onClick={live?e=>{e.stopPropagation();if(phase==='EXPLORING')onClick(layer.detail);}:undefined} onPointerOver={live?()=>{if(phase==='EXPLORING'){document.body.style.cursor='pointer';lightHalo(texture);}}:undefined} onPointerOut={()=>{document.body.style.cursor='';if(live&&useStory.getState().detail!==layer.detail)restHalo(layer,texture);}}/></>;
}
/** A card standing on another card (`on` in src/story.ts), inside that card's hinge so it folds with it (src/popupStack.ts). */
export function StandingGluedCard({parent,...card}:StandingCardProps&{parent:Layer}){
 const {layer,hinges,incoming=false}=card;const ref=useRef<Group>(null!);
 const place=standingPlacement(layer),base=standingPlacement(parent);
 const key=`${incoming?'incoming:':''}${layer.id}:right`;
 useEffect(()=>{const group=ref.current;group.userData.glued=true;hinges.current.set(key,group);return()=>{hinges.current.delete(key);};},[key,hinges]);
 return <group ref={ref} position={[place.x-base.x,surfaceY(place.z)+(place.lift??0)-surfaceY(base.z)-(base.lift??0),place.z-base.z]}><StandingFace {...card}/></group>;
}
export function StandingLayer({layer,texture,hinges,onClick,turn,progress,incoming=false,rank=0,children}:StandingCardProps&{turn:StandingTurn;progress:RefObject<{value:number}>;rank?:number;children?:ReactNode}){
 const place=standingPlacement(layer);
 const anchor=useRef<Group>(null!),ref=useRef<Group>(null!);
 const key=`${incoming?'incoming:':''}${layer.id}:right`;
 useEffect(()=>{const group=ref.current;hinges.current.set(key,group);return()=>{hinges.current.delete(key);};},[key,hinges]);
 useFrame(()=>{
  if(turn){const p=progress.current.value;ref.current.rotation.x=incoming?standingFoldIn(p):standingFoldOut(p);anchor.current.visible=incoming?p>.78:p<.3;}else anchor.current.visible=true;
  // Folded cards stack, front ones on top (src/popupStack.ts); upright the lift is zero.
  anchor.current.position.set(place.x,surfaceY(place.z)+(place.lift??0)+flatLift(rank,ref.current.rotation.x),place.z);
 });
 return <group ref={anchor}><group ref={ref}><StandingFace layer={layer} texture={texture} onClick={onClick} incoming={incoming}/>{children}</group></group>;
}
