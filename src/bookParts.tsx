import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BackSide, Color, DoubleSide, Float32BufferAttribute, Fog, FrontSide, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, RepeatWrapping, Scene, type Camera, type Texture, type WebGLRenderer } from 'three';
import { BOOK_BOARD, BOOK_PAGES } from './bookStructure';
import { createBoardGeometry, createPaperBlockGeometry, createRibbonGeometry, createSpineGeometry, lightShade } from './bookGeometry';
import { createPageSkirt, createPaperGeometry, updatePaperGeometry } from './paperGeometry';
import { haloTone, madeHalo, makeHaloSoon, restHalo } from './cardHalo';
import { useStory, type Layer } from './story';
import type { PaperPiece } from './paperAttachments';

/** Shared by the live book and the offline intro film, so the movie's last frame is the live book. */
export type BookMaterials=Record<string,Texture|undefined>;
/** Binding textures the open book needs; the printed cover is only filmed, never loaded live. The book casts no shadows. */
export const OPEN_BOOK_MATERIALS=['inside','cloth-side','paper-edge','endpaper','desk'] as const;

// Static shapes are built once per page load and reused by every mesh.
const once=<T,>(make:()=>T)=>{let value:T|undefined;return()=>value??=make();};
const boardGeometry=once(()=>createBoardGeometry()),flippedBoardGeometry=once(()=>createBoardGeometry(true)),spineGeometry=once(createSpineGeometry),blockGeometry=once(createPaperBlockGeometry);
const ribbonGeometry=once(createRibbonGeometry);

export function useDisposable<T extends {dispose:()=>void}>(make:()=>T,deps:unknown[]){
 // eslint-disable-next-line react-hooks/exhaustive-deps
 const value=useMemo(make,deps);useEffect(()=>()=>value.dispose(),[value]);return value;
}
/** Every binding surface uses the same unlit textured + baked-light material, so they share one compiled shader. */
export function Surface({map,opacity=1,fallback='#d8c7a8',attach,tint='#ffffff'}:{map?:Texture;opacity?:number;fallback?:string;attach?:string;tint?:string}){
 return <meshBasicMaterial attach={attach} map={map} color={map?tint:fallback} vertexColors side={DoubleSide} transparent={opacity<1} forceSinglePass opacity={opacity} depthWrite/>;
}
/** A board lying open; `top`/`bottom` name the textures of the faces looking up and down. `flipped` is the front cover turned over onto the left. */
export function Board({materials,x,y=BOOK_BOARD.y,flipped=false,top='inside',bottom='inside',opacity=1}:{materials:BookMaterials;x:number;y?:number;flipped?:boolean;top?:string;bottom?:string;opacity?:number}){
 return <mesh geometry={flipped?flippedBoardGeometry():boardGeometry()} position={[x,y,0]}>
  {/* One material per geometry group: face looking up, face looking down, wrapped edge. */}
  <Surface attach="material-0" map={materials[top]} opacity={opacity} fallback="#b9806a"/>
  <Surface attach="material-1" map={materials[bottom]} opacity={opacity} fallback="#b9806a"/>
  <Surface attach="material-2" map={materials['cloth-side']} opacity={opacity} fallback="#ac705b"/>
 </mesh>;
}
export function Spine({materials,opacity=1}:{materials:BookMaterials;opacity?:number}){
 return <mesh geometry={spineGeometry()}><Surface map={materials['cloth-side']} opacity={opacity} fallback="#ac705b"/></mesh>;
}
export function PaperBlock({materials,x,opacity=1}:{materials:BookMaterials;x:number;opacity?:number}){
 const faces=['paper-edge','paper-edge','endpaper','endpaper','paper-edge','paper-edge'];
 return <mesh geometry={blockGeometry()} position={[x,BOOK_PAGES.y,0]}>{faces.map((face,index)=><meshBasicMaterial key={index} attach={'material-'+index} map={materials[face]} color={materials[face]?'#ffffff':'#e8dbc2'} vertexColors side={DoubleSide} transparent={opacity<1} opacity={opacity}/>)}</mesh>;
}
/** A ribbon marker tucked between the pages of the half that never turns, so nothing ever passes through it. */
export function BindingDetails({materials,opacity=1}:{materials:BookMaterials;opacity?:number}){
 return <mesh geometry={ribbonGeometry()}><Surface map={materials['paper-edge']} opacity={opacity}/></mesh>;
}
/** `tint` multiplies the printed paper (the standing book tones its plain flat page to each spread's paper colour). */
export function PrintedPage({texture,edge,left=false,opacity=1,swell=1,tint}:{texture:Texture;edge?:Texture;left?:boolean;opacity?:number;swell?:number;tint?:string}){
 const geometry=useDisposable(()=>{const g=createPaperGeometry(48,12,swell);if(left){g.scale(-1,1,1);const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setX(i,1-uv.getX(i));g.computeVertexNormals();}return g;},[left,swell]);
 const skirt=useDisposable(()=>{const g=createPageSkirt(BOOK_PAGES.y-BOOK_PAGES.thickness/2,lightShade,24,swell);if(left)g.scale(-1,1,1);return g;},[left,swell]);
 return <><mesh geometry={geometry}><Surface map={texture} opacity={opacity} tint={tint}/></mesh><mesh geometry={skirt}><Surface map={edge} opacity={opacity} fallback="#e8dbc2"/></mesh></>;
}
/**
 * Another view of an uploaded picture (its own repeat/offset): shares the picture on the GPU. Marking it needsUpdate would also flag the
 * shared picture and upload it again, a whole page image in the first frame of every turn; a version of its own is enough.
 */
