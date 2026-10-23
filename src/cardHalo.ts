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
import { scenes, useStory, type Layer, type Phase } from './story';

// A soft glow spreading wide around the card, made small (`size` px, so it stays soft) and starting right at the cut-out's edge (`edge`:
// the band along the outline, as a fraction of `size`). `reach`: the least width of the glow in world units, so a small card (the fly
// swatter on the phone) still glows visibly.
// One glow for every spread: chapter 1's deep orange with its stronger rim (it reads on the pale paintings too).
export const HALO={color:'#ff9418',size:128,pad:.1,spread:.018,edge:.012,reach:.05,boost:2.4,peak:1,rest:.7,seen:.32};
/** A spread's own glow (src/story.ts `halo`): a deeper colour, a stronger rim and rest where the default would vanish into its painting. */
export type HaloTone={color:string;boost:number;rest:number;seen:number};
export function haloTone(layer:Layer):HaloTone{
 const scene=scenes.find(s=>(s.layers as Layer[]).includes(layer)) as {halo?:Partial<HaloTone>}|undefined;
 return {color:HALO.color,boost:HALO.boost,rest:HALO.rest,seen:HALO.seen,...scene?.halo};
}
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
 * ~130 px image: a millisecond or two instead of reading back a 1440 px picture.
 */
/** `extent`: the card's larger side in world units, so the rim is never thinner than `reach` (HALO.reach, or the card's own `glow`). */
export function loadHalo(texture:Texture,tone:Pick<HaloTone,'color'|'boost'>=HALO,extent=Infinity,reach=HALO.reach):Promise<Halo>{
 const known=halos.get(texture);if(known)return Promise.resolve(known);
 const pending=making.get(texture);if(pending)return pending;
 const promise=(async()=>{
  const image=texture.image as ImageBitmapSource&CanvasImageSource&{width:number;height:number};
  const k=HALO.size/Math.max(image.width,image.height),w=Math.max(1,Math.round(image.width*k)),h=Math.max(1,Math.round(image.height*k));
  let source:CanvasImageSource=image;
  if(typeof createImageBitmap==='function')try{source=await createImageBitmap(image,{resizeWidth:w,resizeHeight:h,resizeQuality:'medium'});}catch{/* drawn full size below */}
  const spread=Math.max(HALO.spread,reach/extent),pad=Math.round(HALO.size*Math.max(HALO.pad,spread*3)),W=w+2*pad,H=h+2*pad;
  // The silhouette in the glow colour, widened a little all round so the glow reaches out past the card's paper edge. Only the card's
  // solid paper counts: a soft shadow baked under a card's foot (the farmer's) would otherwise glow as a blob on the ground.
  const shape=canvas(W,H);shape.g.drawImage(source,pad,pad,w,h);
  // How much of each pixel the card itself covers (its own alpha, soft fringe included), kept to cut the glow out of the card below.
  const solid=shape.g.getImageData(0,0,W,H),coverage=new Uint8ClampedArray(W*H);
  for(let i=3;i<solid.data.length;i+=4){coverage[(i-3)/4]=solid.data[i];solid.data[i]=solid.data[i]>=128?255:0;}shape.g.putImageData(solid,0,0);
  shape.g.globalCompositeOperation='source-in';shape.g.fillStyle=tone.color;shape.g.fillRect(0,0,W,H);
  if('close' in source&&source!==image)(source as ImageBitmap).close();
  const glow=canvas(W,H),offset=HALO.size*spread;
  // The silhouette itself and rings of copies at a third, two thirds and the whole of the offset: a ring at the full offset alone left an
  // empty band right next to thin parts (the swatter's handle, the carrot tops), so the glow seemed to float apart from the card.
  glow.g.drawImage(shape.c,0,0);
  for(const k of [1/3,2/3,1])for(let i=0;i<12;i++){const a=(i+k)/12*Math.PI*2;glow.g.drawImage(shape.c,Math.cos(a)*offset*k,Math.sin(a)*offset*k);}
  // Softened by shrinking and growing back (a blur every browser draws fast, older iOS Safari included); drawn three times over so the
  // glow stays full near the edge and fades outward.
  const blurred=canvas(W,H);blurred.g.imageSmoothingQuality='high';
  for(const factor of [3,7]){
   const small=canvas(Math.max(1,Math.round(W/factor)),Math.max(1,Math.round(H/factor)));
   small.g.imageSmoothingQuality='high';small.g.drawImage(glow.c,0,0,small.c.width,small.c.height);
   for(let i=0;i<(factor===3?2:1);i++)blurred.g.drawImage(small.c,0,0,W,H);
  }
  // The glow starts right at the cut-out's edge: a band just past the outline at full strength (the silhouette nudged out a little all
  // round, softened by one small shrink), so no dim gap shows between the card and its glow; the haze spreads out from it.
  const edge=Math.max(1,HALO.size*HALO.edge),band=canvas(W,H);band.g.drawImage(shape.c,0,0);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;band.g.drawImage(shape.c,Math.cos(a)*edge,Math.sin(a)*edge);}
  const half=canvas(Math.max(1,Math.round(W/2)),Math.max(1,Math.round(H/2)));half.g.imageSmoothingQuality='high';half.g.drawImage(band.c,0,0,half.c.width,half.c.height);
  blurred.g.drawImage(half.c,0,0,W,H);
  // Blurring thins the glow; strengthen it so the rim reads clearly next to the card. Then cut the card out of it (glow × (1 − the card's
  // coverage)): the halo is drawn just in front of its card (src/bookParts.tsx CardHalo), so it never tints the card and, across the
  // card's soft paper fringe, fills in exactly as the fringe fades. Drawn behind, the fringe (which writes depth) hid the glow and the
  // dark desk showed through it as a gap between the card and its glow.
  const pixels=blurred.g.getImageData(0,0,W,H);
  for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=Math.min(255,pixels.data[i]*tone.boost)*(1-coverage[(i-3)/4]/255);
  blurred.g.putImageData(pixels,0,0);
  const map=new CanvasTexture(blurred.c);map.colorSpace=SRGBColorSpace;map.flipY=texture.flipY;
  const material=new MeshBasicMaterial({map,transparent:true,opacity:0,depthWrite:false,side:DoubleSide,forceSinglePass:true});
  material.visible=false;
  const halo:Halo={material,texture:map,scale:[W/w,H/h]};halos.set(texture,halo);making.delete(texture);return halo;
 })();
 making.set(texture,promise);return promise;
}
/** The halo if it was made already (none is made here). */
export const madeHalo=(texture:Texture)=>halos.get(texture);
/** While the book moves (a spread loading, a page turning or dragged, cards rising), work that can wait does. */
const MOVING=new Set<Phase>(['LOADING_PAGE','TURNING_PAGE','DRAGGING_PAGE','OPENING_POPUP']);
/** The book is still: nothing loading or moving and no animation running (cards rising, a glow blinking), so the canvas draws nothing
 *  and a long task costs no frame. (All the book's animations end; the card hop repeats once.) */
