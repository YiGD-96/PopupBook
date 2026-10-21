/**
 * Search (SEO), AI answer (AEO) and generative-engine (GEO) content, built from the same data the book shows (src/site.ts, src/story.ts,
 * src/details.ts) and written into the page at build time by the plugin in vite.config.ts, so crawlers that do not run JavaScript
 * (most AI crawlers) read the whole story:
 *  - textVersion: every chapter, story, recipe and the FAQ as plain HTML. It is also the book's text alternative: readers open it with
 *    "글로 읽기", screen readers reach it, and it stays in the page after the app starts.
 *  - jsonLd: WebSite, WebPage, the book and its chapters, the three recipes as Recipe, the FAQ as FAQPage.
 *  - headTags: title, description, canonical, Open Graph and Twitter cards.
 *  - llmsTxt / robotsTxt / sitemapXml: files at the site root.
 * `siteUrl` (VITE_SITE_URL, e.g. https://example.vercel.app) makes every URL absolute; without it canonical and the sitemap are left out.
 */
import { SITE } from './site.ts';
import { scenes } from './story.ts';
import { details, type Detail } from './details.ts';

const MAGAZINE = SITE.url.replace(/\/$/, '');
const TITLE = `${SITE.name} — ${SITE.tagline[0]} ${SITE.tagline.slice(1).join('')}`;
const escape = (text: string) => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const abs = (siteUrl: string | undefined, path: string) => siteUrl ? siteUrl.replace(/\/$/, '') + path : path;

/** The stories each spread opens, in the order its objects stand. */
export const chapterStories = scenes.map(scene => [...new Set(scene.layers.map(layer => layer.detail).filter((id): id is string => !!id && !!details[id]))]);
const english = (index: number) => (scenes[index] as { english?: string }).english ?? `0${index + 1}`;
const intro = (index: number) => ((scenes[index] as { intro?: string }).intro ?? '').replace(/\n/g, ' ');

/** Questions people ask about Gujwa carrots, answered only with what the stories themselves say. */
export const FAQ: { question: string; answer: string }[] = [
 { question: '구좌 당근은 왜 달고 맛있나요?', answer: details.harvest.lead },
 { question: '구좌 당근은 누가, 어떻게 키우나요?', answer: details.farmer.lead },
 { question: '유기농 당근밭은 농약 없이 벌레를 어떻게 막나요?', answer: details['night-watch'].lead },
 { question: '구좌 당근으로 집에서 무엇을 만들 수 있나요?', answer: `${['recipe-01', 'recipe-02', 'recipe-03'].map(id => `${details[id].title}(${details[id].facts?.find(f => f[0] === '조리 시간')?.[1] ?? ''})`).join(', ')}를 재료와 조리 순서까지 소개합니다.` },
 { question: `‘${SITE.title}’ 팝업북은 무엇인가요?`, answer: `${SITE.description} 세 장의 입체 팝업북으로 구좌 당근을 키우는 농부, 요리하는 사람들, 메뉴와 레시피를 보여 주고, 그림 속 사물을 누르면 이야기가 열립니다.` },
 { question: '구좌 당근 이야기를 더 보려면 어디로 가면 되나요?', answer: `웹진 ‘${SITE.title}’(${MAGAZINE})에서 농부 인터뷰 영상, 식당 사장님 인터뷰, 메뉴와 레시피 카드뉴스를 볼 수 있습니다.` },
];

