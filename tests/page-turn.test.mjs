import test from 'node:test';
import assert from 'node:assert/strict';
import { paperPoint, createPaperGeometry, createPageSkirt, updatePaperGeometry, PAGE_WIDTH, FORE_EDGE_PULL, pageShade } from '../src/paperGeometry.ts';
import { BOOK_PAGES, BOOK_BOARD } from '../src/bookStructure.ts';
test('a resting sheet sinks into the gutter, swells, and settles near the block at the fore-edge',()=>{
 const y=u=>paperPoint(u,.5,0)[1],block=BOOK_PAGES.y+BOOK_PAGES.thickness/2;
 assert.ok(Math.abs(y(0)-block)<.005);assert.ok(y(.3)>y(0)+.12);assert.ok(y(1)<y(.3));assert.ok(y(1)-block<.08);
});
test('baked page light darkens the gutter and a sheet turned away from the reader',()=>{
 assert.ok(pageShade(0)<.75);assert.ok(pageShade(.4)>.97);assert.ok(pageShade(.4,0)<pageShade(.4,1)*.85);
 const g=createPaperGeometry();assert.equal(g.getAttribute('color').count,g.getAttribute('position').count);
 updatePaperGeometry(g,.5,1);const c=g.getAttribute('color');let darkest=1;for(let i=0;i<c.count;i++)darkest=Math.min(darkest,c.getX(i));assert.ok(darkest<.6);
});
import { dragProgress, commitDrag, wheelDelta } from '../src/turnInput.ts';
test('turning sheet rests on the correct side in both directions',()=>{const edge=PAGE_WIDTH,near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} ≠ ${b}`);near(paperPoint(1,.5,0)[0],edge);near(paperPoint(1,.5,1)[0],-edge);near(paperPoint(1,.5,0,-1)[0],-edge);near(paperPoint(1,.5,1,-1)[0],edge);});
test('the page stack leans in toward the top: its foot spreads past the full-size top sheet; a closed book is square',()=>{
 for(const [swell,inset] of [[1,FORE_EDGE_PULL],[0,0]]){const g=createPageSkirt(BOOK_PAGES.y-BOOK_PAGES.thickness/2,()=>1,24,swell),p=g.getAttribute('position');let foot=0,top=0,low=Infinity,high=-Infinity;
  for(let i=0;i<p.count;i++){low=Math.min(low,p.getY(i));high=Math.max(high,p.getY(i));}
  for(let i=0;i<p.count;i++){if(Math.abs(p.getY(i)-low)<1e-6)foot=Math.max(foot,p.getX(i));if(p.getY(i)>high-.12)top=Math.max(top,p.getX(i));}
  assert.ok(Math.abs(foot-(PAGE_WIDTH+inset))<1e-6,`${swell}: foot ${foot}`);assert.ok(Math.abs(top-PAGE_WIDTH)<.02,`${swell}: top ${top}`);}
 // The hidden block stays inside the walls, and the spread foot stays on the board.
 assert.ok(.004+BOOK_PAGES.width<PAGE_WIDTH);assert.ok(PAGE_WIDTH+FORE_EDGE_PULL<BOOK_BOARD.x+BOOK_BOARD.width/2-.03);
});
test('binding remains fixed and the middle of a turn lifts and curves',()=>{for(const p of [0,.1,.5,.9,1])assert.ok(Math.abs(paperPoint(0,0,p)[0])<1e-10);const tip=paperPoint(1,.5,.5),mid=paperPoint(.5,.5,.5);assert.ok(tip[1]>3);assert.ok(Math.abs(tip[0]-mid[0]*2)>.1);});
test('geometry retains finite normals and bounds throughout repeated turns',()=>{const g=createPaperGeometry();for(let i=0;i<40;i++){updatePaperGeometry(g,(i%20)/19,i<20?1:-1);assert.ok(g.boundingSphere.radius>0);assert.ok(Array.from(g.getAttribute('normal').array).every(Number.isFinite));}g.dispose();});
test('drag follows direction, clamps and returns to zero when reversed',()=>{assert.equal(dragProgress(-168,800,1),.5);assert.equal(dragProgress(168,800,-1),.5);assert.equal(dragProgress(168,800,1),0);assert.equal(dragProgress(-900,800,1),1);});
test('short accidental movements cancel, deliberate drags and flicks commit',()=>{assert.equal(commitDrag(.08,3),false);assert.equal(commitDrag(.25,.1),false);assert.equal(commitDrag(.42,0),true);assert.equal(commitDrag(.18,.7),true);assert.equal(commitDrag(.18,-.7),false);});
test('wheel normalizes pixels, lines, pages and horizontal trackpad gestures',()=>{assert.equal(wheelDelta(0,65,0,600),65);assert.equal(wheelDelta(0,-4,1,600),-64);assert.equal(wheelDelta(0,1,2,600),600);assert.equal(wheelDelta(-75,30,0,600),-75);});
