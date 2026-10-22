import { url } from './base.ts';
/**
 * The web-magazine pages: the shops' ("웹진 2페이지 시안", art-src/gpt/page-2-webzine) and chapter 1's three (art-src/gpt/page-1/new: the
 * farmer's interview, gujwa_farmer_interview_webzine_final_vertical_epilogue.html; the carrot story behind the crate,
 * gujwa_carrot_webzine_responsive.html; the lantern night behind the fly swatter, gujwa_lantern_night_two_page_final.html). Each story is
 * one or two spreads, laid out like its mockup. Opened from the pop-up book as a book (src/WebzineBook.tsx), keyed by the story id of the
 * card (details.ts: farmer, harvest, night-watch, cook-01…03).
 * The words are the mockups'; the pictures are public/media/webzine (scripts/prepare-webzine.mjs).
 */
/** `strong`: a phrase of the paragraph set in the accent colour. */
export type WzFlow={p:string;strong?:string}|{q:string};
export type WzMenu={img:string;alt:string;title:string;text:string;/** Picture on the right, words on the left. */flip?:boolean;shape?:'wide'|'compact'|'tall'|'natural'|'square'};
export type WzBlock=
 | {t:'h1';lines:string[];/** The line (index) printed in the accent colour. */accent?:number;/** A word printed in the accent colour. */mark?:string}
 | {t:'eyebrow';text:string}
 | {t:'season';text:string}
 | {t:'sub';text:string}
 | {t:'hero';img:string;alt:string;caption?:string;/** Share of the page width (centred); default the full width. */width?:number;/** CSS object-position of the crop. */focus?:string}
 | {t:'side';img:string;alt:string;caption?:string;/** Width of the picture's column, as a CSS length (e.g. '49%'). */column:string;aspect:number;focus?:string;body:WzBlock[]}
 | {t:'cutout';img:string;alt:string}
 | {t:'rows';items:{n?:string;term:string;text:string}[];/** Term and words side by side in two columns (a glossary) rather than one line. */pairs?:boolean}
 | {t:'lead';head?:string;text:string}
 | {t:'h2';n?:string;text:string}
 | {t:'photoText';img:string;alt:string;shape:'portrait'|'wide'|'natural';column:WzFlow[]}
 | {t:'flow';items:WzFlow[];/** Follows the picture right away instead of sitting at the foot of the page. */tight?:boolean}
 | {t:'menu';menu:WzMenu}
 | {t:'menus';items:WzMenu[]}
 | {t:'caption';items:{title:string;text:string}[];/** Short notes as small cards in two columns, each under a rule (the farmer's story). */cards?:boolean}
 | {t:'rule'};
/** `dense`: a page set a little smaller and tighter, so a long page still fits (as its mockup does). */
export type WzSpread={left:WzBlock[];right:WzBlock[];dense?:'left'|'right'};
/** `label`: the two words set at the right end of the top bar (default "People / Who Cook"). */
export type Webzine={kicker:string;label?:[string,string];spreads:WzSpread[]};
const img=(name:string)=>url(`/media/webzine/${name}.webp`);

