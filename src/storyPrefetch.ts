import { scenes, useStory, type Layer } from './story';
import { webzines, type WzBlock } from './webzine';
import { posters, posterSrc, photoSrc } from './posters';
import { details } from './details';
import { useLocale } from './locale';
/**
 * The pictures a story opens with, fetched ahead while the reader looks at its spread, so a tapped card's story shows them at once instead
 * of loading them (on a phone the first picture used to arrive a moment after the story opened). Only the opening pictures: a webzine's
 * first spread, a recipe poster and its photo, a story spread's pictures, the recipe call's sheet; the rest load as the reader goes on.
 * Fetched at low priority and decoded off the main thread, in idle time once the spread has settled, so they never share frames with a turn.
 */
function blockPictures(blocks:WzBlock[]):string[]{
 return blocks.flatMap(block=>{
  switch(block.t){
   case 'hero':case 'cutout':case 'photoText':return [block.img];
   case 'side':return [block.img,...blockPictures(block.body)];
   case 'menu':return [block.menu.img];
   case 'menus':return block.items.map(item=>item.img);
   default:return [];
  }
 });
}
export function openingPictures(id:string):string[]{
 const webzine=webzines[id];if(webzine){const first=webzine.spreads[0];return first?blockPictures([...first.left,...first.right]):[];}
 const poster=posters[id];if(poster)return [posterSrc(poster,useLocale.getState().lang),...(poster.photo?[photoSrc(poster)]:[])];
 const detail=details[id];if(!detail)return [];
 return [...(detail.spread?.pictures.map(picture=>picture.src)??[]),...(detail.sheet?[detail.sheet.src]:[])];
}
const fetched=new Set<string>();
function fetchPicture(src:string){
 if(fetched.has(src))return;fetched.add(src);
 const image=new Image() as HTMLImageElement&{fetchPriority?:string};image.decoding='async';image.fetchPriority='low';image.src=src;
}
/** The stories a spread's cards open (and the spread's own). */
function chapterStories(chapter:number):string[]{
 const scene=scenes[chapter] as {detail?:string;layers:Layer[]}|undefined;if(!scene)return [];
 return [...new Set([...scene.layers.filter(layer=>layer.interactive&&layer.detail).map(layer=>layer.detail!),...(scene.detail?[scene.detail]:[])])];
}
/** Fetches the opening pictures of a spread's stories once the browser is idle and the reader is still on that spread. */
export function prefetchChapterStories(chapter:number){
 let cancelled=false;
 const request=(window as unknown as {requestIdleCallback?:(f:()=>void)=>number}).requestIdleCallback;
 const go=()=>{if(cancelled)return;const state=useStory.getState();if(state.chapter!==chapter||!['EXPLORING','ENDING'].includes(state.phase))return;
  for(const id of chapterStories(chapter))openingPictures(id).forEach(fetchPicture);};
 // A moment after the spread settles (its glow is blinking then), and only in an idle period.
 const timer=window.setTimeout(()=>{if(request)request(go);else go();},1500);
 return ()=>{cancelled=true;window.clearTimeout(timer);};
}
