import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/engine.ts';
import {MAX_PASSIVES,MAX_WEAPONS,RUN_SECONDS,SHOPS,WEAPONS,WEAPON_MAX_LEVEL,EVOLVE_PASSIVE_LEVEL} from '../src/game/content.ts';

const seeded=(seed=1)=>()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
/** A simple player: steps back from insects that come close, otherwise walks to the nearest carrot or chest; takes a new weapon when offered,
 *  opens every chest, buys what it can afford in a shop. */
function steer(game){
 const p=game.player;let vx=0,vy=0,close=false;
 for(const e of game.enemies){if(e.def.move==='static')continue;const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);
  if(d>0&&d<110+e.r){close=true;vx+=dx/d*(120+e.r-d)/30;vy+=dy/d*(120+e.r-d)/30;}}
 if(!close){let best=null,bd=350;for(const g of [...game.gems,...game.pickups.filter(k=>k.id==='chest')]){const d=Math.hypot(g.x-p.x,g.y-p.y);if(d<bd){bd=d;best=g;}}
  if(best&&bd>1){vx=(best.x-p.x)/bd;vy=(best.y-p.y)/bd;}else{vx=Math.cos(game.time*.2);vy=Math.sin(game.time*.2);}}
 const l=Math.hypot(vx,vy)||1;game.input.x=vx/l;game.input.y=vy/l;
}
function play(game,seconds,log={},each=()=>{}){
 const dt=1/30;let t=0;
 while(t<seconds&&!game.over){
  steer(game);
  if(game.modal==='levelup'){const i=game.choices.findIndex(c=>c.kind==='weapon');game.choose(i<0?0:i);log.levels=(log.levels??0)+1;continue;}
  if(game.modal==='chest'){log.chests=(log.chests??0)+1;if(game.chestRewards.some(r=>r.kind==='evolve'))log.evolved=(log.evolved??0)+1;game.closeChest();continue;}
  if(game.modal==='shop'){log.shops=(log.shops??0)+1;for(const item of SHOPS[game.openShop].items)game.buy(game.openShop,item.id);game.leaveShop();continue;}
  game.update(dt);t+=dt;each();
  for(const v of [game.player.x,game.player.y,game.player.hp,game.xp])assert.ok(Number.isFinite(v),'state stays finite');
 }
 return log;
}

test('a run plays to the end without breaking, and the player grows',()=>{
 for(const char of ['farmer','traveler']){
  const game=new Game({char,rng:seeded(char.length)});
  // Endless health so the bot sees the whole run (the king, his summons, the end).
  const log=play(game,RUN_SECONDS+60,{},()=>{game.player.hp=game.stats.maxHp;});
  assert.ok(game.level>=15,`${char} reached level ${game.level}`);
  assert.ok(game.kills>300,`${char} killed ${game.kills}`);
  assert.ok(game.weapons.length>=2&&game.weapons.length<=MAX_WEAPONS);
  assert.ok(game.passives.length<=MAX_PASSIVES);
  // Chests opened plus chests still lying where elites fell (the bot steps away from insects and doesn't always reach them).
  assert.ok((log.chests??0)+game.pickups.filter(k=>k.id==='chest').length>=3,'elites drop chests');
  assert.ok(game.king||game.won,'the king comes at the end');
 }
});

test('the player can lose',()=>{
 const game=new Game({char:'farmer',rng:seeded(3)});
 let result=null;game.events.end=r=>{result=r;};
 // Standing still and never choosing anything stronger than the first offer still ends the run once the swarm is thick enough.
 const dt=1/30;
 for(let i=0;i<30*RUN_SECONDS*2&&!game.over;i++){game.input.x=0;game.input.y=0;if(game.modal==='levelup'){game.choose(game.choices.length-1);continue;}if(game.modal==='chest'){game.closeChest();continue;}if(game.modal==='shop'){game.leaveShop();continue;}game.update(dt);}
 assert.ok(result&&result.win===false,'the run ends in a loss');
});

test('level-up choices only offer what fits',()=>{
 const game=new Game({char:'farmer',rng:seeded(5)});
 for(let k=0;k<40;k++){
  for(const c of game.makeChoices()){
   if(c.kind==='weapon'){assert.ok(!WEAPONS[c.id].evolved,'evolved weapons are never offered');
    if(c.isNew)assert.ok(game.weapons.length<MAX_WEAPONS&&!game.hasWeapon(c.id));}
   if(c.kind==='passive'&&c.isNew)assert.ok(game.passives.length<MAX_PASSIVES);
  }
  game.pendingLevels=1;game.update(0);game.choose(0);
 }
});

test('a weapon at its last level with its paired passive evolves when a chest opens',()=>{
 const game=new Game({char:'farmer',rng:seeded(9)});
 const swatter=game.weapons[0];swatter.level=WEAPON_MAX_LEVEL;
 assert.equal(game.evolvable(),null,'not without its passive');
 game.passives.push({id:'gloves',level:EVOLVE_PASSIVE_LEVEL-1});game.recompute();
 assert.equal(game.evolvable(),null,'not with its passive below the needed level');
 game.passives[game.passives.length-1].level=EVOLVE_PASSIVE_LEVEL;
 assert.equal(game.evolvable(),swatter);
 game.pickups.push({x:game.player.x,y:game.player.y,id:'chest',fly:false,sp:0,age:0});
 game.update(1/30);
 assert.equal(game.modal,'chest');
 assert.equal(game.weapons[0].id,'ghostSwatter');
 assert.ok(game.chestRewards.some(r=>r.kind==='evolve'&&r.id==='ghostSwatter'));
});

test('shops heal and power up for coins, then rest',()=>{
 const game=new Game({char:'farmer',rng:seeded(11)});
 const shop=SHOPS.manoa;game.player.x=shop.x;game.player.y=shop.y;game.coins=100;game.player.hp=10;
 game.update(1/30);
 assert.equal(game.modal,'shop');assert.equal(game.openShop,'manoa');
 assert.ok(game.buy('manoa','soup'));assert.equal(game.player.hp,game.stats.maxHp);
 assert.equal(game.buy('manoa','soup'),null,'one of each per visit');
 const before=game.stats.maxHp;assert.ok(game.buy('manoa','jam'));assert.equal(game.stats.maxHp,before+20);
 assert.equal(game.coins,30);
 assert.equal(game.buy('manoa','panini'),null,'not enough coins');
 game.leaveShop();
 assert.equal(game.shopOpen('manoa'),false,'the shop rests after a visit');
 game.update(1/30);assert.equal(game.modal,null,'and does not reopen at once');
});
