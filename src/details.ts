/**
 * What opens in the side panel when a pop-up object is clicked. Content follows the web magazine "당근을 따라, 구좌"
 * (https://gujwa-carrot.vercel.app); where the magazine page is still a sample, only its confirmed summary is shown here and the
 * link leads to the full page.
 */
export type Detail={
 id:string;
 /** Section line above the title, e.g. "01 · FARMER". */
 kicker:string;
 title:string;
 lead:string;
 quote?:string;
 facts?:[string,string][];
 list?:{title:string;items:string[];ordered?:boolean};
 ingredients?:[string,string][];
 tip?:string;
 /** Shown while the magazine page is still being written. */
 note?:string;
 link:{label:string;href:string};
 /** Buttons that lead the reader to do something (send a recipe by mail or Instagram), shown above the link. */
 actions?:{label:string;href:string}[];
 /** Other details worth opening next (ids). */
 related?:string[];
 /** Opens as a book (src/DetailBook.tsx) instead of the side panel: pictures on the left page, the story as running text on the right. */
 spread?:{pictures:{src:string;alt:string;caption:string;fallback?:string}[];byline?:string;paragraphs:string[];folio:[string,string]};
};
import { SHARE } from './site.ts';
const site='https://gujwa-carrot.vercel.app';
const draft='매거진 원고를 준비하고 있어요. 자세한 이야기는 매거진에서 이어집니다.';
export const details:Record<string,Detail>={
 farmer:{id:'farmer',kicker:'01 · FARMER — 영상 인터뷰',title:'당근밭에서 시작되는 이야기',
  lead:'제주 구좌에서 당근을 키우는 유도균 농부님. 23년간 광고 회사에서 일하다 2014년 제주로 내려와, “이 동네는 당근과 콩이다”라는 이웃 할머니의 말 한마디로 당근 농사를 시작했습니다.',
  quote:'겨울을 제대로 맞아야 진짜 맛이 들어요.',facts:[['농부','유도균'],['지역','제주 구좌']],
  list:{title:'인터뷰에서 다루는 이야기',items:['구좌의 흙과 바람','당근이 자라는 시간','수확하는 날','밭에서 식탁까지'],ordered:true},
  note:'인터뷰 영상이 곧 공개됩니다.',link:{label:'영상 인터뷰 보기',href:`${site}/video/farmer-interview`},related:['harvest','night-watch'],
  // The magazine's farmer page (its two photos, resized to WebP, and their alt text) and the facts gathered in this file; the prose adds
  // nothing beyond them.
  spread:{pictures:[
    {src:'/media/farmer-portrait.webp',alt:'농부님 인물 사진',caption:'제주 구좌 당근 농부 유도균',fallback:'/art-raster/char-farmer.webp'},
    {src:'/media/farmer-field.webp',alt:'밭에서 일하는 농부님',caption:'밭에서 일하는 농부님',fallback:'/art-raster/farm-back.webp'}],
   byline:'제주 구좌 당근 농부 유도균 · 영상 인터뷰에서',
   paragraphs:[
    '제주 구좌에서 당근을 키우는 유도균 농부님은 23년 동안 광고 회사에서 일했습니다. 2014년 제주로 내려온 뒤 “이 동네는 당근과 콩이다”라는 이웃 할머니의 말 한마디로 당근 농사를 시작했습니다.',
    '구좌의 밭은 검은 화산토입니다. 물 빠짐이 좋아 당근 뿌리가 땅속 깊이 곧게 내립니다. 겨울 눈보라를 맞으면 당근은 얼지 않으려 잎의 영양분과 당분을 뿌리로 밀어 넣고, 그렇게 겨울을 견딘 당근은 과일처럼 달고 묵직해집니다.',
    '농부님은 당근을 유기농으로 키웁니다. 귀뚜라미가 당근을 꺾고 갉아 먹는데, 막지 않으면 천 평 밭이 이삼일 만에 망가집니다. 유기농에 쓸 수 있는 약은 귀뚜라미에게 직접 맞혀야 듣고 귀뚜라미는 밤에만 바위 틈에서 나오니, 해가 지면 랜턴과 파리채를 들고 밭고랑을 돕니다. 하루에 수천 마리를 잡는 날도 있습니다.',
    '“밭에서 랜턴 들고 돌아다니는 거 보면, 바깥에서 보면 귀신인 줄 알 거야.” 그렇게 키운 당근을 두고 농부님은 짧게 권합니다. “생으로 먹어보세요.”'],
   folio:['— 04 —','— 05 —']}},
 harvest:{id:'harvest',kicker:'01 · FARMER — 수확하는 날',title:'겨울을 견딘 단맛',
  lead:'검은 화산토는 물 빠짐이 좋아 당근 뿌리가 땅속 깊이 곧게 내립니다. 영하의 눈보라를 맞으면 당근은 얼지 않으려 잎의 영양분과 당분을 뿌리로 밀어 넣고, 그래서 겨울을 견딘 구좌 당근은 과일처럼 달고 묵직해집니다.',
  quote:'생으로 먹어보세요.',list:{title:'구좌 당근이 다른 이유',items:['검은 화산토 — 뿌리가 곧고 깊게','겨울 눈보라 — 당분이 뿌리로','농부의 손 — 농약 대신 랜턴과 파리채로']},
  link:{label:'농부 인터뷰 보러 가기',href:`${site}/video/farmer-interview`},related:['farmer','recipe-01']},
 // From the farmer interview (carrot/01_자료/인터뷰정리) and the article draft: organic farming means hunting crickets by lantern at night.
 'night-watch':{id:'night-watch',kicker:'01 · FARMER — 밤의 밭고랑',title:'농약 대신 랜턴과 파리채',
  lead:'유기농으로 당근을 키우는 농부님에게는 밤일이 있습니다. 귀뚜라미가 당근을 꺾고 갉아 먹는데, 막지 않으면 천 평 밭이 이삼일 만에 망가집니다. 유기농에 쓸 수 있는 약은 귀뚜라미에게 직접 맞혀야 듣고, 귀뚜라미는 밤에만 바위 틈에서 나옵니다.',
  quote:'밭에서 랜턴 들고 돌아다니는 거 보면, 바깥에서 보면 귀신인 줄 알 거야.',
  list:{title:'밤의 밭고랑에서',items:['해가 지면 랜턴을 들고 밭을 돈다','파리채로 하루에 수천 마리를 잡기도 한다','밤에 귀뚜라미 잡을 일손을 못 구해 친환경을 포기한 곳도 있다']},
  link:{label:'농부 인터뷰 보러 가기',href:`${site}/video/farmer-interview`},related:['farmer','harvest']},
 'cook-01':{id:'cook-01',kicker:'02 · PEOPLE WHO COOK — 식당 A',title:'당근 한 접시가 주인공이 되기까지',lead:'구좌 당근을 대표 메뉴로 선보이는 식당의 이야기입니다.',note:draft,
  link:{label:'인터뷰 기사 읽기',href:`${site}/article/cook-01`},related:['menu-01','recipe-01']},
 'cook-02':{id:'cook-02',kicker:'02 · PEOPLE WHO COOK — 식당 B',title:'익숙한 재료로 새로운 맛을 만드는 법',lead:'흔한 재료였던 당근을 새로운 메뉴로 풀어내는 식당의 이야기입니다.',note:draft,
  link:{label:'인터뷰 기사 읽기',href:`${site}/article/cook-02`},related:['menu-02','recipe-02']},
 'cook-03':{id:'cook-03',kicker:'02 · PEOPLE WHO COOK — 식당 C',title:'구좌의 계절을 식탁에 올리는 사람',lead:'제철 구좌 당근으로 계절의 맛을 전하는 식당의 이야기입니다.',note:draft,
  link:{label:'인터뷰 기사 읽기',href:`${site}/article/cook-03`},related:['menu-03','recipe-03']},
 'menu-01':{id:'menu-01',kicker:'03 · MENU — 카드뉴스 5장',title:'당근이 주연인 한 접시',lead:'식당 A의 대표 당근 메뉴를 카드뉴스로 소개합니다.',note:draft,
  link:{label:'카드뉴스 보기',href:`${site}/cardnews/menu-01`},related:['cook-01','recipe-01']},
 'menu-02':{id:'menu-02',kicker:'03 · MENU — 카드뉴스 7장',title:'처음 만나는 당근의 맛',lead:'식당 B의 당근 메뉴를 카드뉴스로 소개합니다.',note:draft,
  link:{label:'카드뉴스 보기',href:`${site}/cardnews/menu-02`},related:['cook-02','recipe-02']},
 'menu-03':{id:'menu-03',kicker:'03 · MENU — 카드뉴스 4장',title:'구좌 당근, 새로운 메뉴가 되다',lead:'식당 C의 당근 메뉴를 카드뉴스로 소개합니다.',note:draft,
  link:{label:'카드뉴스 보기',href:`${site}/cardnews/menu-03`},related:['cook-03','recipe-03']},
 'recipe-01':{id:'recipe-01',kicker:'03 · RECIPE — 카드뉴스 6장',title:'집에서 만드는 당근 라페',lead:'채 썬 당근을 새콤하게 버무려 만드는 간단한 당근 샐러드입니다.',
  facts:[['분량','2~3인분'],['조리 시간','20분'],['난이도','쉬움']],
  ingredients:[['당근','2개 (약 300g)'],['소금','1/2작은술'],['올리브유','2큰술'],['레몬즙','1큰술'],['홀그레인 머스터드','1작은술'],['꿀','1작은술'],['후추','약간']],
  list:{title:'조리 순서',ordered:true,items:['당근은 껍질을 벗기고 가늘게 채 썹니다.','채 썬 당근에 소금을 뿌려 10분 정도 절인 뒤 물기를 가볍게 짭니다.','올리브유, 레몬즙, 머스터드, 꿀을 섞어 드레싱을 만듭니다.','당근에 드레싱을 넣고 고루 버무린 뒤 후추로 마무리합니다.']},
  tip:'냉장고에서 30분 정도 두면 맛이 고루 뱁니다.',link:{label:'카드뉴스 보기',href:`${site}/cardnews/recipe-01`},related:['menu-01']},
 'recipe-02':{id:'recipe-02',kicker:'03 · RECIPE — 카드뉴스 8장',title:'부드러운 당근 수프',lead:'당근과 양파를 볶아 곱게 갈아 만드는 따뜻한 수프입니다.',
  facts:[['분량','2인분'],['조리 시간','40분'],['난이도','보통']],
  ingredients:[['당근','2개 (약 300g)'],['양파','1/2개'],['버터','1큰술'],['채수 또는 물','400ml'],['우유','100ml'],['소금·후추','약간']],
  list:{title:'조리 순서',ordered:true,items:['당근과 양파는 얇게 썹니다.','냄비에 버터를 녹이고 양파를 투명해질 때까지 볶습니다.','당근을 넣고 3~4분 더 볶습니다.','채수를 붓고 당근이 부드러워질 때까지 약 20분 끓입니다.','불을 끄고 핸드블렌더로 곱게 갑니다.','우유를 넣어 한소끔 데우고 소금·후추로 간을 맞춥니다.']},
  tip:'뜨거운 내용물은 조금 식힌 뒤 갈면 안전합니다.',link:{label:'카드뉴스 보기',href:`${site}/cardnews/recipe-02`},related:['menu-02']},
 'recipe-03':{id:'recipe-03',kicker:'03 · RECIPE — 카드뉴스 5장',title:'새콤한 당근 피클',lead:'막대 모양으로 썬 당근을 절임물에 담가 만드는 피클입니다.',
  facts:[['분량','피클 병 1개'],['조리 시간','20분 (숙성 하루)'],['난이도','쉬움']],
  ingredients:[['당근','2개'],['물','200ml'],['식초','100ml'],['설탕','4큰술'],['소금','1작은술'],['통후추','약간']],
  list:{title:'조리 순서',ordered:true,items:['당근은 껍질을 벗기고 막대 모양으로 썹니다.','냄비에 물, 식초, 설탕, 소금, 통후추를 넣고 끓여 설탕을 녹입니다.','소독한 병에 당근을 담고 뜨거운 절임물을 붓습니다.','한 김 식힌 뒤 뚜껑을 닫아 냉장고에서 하루 숙성합니다.']},
  tip:'냉장 보관하고 1~2주 안에 드세요.',link:{label:'카드뉴스 보기',href:`${site}/cardnews/recipe-03`},related:['menu-03']},
 // The third spread's kitchen wall: one recipe written out (the carrot burger note) and the booklet where readers' own recipes are collected.
 'recipe-burger':{id:'recipe-burger',kicker:'03 · RECIPE — 당근 버거',title:'집에서 만드는 당근 버거',lead:'새콤한 당근 라페와 곱게 다진 당근을 넣은 패티로 만드는, 당근이 주인공인 수제 버거입니다.',
  facts:[['분량','2개'],['조리 시간','40분'],['난이도','보통']],
  ingredients:[['햄버거 번','2개'],['소고기(간 것)','200g'],['당근','1과 1/2개 (라페용 1개, 패티용 1/2개)'],['슬라이스 치즈','2장'],['양상추·토마토','적당히'],['올리브유','2큰술'],['레몬즙','1/2큰술'],['머스터드','1작은술'],['소금·후추','약간']],
  list:{title:'조리 순서',ordered:true,items:['당근 1개는 가늘게 채 썰어 소금을 약간 뿌려 10분 절인 뒤 물기를 짭니다. 올리브유 1큰술, 레몬즙, 머스터드를 넣어 버무려 라페를 만듭니다.','남은 당근 1/2개는 곱게 다져 소고기, 소금, 후추와 섞고 둥글납작하게 빚습니다.','달군 팬에 올리브유를 두르고 패티를 앞뒤로 3~4분씩 굽다가, 마지막에 치즈를 올려 녹입니다.','번을 팬에 살짝 구워 아래부터 양상추, 토마토, 패티, 라페 순으로 쌓아 올립니다.']},
  tip:'라페는 미리 만들어 냉장고에 30분쯤 두면 맛이 더 잘 뱁니다.',link:{label:'식당에서 만나는 당근 버거',href:`${site}/cardnews/menu-03`},related:['menu-03','recipe-share']},
 'recipe-share':{id:'recipe-share',kicker:'03 · RECIPE — 함께 채우는 레시피',title:'당신의 당근 레시피도 이 벽에 붙여요',
  lead:'구좌 당근으로 만든 나만의 한 접시가 있나요? 레시피나 자랑하고 싶은 요리를 보내 주시면, 이 부엌 벽에 새 포스트잇으로 붙여 드릴게요. 여러 사람의 당근 레시피가 하나씩 모여 가는 공간입니다.',
  facts:[['보낼 것','요리 사진과 레시피'],['보낼 곳','인스타그램 또는 이메일']],
  list:{title:'이렇게 참여해요',ordered:true,items:['구좌 당근으로 만든 요리를 사진으로 남겨요.','요리 이름, 재료, 만드는 순서를 간단히 적어요.','아래 버튼으로 인스타그램이나 이메일에 보내 주세요.','벽에 새 포스트잇으로 붙이고, 원하시면 닉네임도 함께 적어요.']},
  tip:'밝은 곳에서 찍은 사진이 더 맛있어 보여요. 가족의 비법이나 나만의 팁도 좋아요.',
  actions:[...(SHARE.email?[{label:'이메일로 레시피 보내기',href:`mailto:${SHARE.email}?subject=${encodeURIComponent('[당근 레시피] 내 레시피를 보내요')}&body=${encodeURIComponent('요리 이름:\n재료:\n만드는 순서:\n닉네임(선택):\n(요리 사진도 함께 첨부해 주세요)')}`}]:[]),...(SHARE.instagram?[{label:'인스타그램으로 레시피 보내기',href:`https://www.instagram.com/${SHARE.instagram}/`}]:[])],
  note:SHARE.email||SHARE.instagram?undefined:'레시피를 받는 곳(인스타그램·이메일)을 준비하고 있어요. 곧 열려요.',
  link:{label:'웹진 둘러보기',href:site},related:['recipe-burger']},
 // The notes on the kitchen wall open their recipe posters as a book (src/PosterBook.tsx, src/posters.ts); these entries name them for
 // links, analytics and the related buttons.
 'poster-gnocchi':{id:'poster-gnocchi',kicker:'03 · RECIPE — 당근 뇨끼',title:'당근 뇨끼',lead:'익힌 당근을 으깨 전분과 함께 빚는, 쫀득하고 달큰한 당근 뇨끼예요.',
  link:{label:'웹진 둘러보기',href:site},related:['poster-gimbap','poster-jeon']},
 'poster-gimbap':{id:'poster-gimbap',kicker:'03 · RECIPE — 당근 김밥',title:'당근 김밥',lead:'채 썬 당근을 듬뿍 넣어 마는 당근 김밥이에요.',
  link:{label:'웹진 둘러보기',href:site},related:['poster-gnocchi','poster-jeon']},
 'poster-jeon':{id:'poster-jeon',kicker:'03 · RECIPE — 당근전',title:'당근전',lead:'채 썬 당근을 부쳐 내는 고소한 당근전이에요.',
  link:{label:'웹진 둘러보기',href:site},related:['poster-gnocchi','poster-gimbap']},
};