export function textureView(texture:Texture,adjust:(view:Texture)=>void){const view=texture.clone();adjust(view);view.version=Math.max(1,texture.version);return view;}
/** The sheet in mid-turn. Stays mounted (hidden) between turns, so a turn only swaps its pictures instead of setting it up again. */
export function TurningPage({front,back,progress,direction,lift=0,visible=true}:{front:Texture;back:Texture;progress:RefObject<{value:number}>;direction:1|-1;lift?:number;visible?:boolean}){
 const geometry=useDisposable(()=>createPaperGeometry(),[]);const mirrored=useDisposable(()=>textureView(back,t=>{t.repeat.x=-1;t.offset.x=1;}),[back]);
 useFrame(()=>{if(visible)updatePaperGeometry(geometry,progress.current.value,direction);});
 return <group position={[0,.018+lift,0]} visible={visible}><mesh geometry={geometry} renderOrder={4}><meshBasicMaterial map={front} side={FrontSide} vertexColors/></mesh><mesh geometry={geometry} renderOrder={4}><meshBasicMaterial map={mirrored} side={BackSide} vertexColors/></mesh></group>;
}

/** A popup card piece: the art split at the binding, standing on its hinge line. */
export function createCardGeometry(piece:PaperPiece,height:number){
 const g=new PlaneGeometry(piece.width,height);const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setX(i,piece.u0+(piece.u1-piece.u0)*uv.getX(i));return g;
}
/** Where the two halves of the text block sit: they meet at the binding, so the split between the stacks shows only their shaded sides. */
export const BLOCK_X=.0005+BOOK_PAGES.width/2;
/** The open hardback without its printed sheets: the state the intro film ends in and the live book always shows. */
export function OpenCase({materials}:{materials:BookMaterials}){
 return <>
  <Board materials={materials} x={BOOK_BOARD.x}/><Board materials={materials} x={-BOOK_BOARD.x} flipped/><Spine materials={materials}/>
  <PaperBlock materials={materials} x={-BLOCK_X}/><PaperBlock materials={materials} x={BLOCK_X}/><BindingDetails materials={materials}/>
 </>;
}

/**
 * The walnut desk the book lies on (texture: scripts/book-materials.mjs). One plane under the board, reaching behind the camera and far
 * into the distance; the lamp's warm pool around the book is baked into its vertex colours, and fog (DeskFog) fades the far desk into the
 * room's dark, the page colour around the canvas, so the canvas and the films have no visible edge.
 */
