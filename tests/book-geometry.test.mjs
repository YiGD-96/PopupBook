import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoardGeometry,createSpineGeometry,createPaperBlockGeometry,createRibbonGeometry,spineTop,lightShade} from '../src/bookGeometry.ts';
import {BOOK_BOARD,BOOK_SPINE,BOOK_PAGES} from '../src/bookStructure.ts';

const bounds=g=>{g.computeBoundingBox();return g.boundingBox;};
const near=(a,b,e=1e-3)=>assert.ok(Math.abs(a-b)<e,`${a} ≠ ${b}`);

test('a board has the stated footprint and thickness, with up, down and edge material groups',()=>{
 const g=createBoardGeometry(),b=bounds(g);
 near(b.max.x-b.min.x,BOOK_BOARD.width);near(b.max.z-b.min.z,BOOK_BOARD.depth);near(b.max.y-b.min.y,BOOK_BOARD.thickness);
 assert.equal(g.groups.length,3);assert.ok(g.groups.every(group=>group.count>0));
 assert.equal(g.getAttribute('color').count,g.getAttribute('position').count);
});
test('the board turned over onto the left is lit from its turned normals, not like an underside',()=>{
 // Light is baked after the turn, so every vertex shade follows the normal it ends up with.
 for(const flipped of [false,true]){const g=createBoardGeometry(flipped),c=g.getAttribute('color'),n=g.getAttribute('normal');
  for(let i=0;i<c.count;i++)near(c.getX(i),Math.pow(lightShade(n.getX(i),n.getY(i),n.getZ(i)),2.2),1e-5);
  let up=0;for(let i=0;i<c.count;i++)if(n.getY(i)>.95)up++;assert.ok(up>10,'an upward face exists');}
});
test('the cloth case is continuous: the spine meets each board edge at board height',()=>{
 near(BOOK_BOARD.x-BOOK_BOARD.width/2,BOOK_SPINE.halfWidth);
 const top=BOOK_BOARD.y+BOOK_BOARD.thickness/2;
 // The band ends inside the boards at board height; the hinge groove dips just beside each board edge.
 near(spineTop(BOOK_SPINE.halfWidth+.05),top,2e-3);near(spineTop(-BOOK_SPINE.halfWidth-.05),top,2e-3);
 assert.ok(spineTop(BOOK_SPINE.halfWidth)>top-.01);assert.ok(spineTop(BOOK_SPINE.halfWidth+.05-.105)<top-.03,'a visible groove beside the board');
 assert.ok(spineTop(0)<top&&spineTop(0)>top-.05,'the spine only dips slightly under the gutter');
 const b=bounds(createSpineGeometry());near(b.min.y,BOOK_BOARD.y-BOOK_BOARD.thickness/2,3e-3);near(b.max.z-b.min.z,BOOK_BOARD.depth,2e-3);
 assert.ok(b.min.x<-BOOK_SPINE.halfWidth&&b.max.x>BOOK_SPINE.halfWidth,"the band runs into both boards, so the joints never open");
});
test('the text block and ribbon carry baked light and the ribbon reaches the table in front of the book',()=>{
 const block=createPaperBlockGeometry();assert.equal(block.getAttribute('color').count,block.getAttribute('position').count);
 const ribbon=bounds(createRibbonGeometry());assert.ok(ribbon.max.z>BOOK_PAGES.depth/2+.3);near(ribbon.min.y,BOOK_BOARD.y-BOOK_BOARD.thickness/2+.004,1e-3);
});
test('the spine band folds continuously from the closed C to the open spine',()=>{
 const open=bounds(createSpineGeometry(1)),closed=bounds(createSpineGeometry(0)),half=bounds(createSpineGeometry(.5));
 near(open.max.y,BOOK_BOARD.y+BOOK_BOARD.thickness/2,4e-3);
 // Closed, the band reaches from the bottom board up to the cover lying on the stacked halves and bulges out past the binding.
 assert.ok(closed.max.y>BOOK_PAGES.y+BOOK_PAGES.thickness);assert.ok(closed.min.x<-.05);
 assert.ok(half.max.y<closed.max.y+.5&&half.max.y>open.max.y);
});
test('the ribbon sits near the gutter but outside everything that moves when the book opens',()=>{
 const r=bounds(createRibbonGeometry()),spine=Math.max(...[0,.25,.5,.75,1].map(f=>bounds(createSpineGeometry(f)).max.x));
 assert.ok(r.min.x>spine,'clear of the folding spine band');assert.ok(r.min.x>0&&r.max.x<.6,'close to the middle of the book');
});
