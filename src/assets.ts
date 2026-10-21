import { SRGBColorSpace, Texture, TextureLoader } from 'three';
import { scenes } from './story';
import {artSource} from './artSource';
const cache=new Map<string,Promise<Texture>>();
const ready=new Map<string,Texture>();
const loadFailed=()=>new Error('종이 풍경을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.');
const decodeFailed=()=>new Error('종이 풍경을 준비하지 못했어요. 다시 시도해 주세요.');
/** Decodes and flips off the main thread, so the later GPU upload is a plain copy instead of a long main-thread task. */
async function bitmapTexture(url:string){
 const response=await fetch(url);if(!response.ok)throw loadFailed();
 const blob=await response.blob();
 let bitmap:ImageBitmap;try{bitmap=await createImageBitmap(blob,{imageOrientation:'flipY',premultiplyAlpha:'none'});}catch{throw decodeFailed();}
 const texture=new Texture(bitmap);texture.flipY=false;return texture;
}
function imageTexture(url:string){
 return new Promise<Texture>((resolve,reject)=>new TextureLoader().load(url,async texture=>{try{await (texture.image as HTMLImageElement).decode();resolve(texture);}catch{texture.dispose();reject(decodeFailed());}},undefined,()=>reject(loadFailed())));
}
export function loadTexture(name:string):Promise<Texture>{
 const previous=cache.get(name);if(previous)return previous;
 const url=artSource(name);
 const promise=(typeof createImageBitmap==='function'?bitmapTexture(url).catch(()=>imageTexture(url)):imageTexture(url)).then(texture=>{texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;ready.set(name,texture);return texture;},error=>{cache.delete(name);ready.delete(name);throw error;});
 cache.set(name,promise);return promise;
}
/** The art names a spread needs: its cards and, if it has one, the painted floor of the phone's flat page (`stage`, src/story.ts). */
const sceneArt=(chapter:number)=>{const scene=scenes[chapter] as {stage?:string;layers:{src:string}[]};return [...scene.layers.map(l=>l.src),...(scene.stage?[scene.stage,scene.stage+'-sheet']:[])];};
export async function loadScene(chapter:number):Promise<Record<string,Texture>>{return Object.fromEntries(await Promise.all(sceneArt(chapter).map(async src=>[src,await loadTexture(src)])));}
export function readyScene(chapter:number):Record<string,Texture>|null {const names=sceneArt(chapter);if(names.some(src=>!ready.has(src)))return null;return Object.fromEntries(names.map(src=>[src,ready.get(src)!]));}
export function preloadScene(chapter:number){if(chapter<scenes.length)void loadScene(chapter).catch(()=>{});}
