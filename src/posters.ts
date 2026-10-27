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
 /** The Short's title and upload time on YouTube, for the video in the recipe's structured data (src/seo.ts). */
 video?:{title:string;uploaded:string};
 /** The poster's words written out (it is a picture), for search and answer engines and the book's text version (src/seo.ts). */
 recipe:{servings:string;/** [name, amount]; the amount is empty where the poster gives none. */ingredients:[string,string][];steps:string[];tip?:string};
};
export const posters:Record<string,Poster>={
 'poster-gnocchi':{file:'gnocchi',title:{ko:'당근 뇨끼',en:'Carrot Gnocchi',zh:'胡萝卜面疙瘩'},shorts:'xQMgSiBRk60',photo:true,
  caption:{ko:'직접 만든 당근 뇨끼',en:'Our carrot gnocchi',zh:'亲手做的胡萝卜面疙瘩'},
  video:{title:'누구나 쉽게 할 수 있는 뇨끼 - 당근 뇨끼',uploaded:'2026-10-23T01:17:15-07:00'},
  recipe:{servings:'2~3인분',
   ingredients:[['당근','200g'],['소금','2꼬집'],['감자전분','130g (밀가루 가능, 옥수수전분은 안 돼요)'],['물','500ml (삶을 때)'],['크림소스','시중 제품']],
   steps:['당근을 얇게 썰어 주세요.','물을 약간 넣어 뚜껑을 닫고 전자레인지에 7분 돌려주세요.','당근을 으깬 후, 감자전분 130g과 소금 2꼬집을 넣어주세요. (반죽이 질 경우, 조금씩 감자전분을 더 넣어주세요.)','원하는 모양으로 만들어 끓는 물에 넣고, 동동 떠오르면 1~2분 더 삶아 건져주세요.','시중에 파는 크림소스에 익힌 당근을 추가하여 만들어둔 뇨끼와 먹으면 완성!']}},
 'poster-gimbap':{file:'gimbap',title:{ko:'당근 김밥',en:'Carrot Kimbap',zh:'胡萝卜紫菜包饭'},shorts:'DRb3IIKUJSY',photo:true,
  caption:{ko:'직접 만든 당근 김밥',en:'Our carrot kimbap',zh:'亲手做的胡萝卜紫菜包饭'},
  video:{title:'당근 극혐하던 6살, 이 김밥은 두 줄먹음 - 당근 김밥',uploaded:'2026-10-22T18:58:57-07:00'},
  recipe:{servings:'2~3줄',
   ingredients:[['당근','2개'],['달걀','3개'],['밥','2공기'],['단무지',''],['김밥용 김','3장'],['식용유',''],['소금',''],['다진 마늘','1큰술'],['참기름','2큰술'],['밥 양념: 소금','1/2작은술'],['밥 양념: 참기름','1/2큰술']],
   steps:['깨끗이 씻은 당근은 채칼로 채를 썰어주세요.','달군 팬에 식용유 2큰술을 두르고 채 썬 당근을 넣어 볶다가 소금을 넣어 간을 해주세요. (많이 볶으면 식감이 사라지기 때문에 20초 이내로 볶아주세요!)','볼에 달걀 3개, 소금 한 꼬집을 넣고 풀어주세요.','달군 팬에 식용유를 얇게 두르고 풀어둔 달걀을 부쳐주고, 식힌 다음 얇고 길게 잘라주세요.','볼에 밥 2공기를 담아주고 소금 1/2작은술, 참기름 1/2큰술을 넣어서 눌리지 않게 섞어주세요.','김은 거친 면이 위로 오도록 두고(양면이 똑같다면 상관없어요), 밥을 전체적으로 얇고 넓게 깔아주세요.','그 위로 볶은 당근을 듬뿍 올려주고 단무지와 달걀지단을 올려주세요.','손안에 모든 재료가 들어오도록 잡고 돌돌 말아주세요. (모두 말아지기 전, 끝부분에 밥을 으깨고 참기름을 살짝 발라 풀처럼 접착력을 만들어 주고, 끝까지 말아 끝부분이 바닥에 오도록 잠시 두면 잘 붙습니다.)','칼로 먹기 좋은 크기로 자르면 완성!'],
   tip:'기호에 맞게 시금치나물 같은 다른 재료를 넣어주면 더 맛있습니다!'}},
 'poster-jeon':{file:'jeon',title:{ko:'당근전',en:'Carrot Pancakes',zh:'胡萝卜煎饼'},shorts:'izTQxOcRgkg',photo:true,
  caption:{ko:'직접 부친 당근전',en:'Our carrot pancakes',zh:'亲手煎的胡萝卜煎饼'},
  video:{title:'비주얼은 망했지만… 맛은 반전? - 치즈당근전',uploaded:'2026-10-22T00:36:57-07:00'},
  recipe:{servings:'2인분',
   ingredients:[['채 썬 당근','200g'],['전분가루','2스푼'],['모짜렐라 치즈','100g'],['후추','1티스푼']],
   steps:['채 썬 당근을 준비해 전분가루 2스푼을 넣어주세요.','모짜렐라 치즈와 후추를 넣고 잘 섞어줍니다.','1장씩 프라이팬에 작게 만들어 구워주세요.']}},
};
export const posterSrc=(poster:Poster,lang:Lang)=>url(`/media/posters/${poster.file}-${lang}.webp`);
export const photoSrc=(poster:Poster)=>url(`/media/posters/photo-${poster.file}.webp`);
export const shortsUrl=(id:string)=>`https://www.youtube.com/shorts/${id}`;
/** The player, loaded only when the reader presses play (youtube-nocookie: no YouTube cookies until then). */
export const shortsEmbed=(id:string)=>`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
/** YouTube's still for the video: 4:3 with the upright Short in its middle, so it fills a 9:16 frame when centred and cropped. */
export const shortsThumb=(id:string)=>`https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
