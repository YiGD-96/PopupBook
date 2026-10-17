import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {artSource} from '../src/artSource.ts';
import {scenes} from '../src/story.ts';
import {BOOK_FRAME_WIDTH,BOOK_FRAME_HEIGHT,BOOK_TARGET_Y,BOOK_CAMERA_POSITION} from '../src/bookView.ts';
import {INTRO_DURATION,INTRO_UI_AT,INTRO_PAGE_COUNT} from '../src/introPlayback.ts';
import {BOOK_BOARD,BOOK_PAGES,BOOK_SPINE} from '../src/bookStructure.ts';

test('every book texture is delivered as a packaged WebP instead of rasterizing SVG at runtime',async()=>{
 const names=new Set(['book-cover','book-inside','book-cloth-side','book-paper-edge','book-endpaper',...scenes.flatMap((scene,index)=>[...scene.layers.map(l=>l.src),`page-${index}-left`,`page-${index}-right`])]);
 for(const name of names){
  const source=artSource(name);assert.ok(source.endsWith('.webp'));
  const buffer=await fs.readFile(new URL('../public'+source,import.meta.url));
  assert.equal(buffer.toString('ascii',0,4),'RIFF');assert.equal(buffer.toString('ascii',8,12),'WEBP');
 }
});
test('the shipped movie and its endpoint images use the same framing as the interactive book',async()=>{
 const meta=JSON.parse(await fs.readFile(new URL('../public/media/intro-meta.json',import.meta.url),'utf8'));
 assert.equal(meta.worldWidth,BOOK_FRAME_WIDTH);assert.equal(meta.worldHeight,BOOK_FRAME_HEIGHT);assert.equal(meta.targetY,BOOK_TARGET_Y);
 assert.ok(Math.abs(meta.width/meta.height-BOOK_FRAME_WIDTH/BOOK_FRAME_HEIGHT)<1e-9);
 assert.equal(meta.pageCount,INTRO_PAGE_COUNT);assert.equal(meta.fps,60);
 assert.equal(meta.duration,INTRO_DURATION);assert.equal(meta.uiRevealAt,INTRO_UI_AT);assert.equal(meta.sceneryStartsAt,INTRO_UI_AT);
 // The film is staged with the live book's own parts; the recorded dimensions must be the current ones.
 assert.deepEqual(meta.board,BOOK_BOARD);assert.deepEqual(meta.pages,BOOK_PAGES);assert.deepEqual(meta.spine,BOOK_SPINE);assert.equal(meta.shadows,false);
 assert.equal(meta.projection,'perspective');assert.deepEqual(meta.camera,[...BOOK_CAMERA_POSITION]);
 // The book casts no shadows at all, neither live nor baked.
 assert.equal(meta.bakedShadows,false);
 // The reader, the intro screen and the movie share one table colour, so the handoff has no visible frame.
 const css=await fs.readFile(new URL('../src/cinematic.css',import.meta.url),'utf8');
 assert.ok(css.includes(`.reader-mode.cinematic-reader{background:${meta.background}`));assert.ok(css.includes(`.intro-screen{position:absolute;inset:0;z-index:3;background:${meta.background}`));
 for(const name of ['book-opening.mp4','book-cover.webp','book-open.webp'])assert.ok((await fs.stat(new URL('../public/media/'+name,import.meta.url))).size>1000);
});
test('the phone movie and its endpoint images use the standing book\'s camera and framing',async()=>{
 const {STANDING_CAMERA_POSITION,STANDING_TARGET,standingFov}=await import('../src/standingView.ts');
 const {STANDING_FILM_ASPECT}=await import('../src/standingMedia.ts');
 const {STANDING_INTRO_DURATION,STANDING_INTRO_UI_AT,STANDING_INTRO_PAGE_COUNT,INTRO_COVER_HOLD}=await import('../src/introPlayback.ts');
 const meta=JSON.parse(await fs.readFile(new URL('../public/media/intro-meta-standing.json',import.meta.url),'utf8'));
 assert.equal(meta.mode,'standing');assert.equal(meta.projection,'perspective');assert.equal(meta.fps,60);
 // Same camera position and direction as the live standing book; the field of view is the one standingFov gives the film's canvas.
 assert.deepEqual(meta.camera,[...STANDING_CAMERA_POSITION]);assert.deepEqual(meta.target,[...STANDING_TARGET]);
 assert.equal(meta.aspect,STANDING_FILM_ASPECT);assert.ok(Math.abs(meta.width/meta.height-STANDING_FILM_ASPECT)<1e-9);
 assert.ok(Math.abs(meta.fov-standingFov(meta.width,meta.height))<1e-9);
 assert.equal(meta.duration,STANDING_INTRO_DURATION);assert.equal(meta.uiRevealAt,STANDING_INTRO_UI_AT);assert.equal(meta.coverHold,INTRO_COVER_HOLD);assert.equal(meta.pageCount,STANDING_INTRO_PAGE_COUNT);
 assert.deepEqual(meta.board,BOOK_BOARD);assert.deepEqual(meta.pages,BOOK_PAGES);assert.deepEqual(meta.spine,BOOK_SPINE);assert.equal(meta.shadows,false);
 const css=await fs.readFile(new URL('../src/cinematic.css',import.meta.url),'utf8');assert.ok(css.includes('.intro-screen.is-standing .intro-media{width:var(--standing-media-width'));
 for(const name of ['book-opening-standing.mp4','book-cover-standing.webp','book-open-standing.webp'])assert.ok((await fs.stat(new URL('../public/media/'+name,import.meta.url))).size>1000);
});