function storyHtml(detail: Detail) {
 const parts = [`<article id="text-${detail.id}"><p class="book-text-kicker">${escape(detail.kicker)}</p><h3>${escape(detail.title)}</h3><p>${escape(detail.lead)}</p>`];
 if (detail.quote) parts.push(`<blockquote><p>${escape(detail.quote)}</p></blockquote>`);
 if (detail.spread) parts.push(...detail.spread.paragraphs.map(p => `<p>${escape(p)}</p>`));
 if (detail.facts?.length) parts.push(`<dl>${detail.facts.map(([k, v]) => `<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`).join('')}</dl>`);
 if (detail.ingredients?.length) parts.push(`<h4>재료</h4><ul>${detail.ingredients.map(([k, v]) => `<li>${escape(k)} ${escape(v)}</li>`).join('')}</ul>`);
 if (detail.list) { const tag = detail.list.ordered ? 'ol' : 'ul'; parts.push(`<h4>${escape(detail.list.title)}</h4><${tag}>${detail.list.items.map(i => `<li>${escape(i)}</li>`).join('')}</${tag}>`); }
 if (detail.tip) parts.push(`<p><strong>팁</strong> ${escape(detail.tip)}</p>`);
 parts.push(`<p><a href="${escape(detail.link.href)}">${escape(detail.link.label)}</a></p></article>`);
 return parts.join('');
}
/** The whole book as text; hidden until "글로 읽기" opens it (src/App.tsx). */
export function textVersion() {
 const chapters = scenes.map((scene, index) => `<section id="text-${scene.id}" aria-labelledby="text-${scene.id}-title"><h2 id="text-${scene.id}-title">${escape(english(index))} — ${escape(scene.title)}</h2><p>${escape(intro(index))}</p>${chapterStories[index].map(id => storyHtml(details[id])).join('')}</section>`).join('');
 const faq = `<section id="text-faq" aria-labelledby="text-faq-title"><h2 id="text-faq-title">자주 묻는 질문</h2><dl>${FAQ.map(item => `<dt>${escape(item.question)}</dt><dd>${escape(item.answer)}</dd>`).join('')}</dl></section>`;
 const toc = `<nav aria-label="차례"><ol>${scenes.map((scene, index) => `<li><a href="#text-${scene.id}">${escape(english(index))} ${escape(scene.title)}</a></li>`).join('')}<li><a href="#text-faq">자주 묻는 질문</a></li></ol></nav>`;
 return `<section id="book-text" class="book-text" tabindex="-1" aria-labelledby="book-text-title" hidden><div class="book-text-inner">`
  + `<button type="button" class="book-text-close" data-close-text>책으로 돌아가기</button>`
  + `<header><p class="book-text-kicker">${escape(SITE.label)}</p><h1 id="book-text-title">${escape(SITE.title)}</h1><p>${escape(SITE.description)}</p></header>`
  + toc + chapters + faq
  + `<footer><p><a href="${escape(SITE.url)}">웹진 ‘${escape(SITE.title)}’에서 이어 읽기</a></p><p>${escape(SITE.copyright)}</p></footer></div></section>`;
}

