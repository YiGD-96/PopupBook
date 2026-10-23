import { scenes } from './story';
import { artSource } from './artSource';
import { STANDING_QUERY } from './standingMedia';
/**
 * The book's pictures as files, with no three.js: which files a spread needs on this screen, and fetching the first spread's early. The
 * first spread starts downloading from the main bundle while the intro film plays (src/Intro.tsx onBuffered), before the book's own code
 * (src/Storybook.tsx, with three.js) has even arrived; src/assets.ts takes each download over when the book asks for that picture. Waiting
 * for that code first left the connection idle for about a second and kept "책장 속으로" waiting longer.
 */
const standingScreen=()=>typeof matchMedia==='function'&&matchMedia(STANDING_QUERY).matches;
/** The picture a layer is drawn from on this screen: a layer may carry another picture for the phone's standing book (`phoneSrc`, src/story.ts). */
const pictureOf=(layer:{src:string;phoneSrc?:string})=>standingScreen()&&layer.phoneSrc?layer.phoneSrc:layer.src;
/** The pictures a spread needs, as [name the book asks for, file to load]: its cards (under their own name even when the phone shows another picture) and, if it has one, the painted floor of the phone's flat page (`stage`). */
export const sceneArt=(chapter:number):[string,string][]=>{const scene=scenes[chapter] as {stage?:string;layers:{src:string;phoneSrc?:string}[]};return [...scene.layers.map(l=>[l.src,pictureOf(l)] as [string,string]),...(scene.stage?[[scene.stage,scene.stage],[scene.stage+'-sheet',scene.stage+'-sheet']] as [string,string][]:[])];};
const early=new Map<string,Promise<Blob>>();
function prefetch(name:string){
 const url=artSource(name);if(early.has(url))return;
 const download=fetch(url).then(response=>{if(!response.ok)throw new Error(`${response.status} ${url}`);return response.blob();});
 download.catch(()=>{});early.set(url,download);
}
/** An early download of this file, handed over once (the book then keeps the texture it makes from it). */
export function takeEarly(url:string){const download=early.get(url);early.delete(url);return download;}
/** The first spread's pictures, and on the open book its printed pages (the phone's standing book never shows those). */
export function prefetchFirstSpread(){
 for(const [,file] of sceneArt(0))prefetch(file);
 if(!standingScreen())for(const side of ['left','right'])prefetch(`page-0-${side}`);
}
