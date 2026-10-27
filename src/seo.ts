/**
 * Search (SEO), AI answer (AEO) and generative-engine (GEO) content, built from the same data the book shows (src/site.ts, src/story.ts,
 * src/details.ts, the interview pages in src/webzine.ts and the recipe posters in src/posters.ts) and written into the page at build time
 * by the plugin in vite.config.ts, so crawlers that do not run JavaScript (most AI crawlers) read the whole book:
 *  - textVersion: every chapter, interview, recipe and the FAQ as plain HTML. It is also the book's text alternative: readers open it with
 *    "글로 읽기", screen readers reach it, and it stays in the page after the app starts.
 *  - jsonLd: WebSite, WebPage, the service, the book and its chapters, the interviews as Article with their people and shops, the poster
 *    recipes as Recipe (with their Shorts), the FAQ as FAQPage.
 *  - headTags: title, description, canonical, Open Graph and Twitter cards.
 *  - llmsTxt / robotsTxt / sitemapXml: files at the site root.
 * `siteUrl` (VITE_SITE_URL, e.g. https://example.vercel.app) makes every URL absolute; without it canonical and the sitemap are left out.
 * Everything here is the book's own: nothing points to the pre-launch test site.
 */
import { SHARE, SITE } from './site.ts';
import { scenes } from './story.ts';
import { details, type Detail } from './details.ts';
import { webzines, type WzBlock, type WzFlow, type WzMenu } from './webzine.ts';
import { posters, shortsEmbed, shortsThumb, shortsUrl } from './posters.ts';

const TITLE = `${SITE.name} — ${SITE.tagline[0]} ${SITE.tagline.slice(1).join('')}`;
const escape = (text: string) => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const abs = (siteUrl: string | undefined, path: string) => siteUrl ? siteUrl.replace(/\/$/, '') + path : path;
const GUJWA = '제주특별자치도 제주시 구좌읍';

/** The stories each spread opens, in the order its objects stand. */
export const chapterStories = scenes.map(scene => [...new Set(scene.layers.map(layer => layer.detail).filter((id): id is string => !!id && !!details[id]))]);
const english = (index: number) => (scenes[index] as { english?: string }).english ?? `0${index + 1}`;
const intro = (index: number) => ((scenes[index] as { intro?: string }).intro ?? '').replace(/\n/g, ' ');

/** The people the interviews are with, and their shops (the words of each interview's opening lines in src/webzine.ts). */
const PEOPLE: Record<string, { person: string; jobTitle: string; locality: string; shop?: { name: string; type: string } }> = {
 farmer: { person: '유도균', jobTitle: '유기농 당근 농부', locality: '구좌읍' },
 'cook-01': { person: '박정숙', jobTitle: '소농로드 대표', locality: '구좌읍', shop: { name: '소농로드', type: 'FoodEstablishment' } },
 'cook-02': { person: '최혜경', jobTitle: '마노아 대표', locality: '구좌읍', shop: { name: '마노아', type: 'CafeOrCoffeeShop' } },
 'cook-03': { person: '김유민', jobTitle: '버거캐럿 대표', locality: '구좌읍 월정리', shop: { name: '버거캐럿', type: 'Restaurant' } },
};