export const bookStill=()=>!MOVING.has(useStory.getState().phase)&&!gsap.globalTimeline.getChildren(false,true,true).length;
/** Waits for an idle moment while the book is still. requestIdleCallback's timeout (so the work is not put off for ever on a busy page)
 *  used to run the work in the middle of a turn: a halo made then (tens of milliseconds) stalled the turn (2 → 3 notably, whose next
 *  spread has many cards), and right after one it stuttered the landing spread's blinking glow. So stillness is checked again after it
 *  and the wait goes on until the book is still. */
export const idle=()=>new Promise<void>(resolve=>{
 const request=(window as unknown as {requestIdleCallback?:(f:()=>void,o?:{timeout:number})=>number}).requestIdleCallback;
 const attempt=()=>{const go=()=>{if(!bookStill()){window.setTimeout(attempt,250);return;}resolve();};
  if(request)request(go,{timeout:600});else window.setTimeout(go,120);};
 attempt();
});
/** Makes a halo in idle time, then calls back. */
export function makeHaloSoon(texture:Texture,ready:(halo:Halo)=>void,tone?:HaloTone,extent?:number,reach?:number){void idle().then(()=>loadHalo(texture,tone,extent,reach)).then(ready).catch(()=>{});}
const restOf=(layer:Layer)=>{const tone=haloTone(layer);return layer.detail&&seenStories.has(layer.detail)?tone.seen:tone.rest;};
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
