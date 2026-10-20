import test from 'node:test';
import assert from 'node:assert/strict';
import {FLAT_STACK,flatLift,gluedParent,riseOrder,stackRanks} from '../src/popupStack.ts';
import {scenes} from '../src/story.ts';

test('folded cards stack front on top, and stand exactly where they did when upright',()=>{
 const layers=scenes[0].layers,ranks=stackRanks(layers);
 const back=layers.find(l=>l.id==='back'),top=layers.find(l=>ranks.get(l.id)===layers.length-1);
 assert.equal(ranks.get(back.id),0);
 assert.equal(top.position[2],Math.max(...layers.map(l=>l.position[2])));
 for(const a of layers)for(const b of layers)if(a.position[2]<b.position[2])assert.ok(ranks.get(a.id)<ranks.get(b.id),`${a.id} behind ${b.id}`);
 for(const layer of layers)assert.equal(flatLift(ranks.get(layer.id),0),0);
 assert.ok(Math.abs(flatLift(3,-Math.PI/2)-3*FLAT_STACK)<1e-12);
 assert.ok(Math.abs(flatLift(3,-Math.PI/4)-1.5*FLAT_STACK)<1e-12);
});
test('the kitchen dishes stand on the table, which stands on the page',()=>{
 const layers=scenes[2].layers,table=layers.find(l=>l.id==='table');
 assert.equal(gluedParent(table,layers),null);
 for(const id of ['plate','juice','burger'])assert.equal(gluedParent(layers.find(l=>l.id===id),layers),table,id);
 // Every `on` names a card of the same spread.
 for(const scene of scenes)for(const layer of scene.layers)if(layer.on)assert.ok(gluedParent(layer,scene.layers),`${scene.id}/${layer.id}`);
});
test('cards rise front first, so none swings up through a card lying on it',()=>{
 for(const scene of scenes){
  const layers=scene.layers,ranks=stackRanks(layers);
  for(const front of layers)for(const back of layers)if(front.position[2]>back.position[2])
   assert.ok(riseOrder(ranks.get(front.id),layers.length)<=riseOrder(ranks.get(back.id),layers.length),`${scene.id}: ${front.id} rises before ${back.id}`);
 }
});