// --- The interview pages (src/webzine.ts) as text ---
const wzBlocks = (id: string) => webzines[id]?.spreads.flatMap(spread => [...spread.left, ...spread.right]) ?? [];
const flatBlocks = (blocks: WzBlock[]): WzBlock[] => blocks.flatMap(block => block.t === 'side' ? [block, ...flatBlocks(block.body)] : [block]);
/** An interview's headline: the first spread's big title. */
const wzHeadline = (id: string) => { const h1 = wzBlocks(id).find(block => block.t === 'h1'); return h1?.t === 'h1' ? h1.lines.join(' ') : details[id].title; };
/** Its opening paragraph: the first lead or paragraph. */
const wzSummary = (id: string) => {
 for (const block of flatBlocks(wzBlocks(id))) {
  if (block.t === 'lead') return block.text;
  if (block.t === 'flow') { const p = block.items.find(item => 'p' in item); if (p && 'p' in p) return p.p; }
 }
 return details[id].lead;
};
/** The dishes a shop's interview shows: its menu blocks, or (the burger shop's) the captions under the menu photo. */
const wzMenus = (id: string): { title: string; text: string }[] => {
 const blocks = flatBlocks(wzBlocks(id));
 const menus = blocks.flatMap(block => block.t === 'menu' ? [block.menu] : block.t === 'menus' ? block.items : []).map((menu: WzMenu) => ({ title: menu.title, text: menu.text }));
 return menus.length ? menus : blocks.flatMap(block => block.t === 'caption' ? block.items : []);
};
const flowHtml = (items: WzFlow[]) => items.map(item => 'q' in item ? `<blockquote><p>${escape(item.q)}</p></blockquote>` : `<p>${escape(item.p)}</p>`).join('');
const dl = (items: { title: string; text: string }[]) => `<dl>${items.map(item => `<dt>${escape(item.title)}</dt><dd>${escape(item.text)}</dd>`).join('')}</dl>`;
function blockHtml(block: WzBlock, first: boolean): string {
 switch (block.t) {
  case 'h1': return first ? '' : `<h4>${escape(block.lines.join(' '))}</h4>`;
  case 'h2': return `<h4>${escape([block.n, block.text].filter(Boolean).join(' '))}</h4>`;
  case 'eyebrow': case 'season': case 'sub': return `<p class="book-text-kicker">${escape(block.text)}</p>`;
  case 'lead': return `<p>${block.head ? `<strong>${escape(block.head)}</strong> ` : ''}${escape(block.text)}</p>`;
  case 'flow': return flowHtml(block.items);
  case 'photoText': return flowHtml(block.column);
  case 'side': return block.body.map(inner => blockHtml(inner, false)).join('');
  case 'rows': return `<dl>${block.items.map(item => `<dt>${escape([item.n, item.term].filter(Boolean).join(' '))}</dt><dd>${escape(item.text)}</dd>`).join('')}</dl>`;
  case 'menu': return dl([block.menu]);
  case 'menus': return dl(block.items);
  case 'caption': return dl(block.items);
  case 'hero': case 'cutout': case 'rule': return '';
 }
}
function interviewHtml(id: string) {
 const blocks = wzBlocks(id), firstH1 = blocks.findIndex(block => block.t === 'h1');
 return `<article id="text-${id}"><p class="book-text-kicker">${escape(webzines[id].kicker)}</p><h3>${escape(wzHeadline(id))}</h3>`
  + blocks.map((block, index) => blockHtml(block, index === firstH1)).join('') + '</article>';
}

// --- The recipe posters (src/posters.ts) as text ---
const ingredientText = ([name, amount]: [string, string]) => amount ? `${name} ${amount}` : name;
function posterHtml(id: string) {
 const poster = posters[id], recipe = poster.recipe, detail = details[id];
 return `<article id="text-${id}"><p class="book-text-kicker">${escape(detail.kicker)}</p><h3>${escape(poster.title.ko)}</h3><p>${escape(detail.lead)}</p>`
  + `<dl><dt>분량</dt><dd>${escape(recipe.servings)}</dd></dl>`
  + `<h4>재료</h4><ul>${recipe.ingredients.map(item => `<li>${escape(ingredientText(item))}</li>`).join('')}</ul>`
  + `<h4>만드는 법</h4><ol>${recipe.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol>`
  + (recipe.tip ? `<p><strong>팁</strong> ${escape(recipe.tip)}</p>` : '')
  + (poster.shorts ? `<p><a href="${escape(shortsUrl(poster.shorts))}">${escape(poster.video?.title ?? `${poster.title.ko} 만드는 영상`)} (YouTube)</a></p>` : '')
  + '</article>';
}