export const webzines:Record<string,Webzine>={
 // The farmer's interview (gujwa_farmer_interview_webzine_final_vertical_epilogue.html): the farmer Yu Do-gyun on growing carrots in
 // Gujwa, ending with an epilogue.
 'farmer':{kicker:'01 · FARMER — 영상 인터뷰',label:['Farmer','Interview'],spreads:[
  {left:[
    {t:'h1',lines:['구좌에서 당근 농부로','살아간다는 것']},
    {t:'sub',text:'구좌 당근과 농부 이야기 | 유기농 당근 농부 유도균 대표'},
    {t:'hero',img:img('farmer-portrait'),alt:'제주 구좌 당근밭에서 직접 당근을 들고 미소 짓는 유도균 농부',caption:'제주 구좌 당근 농부 유도균 대표',width:.92,focus:'center 45%'},
    {t:'flow',items:[{p:'제주 구좌읍에서 유기농 당근을 키우는 유도균 대표. 광고회사에서 일하다 제주로 내려온 그가 구좌 당근의 단맛과 한 뿌리가 식탁에 오르기까지의 시간을 들려준다.'}]},
    {t:'rule'},
    {t:'h2',n:'01.',text:'할머니가 건넨 한마디'},
    {t:'flow',items:[{p:'제주에 내려온 그는 할머니의 “구좌는 당근과 콩이다”라는 한마디를 듣고 농사를 시작했다. 여러 작물을 거쳐 결국 당근 하나가 남았다.'}]}],
   right:[
    {t:'h2',n:'02.',text:'화산재 흙과 겨울이 만든 단맛'},
    {t:'flow',items:[{p:'구좌의 검은 화산재 흙은 물 빠짐이 좋아 당근이 깊이 뿌리내린다. 추위를 견디면 단맛이 더 진해진다. 유 대표는 생으로 먹거나 주스로 마실 때 그 차이가 분명하다고 말한다.'},{q:'육지 당근이랑 비교하면 압도적이죠.'}]},
    {t:'rule'},
    {t:'h2',n:'03.',text:'비가 오지 않는 밭'},
    {t:'flow',items:[{p:'예전에는 파종 뒤 비가 알맞게 내렸지만, 최근에는 씨를 뿌린 뒤에도 비가 오지 않는 날이 늘었다. 스프링클러를 밤마다 돌리고, 농업용수가 부족해 새벽에 물을 받아야 하는 일도 생겼다. 달라진 기후 속에서 농부의 손길은 더 바빠졌다.'}]},
    {t:'hero',img:img('farmer-boots'),alt:'제주 당근밭에서 작업하는 농부의 장화와 검은 화산토, 초록색 당근 잎',caption:'구좌 당근밭에서 일하는 농부의 발',width:.92}]},
  {left:[
    {t:'h1',lines:['당근 한 뿌리가','식탁에 오르기까지']},
    {t:'sub',text:'구좌 당근과 농부 이야기 | 유기농 당근 농부 유도균 대표'},
    {t:'rule'},
    {t:'side',img:img('farmer-pile'),alt:'구좌 당근 수확 현장에 모여 있는 당근과 포장 상자',caption:'수확한 당근이 밭에 모여 있는 모습',column:'49%',aspect:1.25,focus:'center 56%',body:[
      {t:'h2',n:'04.',text:'밭에 남겨지는 당근들'},
      {t:'flow',items:[{p:'당근은 길이와 굵기 등 규격에 맞아야 시장으로 나간다. 규격을 벗어난 당근은 ‘파치’라고 불리며 밭에 남거나 거름이 되기도 한다. 조금 다른 모양이어도 같은 구좌의 흙에서 자란 당근이다.'}]}]},
    {t:'rule'},
    {t:'h2',n:'05.',text:'좋은 당근 줘서 고맙다는 말'},
    {t:'flow',items:[{p:'택배로 당근을 팔기 시작한 뒤 가장 기억에 남은 말은 “좋은 당근 줘서 고맙다”는 인사였다. 그는 당근을 쪄서 갈아 먹고 겨울에는 주스로 마신다. 주스 사업 제안은 “원물이 중요하니까요”라며 거절했다.'},{q:'좋은 당근 줘서 고맙다는 말이 제일 기억에 남아요. 원물이 중요하니까요.'}]}],
   right:[
    {t:'side',img:img('farmer-talk'),alt:'실내에서 인터뷰에 응하는 유도균 농부',caption:'인터뷰 중인 유도균 대표',column:'50%',aspect:1.4,focus:'66% 38%',body:[
      {t:'h2',n:'06.',text:'혼자 짓지 않는 농사'},
      {t:'flow',items:[{p:'유 대표가 귀농을 꿈꾸는 청년들에게 강조한 것은 관계였다. 농사는 혼자 할 수 없고, 아프면 대신해 줄 사람도 필요하다. 몸은 고되고 수입은 불안정하지만, 지금의 삶에는 만족한다고 말한다.'},{q:'엄청 만족해요. 농부는 은퇴가 없는 좋은 직업이에요.'}]}]},
    {t:'rule'},
    {t:'eyebrow',text:'EPILOGUE'},
    {t:'h2',text:'올겨울에도 구좌의 밭에서는'},
    {t:'flow',items:[
      {p:'올겨울에도 구좌의 밭에서는 한파를 견딘 당근이 조금씩 단맛을 채워 가고 있다. 우리가 식탁에서 만나는 당근 한 뿌리에는 제주의 검은 화산토와 차가운 겨울바람, 그리고 오랜 시간 밭을 지켜 온 농부의 손길이 함께 담겨 있다.'},
      {p:'비가 오지 않아 밤새 물을 대야 하는 날도 있고, 정성껏 키운 당근이 모양과 크기 때문에 시장에 나가지 못하는 날도 있다. 그럼에도 농부는 다시 씨를 뿌리고, 계절을 기다리며 다음 수확을 준비한다.'},
      {p:'유도균 대표에게 농사는 혼자만의 일이 아니다. 서로의 어려움을 살피고 도움을 주고받으며 함께 이어가는 삶이다. 그렇게 키운 당근이 누군가의 식탁에 오르고, “좋은 당근 줘서 고맙다”는 말로 돌아올 때 그간의 수고는 특별한 의미를 갖는다.'},
      {p:'1월쯤 제주를 찾는다면, 눈 맞은 구좌 당근을 생으로 한입 베어 물어 보길 권한다. 아삭한 식감과 달콤한 맛 너머로, 그 한 뿌리를 키워 낸 구좌의 겨울과 농부의 시간을 조금은 느낄 수 있을 것이다.',strong:'그 한 뿌리를 키워 낸 구좌의 겨울과 농부의 시간을 조금은 느낄 수 있을 것이다.'}]}],dense:'right'}]},

 // The lantern night behind the fly swatter (gujwa_lantern_night_two_page_final.html): one spread, the swatter and lantern on the left.
 'night-watch':{kicker:'01 · FARMER — 랜턴과 파리채를 든 밤',label:['The Carrot','Story'],spreads:[
  {left:[
    {t:'h1',lines:['랜턴과','파리채를 든 밤'],mark:'파리채'},
    {t:'sub',text:'구좌 당근 농부 이야기 | 유기농 당근 농부 유도균 대표'},
    {t:'cutout',img:img('lantern-cutout'),alt:'낡은 붉은 파리채와 끈에 걸린 검은 랜턴'},
    {t:'rule'},
    {t:'eyebrow',text:'PROLOGUE'},
    {t:'flow',items:[{p:'해가 진 구좌의 당근밭에는 작은 불빛이 움직인다. 어린 당근을 지키려 랜턴과 파리채를 들고 나선 유도균 대표다. 남들이 잠든 시간에도 이어지는 농부의 일. 당근 한 뿌리에는 우리가 보지 못한 밤의 수고가 담겨 있다.'}]}],
   right:[
    {t:'h2',n:'01.',text:'유기농이 원칙이 되기까지'},
    {t:'flow',items:[{p:'유도균 대표가 처음 얻은 밭은 우연히도 유기농 밭이었다. 유기농이라는 말조차 낯설던 시절이었다. 농약은 몸에도 좋지 않았고, 농사를 지어 보니 생각보다 많은 것이 들어간다는 사실도 알게 됐다. 그렇게 유기농은 유 대표의 원칙이 되었다.'}]},
    {t:'rule'},
    {t:'h2',n:'02.',text:'귀뚜라미와의 밤'},
    {t:'flow',items:[
      {p:'유기농 당근밭의 가장 큰 적은 귀뚜라미다. 귀뚜라미가 어린 당근을 꺾어 먹기 시작하면 천 평 밭이 2~3일 만에 망가진다. 유기농 살충제는 벌레에 직접 닿아야 효과가 있는데, 귀뚜라미는 밤에만 바위 틈에서 나온다.'},
      {p:'그래서 유 대표는 밤마다 랜턴과 파리채를 들고 밭을 돈다. 하루에 잡는 귀뚜라미만 수천 마리다.'},
      {q:'밖에서 보면 귀신인 줄 알 거예요.'},
      {p:'웃으며 한 말이지만 가볍게 넘길 일은 아니다. 이 문제 때문에 친환경을 포기한 큰 영농조합도 있을 정도다.'}]}]}]},

 // The carrot story behind the crate (gujwa_carrot_webzine_responsive.html): the winter harvest, why Gujwa carrots differ, and what carrots
 // do for us.
 'harvest':{kicker:'01 · FARMER — 겨울을 견딘 당근',label:['The Carrot','Story'],spreads:[
  {left:[
    {t:'season',text:'수확철 | 12월 ~ 이듬해 3월'},
    {t:'h1',lines:['겨울을 견딘','제주 구좌 당근 이야기'],accent:1},
    {t:'lead',head:'검은 땅과 겨울바람이 키운 맛',text:'제주 구좌의 검은 화산토와 매서운 겨울바람 속에서 자란 당근. 겨울을 건넌 당근은 더욱 달고 묵직한 맛으로 식탁에 찾아옵니다.'},
    {t:'flow',items:[{q:'생으로 먹어보세요.'}]},
    {t:'hero',img:img('farmer-harvest'),alt:'흙이 묻은 채 수확해 밭에 놓아둔 제주 구좌 당근',caption:'수확한 구좌 당근 · 농부의 밭에서'}],
   right:[
    {t:'h2',n:'01.',text:'겨울을 건넌 당근'},
    {t:'flow',items:[{p:'검은 화산토는 물 빠짐이 좋아 당근 뿌리가 땅속 깊이 곧게 내립니다. 겨울 추위를 겪으며 단맛이 깊어지고, 제철의 구좌 당근은 아삭하고 묵직해집니다.'}]},
    {t:'hero',img:img('farmer-field'),alt:'검은 화산토 사이로 푸른 당근 잎이 가지런히 자란 구좌 당근밭',caption:'검은 흙 위로 펼쳐진 제주 구좌 당근밭'},
    {t:'h2',n:'02.',text:'구좌 당근이 다른 이유'},
    {t:'rows',items:[{n:'01',term:'검은 화산토',text:'뿌리가 곧고 깊게'},{n:'02',term:'겨울 눈보라',text:'추위를 견디며 깊어지는 단맛'},{n:'03',term:'농부의 손',text:'농약 대신 랜턴과 파리채로'}]}]},
  {left:[
    {t:'h2',n:'03.',text:'나를 위한 당근의 효능'},
    {t:'flow',items:[{p:'작지만 든든한 주황색 영양소. 당근은 일상의 식탁에서 여러 영양소를 더해 줍니다.'}]},
    {t:'caption',cards:true,items:[
      {title:'01. 피부',text:'비타민 A는 피부와 점막을 정상적으로 유지하는 데 필요합니다.'},
      {title:'02. 가벼운 간식',text:'생당근 100g은 약 41kcal. 아삭한 식감을 즐기기 좋습니다.'},
      {title:'03. 장 건강',text:'식이섬유가 장 운동과 규칙적인 배변에 도움이 됩니다.'},
      {title:'04. 나트륨 균형',text:'당근의 칼륨은 정상적인 체내 기능을 유지하는 데 필요합니다.'},
      {title:'05. 항산화',text:'베타카로틴·알파카로틴 등 카로티노이드를 함유합니다.'}]},
    {t:'h2',n:'04.',text:'아이에게도 좋은 이유'},
    {t:'flow',items:[{p:'다양한 음식과 함께 당근을 조금씩 식탁에 올려 보세요.'}]},
    {t:'rows',items:[{n:'01',term:'눈 건강',text:'비타민 A는 정상 시력 유지에 필요합니다.'},{n:'02',term:'점막과 면역',text:'점막의 정상적인 기능을 돕습니다.'},{n:'03',term:'성장기 영양',text:'세포 성장과 분화에 관여합니다.'}]}],
   right:[
    {t:'h2',n:'05.',text:'당근과 궁합이 좋은 재료'},
    {t:'rows',pairs:true,items:[{term:'기름',text:'베타카로틴 흡수를 돕습니다.'},{term:'달걀·고기',text:'단백질과 철분을 더합니다.'},{term:'치즈·우유',text:'칼슘을 더하고 풍미를 부드럽게 합니다.'},{term:'사과',text:'산뜻한 단맛과 식이섬유가 더해집니다.'}]},
    {t:'h2',n:'06.',text:'당근 오해와 진실'},
    {t:'rows',pairs:true,items:[{term:'시력이 좋아진다?',text:'비타민 A 결핍 예방에 도움을 주지만 시력 자체를 높이지는 않습니다.'},{term:'꼭 생으로?',text:'익히고 약간의 기름과 함께 먹으면 카로티노이드 흡수에 유리합니다.'},{term:'손바닥이 노랗다?',text:'과다 섭취에 따른 카로틴혈증일 수 있습니다.'}]},
    {t:'h2',n:'07.',text:'알아 두면 좋은 것'},
    {t:'flow',items:[{p:'임신 준비 중 고용량 레티놀 보충제는 주의하세요. 고용량 베타카로틴 보충제도 의료진과 상담이 필요합니다. 어린아이에게는 단단한 생당근 조각 대신 익힌 당근을 주세요.'},{q:'당근은 약이 아니라 밥상이다.'}]}]}]},

 'cook-01':{kicker:'02 · PEOPLE WHO COOK',spreads:[
  {left:[
    {t:'h1',lines:['당근주스 한 잔에서 시작된','작은 농부들의 길']},
    {t:'sub',text:'소농로드 박정숙 대표'},
    {t:'hero',img:img('soo-front'),alt:'당근밭 옆에 자리한 소농로드의 전경'},
    {t:'lead',head:'제주 구좌, 당근밭 옆에 소농로드가 있다.',text:'육지에서 내려와 6년째 당근 농사를 짓는 박정숙 대표는 우연히 마신 당근 주스 한 잔으로 당근의 매력에 빠졌다. 이제는 구좌 당근의 자연스러운 단맛을 더 많은 사람에게 전하고 있다.'}],
   right:[
    {t:'h2',n:'01.',text:'당근 주스 한 잔에서 시작된 소농의 길'},
    {t:'photoText',img:img('soo-owner'),alt:'당근을 든 소농로드 박정숙 대표',shape:'portrait',column:[
      {p:'박정숙 대표가 구좌 당근을 처음 만난 것은 모양이 고르지 않거나 버려지던 당근들이었다. 상품으로 팔기엔 부족하다는 이유로 밭에서 그냥 버려지던 파치 당근에 주목했고, 그것으로 주스를 만들어 마시면서 당근의 새로운 가능성을 발견했다.'},
      {q:'제주 당근 주스를 처음 마시고 ‘인생 참 살고 있구나’라는 생각이 들었어요.'},
      {p:'평범하게 생각했던 당근에서 예상하지 못한 달콤함을 발견한 박 대표는 그 맛에 반해 직접 농사를 시작했다. 제주로 내려와 새로운 삶을 찾아 농사를 시작했고, 작은 농부들의 가능성을 보여주고 싶다는 마음이 점점 더 커졌다.'}]},
    {t:'flow',items:[{p:'소농로드라는 이름에는 ‘작은 농부들이 함께 걸어가는 길’이라는 의미가 담겨 있다. 그렇게 소농로드는 직접 재배한 구좌 당근으로 음식과 음료를 선보이며, 농사에서 식탁까지 작은 농부들의 이야기를 이어가는 공간이 되었다.'}]}]},
  {left:[
    {t:'h2',n:'02.',text:'주스부터 소르베까지, 당근 본연의 달콤함'},
    {t:'flow',items:[{p:'소농로드에서는 직접 재배한 구좌 당근을 활용해 다양한 음료와 디저트를 선보인다. 익숙한 당근도 주스부터 소르베, 라떼까지, 메뉴마다 다른 방식으로 즐길 수 있다.'}]},
    {t:'menu',menu:{img:img('soo-juice'),alt:'소농로드의 당근 주스',title:'당근 주스',text:'구좌 당근의 맛을 가장 순수하게 느낄 수 있는 메뉴다. 신선한 당근을 착즙해 특유의 향과 자연스러운 단맛을 그대로 담았다.',shape:'wide'}},
    {t:'rule'},
    {t:'menus',items:[
      {img:img('soo-latte'),alt:'소농로드의 당근 라떼',title:'당근 라떼',text:'당근을 조금 더 부드럽게 즐길 수 있는 음료다. 당근 특유의 달콤함과 라떼의 부드러운 질감이 어우러진다.',shape:'tall'},
      {img:img('soo-sorbet'),alt:'소농로드의 당근 소르베',title:'당근 소르베',text:'당근의 매력을 색다른 방식으로 보여주는 디저트다. 당근과 레몬의 조화가 산뜻하고 깔끔하다.',shape:'tall'}]},
    {t:'rule'},
    {t:'flow',items:[{p:'주스부터 라떼, 소르베까지, 같은 당근으로 만들었지만 맛과 질감은 저마다 다르다. 소농로드에서는 당근이 다양한 음료와 디저트로 변신한다.'}]}],
   right:[
    {t:'h2',n:'03.',text:'작은 농부들이 전하는 당근의 진짜 맛'},
    {t:'flow',items:[
      {p:'박 대표에게 당근은 단순한 농작물이 아니다. 제주에서 자신의 길을 찾게 해준 식재료이자, 동료들과 새로운 가능성을 만들어가는 출발점이다.'},
      {p:'그녀가 전하는 음료와 디저트에는 구좌의 토양과 계절, 그리고 작은 농부들이 지닌 농업에 대한 마음이 담겨 있다.'},
      {q:'이렇게 맛있는 걸 함께 나눠 먹으면 좋겠다고 생각했어요.'},
      {p:'평범하게 생각했던 당근이 예상하지 못한 달콤함을 발견한 박 대표는 그 맛에 반해 직접 농사를 시작했고, 지금도 제주의 작은 농부들과 함께 더 많은 사람들에게 당근의 새로운 매력을 전하고 있다.'},
      {p:'늘 식탁의 조연이었던 당근이, 이곳에서는 가장 달콤한 주인공이 된다.'}]}]}]},

 'cook-02':{kicker:'02 · PEOPLE WHO COOK',spreads:[
  {left:[
    {t:'h1',lines:['수프가 되고 잼이 되는 당근,','마노아의 특별한 식탁']},
    {t:'sub',text:'마노아 최혜경 대표'},
    {t:'hero',img:img('manoa-front'),alt:'담쟁이 덮인 카페 마노아의 전경'},
    {t:'lead',text:'제주 구좌의 한적한 마을에 자리한 카페 마노아. 이곳에서는 따뜻한 당근수프부터 달콤한 당근잼까지, 익숙한 식재료가 새로운 모습으로 식탁에 오른다. 15년간 카페를 운영해 온 최혜경 대표는 자신이 좋아하는 요리로 손님들에게 제주의 맛과 편안한 쉼을 전하고 있다.'}],
   right:[
    {t:'h2',n:'01.',text:'제주에서 다시 시작한 꿈, 당근을 만나다'},
    {t:'photoText',img:img('manoa-owner'),alt:'주방에서 당근을 손질하는 마노아 최혜경 대표',shape:'portrait',column:[
      {p:'수원 광교에서 브런치 카페를 운영하던 최혜경 대표는 코로나19를 겪으며 카페 문을 닫아야 했다. 그 시간을 지나며 자신이 가장 좋아하고 잘하는 일이 결국 카페라는 사실을 다시 깨달았다.'},
      {q:'카페를 그만두고 나니까 제가 좋아하고 잘하는 일이 결국 카페 일이더라고요.'},
      {p:'그렇게 제주에 내려와 새롭게 문을 연 곳이 바로 마노아다. 이곳은 손님들이 맛있는 음식을 즐기며 잠시 쉬어갈 수 있는 곳이길 바랐다. 제주의 신선한 식재료와 자신의 요리 경험이 자연스럽게 만나는 공간이 되었다.'}]},
    {t:'flow',items:[
      {p:'요리를 이어가며 최혜경 대표는 당근의 또 다른 매력을 발견했다. 당근은 수프, 잼, 파니니, 피클 등 다양한 방식으로 요리할 수 있어, 익숙한 식재료가 전혀 다른 맛과 식감으로 변신할 수 있다는 점이 큰 즐거움이 되었다.'},
      {p:'그에게 당근은 단순한 농작물이 아니라, 손님들에게 새로운 맛과 경험을 전해주는 특별한 식재료이자, 제주의 식탁을 더 풍성하게 만들어주는 소중한 재료다.'}]}]},
  {left:[
    {t:'h2',n:'02.',text:'따뜻한 수프부터 달콤한 잼까지, 당근의 색다른 변신'},
    {t:'flow',items:[{p:'마노아에서는 구좌 당근을 활용한 수프와 잼, 파니니, 피클 등 다양한 음식을 만날 수 있다. 같은 당근으로 만들었지만 조리 방식에 따라 저마다 다른 맛과 식감을 보여준다.'}]},
    {t:'menu',menu:{img:img('manoa-soup'),alt:'마노아의 당근수프',title:'당근수프',text:'구좌 당근의 부드러운 단맛을 한 그릇에 담아낸 메뉴. 따뜻하고 포근한 질감이 살아 있다.',shape:'natural'}},
    {t:'menu',menu:{img:img('manoa-jam'),alt:'마노아의 당근잼',title:'당근잼',text:'당근을 익숙한 잼의 형태로 풀어낸 메뉴. 빵과 함께 먹으면 당근의 달콤함이 은은하게 퍼진다.',flip:true,shape:'natural'}},
    {t:'menu',menu:{img:img('manoa-panini'),alt:'마노아의 당근파니니와 피클',title:'당근파니니',text:'빵과 여러 재료 사이에 당근을 더해 구좌의 맛을 담아낸 메뉴. 아삭함과 은은한 단맛이 조화를 이룬다.',shape:'natural'}},
    {t:'flow',items:[{p:'수프부터 잼, 파니니와 피클까지, 구좌 당근은 마노아에서 따뜻한 한 끼가 되기도 하고, 빵에 곁들이는 달콤한 잼이나 산뜻한 피클로 변신하기도 한다.'}]}],
   right:[
    {t:'h2',n:'03.',text:'한 접시에 담아내는 구좌의 계절'},
    {t:'photoText',img:img('manoa-field'),alt:'마노아 뒤편에 펼쳐진 당근밭',shape:'natural',column:[
      {p:'마노아 뒤편에는 계절마다 모습을 달리하는 당근밭이 펼쳐져 있다. 봄에는 푸른 잎이 바람에 흔들리고, 가을에는 수확을 앞둔 당근이 땅을 채운다. 작은 한 접시 안에는 그렇게 변하는 제주의 계절과 구좌의 풍경이 담겨 있다.'},
      {p:'마노아의 식탁에는 평범한 채소가 아니라, 농부들이 애써 기른 제철 당근과 제주의 계절이 담겨 있다.'}]},
    {t:'flow',tight:true,items:[
      {q:'단순히 ‘당근으로 만든 음식’이었다기보다, 제주 구좌에서 자란 당근을 맛봤다고 기억해주셨으면 좋겠어요.'},
      {p:'손님들이 처음에는 호기심으로 당근 메뉴를 주문했다가 예상하지 못한 맛에 가장 큰 놀라움을 느낀다. 익숙한 채소라는 생각이 바뀌는 순간, 당근이 이렇게 맛있을 수 있다는 반응이 이어진다.'},
      {p:'따뜻한 수프 한 그릇과 달콤한 잼 한 숟가락 안에는 구좌의 햇살과 바람, 그리고 제주의 계절이 고스란히 담겨 있다. 마노아의 식탁에서 만나는 당근은 단순한 재료를 넘어, 이곳의 풍경과 계절을 맛보게 하는 특별한 경험이 된다.'}]}]}]},

 'cook-03':{kicker:'02 · PEOPLE WHO COOK',spreads:[
  {left:[
    {t:'h1',lines:['당근을 싫어하던 사람이','당근 버거를 만든 이유']},
    {t:'sub',text:'버거캐럿 김유민 대표'},
    {t:'hero',img:img('burger-front'),alt:'제주 월정리 바다 앞의 버거캐럿 매장'},
    {t:'lead',text:'제주 월정리 바다 앞에 조금 특별한 버거 가게가 있다. 아기자기한 소품으로 꾸며진 버거캐럿에서는 햄버거 속에서 좀처럼 주목받지 못하던 당근이 메뉴의 중심에 선다. 김유민 대표는 자신처럼 당근의 매력을 미처 몰랐던 사람들에게 구좌 당근의 새로운 맛을 보여주고 싶어 이곳을 열었다.'}],
   right:[
    {t:'h2',n:'01.',text:'월정리에서 건네받은 당근 한 개'},
    {t:'flow',items:[
      {p:'김유민 대표가 제주에 처음 이주했을 때, 월정리에서 가장 먼저 눈에 들어온 풍경 중 하나는 푸르게 펼쳐진 밭이었다. 무슨 작물이 자라고 있는지 궁금해하던 그에게 동네 어르신이 다가와 “여긴 당근밭이야”라며 갓 뽑은 당근 하나를 건네주었다.'},
      {p:'그전까지 김 대표에게 당근은 그다지 특별한 채소가 아니었다. 음식에 색을 더하기 위해 넣거나, 빠지면 조금 아쉬운 정도의 채소였다. 하지만 월정리에서 맛본 그 한 입의 당근은 달랐다. 자연스러운 단맛과 아삭한 식감이 입안에 퍼지며, 당근을 다시 보게 되었다.'},
      {q:'저처럼 당근을 별로 좋아하지 않았던 사람들에게도 ‘당근이 이렇게 맛있을 수 있구나’를 보여주고 싶었어요.'},
      {p:'그렇게 ‘이렇게 맛있는 당근으로 버거를 만들면 어떨까’라는 생각이 버거캐럿의 시작이 되었다. 김 대표는 단순히 당근을 더 많은 메뉴에 넣는 대신, 당근 본연의 맛을 가장 잘 살릴 수 있는 방법을 고민했다.'},
      {p:'너무 과하게 가공하기보다는 당근이 가진 자연스러운 단맛과 아삭한 식감을 그대로 느낄 수 있는 메뉴를 만들고 싶었다. 그렇기에 버거캐럿의 메뉴는 복잡하지 않지만, 당근이라는 재료가 가진 매력을 온전히 담고 있다.'}]}]},
  {left:[
    {t:'h2',n:'02.',text:'버거부터 튀김까지, 당근의 색다른 변신'},
    {t:'flow',items:[{p:'버거캐럿에서는 익숙한 햄버거와 사이드 메뉴에 구좌 당근을 더한 색다른 음식을 만날 수 있다. 아삭한 당근라페가 들어간 버거부터 당근을 가득 더한 사이드 메뉴까지, 당근의 새로운 맛과 식감을 즐길 수 있다.'}]},
    {t:'hero',img:img('burger-menu'),alt:'버거캐럿의 캐럿버거와 캐럿프라이즈'},
    {t:'caption',items:[
      {title:'캐럿버거',text:'아삭한 당근라페와 육즙 가득한 소고기 패티가 어우러지는 메뉴, 당근 특유의 상큼함이 버거의 풍미를 살린다.'},
      {title:'캐럿프라이즈',text:'감자튀김 대신 당근을 활용한 사이드 메뉴. 익숙한 튀김의 식감 속에서 당근의 새로운 매력을 느낄 수 있다.'}]},
    {t:'rule'},
    {t:'flow',items:[{p:'버거캐럿에서는 평소 익숙하게 먹던 당근을 조금 더 특별한 방식으로 만날 수 있다.'}]}],
   right:[
    {t:'h2',n:'03.',text:'당근을 좋아하지 않던 사람도 반한 한 입'},
    {t:'flow',items:[
      {p:'김 대표가 가장 기억에 남는 손님의 반응은 의외로 당근을 좋아하지 않는 사람들에게서 나온다. 처음에는 버거에 당근이 들어간다는 사실을 낯설어하는 손님들도 한 입 먹고 나면 예상과 다른 맛에 놀라는 경우가 많다.'},
      {p:'당근과 버거가 이렇게 잘 어울릴 줄 몰랐다는 반응도 이어진다. 특히 당근을 먹지 않던 아이가 이곳에서는 잘 먹었다는 부모님의 이야기가 기억에 남는다고 한다.'},
      {q:'저 원래 당근 안 좋아하는데, 이건 맛있어요.'},
      {p:'김 대표 역시 처음부터 당근을 좋아했던 사람은 아니었다. 월정리에서 처음 먹었던 당근 한 개가 자신의 생각을 바꿨고, 이제는 자신이 만든 버거가 누군가의 생각을 바꾸고 있는 셈이다.'},
      {p:'구좌 당근을 선택했다기보다는, 구좌 당근을 만나기 때문에 버거캐럿이 시작됐다는 표현이 더 맞는 것 같다고.'},
      {p:'월정리에서 건네받은 당근 한 개로 시작한 이야기는 이제 버거 한 입에 담겨 여행자들에게 전해지고 있다.'}]}]}]},
};
