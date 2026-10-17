/** Pieces both intro films use (src/film.tsx for the open book, src/standingFilm.tsx for phones). Offline only. */
import { useMemo } from 'react';
import { DoubleSide, type BufferGeometry, type Texture } from 'three';
import { relightTurned } from './bookGeometry';

export const clamp=(x:number)=>Math.max(0,Math.min(1,x)),smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x);},ease=(x:number)=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
export const FILM_FONT="'Gowun Batang','Noto Serif KR','HANBatang',Batang,serif";

/** Re-bakes a part's light for its current turn about the binding axis, so a turning half is lit as it will be lying open. */
function useTurnedLight(geometry:BufferGeometry,angle:number){
 // The baked colour is light × tint (e.g. the text block's shaded sides); keep each vertex's tint and re-light only.
 const base=useMemo(()=>relightTurned(geometry,0),[geometry]);
 useMemo(()=>relightTurned(geometry,angle,base),[geometry,base,angle]);
}
export function TurnedMesh({geometry,angle,position,maps}:{geometry:BufferGeometry;angle:number;position:[number,number,number];maps:(Texture|undefined)[]}){
 useTurnedLight(geometry,angle);
 return <mesh geometry={geometry} position={position}>{maps.map((map,i)=><meshBasicMaterial key={i} attach={`material-${i}`} map={map} vertexColors side={DoubleSide}/>)}</mesh>;
}
