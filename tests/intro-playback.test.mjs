import test from 'node:test';
import assert from 'node:assert/strict';
import {COVER_HOLD_MS,coverTimeRemaining,canRevealReader,INTRO_PAGE_COUNT,INTRO_PAGE_STAGGER,INTRO_UI_AT,INTRO_DURATION} from '../src/introPlayback.ts';

test('the cover stays visible for one second counted from its painted image',()=>{
 assert.equal(COVER_HOLD_MS,1000);
 assert.equal(coverTimeRemaining(10000,10000),1000);
 assert.equal(coverTimeRemaining(10000,10999),1);
 assert.equal(coverTimeRemaining(10000,11000),0);
 assert.equal(coverTimeRemaining(10000,18000),0);
});
test('the intro cannot hand off until both playback and the interactive scene are ready',()=>{
 assert.equal(canRevealReader(false,false),false);
 assert.equal(canRevealReader(false,true),false);
 assert.equal(canRevealReader(true,false),false);
 assert.equal(canRevealReader(true,true),true);
});
test('the intro fans six pages and is shorter by the time of the four pages it no longer turns',()=>{
 assert.equal(INTRO_PAGE_COUNT,6);
 const removed=4*INTRO_PAGE_STAGGER;
 assert.ok(Math.abs(INTRO_UI_AT-(2.8-removed))<1e-9);assert.ok(Math.abs(INTRO_DURATION-(4.6-removed))<1e-9);
});