// --- Any other story (src/details.ts) as text ---
function storyHtml(detail: Detail) {
 const parts = [`<article id="text-${detail.id}"><p class="book-text-kicker">${escape(detail.kicker)}</p><h3>${escape(detail.title)}</h3><p>${escape(detail.lead)}</p>`];
 if (detail.quote) parts.push(`<blockquote><p>${escape(detail.quote)}</p></blockquote>`);
 if (detail.spread) parts.push(...detail.spread.paragraphs.map(p => `<p>${escape(p)}</p>`));
 if (detail.facts?.length) parts.push(`<dl>${detail.facts.map(([k, v]) => `<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`).join('')}</dl>`);
 if (detail.ingredients?.length) parts.push(`<h4>재료</h4><ul>${detail.ingredients.map(([k, v]) => `<li>${escape(k)} ${escape(v)}</li>`).join('')}</ul>`);
 if (detail.list) { const tag = detail.list.ordered ? 'ol' : 'ul'; parts.push(`<h4>${escape(detail.list.title)}</h4><${tag}>${detail.list.items.map(i => `<li>${escape(i)}</li>`).join('')}</${tag}>`); }
 if (detail.tip) parts.push(`<p><strong>팁</strong> ${escape(detail.tip)}</p>`);
 if (detail.actions?.length) parts.push(`<ul>${detail.actions.map(a => `<li><a href="${escape(a.href)}">${escape(a.label)}</a></li>`).join('')}</ul>`);
 parts.push('</article>');
 return parts.join('');
}
const articleHtml = (id: string) => webzines[id] ? interviewHtml(id) : posters[id] ? posterHtml(id) : storyHtml(details[id]);

const posterIds = Object.keys(posters), interviewIds = Object.keys(PEOPLE).filter(id => webzines[id]);
const shopList = interviewIds.filter(id => PEOPLE[id].shop).map(id => {
 const { shop, locality } = PEOPLE[id], menus = wzMenus(id).map(menu => menu.title);
 return `${locality === '구좌읍' ? '' : `${locality.replace('구좌읍 ', '')} `}${shop!.name}(${menus.join('·')})`;
});
const sendTo = [SHARE.instagram && `인스타그램(@${SHARE.instagram}) DM`, SHARE.email && `이메일(${SHARE.email})`].filter(Boolean).join(' 또는 ');

/** Questions people ask about Gujwa carrots, answered only with what the book itself says. */
export const FAQ: { question: string; answer: string }[] = [
 { question: '구좌 당근은 왜 달고 맛있나요?', answer: details.harvest.lead },
 { question: '구좌 당근은 누가, 어떻게 키우나요?', answer: details.farmer.lead },
 { question: '유기농 당근밭은 농약 없이 벌레를 어떻게 막나요?', answer: details['night-watch'].lead },
 { question: '구좌에서 구좌 당근 요리를 맛볼 수 있는 곳은 어디인가요?', answer: `팝업북에서 구좌 당근으로 요리하는 세 곳의 대표를 인터뷰했습니다. ${shopList.join(', ')}입니다.` },
 { question: '구좌 당근으로 집에서 무엇을 만들 수 있나요?', answer: `${posterIds.map(id => `${posters[id].title.ko}(${posters[id].recipe.servings})`).join(', ')}, 세 가지 레시피를 재료와 만드는 법, 직접 만든 영상까지 소개합니다.` },
 ...(sendTo ? [{ question: '내 당근 레시피도 보낼 수 있나요?', answer: `네. 구좌 당근으로 만든 요리의 이름, 재료, 만드는 법과 사진을 ${sendTo}로 보내 주시면 팝업북 부엌 벽에 새 포스트잇으로 붙여 드립니다.` }] : []),
 { question: `‘${SITE.name}’는 무엇인가요?`, answer: `${SITE.description} 세 장의 입체 팝업북으로 구좌 당근을 키우는 농부, 요리하는 사람들, 집에서 만드는 레시피를 보여 주고, 그림 속 사물을 누르면 인터뷰와 레시피가 열립니다.` },
];

