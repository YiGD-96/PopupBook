/**
 * The glow that marks a clickable card (it replaced the cards' sway, which stuttered on iPhones and kept the GPU busy).
 *
 * Each clickable card gets a halo: its own cut-out silhouette, tinted lamp-warm and softened, drawn just behind the card so only the
 * glow around the edge shows. It is made once per picture from a small copy of the card's image (loadHalo), and it is only a change
 * of brightness: a brightness change looks smooth at any frame rate, and once it settles the book stops drawing altogether.
 *
 * When a spread opens, its clickable cards blink together three times (about 1.3 s each), then keep a faint rim; hovering or pressing a card lights it fully; a
 * card whose story was read keeps a fainter rim. Halos start dark, so the first frame after the intro film is the film's last frame.
 */
import gsap from 'gsap';
import { CanvasTexture, DoubleSide, MeshBasicMaterial, SRGBColorSpace, type Texture } from 'three';
import type { Layer } from './story';

export const HALO={color:'#ffc768',size:192,pad:.1,spread:.018,boost:1.7,peak:1,rest:.4,seen:.18};
export type Halo={material:MeshBasicMaterial;texture:CanvasTexture;scale:[number,number]};
const halos=new WeakMap<Texture,Halo>();
/** Stories already opened (their cards keep a fainter rim). */
export const seenStories=new Set<string>();

// Small CPU canvases throughout: the halo is read back once, and mixing GPU canvases in would cost readback stalls.
function canvas(width:number,height:number){const c=document.createElement('canvas');c.width=width;c.height=height;return {c,g:c.getContext('2d',{willReadFrequently:true})!};}
const making=new WeakMap<Texture,Promise<Halo>>();
/**
 * Makes the halo of a card picture (once; kept for the page's life, like the card material in src/bookParts.tsx). The picture is first
 * shrunk to the halo's size by the browser (createImageBitmap resize, off the main thread where supported), so the work here is on a
 * ~200 px image: a couple of milliseconds instead of reading back a 1440 px picture.
 */
export function loadHalo(texture:Texture):Promise<Halo>{
 const known=halos.get(texture);if(known)return Promise.resolve(known);
 const pending=making.get(texture);if(pending)return pending;
 const promise=(async()=>{
  const image=texture.image as ImageBitmapSource&CanvasImageSource&{width:number;height:number};
  const k=HALO.size/Math.max(image.width,image.height),w=Math.max(1,Math.round(image.width*k)),h=Math.max(1,Math.round(image.height*k));
  let source:CanvasImageSource=image;
  if(typeof createImageBitmap==='function')try{source=await createImageBitmap(image,{resizeWidth:w,resizeHeight:h,resizeQuality:'medium'});}catch{/* drawn full size below */}
  const pad=Math.round(HALO.size*HALO.pad),W=w+2*pad,H=h+2*pad;
  // The silhouette in the glow colour, widened a little all round so the glow reaches out past the card's paper edge.
  const shape=canvas(W,H);shape.g.drawImage(source,pad,pad,w,h);shape.g.globalCompositeOperation='source-in';shape.g.fillStyle=HALO.color;shape.g.fillRect(0,0,W,H);
  if('close' in source&&source!==image)(source as ImageBitmap).close();
  const glow=canvas(W,H),reach=HALO.size*HALO.spread;
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;glow.g.drawImage(shape.c,Math.cos(a)*reach,Math.sin(a)*reach);}
  // Softened by shrinking and growing back (a blur every browser draws fast, older iOS Safari included); drawn three times over so the
  // glow stays full near the edge and fades outward.
  const blurred=canvas(W,H);blurred.g.imageSmoothingQuality='high';
  for(const factor of [3,7]){
   const small=canvas(Math.max(1,Math.round(W/factor)),Math.max(1,Math.round(H/factor)));
   small.g.imageSmoothingQuality='high';small.g.drawImage(glow.c,0,0,small.c.width,small.c.height);
   for(let i=0;i<(factor===3?2:1);i++)blurred.g.drawImage(small.c,0,0,W,H);
  }
  // Blurring thins the glow; strengthen it so the rim reads clearly next to the card.
  const pixels=blurred.g.getImageData(0,0,W,H);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=Math.min(255,pixels.data[i]*HALO.boost);blurred.g.putImageData(pixels,0,0);
  const map=new CanvasTexture(blurred.c);map.colorSpace=SRGBColorSpace;map.flipY=texture.flipY;
  const material=new MeshBasicMaterial({map,transparent:true,opacity:0,depthWrite:false,side:DoubleSide,forceSinglePass:true});
  material.visible=false;
  const halo:Halo={material,texture:map,scale:[W/w,H/h]};halos.set(texture,halo);making.delete(texture);return halo;
 })();
 making.set(texture,promise);return promise;
}
/** The halo if it was made already (none is made here). */
export const madeHalo=(texture:Texture)=>halos.get(texture);
/** Waits for an idle moment (never a frame that is drawing a turn). */
export const idle=()=>new Promise<void>(resolve=>{
 const request=(window as unknown as {requestIdleCallback?:(f:()=>void,o?:{timeout:number})=>number}).requestIdleCallback;
 if(request)request(()=>resolve(),{timeout:600});else window.setTimeout(resolve,120);
});
/** Makes a halo in idle time, then calls back. */
export function makeHaloSoon(texture:Texture,ready:(halo:Halo)=>void){void idle().then(()=>loadHalo(texture)).then(ready).catch(()=>{});}
const restOf=(layer:Layer)=>layer.detail&&seenStories.has(layer.detail)?HALO.seen:HALO.rest;
/** Tweens a halo's brightness; it is skipped while dark (no fill cost). */
function fade(halo:Halo,opacity:number,vars:gsap.TweenVars={}){
 const {material}=halo;
 return gsap.to(material,{opacity,duration:.3,ease:'sine.inOut',overwrite:'auto',...vars,onUpdate:()=>{material.visible=material.opacity>.004;},onComplete:()=>{material.visible=material.opacity>.004;}});
}
/** When a spread opens, all its clickable cards blink together three times (about 1.3 s each), then settle to their rim. */
export function pulseHalos(cards:{layer:Layer;texture:Texture}[]){
 const timeline=gsap.timeline();
 // A card whose halo is still being made fades in to its rim when it is ready (src/bookParts.tsx CardHalo).
 for(const {layer,texture} of cards.filter(c=>madeHalo(c.texture))){
  const {material}=madeHalo(texture)!,blink=[{opacity:HALO.peak,duration:.65},{opacity:.3,duration:.65}];
  timeline.to(material,{keyframes:[...blink,...blink,{opacity:HALO.peak,duration:.65},{opacity:restOf(layer),duration:.7}],ease:'sine.inOut',
   onStart:()=>{material.visible=true;},onUpdate:()=>{material.visible=material.opacity>.004;}},0);
 }
 return timeline;
}
export function lightHalo(texture:Texture){const halo=halos.get(texture);if(halo)fade(halo,HALO.peak,{duration:.18});}
export function restHalo(layer:Layer,texture:Texture){const halo=halos.get(texture);if(halo)fade(halo,restOf(layer),{duration:.45});}
/** Darkens a halo that exists (a card not yet shown has none to darken, and none is made for it here). */
export function darkHalo(texture:Texture,duration=.25){const halo=halos.get(texture);if(halo)fade(halo,0,{duration});}
