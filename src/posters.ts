import type { Lang } from './locale';
import { url } from './base.ts';
/**
 * The recipe posters on the third spread's kitchen wall, opened as a book (src/PosterBook.tsx): the poster in the reader's language on the
 * right page; on the left, the dish as it really turned out — a YouTube Short of it being made and a photo of the plate. Keyed by the story
 * id of the note (details.ts: poster-*). The pictures are public/media/posters (scripts/prepare-posters.mjs).
 */
export type Poster={
 /** Name in public/media/posters: `${file}-${lang}.webp` (the poster) and `photo-${file}.webp` (the real photo). */
 file:string;
 title:Record<Lang,string>;
 /** The YouTube Short's video id (youtube.com/shorts/<id>). */
 shorts?:string;
 /** A line under the photo. */
 caption:Record<Lang,string>;
 /** Leave out while there is no real photo yet. */
 photo?:boolean;
};
// The same Short stands in for all three until each dish has its own (the user's temporary link).
const SHORTS='j4WDQC1tTyI';
export const posters:Record<string,Poster>={
 'poster-gnocchi':{file:'gnocchi',title:{ko:'당근 뇨끼',en:'Carrot Gnocchi',zh:'胡萝卜面疙瘩'},shorts:SHORTS,photo:true,
  caption:{ko:'직접 만든 당근 뇨끼',en:'Our carrot gnocchi, made at home',zh:'亲手做的胡萝卜面疙瘩'}},
 'poster-gimbap':{file:'gimbap',title:{ko:'당근 김밥',en:'Carrot Kimbap',zh:'胡萝卜紫菜包饭'},shorts:SHORTS,photo:true,
  caption:{ko:'직접 만든 당근 김밥',en:'Our carrot kimbap, made at home',zh:'亲手做的胡萝卜紫菜包饭'}},
 'poster-jeon':{file:'jeon',title:{ko:'당근전',en:'Carrot Pancakes',zh:'胡萝卜煎饼'},shorts:SHORTS,photo:true,
  caption:{ko:'직접 부친 당근 치즈전',en:'Our carrot cheese pancakes, made at home',zh:'亲手煎的胡萝卜芝士煎饼'}},
};
export const posterSrc=(poster:Poster,lang:Lang)=>url(`/media/posters/${poster.file}-${lang}.webp`);
export const photoSrc=(poster:Poster)=>url(`/media/posters/photo-${poster.file}.webp`);
export const shortsUrl=(id:string)=>`https://www.youtube.com/shorts/${id}`;
/** The player, loaded only when the reader presses play (youtube-nocookie: no YouTube cookies until then). */
export const shortsEmbed=(id:string)=>`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
/** YouTube's still for the video: 4:3 with the upright Short in its middle, so it fills a 9:16 frame when centred and cropped. */
export const shortsThumb=(id:string)=>`https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
