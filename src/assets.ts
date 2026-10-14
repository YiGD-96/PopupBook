import { SRGBColorSpace, Texture, TextureLoader } from 'three';
import { scenes } from './story';
const cache=new Map<string,Promise<Texture>>();
const ready=new Map<string,Texture>();
export function loadTexture(name:string):Promise<Texture>{
 const previous=cache.get(name);if(previous)return previous;
 const promise=new Promise<Texture>((resolve,reject)=>new TextureLoader().load(`/art/${name}.svg`,async texture=>{try{await (texture.image as HTMLImageElement).decode();texture.colorSpace=SRGBColorSpace;ready.set(name,texture);resolve(texture);}catch{texture.dispose();cache.delete(name);ready.delete(name);reject(new Error('종이 풍경을 준비하지 못했어요. 다시 시도해 주세요.'));}},undefined,()=>{cache.delete(name);ready.delete(name);reject(new Error('종이 풍경을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.'));}));
 cache.set(name,promise);return promise;
}
export async function loadScene(chapter:number):Promise<Record<string,Texture>>{return Object.fromEntries(await Promise.all(scenes[chapter].layers.map(async l=>[l.src,await loadTexture(l.src)])));}
export function readyScene(chapter:number):Record<string,Texture>|null {const layers=scenes[chapter].layers;if(layers.some(l=>!ready.has(l.src)))return null;return Object.fromEntries(layers.map(l=>[l.src,ready.get(l.src)!]));}
export function preloadScene(chapter:number){if(chapter<scenes.length)void loadScene(chapter).catch(()=>{});}
