import { useEffect, useMemo, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, FrontSide, PlaneGeometry, ShaderMaterial, type Texture } from 'three';
import { BOOK_BOARD, BOOK_FLOOR_SHADOW, BOOK_PAGES, POPUP_SHADOW } from './bookStructure';
import { createBoardGeometry, createPaperBlockGeometry, createRibbonGeometry, createSpineGeometry, lightShade } from './bookGeometry';
import { createPageSkirt, createPaperGeometry, updatePaperGeometry } from './paperGeometry';
import { pageBelowAnchor, type PaperPiece } from './paperAttachments';

/** Shared by the live book and the offline intro film, so the movie's last frame is the live book. */
export type BookMaterials=Record<string,Texture|undefined>;
/** Binding textures the open book needs; the printed cover is only filmed, never loaded live. */
export const OPEN_BOOK_MATERIALS=['inside','cloth-side','paper-edge','endpaper','shadow'] as const;

// Static shapes are built once per page load and reused by every mesh.
const once=<T,>(make:()=>T)=>{let value:T|undefined;return()=>value??=make();};
const boardGeometry=once(()=>createBoardGeometry()),flippedBoardGeometry=once(()=>createBoardGeometry(true)),spineGeometry=once(createSpineGeometry),blockGeometry=once(createPaperBlockGeometry);
const ribbonGeometry=once(createRibbonGeometry),shadowGeometry=once(()=>new PlaneGeometry(BOOK_FLOOR_SHADOW.width,BOOK_FLOOR_SHADOW.depth));

export function useDisposable<T extends {dispose:()=>void}>(make:()=>T,deps:unknown[]){
 // eslint-disable-next-line react-hooks/exhaustive-deps
 const value=useMemo(make,deps);useEffect(()=>()=>value.dispose(),[value]);return value;
}
/** Every binding surface uses the same unlit textured + baked-light material, so they share one compiled shader. */
function Surface({map,opacity=1,fallback='#d8c7a8',attach}:{map?:Texture;opacity?:number;fallback?:string;attach?:string}){
 return <meshBasicMaterial attach={attach} map={map} color={map?'#ffffff':fallback} vertexColors side={DoubleSide} transparent={opacity<1} opacity={opacity} depthWrite/>;
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
export function FloorShadow({materials,x,opacity=1}:{materials:BookMaterials;x:number;opacity?:number}){
 if(!materials.shadow)return null;
 return <mesh geometry={shadowGeometry()} position={[x,BOOK_FLOOR_SHADOW.y,BOOK_FLOOR_SHADOW.z]} rotation={[-Math.PI/2,0,0]} renderOrder={-2}><meshBasicMaterial map={materials.shadow} transparent opacity={opacity} depthWrite={false}/></mesh>;
}
export function PrintedPage({texture,edge,left=false,opacity=1,swell=1}:{texture:Texture;edge?:Texture;left?:boolean;opacity?:number;swell?:number}){
 const geometry=useDisposable(()=>{const g=createPaperGeometry(48,12,swell);if(left){g.scale(-1,1,1);const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setX(i,1-uv.getX(i));g.computeVertexNormals();}return g;},[left,swell]);
 const skirt=useDisposable(()=>{const g=createPageSkirt(BOOK_PAGES.y-BOOK_PAGES.thickness/2,lightShade,24,swell);if(left)g.scale(-1,1,1);return g;},[left,swell]);
 return <><mesh geometry={geometry}><Surface map={texture} opacity={opacity}/></mesh><mesh geometry={skirt}><Surface map={edge} opacity={opacity} fallback="#e8dbc2"/></mesh></>;
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
/** A strip lying on the swelled sheet in front of a card; its depth (local z 0→1) is scaled to the shadow length every frame. */
export function createPopupShadowGeometry(piece:PaperPiece,layerY:number,columns=16){
 const geometry=new BufferGeometry();const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let c=0;c<=columns;c++){const t=c/columns,x=(t-.5)*piece.width,y=pageBelowAnchor(piece.center+x,layerY)+.012,u=piece.u0+(piece.u1-piece.u0)*t;positions.push(x,y,0,x,y,1);uv.push(u,0,u,1);}
 for(let c=0;c<columns;c++){const a=c*2;indices.push(a,a+1,a+2,a+2,a+1,a+3);}
 geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));geometry.setIndex(indices);return geometry;
}
/** The card's own alpha, sampled from a coarse mip level, stands in for a blurred silhouette: no extra image or render pass. */
export function createPopupShadowMaterial(map:Texture){
 return new ShaderMaterial({uniforms:{map:{value:map},opacity:{value:POPUP_SHADOW.opacity},color:{value:new Color(...POPUP_SHADOW.color)}},transparent:true,depthWrite:false,side:DoubleSide,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D map;uniform float opacity;uniform vec3 color;varying vec2 vUv;void main(){float a=texture2D(map,vUv,${POPUP_SHADOW.mipBias.toFixed(1)}).a;gl_FragColor=vec4(color,a*opacity*(1.-.55*vUv.y));}`});
}
/** Shadow length and strength follow how upright the card stands (hinge angle 0 = upright, -π/2 = flat). */
export function popupShadowLean(hingeAngle:number){return Math.max(0,Math.cos(hingeAngle));}
/** Where the two halves of the text block sit: each starts just off the gutter. */
export const BLOCK_X=.004+BOOK_PAGES.width/2;
/** The open hardback without its printed sheets: the state the intro film ends in and the live book always shows. */
export function OpenCase({materials}:{materials:BookMaterials}){
 return <>
  <FloorShadow materials={materials} x={-BOOK_BOARD.x}/><FloorShadow materials={materials} x={BOOK_BOARD.x}/>
  <Board materials={materials} x={BOOK_BOARD.x}/><Board materials={materials} x={-BOOK_BOARD.x} flipped/><Spine materials={materials}/>
  <PaperBlock materials={materials} x={-BLOCK_X}/><PaperBlock materials={materials} x={BLOCK_X}/><BindingDetails materials={materials}/>
 </>;
}
