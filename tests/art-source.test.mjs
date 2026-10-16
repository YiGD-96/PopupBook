import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {artSource} from '../src/artSource.ts';
import {scenes} from '../src/story.ts';
import {BOOK_FRAME_WIDTH,BOOK_FRAME_HEIGHT,BOOK_TARGET_Y} from '../src/bookView.ts';
import {INTRO_DURATION,INTRO_UI_AT} from '../src/introPlayback.ts';
import {BOOK_BOARD,BOOK_PAGES,COVER_ART_Y,COVER_HINGE_Y} from '../src/bookStructure.ts';

test('every book texture is delivered as a packaged WebP instead of rasterizing SVG at runtime',async()=>{
 const names=new Set(['book-cover','book-cloth','book-cloth-side','book-cover-edge','book-paper-edge','book-endpaper',...scenes.flatMap((scene,index)=>[...scene.layers.map(l=>l.src),`page-${index}-left`,`page-${index}-right`])]);
 for(const name of names){
  const source=artSource(name);assert.ok(source.endsWith('.webp'));
  const buffer=await fs.readFile(new URL('../public'+source,import.meta.url));
  assert.equal(buffer.toString('ascii',0,4),'RIFF');assert.equal(buffer.toString('ascii',8,12),'WEBP');
 }
});
test('the shipped movie and its endpoint images use the same framing as the interactive book',async()=>{
 const meta=JSON.parse(await fs.readFile(new URL('../public/media/intro-meta.json',import.meta.url),'utf8'));
 assert.equal(meta.worldWidth,BOOK_FRAME_WIDTH);assert.equal(meta.worldHeight,BOOK_FRAME_HEIGHT);assert.equal(meta.targetY,BOOK_TARGET_Y);
 assert.equal(meta.width/meta.height,BOOK_FRAME_WIDTH/BOOK_FRAME_HEIGHT);
 assert.equal(meta.pageCount,10);assert.equal(meta.fps,60);
 assert.equal(meta.duration,INTRO_DURATION);assert.equal(meta.uiRevealAt,INTRO_UI_AT);assert.equal(meta.sceneryStartsAt,INTRO_UI_AT);
 assert.deepEqual(meta.materials.bottomCover,{width:BOOK_BOARD.width,height:BOOK_BOARD.thickness,depth:BOOK_BOARD.depth,y:BOOK_BOARD.y});
 assert.deepEqual(meta.materials.paperBlock,{width:BOOK_PAGES.width,height:BOOK_PAGES.thickness,depth:BOOK_PAGES.depth,y:BOOK_PAGES.y});
 assert.equal(meta.materials.frontCover.hingeY,COVER_HINGE_Y);assert.equal(meta.materials.frontCover.artY,COVER_ART_Y);assert.equal(meta.materials.shadows,false);
 for(const name of ['book-opening.mp4','book-cover.webp','book-open.webp'])assert.ok((await fs.stat(new URL('../public/media/'+name,import.meta.url))).size>1000);
});
