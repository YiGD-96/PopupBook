import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareBookRenderer } from '../src/bookPreparation.ts';

test('first opening waits for staged texture uploads and shader preparation',async()=>{
 const events=[];const cover={},page={};
 const renderer={initTexture:texture=>events.push(texture),compileAsync:async()=>events.push('compile')};
 const result=await prepareBookRenderer(renderer,[cover,page,cover],{},{},()=>true,async()=>events.push('frame'));
 assert.equal(result,true);
 assert.deepEqual(events,['frame','frame',cover,'frame',page,'frame','compile','frame']);
});
test('unmount or retry cancels stale startup before further GPU work',async()=>{
 let active=true;const uploads=[];
 const renderer={initTexture:texture=>{uploads.push(texture);active=false;},compileAsync:async()=>assert.fail('stale startup compiled')};
 assert.equal(await prepareBookRenderer(renderer,[{},{}],{},{},()=>active,async()=>{}),false);
 assert.equal(uploads.length,1);
});
test('a shader failure is propagated so startup can show a retry instead of opening',async()=>{
 const renderer={initTexture:()=>{},compileAsync:async()=>{throw new Error('shader unavailable');}};
 await assert.rejects(prepareBookRenderer(renderer,[],{},{},()=>true,async()=>{}),/shader unavailable/);
});
test('the hidden first scene is rendered after shaders compile and before preparation finishes',async()=>{
 const events=[];const renderer={initTexture:()=>{},compileAsync:async()=>events.push('compiled')};
 assert.equal(await prepareBookRenderer(renderer,[],{},{},()=>true,async()=>events.push('frame'),()=>events.push('rendered')),true);
 assert.deepEqual(events,['frame','frame','compiled','rendered','frame']);
});
test('cancellation during shader compilation prevents a stale hidden render',async()=>{
 let active=true;const renderer={initTexture:()=>{},compileAsync:async()=>{active=false;}};
 assert.equal(await prepareBookRenderer(renderer,[],{},{},()=>active,async()=>{},()=>assert.fail('stale scene rendered')),false);
});
