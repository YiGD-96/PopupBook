import test from 'node:test';
import assert from 'node:assert/strict';
import {COVER_HOLD_MS,INTRO_COVER_HOLD,INTRO_PAGES_START,canRevealReader,INTRO_PAGE_COUNT,INTRO_PAGE_STAGGER,INTRO_UI_AT,INTRO_DURATION,INTRO_PAGE_TURN,STANDING_INTRO_PAGE_COUNT,STANDING_INTRO_PAGE_STAGGER,STANDING_INTRO_UI_AT,STANDING_INTRO_DURATION} from '../src/introPlayback.ts';

test('the closed book stands for one second at the start of the film, before anything moves',()=>{
 assert.equal(COVER_HOLD_MS,1000);assert.equal(INTRO_COVER_HOLD,1);
 // The book lowers and opens for one second before the pages fan.
 assert.equal(INTRO_PAGES_START,INTRO_COVER_HOLD+1);
});
test('the intro cannot hand off until both playback and the interactive scene are ready',()=>{
 assert.equal(canRevealReader(false,false),false);
 assert.equal(canRevealReader(false,true),false);
 assert.equal(canRevealReader(true,false),false);
 assert.equal(canRevealReader(true,true),true);
});
test('the intro fans six pages, and pauses for the prologue just after the last one has landed (never with a page in the air)',()=>{
 assert.equal(INTRO_PAGE_COUNT,6);
 const lastLands=INTRO_PAGES_START+(INTRO_PAGE_COUNT-1)*INTRO_PAGE_STAGGER+INTRO_PAGE_TURN;
 assert.ok(INTRO_UI_AT>=lastLands&&INTRO_UI_AT-lastLands<.1);
 assert.ok(Math.abs(INTRO_DURATION-INTRO_UI_AT-1.8)<1e-9);
});
test('the phone film keeps the hold and opening, and pauses just after the last swinging sheet has landed',()=>{
 assert.ok(STANDING_INTRO_PAGE_COUNT>=2&&STANDING_INTRO_PAGE_COUNT<=3,'a few sheets, each carrying a chapter painting');
 const lastLands=INTRO_PAGES_START+(STANDING_INTRO_PAGE_COUNT-1)*STANDING_INTRO_PAGE_STAGGER+INTRO_PAGE_TURN;
 assert.ok(STANDING_INTRO_UI_AT>=lastLands&&STANDING_INTRO_UI_AT-lastLands<.1);
 assert.ok(Math.abs(STANDING_INTRO_DURATION-STANDING_INTRO_UI_AT-(INTRO_DURATION-INTRO_UI_AT))<1e-9,'the same time for the cards as for the open book scenery');
});
