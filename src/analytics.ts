/**
 * Google Analytics 4 for the book. gtag.js loads only when VITE_GA_ID is set (or a gtag snippet is already on the page), after the intro,
 * so it never competes with the first paint or the intro film. Events are queued in dataLayer until it arrives.
 *
 * What is measured (GA4 event → parameters):
 *  page_view          a spread, the ending or a story shown: page_location carries the hash (#farmer, #cooks/cook-02, #ending)
 *  select_content     a story opened: content_type 'story', content_id, chapter_id, source (object | button | related | link)
 *  story_close        a story closed: content_id, open_seconds
 *  page_turn          a page turned: from_chapter, to_chapter, direction (next | previous), method (arrow | key | drag | wheel | link)
 *  story_link_click   a link followed: link_url, link_text, link_location (story | ending | header | about), content_id, outbound
 *  intro_complete     the intro film ended: layout (open | standing), dropped_frames
 *  story_complete     the ending reached; restart: the reader starts over from the cover; about_open: the about box opened
 *
 * The URL hash follows what is on screen (history.replaceState, so the back button is not filled with page turns), and a link with a
 * hash opens that spread or story after the intro (src/App.tsx). Turn off GA4 Enhanced measurement › "Page changes based on browser
 * history events" so page views are not counted twice; the page_view events below are the complete set.
 */
import { scenes, useStory } from './story.ts';
import { details } from './details.ts';

declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void } }
const GA_ID = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_GA_ID;

type Params = Record<string, string | number | boolean | undefined>;
export function track(name: string, params: Params = {}) {
 window.gtag?.('event', name, params);
}

/** Readable ids in the URL: the chapter's own id, a story's id after a slash, 'ending' for the closing page. */
export function locationHash(chapter: number, detail: string | null, ending: boolean) {
 if (ending) return '#ending';
 return `#${scenes[chapter].id}${detail ? '/' + detail : ''}`;
}
/** A shared link's target: which spread and which story (both optional). */
export function parseHash(hash: string): { chapter: number | null; detail: string | null; ending: boolean } {
 const [part, story] = decodeURIComponent(hash.replace(/^#/, '')).split('/');
 if (part === 'ending') return { chapter: scenes.length - 1, detail: null, ending: true };
 const chapter = scenes.findIndex(scene => scene.id === part);
 const detail = story && details[story] ? story : null;
 return { chapter: chapter >= 0 ? chapter : null, detail, ending: false };
}

// Which input caused the next turn or story, noted just before it happens (the store change carries no cause of its own).
let turnMethod = 'arrow', detailSource = 'object';
export const noteTurn = (method: 'arrow' | 'key' | 'drag' | 'wheel' | 'link') => { turnMethod = method; };
export const noteStory = (source: 'object' | 'button' | 'related' | 'link') => { detailSource = source; };

function pageTitle(chapter: number, detail: string | null, ending: boolean) {
 const base = document.title.split(' — ')[0];
 if (ending) return `마무리 | ${base}`;
 const scene = scenes[chapter], story = detail ? details[detail] : null;
 return `${story ? story.title + ' · ' : ''}0${chapter + 1} ${scene.title} | ${base}`;
}
function loadGtag() {
 if (!GA_ID || document.querySelector('script[data-gtag]')) return;
 const script = document.createElement('script');
 script.async = true; script.dataset.gtag = ''; script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
 document.head.append(script);
}

/** Starts measuring: the landing page view now, gtag.js once the intro is over, then events from the book's state. */
export function initAnalytics() {
 if (GA_ID && !window.gtag) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer!.push(arguments); }; // gtag.js reads the arguments object itself
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
 }
 track('page_view', { page_location: location.href, page_title: document.title });

 let shown = '', opened: { id: string; at: number } | null = null, lastChapter = useStory.getState().chapter, introDone = false;
 useStory.subscribe((state, previous) => {
  const reading = state.phase === 'EXPLORING' || state.phase === 'ENDING';
  if (!introDone && reading) {
   introDone = true;
   const idle = (window as unknown as { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback;
   idle ? idle(loadGtag) : window.setTimeout(loadGtag, 1200);
  }
  if (!reading) return;
  const ending = state.phase === 'ENDING';
  // A page turn completes when the chapter changes while reading.
  if (state.chapter !== lastChapter) {
   track('page_turn', { from_chapter: scenes[lastChapter].id, to_chapter: scenes[state.chapter].id, direction: state.chapter > lastChapter ? 'next' : 'previous', method: turnMethod });
   turnMethod = 'arrow'; lastChapter = state.chapter;
  }
  if (state.detail !== previous.detail) {
   if (opened) { track('story_close', { content_id: opened.id, open_seconds: Math.round((performance.now() - opened.at) / 1000) }); opened = null; }
   if (state.detail) {
    opened = { id: state.detail, at: performance.now() };
    track('select_content', { content_type: 'story', content_id: state.detail, chapter_id: scenes[state.chapter].id, source: detailSource });
    detailSource = 'object';
   }
  }
  if (ending && previous.phase !== 'ENDING') track('story_complete', { stories_opened: state.visited.length });
  const hash = locationHash(state.chapter, ending ? null : state.detail, ending);
  if (hash !== shown) {
   shown = hash;
   history.replaceState(history.state, '', hash);
   track('page_view', { page_location: location.href, page_title: pageTitle(state.chapter, ending ? null : state.detail, ending) });
  }
 });

 // Every link the reader follows, with where it was and which story was open.
 document.addEventListener('click', event => {
  const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!link || link.getAttribute('href')?.startsWith('#')) return;
  const where = link.closest('.detail-panel,.detail-book,.webzine-book') ? 'story' : link.closest('.is-ending') ? 'ending' : link.closest('.site-header') ? 'header' : link.closest('[role="dialog"]') ? 'about' : 'page';
  track('story_link_click', { link_url: link.href, link_text: link.textContent?.trim().slice(0, 100), link_location: where, content_id: useStory.getState().detail ?? undefined, outbound: link.host !== location.host });
 }, true);
}