export const DESK={y:BOOK_BOARD.y-BOOK_BOARD.thickness/2-.004,tile:3,color:'#1a110b',fog:[16,38] as [number,number]};
const deskGeometry=once(()=>{
 const width=170,depth=170,front=14,g=new PlaneGeometry(width,depth,96,96);
 g.rotateX(-Math.PI/2);g.translate(0,DESK.y,front-depth/2);
 const position=g.getAttribute('position'),uv=g.getAttribute('uv'),colors:number[]=[];
 for(let i=0;i<position.count;i++){
  const x=position.getX(i),z=position.getZ(i);
  uv.setXY(i,x/DESK.tile,-z/DESK.tile);
  // Lamp light: a warm pool centred a little behind the book, the rest of the desk in soft shadow.
  const pool=Math.exp(-(x*x)/(2*4.6*4.6)-((z+.4)*(z+.4))/(2*3.9*3.9)),light=.3+1.12*pool;
  colors.push(light*(1+.12*pool),light*(.97+.02*pool),light*(.86-.06*pool));
 }
 g.setAttribute('color',new Float32BufferAttribute(colors,3));
 return g;
});
function useDeskTexture(map:Texture|undefined){
 const {gl}=useThree();
 useMemo(()=>{if(!map)return;map.wrapS=map.wrapT=RepeatWrapping;map.anisotropy=Math.min(8,gl.capabilities.getMaxAnisotropy());map.needsUpdate=true;},[map,gl]);
}
const deskMaterial=(map:Texture|undefined)=>new MeshBasicMaterial({map:map??null,color:map?'#ffffff':'#3e2a1c',vertexColors:true});
/** The desk drawn every frame, for the intro films (src/film.tsx, src/standingFilm.tsx). The live book uses DeskBackdrop. */
export function Desk({materials}:{materials:BookMaterials}){
 const map=materials.desk;useDeskTexture(map);
 return <mesh geometry={deskGeometry()} renderOrder={-3}><meshBasicMaterial map={map} color={map?'#ffffff':'#3e2a1c'} vertexColors/></mesh>;
}
/**
 * The live book's desk. The desk and the camera stand still while reading, so the desk is drawn once (again only when the canvas size or
 * the camera changes) and copied into a plain 2D canvas right behind the WebGL canvas; each frame then draws only the book. The page
 * composites the transparent book canvas over it, which blends exactly as drawing the book over the desk did (edges included), and saves
 * the desk's whole-screen texture filtering and fog every frame (~3 ms of an integrated GPU's 16.7 ms at 1920×1080).
 */
export function DeskBackdrop({materials}:{materials:BookMaterials}){
 const {gl,camera,scene}=useThree(),map=materials.desk;useDeskTexture(map);
 const desk=useMemo(()=>{const room=new Scene();room.add(new Mesh(deskGeometry(),deskMaterial(map)));return room;},[map]);
 useEffect(()=>()=>{(desk.children[0] as Mesh<PlaneGeometry,MeshBasicMaterial>).material.dispose();},[desk]);
 const backdrop=useMemo(()=>{const c=document.createElement('canvas');c.className='desk-backdrop';c.setAttribute('aria-hidden','true');
  Object.assign(c.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});return c;},[]);
 // Behind the WebGL canvas (both positioned, so document order stacks them), inside R3F's sized container.
 useEffect(()=>{const canvas=gl.domElement;canvas.style.position='relative';canvas.parentElement?.insertBefore(backdrop,canvas);return()=>backdrop.remove();},[gl,backdrop]);
 const drawn=useRef('');
 useFrame(()=>{
  const cam=camera as PerspectiveCamera,canvas=gl.domElement;
  const key=`${canvas.width}x${canvas.height} ${cam.fov} ${cam.aspect} ${cam.view?.offsetY??0} ${cam.position.toArray()} ${cam.quaternion.toArray()} ${scene.fog?1:0} ${map?.uuid}`;
  if(key===drawn.current)return;drawn.current=key;
  desk.fog=scene.fog;backdrop.width=canvas.width;backdrop.height=canvas.height;
  gl.render(desk,camera);backdrop.getContext('2d')!.drawImage(canvas,0,0);
 });
 return null;
}
/** The room's dark: fog over the far desk; the films also clear to it (`background`). */
export function DeskFog({background=false}:{background?:boolean}){
 const {scene}=useThree();
 useEffect(()=>{scene.fog=new Fog(DESK.color,...DESK.fog);if(background)scene.background=new Color(DESK.color);return()=>{scene.fog=null;};},[scene,background]);
 return null;
}

