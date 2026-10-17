import test from 'node:test';
import assert from 'node:assert/strict';
import {ResolutionGovernor,PACING_WINDOW} from '../src/framePacing.ts';

const feed=(governor,interval,work,count=PACING_WINDOW)=>{let result=null;for(let i=0;i<count;i++)result=governor.sample(interval,work)??result;return result;};

test('a smooth 60 Hz book keeps its resolution, even with an occasional late frame',()=>{
 const g=new ResolutionGovernor(1.5);
 assert.equal(feed(g,16.7,3,PACING_WINDOW*4),null);
 for(let i=0;i<PACING_WINDOW*4;i++)assert.equal(g.sample(i%10===0?33.4:16.7,3),null);
});
test('a fifth of the frames late steps down',()=>{
 const g=new ResolutionGovernor(1.5);let result=null;
 for(let i=0;i<PACING_WINDOW;i++)result=g.sample(i%4===0?33.4:16.7,3)??result;
 assert.equal(result,1.275);
});
test('frames that miss vsync while the main thread is idle step the resolution down, not below the floor',()=>{
 const g=new ResolutionGovernor(1.5);feed(g,16.7,3,5);
 assert.equal(feed(g,33.4,4),1.275);
 assert.equal(feed(g,33.4,4),1.084);
 assert.equal(feed(g,33.4,4),1); // 60 % of 1.5 is .9: the floor is 1×
 assert.equal(feed(g,33.4,4),null);
});
test('a busy main thread is not the GPU: no change',()=>{
 const g=new ResolutionGovernor(2);feed(g,16.7,3,5);
 assert.equal(feed(g,33.4,25),null);
});
test('a 1× canvas never goes lower; stalls from a hidden tab are ignored',()=>{
 assert.equal(feed(new ResolutionGovernor(1),33.4,2),null);
 const g=new ResolutionGovernor(2);feed(g,16.7,3,5);
 assert.equal(feed(g,900,1),null);
});
