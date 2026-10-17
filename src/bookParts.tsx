import { useEffect, useMemo, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, DoubleSide, FrontSide, PlaneGeometry, type Texture } from 'three';
import { BOOK_BOARD, BOOK_PAGES } from './bookStructure';
import { createBoardGeometry, createPaperBlockGeometry, createRibbonGeometry, createSpineGeometry, lightShade } from './bookGeometry';
import { createPageSkirt, createPaperGeometry, updatePaperGeometry } from './paperGeometry';
import type { PaperPiece } from './paperAttachments';

/** Shared by the live book and the offline intro film, so the movie's last frame is the live book. */
export type BookMaterials=Record<string,Texture|undefined>;
/** Binding textures the open book needs; the printed cover is only filmed, never loaded live. The book casts no shadows. */
export const OPEN_BOOK_MATERIALS=['inside','cloth-side','paper-edge','endpaper'] as const;

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
 return <meshBasicMaterial attach={attach} map={map} color={map?tint:fallback} vertexColors side={DoubleSide} transparent={opacity<1} opacity={opacity} depthWrite/>;
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
export function TurningPage({front,back,progress,direction,lift=0}:{front:Texture;back:Texture;progress:RefObject<{value:number}>;direction:1|-1;lift?:number}){
 const geometry=useDisposable(()=>createPaperGeometry(),[]);const mirrored=useDisposable(()=>{const t=back.clone();t.repeat.x=-1;t.offset.x=1;t.needsUpdate=true;return t;},[back]);
 useFrame(()=>updatePaperGeometry(geometry,progress.current.value,direction));
 return <group position={[0,.018+lift,0]}><mesh geometry={geometry} renderOrder={4}><meshBasicMaterial map={front} side={FrontSide} vertexColors/></mesh><mesh geometry={geometry} renderOrder={4}><meshBasicMaterial map={mirrored} side={BackSide} vertexColors/></mesh></group>;
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
