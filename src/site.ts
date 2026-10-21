// Wording taken verbatim from the web magazine this book showcases (https://gujwa-carrot.vercel.app).
export const SITE={
  url:'https://gujwa-carrot.vercel.app/',
  name:'구좌 당근을 만나는 사람들',
  label:'JEJU LOCAL MAGAZINE — VOL. 01',
  title:'당근을 따라, 구좌',
  // "어디서나 곁들임이던 채소가, / 구좌를 [찾아오는 이유]가 된다." — the bracketed part is highlighted on the site.
  tagline:['어디서나 곁들임이던 채소가,','구좌를 ','찾아오는 이유','가 된다.'],
  description:'어디서나 곁들임이던 채소가, 구좌를 찾아오는 이유가 된다. 제주 구좌 당근을 키우는 사람부터 요리하는 사람까지, 로컬 여행 웹진 구좌 당근을 만나는 사람들.',
  coverAlt:'제주 바다와 돌담이 보이는 주황색 나무 식탁 위에 당근 수프와 당근 주스, 흙 묻은 구좌 당근이 놓인 그림',
  copyright:'© 2026 구좌 당근을 만나는 사람들. All rights reserved.',
  // The newspaper article the ending screen points to ("관련 기사 보기").
  article:'https://www.hankyung.com/article/202610215487O',
} as const;
/**
 * Where readers send their own carrot recipes (the "더 많은 레시피" booklet on the third spread opens a panel that explains it). Fill in either
 * or both: an email address and/or the account name of the Instagram page (without the @). Left empty, the panel says the channel is coming.
 */
export const SHARE:{instagram:string;email:string}={instagram:'',email:''};