/** The whole book as text; hidden until "글로 읽기" opens it (src/App.tsx). */
export function textVersion() {
 const chapters = scenes.map((scene, index) => `<section id="text-${scene.id}" aria-labelledby="text-${scene.id}-title"><h2 id="text-${scene.id}-title">${escape(english(index))} — ${escape(scene.title)}</h2><p>${escape(intro(index))}</p>${chapterStories[index].map(articleHtml).join('')}</section>`).join('');
 const faq = `<section id="text-faq" aria-labelledby="text-faq-title"><h2 id="text-faq-title">자주 묻는 질문</h2><dl>${FAQ.map(item => `<dt>${escape(item.question)}</dt><dd>${escape(item.answer)}</dd>`).join('')}</dl></section>`;
 const toc = `<nav aria-label="차례"><ol>${scenes.map((scene, index) => `<li><a href="#text-${scene.id}">${escape(english(index))} ${escape(scene.title)}</a></li>`).join('')}<li><a href="#text-faq">자주 묻는 질문</a></li></ol></nav>`;
 return `<section id="book-text" class="book-text" tabindex="-1" aria-labelledby="book-text-title" hidden><div class="book-text-inner">`
  + `<button type="button" class="book-text-close" data-close-text>책으로 돌아가기</button>`
  + `<header><p class="book-text-kicker">제주 구좌 당근 팝업북 · ${escape(SITE.title)}</p><h1 id="book-text-title">${escape(SITE.name)}</h1><p>${escape(SITE.description)}</p></header>`
  + toc + chapters + faq
  + `<footer><p><a href="${escape(SITE.article)}">관련 기사 보기</a></p><p>${escape(SITE.copyright)}</p></footer></div></section>`;
}

