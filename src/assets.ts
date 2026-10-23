import { SRGBColorSpace, Texture, TextureLoader } from 'three';
import {artSource} from './artSource';
import { sceneArt, takeEarly } from './artFetch';
const cache=new Map<string,Promise<Texture>>();
const ready=new Map<string,Texture>();
const loadFailed=()=>new Error('종이 풍경을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.');
const decodeFailed=()=>new Error('종이 풍경을 준비하지 못했어요. 다시 시도해 주세요.');
async function fetchBlob(url:string){const response=await fetch(url);if(!response.ok)throw loadFailed();return response.blob();}
/** Decodes and flips off the main thread, so the later GPU upload is a plain copy instead of a long main-thread task. */
async function bitmapTexture(url:string){
 // Taken over from the early download (src/artFetch.ts) when there was one; fetched again if that failed.
 const blob=await takeEarly(url)?.catch(()=>null)||await fetchBlob(url);
 let bitmap:ImageBitmap;try{bitmap=await createImageBitmap(blob,{imageOrientation:'flipY',premultiplyAlpha:'none'});}catch{throw decodeFailed();}
 const texture=new Texture(bitmap);texture.flipY=false;return texture;
}
function imageTexture(url:string){
 return new Promise<Texture>((resolve,reject)=>new TextureLoader().load(url,async texture=>{try{await (texture.image as HTMLImageElement).decode();resolve(texture);}catch{texture.dispose();reject(decodeFailed());}},undefined,()=>reject(loadFailed())));
}
/** The printed pages and the phone's painted floors (three.js caps anisotropy at what the GPU supports). */
const PRINTED=/^page-\d|-stage(-sheet)?$/;
export function loadTexture(name:string):Promise<Texture>{
 const previous=cache.get(name);if(previous)return previous;
 const url=artSource(name);
 // A printed page is seen at a slant, so without anisotropic filtering it falls to a blurred mipmap far before its own resolution runs out.
 const promise=(typeof createImageBitmap==='function'?bitmapTexture(url).catch(()=>imageTexture(url)):imageTexture(url)).then(texture=>{texture.colorSpace=SRGBColorSpace;if(PRINTED.test(name))texture.anisotropy=8;texture.needsUpdate=true;ready.set(name,texture);return texture;},error=>{cache.delete(name);ready.delete(name);throw error;});
 cache.set(name,promise);return promise;
}
export async function loadScene(chapter:number):Promise<Record<string,Texture>>{return Object.fromEntries(await Promise.all(sceneArt(chapter).map(async ([name,file])=>[name,await loadTexture(file)])));}
export function readyScene(chapter:number):Record<string,Texture>|null {const pairs=sceneArt(chapter);if(pairs.some(([,file])=>!ready.has(file)))return null;return Object.fromEntries(pairs.map(([name,file])=>[name,ready.get(file)!]));}