/**
 * One material per card picture, shared by every card that shows it (the spread, the incoming page during a turn, the standing book), so
 * turning a page never sets materials up again. Lives as long as the cached texture (src/assets.ts), i.e. the page. Drawn in one pass:
 * three.js draws a see-through two-sided material as back faces then front faces, switching its shader setup twice per card per frame,
 * which a flat cutout card does not need.
 */
const cardMaterials=new WeakMap<Texture,MeshBasicMaterial>();
export function cardMaterial(texture:Texture){
 let material=cardMaterials.get(texture);
 if(!material){material=new MeshBasicMaterial({map:texture,transparent:true,alphaTest:.025,side:DoubleSide,depthWrite:true,forceSinglePass:true});cardMaterials.set(texture,material);}
 return material;
}
/** The turning sheet's two faces (the open book) and the standing sheet's faces, as they will be drawn, for warmMaterials at startup. */
export function sheetMaterials(paper:Texture){
 return [new MeshBasicMaterial({map:paper,vertexColors:true,side:FrontSide}),new MeshBasicMaterial({map:paper,vertexColors:true,side:BackSide}),
  new MeshBasicMaterial({map:paper,vertexColors:true,side:DoubleSide}),new MeshBasicMaterial({map:paper,vertexColors:true,transparent:true,side:BackSide,depthWrite:false})];
}
/**
 * Sets up materials ahead of their first frame on screen: shader programs are built (or found in the cache) and bound to each material
 * here, in a moment of the caller's choosing, instead of in the first frame of a page turn. Uses the live scene's fog so the programs match.
 */
const warmGeometry=once(()=>{const g=new PlaneGeometry(.01,.01);g.setAttribute('color',new Float32BufferAttribute(new Array(g.getAttribute('position').count*3).fill(1),3));return g;});
export function warmMaterials(renderer:Pick<WebGLRenderer,'compile'>,world:Scene,camera:Camera,materials:MeshBasicMaterial[]){
 if(!materials.length)return;
 const temp=new Scene();temp.fog=world.fog;
 for(const material of materials)temp.add(new Mesh(warmGeometry(),material));
 renderer.compile(temp,camera);
}

const haloPlane=once(()=>new PlaneGeometry(1,1));
/**
 * A clickable card's glow (src/cardHalo.ts), just behind the card's face of the given size. Usually made ahead (startup, warmChapter);
 * if not, it is made in idle time after the card appears, never in a turn's frame, and fades in to its rim on a spread being read.
 */
/** Drawn after the cards (renderOrder 1): the glow writes no depth, so a card behind it drawn later would paint over it (the fly swatter's
 *  glow vanished under its shed); drawn last it is still hidden, by the depth test, behind any card in front of it.
 *  The glow stays centred on the card: the part below its foot is simply hidden by the page it stands on. (Lifting the halo to keep all
 *  of it above the page, as the phone's book once did, slid the glow off the card's silhouette.) */
/** `reach`: the least rim width for this view (the phone passes the card's own `glow`). */
export function CardHalo({layer,texture,width,height,incoming=false,reach}:{layer:Layer;texture:Texture;width:number;height:number;incoming?:boolean;reach?:number}){
 const [halo,setHalo]=useState(()=>madeHalo(texture));
 useEffect(()=>{
  if(halo)return;let live=true;
  makeHaloSoon(texture,made=>{if(!live)return;setHalo(made);if(!incoming&&useStory.getState().phase==='EXPLORING')restHalo(layer,texture);},haloTone(layer),Math.max(width,height),reach);
  return()=>{live=false;};
 },[halo,texture,layer,incoming,width,height,reach]);
 if(!halo)return null;
 return <mesh geometry={haloPlane()} material={halo.material} dispose={null} renderOrder={1} position={[0,height/2,-.008]} scale={[width*halo.scale[0],height*halo.scale[1],1]}/>;
}