const minutes = (text = '') => { const m = /(\d+)\s*분/.exec(text); const day = /하루/.test(text); return m ? `P${day ? '1D' : ''}T${m[1]}M` : undefined; };
/** Structured data for search and answer engines. */
export function jsonLd(siteUrl?: string) {
 const page = abs(siteUrl, '/'), image = abs(siteUrl, '/media/og-image.jpg');
 const publisher = { '@type': 'Organization', '@id': `${MAGAZINE}/#organization`, name: SITE.name, url: SITE.url, logo: abs(siteUrl, '/media/logo.webp') };
 // The recipes on the kitchen wall; a recipe whose note does not open it (the three card-news recipes) borrows the note's picture.
 const NOTE_ART: Record<string, string> = { 'recipe-01': 'note-rape', 'recipe-02': 'note-soup', 'recipe-03': 'note-pickle', 'recipe-burger': 'note-burger' };
 const recipes = ['recipe-01', 'recipe-02', 'recipe-03', 'recipe-burger'].map(id => {
  const d = details[id], fact = (k: string) => d.facts?.find(f => f[0] === k)?.[1];
  const art = scenes[2].layers.find(layer => layer.detail === id)?.src ?? NOTE_ART[id];
  return {
   '@type': 'Recipe', '@id': `${page}#${id}`, name: d.title, description: d.lead, inLanguage: 'ko-KR', author: publisher,
   image: art ? [abs(siteUrl, `/art-raster/${art}.webp`)] : undefined,
   recipeYield: fact('분량'), totalTime: minutes(fact('조리 시간')), keywords: '구좌 당근, 제주 당근, 당근 레시피',
   recipeCategory: '당근 요리', recipeIngredient: d.ingredients?.map(([k, v]) => `${k} ${v}`),
   recipeInstructions: d.list?.items.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })), url: d.link.href,
  };
 });
 return {
  '@context': 'https://schema.org',
  '@graph': [
   { '@type': 'WebSite', '@id': `${page}#website`, url: page, name: `${SITE.title} — 팝업북`, inLanguage: 'ko-KR', publisher: { '@id': publisher['@id'] } },
   publisher,
   { '@type': 'WebPage', '@id': `${page}#webpage`, url: page, name: TITLE, description: SITE.description, inLanguage: 'ko-KR', isPartOf: { '@id': `${page}#website` },
    primaryImageOfPage: image, about: [{ '@type': 'Thing', name: '구좌 당근' }, { '@type': 'Place', name: '제주특별자치도 제주시 구좌읍' }], mainEntity: { '@id': `${page}#book` },
    relatedLink: SITE.url },
   { '@type': 'CreativeWork', '@id': `${page}#book`, name: SITE.title, alternativeHeadline: SITE.label, description: SITE.description, inLanguage: 'ko-KR', image,
    genre: '인터랙티브 팝업북', publisher: { '@id': publisher['@id'] }, isBasedOn: SITE.url,
    hasPart: scenes.map((scene, index) => ({ '@type': 'CreativeWork', position: index + 1, name: scene.title, alternativeHeadline: english(index), description: intro(index), url: `${page}#${scene.id}` })) },
   ...recipes,
   { '@type': 'FAQPage', '@id': `${page}#faq`, mainEntity: FAQ.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
  ],
 };
}
/** Tags for <head>: description, canonical, robots, Open Graph, Twitter. */
export function headTags(siteUrl?: string) {
 const page = abs(siteUrl, '/'), image = abs(siteUrl, '/media/og-image.jpg'), alt = `${SITE.title} 팝업북 — 해질녘 구좌 당근밭과 농부`;
 return [
  `<meta name="description" content="${escape(SITE.description)}"/>`,
  `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"/>`,
  siteUrl ? `<link rel="canonical" href="${escape(page)}"/>` : '',
  `<meta property="og:type" content="website"/>`, `<meta property="og:locale" content="ko_KR"/>`, `<meta property="og:site_name" content="${escape(SITE.name)}"/>`,
  `<meta property="og:title" content="${escape(TITLE)}"/>`, `<meta property="og:description" content="${escape(SITE.description)}"/>`,
  siteUrl ? `<meta property="og:url" content="${escape(page)}"/>` : '',
  `<meta property="og:image" content="${escape(image)}"/>`, `<meta property="og:image:width" content="1200"/>`, `<meta property="og:image:height" content="630"/>`, `<meta property="og:image:alt" content="${escape(alt)}"/>`,
  `<meta name="twitter:card" content="summary_large_image"/>`, `<meta name="twitter:title" content="${escape(TITLE)}"/>`, `<meta name="twitter:description" content="${escape(SITE.description)}"/>`, `<meta name="twitter:image" content="${escape(image)}"/>`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd(siteUrl)).replace(/</g, '\\u003c')}</script>`,
 ].filter(Boolean).join('');
}
/** A plain-language map of the site for AI answer engines (llmstxt.org). */
export function llmsTxt(siteUrl?: string) {
 const page = abs(siteUrl, '/');
 const lines = [`# ${SITE.title} — 팝업북 (${SITE.name})`, '', `> ${SITE.description}`, '',
  `제주 구좌 당근을 따라가는 세 장의 인터랙티브 팝업북입니다. 웹진 ‘${SITE.title}’(${MAGAZINE})의 이야기를 바탕으로 합니다. 페이지: ${page}`, ''];
 scenes.forEach((scene, index) => {
  lines.push(`## ${english(index)} — ${scene.title}`, '', intro(index), '');
  for (const id of chapterStories[index]) {
   const d = details[id];
   lines.push(`### ${d.title}`, '', d.lead);
   if (d.quote) lines.push('', `> ${d.quote}`);
   if (d.ingredients?.length) lines.push('', `재료: ${d.ingredients.map(([k, v]) => `${k} ${v}`).join(', ')}`);
   if (d.list) lines.push('', `${d.list.title}:`, ...d.list.items.map((item, i) => d.list!.ordered ? `${i + 1}. ${item}` : `- ${item}`));
   if (d.tip) lines.push('', `팁: ${d.tip}`);
   lines.push('', `자세히: ${d.link.href}`, '');
  }
 });
 lines.push('## 자주 묻는 질문', '', ...FAQ.flatMap(item => [`### ${item.question}`, '', item.answer, '']));
 lines.push('## 링크', '', `- 웹진 ‘${SITE.title}’: ${SITE.url}`, `- 팝업북: ${page}`, '');
 return lines.join('\n');
}
export function robotsTxt(siteUrl?: string) {
 return ['User-agent: *', 'Allow: /', '', ...(siteUrl ? [`Sitemap: ${abs(siteUrl, '/sitemap.xml')}`] : []), ''].join('\n');
}
export function sitemapXml(siteUrl: string, lastmod: string) {
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(abs(siteUrl, '/'))}</loc><lastmod>${lastmod}</lastmod></url></urlset>\n`;
}
export const PAGE_TITLE = TITLE;