/** Structured data for search and answer engines. `modified`: the build's date (YYYY-MM-DD). */
export function jsonLd(siteUrl?: string, modified: string = SITE.published) {
 const page = abs(siteUrl, '/'), image = abs(siteUrl, '/media/og-image.jpg'), dates = { datePublished: SITE.published, dateModified: modified };
 const org = { '@id': `${page}#organization` };
 const address = (locality: string) => ({ '@type': 'PostalAddress', addressCountry: 'KR', addressRegion: '제주특별자치도', addressLocality: `제주시 ${locality}` });
 const people = interviewIds.flatMap(id => {
  const { person, jobTitle, locality, shop } = PEOPLE[id];
  return [
   { '@type': 'Person', '@id': `${page}#person-${id}`, name: person, jobTitle, homeLocation: { '@type': 'Place', name: GUJWA },
    ...(shop ? { worksFor: { '@id': `${page}#shop-${id}` } } : { knowsAbout: '구좌 당근 유기농 재배' }) },
   ...(shop ? [{ '@type': shop.type, '@id': `${page}#shop-${id}`, name: shop.name, description: wzSummary(id), address: address(locality),
    hasMenu: { '@type': 'Menu', hasMenuItem: wzMenus(id).map(menu => ({ '@type': 'MenuItem', name: menu.title, description: menu.text })) } }] : []),
   { '@type': 'Article', '@id': `${page}#text-${id}`, url: `${page}#text-${id}`, headline: wzHeadline(id), description: wzSummary(id), inLanguage: 'ko-KR',
    ...dates, author: org, publisher: org, isPartOf: { '@id': `${page}#book` },
    about: [{ '@id': `${page}#person-${id}` }, ...(shop ? [{ '@id': `${page}#shop-${id}` }] : []), { '@type': 'Thing', name: '구좌 당근' }] },
  ];
 });
 const recipes = posterIds.map(id => {
  const poster = posters[id], recipe = poster.recipe, photo = abs(siteUrl, `/media/posters/photo-${poster.file}.webp`);
  return {
   '@type': 'Recipe', '@id': `${page}#text-${id}`, url: `${page}#text-${id}`, name: poster.title.ko, description: details[id].lead, inLanguage: 'ko-KR',
   ...dates, author: org, publisher: org, isPartOf: { '@id': `${page}#book` },
   image: [...(poster.photo ? [photo] : []), abs(siteUrl, `/media/posters/${poster.file}-ko.webp`)],
   recipeYield: recipe.servings, recipeCategory: '당근 요리', keywords: `구좌 당근, 제주 당근, 당근 레시피, ${poster.title.ko}`,
   recipeIngredient: recipe.ingredients.map(ingredientText),
   recipeInstructions: recipe.steps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
   ...(poster.shorts && poster.video ? { video: { '@type': 'VideoObject', name: poster.video.title, description: `${poster.title.ko} 만드는 과정`,
    thumbnailUrl: shortsThumb(poster.shorts), uploadDate: poster.video.uploaded, contentUrl: shortsUrl(poster.shorts), embedUrl: shortsEmbed(poster.shorts).split('?')[0] } } : {}),
  };
 });
 return {
  '@context': 'https://schema.org',
  '@graph': [
   { '@type': 'WebSite', '@id': `${page}#website`, url: page, name: SITE.name, inLanguage: 'ko-KR', publisher: org },
   { '@type': 'Organization', '@id': org['@id'], name: SITE.name, url: page, logo: abs(siteUrl, '/media/logo.webp'),
    ...(SHARE.instagram ? { sameAs: [`https://www.instagram.com/${SHARE.instagram}/`] } : {}), ...(SHARE.email ? { email: SHARE.email } : {}) },
   { '@type': 'WebPage', '@id': `${page}#webpage`, url: page, name: TITLE, description: SITE.description, inLanguage: 'ko-KR', isPartOf: { '@id': `${page}#website` },
    ...dates, primaryImageOfPage: image, about: [{ '@type': 'Thing', name: '구좌 당근' }, { '@type': 'Place', name: GUJWA }], mainEntity: { '@id': `${page}#book` } },
   { '@type': 'CreativeWork', '@id': `${page}#book`, name: SITE.title, alternateName: SITE.name, description: SITE.description, inLanguage: 'ko-KR', image,
    ...dates, genre: '인터랙티브 팝업북', author: org, publisher: org,
    hasPart: scenes.map((scene, index) => ({ '@type': 'CreativeWork', position: index + 1, name: scene.title, alternativeHeadline: english(index), description: intro(index), url: `${page}#text-${scene.id}` })) },
   ...people,
   ...recipes,
   { '@type': 'FAQPage', '@id': `${page}#faq`, mainEntity: FAQ.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
  ],
 };
}
/** Tags for <head>: description, canonical, robots, Open Graph, Twitter. */
export function headTags(siteUrl?: string, modified?: string) {
 const page = abs(siteUrl, '/'), image = abs(siteUrl, '/media/og-image.jpg'), alt = `${SITE.name} 팝업북 — 해질녘 구좌 당근밭과 농부`;
 return [
  `<meta name="description" content="${escape(SITE.description)}"/>`,
  `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"/>`,
  siteUrl ? `<link rel="canonical" href="${escape(page)}"/>` : '',
  `<meta property="og:type" content="website"/>`, `<meta property="og:locale" content="ko_KR"/>`, `<meta property="og:site_name" content="${escape(SITE.name)}"/>`,
  `<meta property="og:title" content="${escape(TITLE)}"/>`, `<meta property="og:description" content="${escape(SITE.description)}"/>`,
  siteUrl ? `<meta property="og:url" content="${escape(page)}"/>` : '',
  `<meta property="og:image" content="${escape(image)}"/>`, `<meta property="og:image:width" content="1200"/>`, `<meta property="og:image:height" content="630"/>`, `<meta property="og:image:alt" content="${escape(alt)}"/>`,
  `<meta name="twitter:card" content="summary_large_image"/>`, `<meta name="twitter:title" content="${escape(TITLE)}"/>`, `<meta name="twitter:description" content="${escape(SITE.description)}"/>`, `<meta name="twitter:image" content="${escape(image)}"/>`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd(siteUrl, modified)).replace(/</g, '\\u003c')}</script>`,
 ].filter(Boolean).join('');
}

// --- llms.txt ---
function wzMarkdown(block: WzBlock, first: boolean): string[] {
 const flow = (items: WzFlow[]) => items.flatMap(item => 'q' in item ? [`> ${item.q}`, ''] : [item.p, '']);
 const pairs = (items: { title: string; text: string }[]) => [...items.map(item => `- ${item.title}: ${item.text}`), ''];
 switch (block.t) {
  case 'h1': return first ? [] : [`#### ${block.lines.join(' ')}`, ''];
  case 'h2': return [`#### ${[block.n, block.text].filter(Boolean).join(' ')}`, ''];
  case 'eyebrow': case 'season': case 'sub': return [block.text, ''];
  case 'lead': return [block.head ? `${block.head} ${block.text}` : block.text, ''];
  case 'flow': return flow(block.items);
  case 'photoText': return flow(block.column);
  case 'side': return block.body.flatMap(inner => wzMarkdown(inner, false));
  case 'rows': return [...block.items.map(item => `- ${[item.n, item.term].filter(Boolean).join(' ')}: ${item.text}`), ''];
  case 'menu': return pairs([block.menu]);
  case 'menus': case 'caption': return pairs(block.items);
  case 'hero': case 'cutout': case 'rule': return [];
 }
}
function storyMarkdown(id: string): string[] {
 if (webzines[id]) {
  const blocks = wzBlocks(id), firstH1 = blocks.findIndex(block => block.t === 'h1');
  return [`### ${wzHeadline(id)}`, '', ...blocks.flatMap((block, index) => wzMarkdown(block, index === firstH1))];
 }
 if (posters[id]) {
  const poster = posters[id], recipe = poster.recipe;
  return [`### ${poster.title.ko} (${recipe.servings})`, '', details[id].lead, '', `재료: ${recipe.ingredients.map(ingredientText).join(', ')}`, '',
   '만드는 법:', ...recipe.steps.map((step, i) => `${i + 1}. ${step}`), '', ...(recipe.tip ? [`팁: ${recipe.tip}`, ''] : []),
   ...(poster.shorts ? [`영상: ${shortsUrl(poster.shorts)}`, ''] : [])];
 }
 const d = details[id], lines = [`### ${d.title}`, '', d.lead, ''];
 if (d.list) lines.push(`${d.list.title}:`, ...d.list.items.map((item, i) => d.list!.ordered ? `${i + 1}. ${item}` : `- ${item}`), '');
 if (d.tip) lines.push(`팁: ${d.tip}`, '');
 if (d.actions?.length) lines.push(...d.actions.map(a => `- ${a.label}: ${a.href}`), '');
 return lines;
}
/** A plain-language map of the site for AI answer engines (llmstxt.org). */
export function llmsTxt(siteUrl?: string) {
 const page = abs(siteUrl, '/');
 const lines = [`# ${SITE.name} — 제주 구좌 당근 팝업북`, '', `> ${SITE.description}`, '',
  `‘${SITE.name}’는 제주 구좌 당근을 따라가는 세 장의 인터랙티브 팝업북 『${SITE.title}』입니다. 그림 속 사물을 누르면 농부와 가게 대표들의 인터뷰, 집에서 만드는 당근 레시피가 열립니다. 페이지: ${page}`, ''];
 scenes.forEach((scene, index) => {
  lines.push(`## ${english(index)} — ${scene.title}`, '', intro(index), '');
  for (const id of chapterStories[index]) lines.push(...storyMarkdown(id));
 });
 lines.push('## 자주 묻는 질문', '', ...FAQ.flatMap(item => [`### ${item.question}`, '', item.answer, '']));
 lines.push('## 링크', '', `- 팝업북: ${page}`, `- 관련 기사: ${SITE.article}`, ...(SHARE.instagram ? [`- 인스타그램: https://www.instagram.com/${SHARE.instagram}/`] : []), '');
 return lines.join('\n');
}
export function robotsTxt(siteUrl?: string) {
 return ['User-agent: *', 'Allow: /', '', ...(siteUrl ? [`Sitemap: ${abs(siteUrl, '/sitemap.xml')}`] : []), ''].join('\n');
}
export function sitemapXml(siteUrl: string, lastmod: string) {
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(abs(siteUrl, '/'))}</loc><lastmod>${lastmod}</lastmod></url></urlset>\n`;
}
export const PAGE_TITLE = TITLE;
