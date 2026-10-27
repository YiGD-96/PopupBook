// The service's name (beside the logo) and the book's own words. gujwa-carrot.vercel.app was the pre-launch test site: nothing links to it.
export const SITE={
  name:'구좌 당근, 몬딱 담았수다',
  label:'JEJU LOCAL MAGAZINE — VOL. 01',
  title:'당근을 따라, 구좌',
  // The title printed on the book's first page in the intro film (scripts/render-intro.mjs): the book's own line, not the magazine's name.
  filmTitle:'오늘 한 끼, 구좌 당근',
  // "어디서나 곁들임이던 채소가, / 구좌를 [찾아오는 이유]가 된다." — the bracketed part is highlighted on the site.
  tagline:['어디서나 곁들임이던 채소가,','구좌를 ','찾아오는 이유','가 된다.'],
  description:'어디서나 곁들임이던 채소가, 구좌를 찾아오는 이유가 된다. 제주 구좌 당근을 키우는 농부부터 당근 요리를 내는 가게, 집에서 만드는 당근 레시피까지 한 권에 담은 팝업북 ‘구좌 당근, 몬딱 담았수다’.',
  // The day the book was published (YYYY-MM-DD): datePublished in the structured data (src/seo.ts).
  published:'2026-10-27',
  coverAlt:'제주 바다와 돌담이 보이는 주황색 나무 식탁 위에 당근 수프와 당근 주스, 흙 묻은 구좌 당근이 놓인 그림',
  copyright:'© 2026 구좌 당근, 몬딱 담았수다. All rights reserved.',
  // The newspaper article the ending screen points to ("관련 기사 보기").
  article:'https://www.hankyung.com/article/202610215487O',
} as const;
/**
 * Where readers send their own carrot recipes (the "더 많은 레시피" booklet on the third spread opens a panel that explains it). Fill in either
 * or both: an email address and/or the account name of the Instagram page (without the @). Left empty, the panel says the channel is coming.
 */
export const SHARE:{instagram:string;email:string}={instagram:'jeju_carrot_hub',email:'jejucarrotlab@gmail.com'};
