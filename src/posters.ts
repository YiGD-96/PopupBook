import type { Lang } from './locale';
/**
 * The recipe posters on the third spread's kitchen wall, opened as a book (src/PosterBook.tsx): the poster in the reader's language on the
 * right page, and the left page kept for a real photo or a video of the dish. Keyed by the story id of the note (details.ts: poster-*).
 * The pictures are public/media/posters (scripts/prepare-posters.mjs).
 */
export type PosterMedia={kind:'image';src:string;alt:string}|{kind:'video';src:string;poster?:string;title:string};
export type Poster={
 /** Name in public/media/posters: `${file}-${lang}.webp`. */
 file:string;
 title:Record<Lang,string>;
 /** For the left page; until it is filled, the page shows an empty frame. */
 media?:PosterMedia;
};
export const posters:Record<string,Poster>={
 'poster-gnocchi':{file:'gnocchi',title:{ko:'당근 뇨끼',en:'Carrot Gnocchi',zh:'胡萝卜面疙瘩'}},
 'poster-gimbap':{file:'gimbap',title:{ko:'당근 김밥',en:'Carrot Kimbap',zh:'胡萝卜紫菜包饭'}},
 'poster-jeon':{file:'jeon',title:{ko:'당근전',en:'Carrot Pancakes',zh:'胡萝卜煎饼'}},
};
export const posterSrc=(poster:Poster,lang:Lang)=>`/media/posters/${poster.file}-${lang}.webp`;
