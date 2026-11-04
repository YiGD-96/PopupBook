/**
 * The game's rules, with no drawing and no DOM, so the tests can play a whole run in Node (tests/game.test.mjs). src/game/render.ts draws
 * this state on a canvas; src/game/Game.tsx shows the choices (level-up, chest, shop) the engine asks for through `events`.
 * Units are world pixels and seconds; y grows downwards.
 */
import { BASE_STATS, BASE_WEAPONS, CHARACTERS, ENEMIES, ENEMY_CAP, EVENTS, MAX_PASSIVES, MAX_WEAPONS, PASSIVES, PASSIVE_IDS, RUN_SECONDS,
 SHOPS, SHOP_IDS, SHOP_RADIUS, SHOP_REST, WAVES, WEAPONS, WEAPON_MAX_LEVEL, EVOLVE_PASSIVE_LEVEL, xpToNext,
 type CharId, type EnemyDef, type EnemyId, type PassiveId, type PickupId, type ShopId, type ShopItem, type ShopItemId, type StatKey,
 type Stats, type WeaponId, type WeaponStats } from './content.ts';

export type Enemy={uid:number;def:EnemyDef;x:number;y:number;hp:number;maxHp:number;r:number;speed:number;dmg:number;
 /** Knockback velocity, decaying. */kx:number;ky:number;/** A flock's or a lunge's own heading. */vx:number;vy:number;
 flash:number;slow:number;/** Until it can hurt the player again. */touch:number;/** Lunge / charge / summon clock. */phase:number;lunging:number;
 face:1|-1;/** Per weapon: the time it can be hit by that weapon again (auras, blades, puddles). */hits:Partial<Record<WeaponId,number>>;
 life:number;dead:boolean};
export type Projectile={kind:'shard'|'burger'|'fry'|'kimbap'|'pot';src:WeaponId;x:number;y:number;vx:number;vy:number;r:number;dmg:number;
 pierce:number;life:number;age:number;kb:number;rot:number;hit:Set<number>;
 /** Kimbap: its heading and launch speed (it slows, turns and comes back). Pot: where it lands, and its puddle. */
 dx:number;dy:number;v0:number;tx:number;ty:number;slow:number;area:number;dur:number;flip:boolean};
export type Puddle={src:WeaponId;x:number;y:number;r:number;life:number;max:number;dmg:number;grow:boolean;follow:boolean};
/** A swatter swing: a fan from the player (x, y) centred on `angle`, `reach` long and ±`spread` radians wide, swept in direction `dir`. */
export type Slash={x:number;y:number;angle:number;reach:number;spread:number;dir:1|-1;life:number;max:number;evolved:boolean;
 src:WeaponId;damage:number;kb:number;/** Insects this swing has already hit. */hit:Set<number>};
/** How long a swing lasts; the sweep takes the first SLASH_SWEEP of it, the rest is the fade. The swing starts a little above the feet. */
/** How often one insect can bite the player. */
const TOUCH_GAP=.6;
export const SLASH_LIFE=.22,SLASH_SWEEP=.6,SLASH_LIFT=6;
/** Where a swing starts sweeping, and where its leading edge is now (radians). The renderer draws exactly this. */
export const slashFrom=(s:Slash)=>s.angle-s.spread*s.dir;
export function slashHead(s:Slash){const u=Math.min(1,(1-s.life/s.max)/SLASH_SWEEP);return slashFrom(s)+2*s.spread*s.dir*(1-(1-u)*(1-u));}
export type Pet={x:number;y:number;target:number;cd:number;face:1|-1;run:number;home:number};
export type Gem={x:number;y:number;v:number;fly:boolean;sp:number};
export type Pickup={x:number;y:number;id:PickupId;fly:boolean;sp:number;age:number};
export type Effect={kind:'pop'|'ring'|'spark'|'flash';x:number;y:number;life:number;max:number;r:number;color:string};
export type DamageText={x:number;y:number;v:number;life:number;crit:boolean};
export type OwnedWeapon={id:WeaponId;level:number;timer:number;/** Turbine: spinning (seconds left) and its angle; swatter: queued swings. */active:number;angle:number;queue:number[];damage:number};
export type OwnedPassive={id:PassiveId;level:number};
export type Choice={kind:'weapon'|'passive'|'heal'|'coins';id:string;name:string;desc:string;level:number;isNew:boolean};
export type ChestReward={kind:'evolve'|'weapon'|'passive'|'coins';id:string;name:string;desc:string;level?:number};
export type RunResult={win:boolean;time:number;level:number;kills:number;coins:number;char:CharId;weapons:{id:WeaponId;level:number;damage:number}[]};
export type Sfx='hit'|'gem'|'hurt'|'level'|'chest'|'coin'|'heal'|'kill'|'boss'|'buy';
export type GameEvents={levelUp:(choices:Choice[])=>void;chest:(rewards:ChestReward[])=>void;shop:(id:ShopId)=>void;end:(result:RunResult)=>void;sfx:(kind:Sfx)=>void};
export type Modal=null|'levelup'|'chest'|'shop'|'end';

const TAU=Math.PI*2;
const CELL=80;

export class Game {
 rng:()=>number;
 events:Partial<GameEvents>;
 char:CharId;
 time=0;
 modal:Modal=null;
 userPaused=false;
 over=false;
 won=false;
 /** The camera's view in world units (set by the renderer; the tests keep the default). */
 view={w:800,h:600};
 player={x:0,y:0,r:14,hp:100,hurt:0,faceX:1 as 1|-1,dirX:1,dirY:0,moving:false,walk:0,revivals:0};
 input={x:0,y:0};
 level=1;xp=0;xpNext=xpToNext(1);pendingLevels=0;
 kills=0;coins=0;coinsTotal=0;
 weapons:OwnedWeapon[]=[];
 passives:OwnedPassive[]=[];
 stats:Stats={...BASE_STATS};
 /** Stat additions that do not change during a run: the character's bonus and the lasting upgrades. */
 private fixed:Partial<Record<StatKey,number>>;
 private bonusHp=0;
 buffs={latte:0,burger:0};
 enemies:Enemy[]=[];
 projectiles:Projectile[]=[];
 puddles:Puddle[]=[];
 slashes:Slash[]=[];
 pets:Pet[]=[];
 gems:Gem[]=[];
 pickups:Pickup[]=[];
 effects:Effect[]=[];
 texts:DamageText[]=[];
 banner={text:'',until:0};
 freeze=0;
 shops:Record<ShopId,{openAt:number;inside:boolean;bought:Set<ShopItemId>;count:Partial<Record<ShopItemId,number>>}>;
 openShop:ShopId|null=null;
 choices:Choice[]=[];
 chestRewards:ChestReward[]=[];
 king:Enemy|null=null;
 /** When the results show after the king falls. */
 winAt=0;
 private uid=1;
 private spawnClock=0;
 private eventIndex=0;
 private grid=new Map<number,Enemy[]>();
 private healBudget=0;
 private baleClock=0;

 constructor(opts:{char:CharId;meta?:Partial<Record<StatKey,number>>;events?:Partial<GameEvents>;rng?:()=>number}){
  this.rng=opts.rng??Math.random;this.events=opts.events??{};this.char=opts.char;
  const c=CHARACTERS[opts.char];this.fixed={};
  for(const [k,v] of Object.entries(opts.meta??{}) as [StatKey,number][])this.fixed[k]=(this.fixed[k]??0)+v;
  for(const [k,v] of Object.entries(c.bonus) as [StatKey,number][])if(k==='maxHp')this.bonusHp+=v;else this.fixed[k]=(this.fixed[k]??0)+v;
  this.shops=Object.fromEntries(SHOP_IDS.map(id=>[id,{openAt:0,inside:false,bought:new Set(),count:{}}])) as Game['shops'];
  this.addWeapon(c.weapon);
  this.recompute();this.player.hp=this.stats.maxHp;this.player.revivals=this.stats.revival;
  for(let i=0;i<6;i++)this.placeBale();
 }

 // ── Stats ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 recompute(){
  const s:Stats={...BASE_STATS};let hpMul=0;
  const add=(k:StatKey,v:number)=>{if(k==='maxHp')hpMul+=v;else s[k]+=v;};
  for(const [k,v] of Object.entries(this.fixed) as [StatKey,number][])add(k,v);
  for(const p of this.passives){const d=PASSIVES[p.id];add(d.stat,d.per*p.level);}
  if(this.buffs.latte>this.time){s.moveSpeed+=.25;s.cooldown-=.15;}
  if(this.buffs.burger>this.time)s.might+=.3;
  s.cooldown=Math.max(.4,s.cooldown);
  const old=this.stats.maxHp;
  s.maxHp=Math.round((BASE_STATS.maxHp+this.bonusHp)*(1+hpMul));
  this.stats=s;
  if(s.maxHp>old&&old>0)this.player.hp+=s.maxHp-old;
  this.player.hp=Math.min(this.player.hp,s.maxHp);
 }
 weaponStats(w:OwnedWeapon):WeaponStats{
  const d=WEAPONS[w.id],out={...d.base};
  for(let i=0;i<w.level-1&&i<d.levels.length;i++)for(const [k,v] of Object.entries(d.levels[i].delta) as [keyof WeaponStats,number][])out[k]+=v;
  const s=this.stats;
  out.damage*=s.might;out.cooldown*=s.cooldown;out.amount+=s.amount;out.area*=s.area;out.speed*=s.speed;out.duration*=s.duration;
  return out;
 }
 hasWeapon(id:WeaponId){return this.weapons.some(w=>w.id===id);}
 addWeapon(id:WeaponId){this.weapons.push({id,level:1,timer:.3,active:0,angle:0,queue:[],damage:0});if(id==='dog'||id==='dogPack')this.syncPets();}

 // ── The loop ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
 update(dt:number){
  if(this.modal||this.userPaused||this.over)return;
  // A frame's timestamp can come slightly before the clock the loop started from: never step backwards.
  dt=Math.min(Math.max(dt,0),1/20);
  this.time+=dt;
  if((this.buffs.latte&&this.buffs.latte<=this.time)||(this.buffs.burger&&this.buffs.burger<=this.time)){
   if(this.buffs.latte<=this.time)this.buffs.latte=0;if(this.buffs.burger<=this.time)this.buffs.burger=0;this.recompute();}
  this.healBudget=Math.min(8,this.healBudget+dt*8);
  this.freeze=Math.max(0,this.freeze-dt);
  this.movePlayer(dt);
  this.spawn(dt);
  this.moveEnemies(dt);
  this.buildGrid();
  this.separate();
  this.fireWeapons(dt);
  this.updateSlashes();
  this.moveProjectiles(dt);
  this.updatePuddles(dt);
  this.updatePets(dt);
  this.touchPlayer(dt);
  this.collect(dt);
  this.visitShops();
  this.age(dt);
  this.cleanup();
  if(this.won&&this.time>=this.winAt){this.vacuum();this.finish(true);return;}
  if(this.won)this.vacuum();
  if(this.player.hp<=0&&!this.won)this.die();
  if(!this.modal&&this.pendingLevels>0)this.offerLevel();
 }

 private movePlayer(dt:number){
  if(!Number.isFinite(this.input.x)||!Number.isFinite(this.input.y))this.input.x=this.input.y=0;
  const p=this.player,len=Math.hypot(this.input.x,this.input.y),k=len>1?1/len:1;
  const ix=this.input.x*k,iy=this.input.y*k;
  p.moving=len>.05;
  if(p.moving){p.dirX=this.input.x/len;p.dirY=this.input.y/len;if(Math.abs(ix)>.1)p.faceX=ix<0?-1:1;p.walk+=dt*8;}
  const speed=150*this.stats.moveSpeed;p.x+=ix*speed*dt;p.y+=iy*speed*dt;
  if(this.stats.recovery>0)this.heal(this.stats.recovery*dt,false);
  p.hurt=Math.max(0,p.hurt-dt);
 }
 heal(amount:number,show=true){const p=this.player,before=p.hp;p.hp=Math.min(this.stats.maxHp,p.hp+amount);if(show&&p.hp>before+1){this.events.sfx?.('heal');this.effects.push({kind:'ring',x:p.x,y:p.y,life:.5,max:.5,r:40,color:'#8fd16a'});}}
 private get viewRadius(){return Math.hypot(this.view.w,this.view.h)/2;}

 // ── Enemies ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 private minuteRow(){return WAVES[Math.min(WAVES.length-1,Math.floor(this.time/60))];}
 private spawn(dt:number){
  if(this.won)return;
  while(this.eventIndex<EVENTS.length&&EVENTS[this.eventIndex].t<=this.time){this.runEvent(this.eventIndex);this.eventIndex++;}
  const row=this.minuteRow();
  let alive=0;for(const e of this.enemies)if(e.def.move!=='static'&&e.def.move!=='flock')alive++;
  this.spawnClock-=dt;
  // Batches keep coming while the field holds fewer than twice the minute's minimum; below the minimum it refills at once.
  if((this.spawnClock<=0&&alive<row.min*2)||alive<row.min){
   this.spawnClock=row.every;
   const n=alive<row.min?Math.min(row.min-alive,row.batch*2):row.batch;
   for(let i=0;i<n&&this.enemies.length<ENEMY_CAP;i++){const [x,y]=this.ringPoint(1.05);this.addEnemy(this.pick(row.mix),x,y);}
  }
  this.baleClock-=dt;
  if(this.baleClock<=0){this.baleClock=4;let bales=0;for(const e of this.enemies)if(e.def.id==='bale')bales++;if(bales<6)this.placeBale();}
 }
 private pick(mix:Partial<Record<EnemyId,number>>):EnemyId{
  let total=0;for(const v of Object.values(mix))total+=v??0;
  let r=this.rng()*total;for(const [id,v] of Object.entries(mix) as [EnemyId,number][]){r-=v;if(r<=0)return id;}
  return 'hopper';
 }
 /** A point just outside the view, a little ahead of where the player is walking. */
 private ringPoint(reach:number,angle?:number):[number,number]{
  const p=this.player;let a=angle??this.rng()*TAU;
  if(angle===undefined&&p.moving&&this.rng()<.5)a=Math.atan2(p.dirY,p.dirX)+(this.rng()-.5)*1.6;
  const d=this.viewRadius*reach;return [p.x+Math.cos(a)*d,p.y+Math.sin(a)*d];
 }
 addEnemy(id:EnemyId,x:number,y:number):Enemy{
  const def=ENEMIES[id],minutes=this.time/60;
  const scale=id==='bale'?1:id==='king'?1+this.level*.02:id==='elite'?1+minutes*.26:1+minutes*.34;
  const e:Enemy={uid:this.uid++,def,x,y,hp:def.hp*scale,maxHp:def.hp*scale,r:def.r,speed:def.speed*(.9+this.rng()*.2),dmg:def.damage*(1+minutes*.05),
   kx:0,ky:0,vx:0,vy:0,flash:0,slow:0,touch:0,phase:def.move==='lunge'?1+this.rng()*2:3,lunging:0,face:x<this.player.x?1:-1,hits:{},life:def.move==='flock'?16:Infinity,dead:false};
  this.enemies.push(e);return e;
 }
 private placeBale(){const p=this.player,a=this.rng()*TAU,d=260+this.rng()*600;this.addEnemy('bale',p.x+Math.cos(a)*d,p.y+Math.sin(a)*d);}
 private runEvent(i:number){
  const ev=EVENTS[i],p=this.player;
  const boost=(e:Enemy)=>{if(!ev.boost)return e;e.hp*=ev.boost;e.maxHp*=ev.boost;e.dmg*=1+(ev.boost-1)*.2;e.r*=1.15;return e;};
  if(ev.banner)this.banner={text:ev.banner,until:this.time+3};
  if(ev.kind==='flock'){
   const a=this.rng()*TAU,[cx,cy]=this.ringPoint(1.1,a),dir=Math.atan2(p.y-cy,p.x-cx),n=ev.count??20;
   for(let k=0;k<n&&this.enemies.length<ENEMY_CAP+40;k++){const e=boost(this.addEnemy(ev.enemy??'swarm',cx+(this.rng()-.5)*160,cy+(this.rng()-.5)*160));e.vx=Math.cos(dir);e.vy=Math.sin(dir);}
  }else if(ev.kind==='ring'){
   const n=ev.count??30;for(let k=0;k<n&&this.enemies.length<ENEMY_CAP+40;k++){const [x,y]=this.ringPoint(.85,k/n*TAU);boost(this.addEnemy(ev.enemy??'hopper',x,y));}
  }else if(ev.kind==='elite'){const [x,y]=this.ringPoint(1.05);this.addEnemy('elite',x,y);}
  else if(ev.kind==='king'){
   for(const e of this.enemies)if(e.def.move==='flock')e.dead=true;
   const [x,y]=this.ringPoint(.9);this.king=this.addEnemy('king',x,y);this.events.sfx?.('boss');
  }
 }
 private moveEnemies(dt:number){
  const p=this.player,frozen=this.freeze>0,far=this.viewRadius*1.7,decay=Math.exp(-9*dt);
  for(const e of this.enemies){
   if(e.dead)continue;
   e.flash=Math.max(0,e.flash-dt);e.slow=Math.max(0,e.slow-dt);e.touch=Math.max(0,e.touch-dt);
   if(e.def.move==='static'){if(Math.abs(e.x-p.x)>far*1.4||Math.abs(e.y-p.y)>far*1.4)e.dead=true;continue;}
   e.life-=dt;if(e.life<=0){e.dead=true;continue;}
   const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
   if(d>far&&e.def.move!=='boss'){
    if(e.def.move==='flock'){e.dead=true;continue;}
    const [x,y]=this.ringPoint(1.02);e.x=x;e.y=y;continue;
   }
   let vx=0,vy=0;
   if(!frozen||e.def.move==='boss'){
    const sp=e.speed*(e.slow>0?.55:1)*(frozen?.3:1);
    if(e.def.move==='flock'){vx=e.vx*sp;vy=e.vy*sp;}
    else if(e.def.move==='lunge'){
     e.phase-=dt;
     if(e.lunging>0){e.lunging-=dt;vx=e.vx*sp*4.8;vy=e.vy*sp*4.8;}
     else{vx=dx/d*sp;vy=dy/d*sp;if(e.phase<=0&&d<320){e.lunging=.28;e.phase=2+this.rng()*1.2;e.vx=dx/d;e.vy=dy/d;}}
    }else if(e.def.move==='boss'){
     e.phase-=dt;
     if(e.lunging>0){e.lunging-=dt;vx=e.vx*sp*3.4;vy=e.vy*sp*3.4;}
     else{vx=dx/d*sp;vy=dy/d*sp;
      if(e.phase<=0){e.phase=4.5;
       if(this.rng()<.5){e.lunging=.9;e.vx=dx/d;e.vy=dy/d;}
       else for(let k=0;k<7&&this.enemies.length<ENEMY_CAP;k++){const a=k/7*TAU;this.addEnemy('hopper',e.x+Math.cos(a)*80,e.y+Math.sin(a)*80);}}}
    }else{vx=dx/d*sp;vy=dy/d*sp;}
   }
   e.x+=(vx+e.kx)*dt;e.y+=(vy+e.ky)*dt;e.kx*=decay;e.ky*=decay;
   const fx=vx||dx;if(Math.abs(fx)>.5)e.face=fx<0?-1:1;
  }
 }
 private key(cx:number,cy:number){return (cx+32768)*65536+(cy+32768);}
 private buildGrid(){
  this.grid.clear();
  for(const e of this.enemies){if(e.dead)continue;const k=this.key(Math.floor(e.x/CELL),Math.floor(e.y/CELL));const c=this.grid.get(k);if(c)c.push(e);else this.grid.set(k,[e]);}
 }
 /** Calls `fn` for every live enemy whose circle meets the circle (x, y, r). */
 forEachNear(x:number,y:number,r:number,fn:(e:Enemy)=>void){
  const reach=r+60,x0=Math.floor((x-reach)/CELL),x1=Math.floor((x+reach)/CELL),y0=Math.floor((y-reach)/CELL),y1=Math.floor((y+reach)/CELL);
  for(let cx=x0;cx<=x1;cx++)for(let cy=y0;cy<=y1;cy++){const c=this.grid.get(this.key(cx,cy));if(!c)continue;
   for(const e of c){if(e.dead)continue;const rr=r+e.r;const dx=e.x-x,dy=e.y-y;if(dx*dx+dy*dy<=rr*rr)fn(e);}}
 }
 /** Enemies push each other apart a little, so a crowd spreads out instead of stacking on one spot. */
 private separate(){
  for(const c of this.grid.values()){
   const n=Math.min(c.length,24);
   for(let i=0;i<n;i++){const a=c[i];if(a.def.move==='static')continue;
    for(let j=i+1;j<n;j++){const b=c[j];if(b.def.move==='static')continue;
     const dx=b.x-a.x,dy=b.y-a.y,rr=a.r+b.r,d2=dx*dx+dy*dy;
     if(d2<rr*rr&&d2>.01){const d=Math.sqrt(d2),push=(rr-d)*.25/d;
      const wa=a.def.knockRes>=1?0:1,wb=b.def.knockRes>=1?0:1;a.x-=dx*push*wa;a.y-=dy*push*wa;b.x+=dx*push*wb;b.y+=dy*push*wb;}}}
  }
 }
 nearestEnemy(x:number,y:number,maxD=Infinity,skip?:Set<number>):Enemy|null{
  let best:Enemy|null=null,bd=maxD*maxD;
  for(const e of this.enemies){if(e.dead||e.def.move==='static'||skip?.has(e.uid))continue;const dx=e.x-x,dy=e.y-y,d=dx*dx+dy*dy;if(d<bd){bd=d;best=e;}}
  return best;
 }
 /** Deals damage from weapon `src`; returns whether it killed. */
 hit(e:Enemy,dmg:number,src:WeaponId,kb:number,fromX:number,fromY:number,crit=false):boolean{
  if(e.dead)return false;
  e.hp-=dmg;e.flash=.12;
  const w=this.weapons.find(w=>w.id===src);if(w)w.damage+=Math.min(dmg,e.hp+dmg);
  if(kb>0&&e.def.knockRes<1){const dx=e.x-fromX,dy=e.y-fromY,d=Math.hypot(dx,dy)||1,f=240*kb*(1-e.def.knockRes);e.kx+=dx/d*f;e.ky+=dy/d*f;}
  if(e.def.move!=='static'&&this.texts.length<70)this.texts.push({x:e.x+(this.rng()-.5)*10,y:e.y-e.r,v:Math.round(dmg),life:.6,crit});
  if(src==='ghostSwatter'||src==='moonLantern'){const amount=Math.min(this.healBudget,src==='ghostSwatter'?1:.4);if(amount>0){this.healBudget-=amount;this.heal(amount,false);}}
  if(e.hp<=0){this.kill(e);return true;}
  this.events.sfx?.('hit');return false;
 }
 private kill(e:Enemy){
  e.dead=true;
  const id=e.def.id;
  if(id==='bale'){this.dropFromBale(e.x,e.y);this.effects.push({kind:'pop',x:e.x,y:e.y,life:.35,max:.35,r:26,color:'#e8c66a'});return;}
  this.kills++;this.events.sfx?.('kill');
  this.effects.push({kind:'pop',x:e.x,y:e.y,life:.3,max:.3,r:e.r*1.2,color:'#9fc25a'});
  if(e.def.xp>0)this.gems.push({x:e.x,y:e.y,v:e.def.xp,fly:false,sp:0});
  if(this.rng()<.045*this.stats.luck)this.pickups.push({x:e.x+8,y:e.y,id:'coin',fly:false,sp:0,age:0});
  if(id==='elite'){this.pickups.push({x:e.x,y:e.y,id:'chest',fly:false,sp:0,age:0});this.effects.push({kind:'ring',x:e.x,y:e.y,life:.8,max:.8,r:90,color:'#ffd36b'});}
  if(id==='king'){this.king=null;this.win(e.x,e.y);}
  if(this.gems.length>350){const merged=this.gems.splice(0,80);const total=merged.reduce((s,g)=>s+g.v,0);this.gems.push({x:merged[0].x,y:merged[0].y,v:total,fly:false,sp:0});}
 }
 private dropFromBale(x:number,y:number){
  const r=this.rng();const id:PickupId=r<.34?'juice':r<.56?'coin':r<.7?'bag':r<.81?'gust':r<.91?'frost':'torch';
  this.pickups.push({x,y,id,fly:false,sp:0,age:0});
 }

 // ── Weapons ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 private fireWeapons(dt:number){
  const p=this.player;
  for(const w of this.weapons){
   const s=this.weaponStats(w);
   switch(w.id){
    case 'swatter':case 'ghostSwatter':{
     w.timer-=dt;
     if(w.timer<=0){w.timer=s.cooldown;w.queue=[];for(let i=0;i<s.amount;i++)w.queue.push(i*.12);}
     for(let i=w.queue.length-1;i>=0;i--){w.queue[i]-=dt;if(w.queue[i]<=0){const n=w.queue.length;w.queue.splice(i,1);this.swing(w,s,n);}}
     break;}
    case 'rape':case 'blizzardRape':{
     w.timer-=dt;if(w.timer>0)break;w.timer=s.cooldown;
     const used=new Set<number>();
     for(let i=0;i<s.amount;i++){
      const t=this.nearestEnemy(p.x,p.y,700,used)??this.nearestEnemy(p.x,p.y,700);
      const a=t?Math.atan2(t.y-p.y,t.x-p.x):Math.atan2(p.dirY,p.dirX)+(i-(s.amount-1)/2)*.2;if(t)used.add(t.uid);
      const sp=400*s.speed,spread=w.id==='blizzardRape'?(this.rng()-.5)*.25:0;
      this.shoot('shard',w.id,p.x,p.y-8,Math.cos(a+spread)*sp,Math.sin(a+spread)*sp,6*s.area,s,w.id==='blizzardRape'?1.2:0);
     }
     break;}
    case 'lantern':case 'moonLantern':{
     const r=58*s.area;
     this.forEachNear(p.x,p.y,r,e=>{const until=e.hits[w.id]??0;if(until>this.time)return;e.hits[w.id]=this.time+s.cooldown;this.hit(e,s.damage,w.id,s.knockback,p.x,p.y);});
     break;}
    case 'turbine':case 'windFarm':{
     const permanent=w.id==='windFarm';
     if(w.active>0||permanent){
      w.active-=dt;w.angle+=dt*3.2*s.speed;
      const radius=74*s.area,blade=15*s.area;
      for(let i=0;i<s.amount;i++){const a=w.angle+i/s.amount*TAU,bx=p.x+Math.cos(a)*radius,by=p.y+Math.sin(a)*radius;
       this.forEachNear(bx,by,blade,e=>{const until=e.hits[w.id]??0;if(until>this.time)return;e.hits[w.id]=this.time+.45;this.hit(e,s.damage,w.id,s.knockback,p.x,p.y);});}
      if(w.active<=0&&!permanent)w.timer=s.cooldown;
     }else{w.timer-=dt;if(w.timer<=0)w.active=s.duration;}
     break;}
    case 'burger':case 'burgerSet':{
     w.timer-=dt;if(w.timer>0)break;w.timer=s.cooldown;
     for(let i=0;i<s.amount;i++){const vx=(this.rng()*2-1)*110+(i-(s.amount-1)/2)*60,vy=-(430+this.rng()*120)*s.speed;
      this.shoot('burger',w.id,p.x,p.y-10,vx,vy,14*s.area,s,0);}
     break;}
    case 'soup':case 'manoaSoup':{
     w.timer-=dt;if(w.timer>0)break;w.timer=s.cooldown;
     for(let i=0;i<s.amount;i++){
      const t=this.enemies.length?this.enemies[Math.floor(this.rng()*this.enemies.length)]:null;
      const ok=t&&!t.dead&&Math.hypot(t.x-p.x,t.y-p.y)<this.viewRadius*.8;
      const a=this.rng()*TAU,d=80+this.rng()*160;
      const tx=ok?t!.x:p.x+Math.cos(a)*d,ty=ok?t!.y:p.y+Math.sin(a)*d;
      const pr=this.shoot('pot',w.id,p.x,p.y-10,0,0,10,s,0);pr.tx=tx;pr.ty=ty;pr.life=.42;pr.area=s.area;pr.dur=s.duration;
     }
     break;}
    case 'kimbap':case 'kimbapStorm':{
     w.timer-=dt;if(w.timer>0)break;w.timer=s.cooldown;
     const t=this.nearestEnemy(p.x,p.y,600);
     const base=t?Math.atan2(t.y-p.y,t.x-p.x):Math.atan2(p.dirY,p.dirX);
     for(let i=0;i<s.amount;i++){
      const a=w.id==='kimbapStorm'?base+i/s.amount*TAU:base+(i-(s.amount-1)/2)*.35;
      const pr=this.shoot('kimbap',w.id,p.x,p.y-6,0,0,13*s.area,s,0);pr.dx=Math.cos(a);pr.dy=Math.sin(a);pr.v0=430*s.speed;pr.dur=s.duration;pr.life=s.duration*1.5;
     }
     break;}
    case 'dog':case 'dogPack':break;
   }
  }
 }
 private swing(w:OwnedWeapon,s:WeaponStats,left:number){
  const p=this.player,evolved=w.id==='ghostSwatter',index=s.amount-left;
  // Aimed: the first swing goes toward the nearest insect (or the way the player walks), the next one the opposite way, and any further
  // ones fan out between them. The hits happen as the swing sweeps (updateSlashes), so what the drawn swing passes over is what it hits.
  const near=this.nearestEnemy(p.x,p.y,260),aim=near?Math.atan2(near.y-p.y,near.x-p.x):Math.atan2(p.dirY,p.dirX);
  const angle=aim+(index%2?Math.PI:0)+Math.floor(index/2)*.9;
  this.slashes.push({x:p.x,y:p.y-SLASH_LIFT,angle,reach:138*s.area,spread:.55,dir:index%2?-1:1,life:SLASH_LIFE,max:SLASH_LIFE,evolved,
   src:w.id,damage:s.damage,kb:s.knockback,hit:new Set()});
 }
 /** Each swing follows the player and hits every insect its sweep has passed over so far (once each): the fan from `slashFrom` to `slashHead`,
  *  out to `reach`. */
 private updateSlashes(){
  const p=this.player;
  for(const s of this.slashes){
   s.x=p.x;s.y=p.y-SLASH_LIFT;
   const from=slashFrom(s),swept=Math.abs(slashHead(s)-from);
   this.forEachNear(s.x,s.y,s.reach,e=>{
    if(s.hit.has(e.uid))return;
    const dx=e.x-s.x,dy=e.y-s.y,d=Math.hypot(dx,dy)||1,tol=Math.min(.6,e.r/d);
    let a=(Math.atan2(dy,dx)-from)*s.dir;a=Math.atan2(Math.sin(a),Math.cos(a));
    if(a<-tol||a>swept+tol)return;
    s.hit.add(e.uid);
    const crit=s.evolved&&this.rng()<.2*this.stats.luck;
    this.hit(e,s.damage*(crit?2:1),s.src,s.kb,s.x,s.y,crit);
   });
  }
 }



 private shoot(kind:Projectile['kind'],src:WeaponId,x:number,y:number,vx:number,vy:number,r:number,s:WeaponStats,slow:number):Projectile{
  const pr:Projectile={kind,src,x,y,vx,vy,r,dmg:s.damage,pierce:s.pierce,life:kind==='shard'?s.duration:kind==='burger'?s.duration:1,age:0,kb:s.knockback,
   rot:this.rng()*TAU,hit:new Set(),dx:0,dy:0,v0:0,tx:0,ty:0,slow,area:s.area,dur:s.duration,flip:false};
  this.projectiles.push(pr);return pr;
 }
 private moveProjectiles(dt:number){
  const p=this.player;
  for(const pr of this.projectiles){
   pr.age+=dt;pr.life-=dt;
   if(pr.kind==='pot'){
    const t=Math.min(1,pr.age/.42);pr.x=pr.x+(pr.tx-pr.x)*Math.min(1,dt*10);pr.y=pr.y+(pr.ty-pr.y)*Math.min(1,dt*10)-Math.sin(t*Math.PI)*3;pr.rot+=dt*8;
    if(pr.life<=0){const evolved=pr.src==='manoaSoup';
     this.puddles.push({src:pr.src,x:pr.tx,y:pr.ty,r:46*pr.area,life:pr.dur,max:pr.dur,dmg:pr.dmg,grow:evolved,follow:evolved});}
    continue;
   }
   if(pr.kind==='kimbap'){
    const k=1-2*pr.age/pr.dur,sp=pr.v0*k;
    if(k<0&&!pr.flip){pr.flip=true;pr.hit.clear();}
    pr.x+=pr.dx*sp*dt;pr.y+=pr.dy*sp*dt;pr.rot+=dt*14;
   }else{
    if(pr.kind==='burger')pr.vy+=900*dt;
    pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.rot+=dt*(pr.kind==='burger'?9:0);
    if(pr.kind==='burger'&&pr.src==='burgerSet'&&!pr.flip&&pr.vy>0&&pr.y>p.y+60){pr.flip=true;this.burstFries(pr);}
   }
   this.forEachNear(pr.x,pr.y,pr.r,e=>{
    if(pr.life<=0||pr.hit.has(e.uid))return;
    pr.hit.add(e.uid);
    if(pr.slow)e.slow=pr.slow;
    this.hit(e,pr.dmg,pr.src,pr.kb,pr.x-pr.vx*.01-pr.dx,pr.y-pr.vy*.01-pr.dy);
    if(pr.kind==='burger'&&pr.src==='burgerSet'&&pr.hit.size===1)this.burstFries(pr);
    pr.pierce--;if(pr.pierce<=0)pr.life=0;
   });
  }
 }
 private burstFries(pr:Projectile){
  for(let i=0;i<6;i++){const a=i/6*TAU+this.rng()*.3,sp=320;
   const f:Projectile={...pr,kind:'fry',x:pr.x,y:pr.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:7,dmg:pr.dmg*.4,pierce:1,life:.55,age:0,rot:a,hit:new Set(),flip:true};
   this.projectiles.push(f);}
 }
 private updatePuddles(dt:number){
  const p=this.player;
  for(const u of this.puddles){
   u.life-=dt;
   if(u.grow)u.r+=dt*10;
   if(u.follow){const dx=p.x-u.x,dy=p.y-u.y,d=Math.hypot(dx,dy)||1;if(d>40){u.x+=dx/d*60*dt;u.y+=dy/d*60*dt;}}
   this.forEachNear(u.x,u.y,u.r,e=>{const until=e.hits[u.src]??0;if(until>this.time)return;e.hits[u.src]=this.time+.45;this.hit(e,u.dmg,u.src,0,u.x,u.y);});
  }
 }
 private syncPets(){
  const w=this.weapons.find(w=>w.id==='dog'||w.id==='dogPack');
  const n=w?this.weaponStats(w).amount:0;
  while(this.pets.length<n){const i=this.pets.length;this.pets.push({x:this.player.x-20,y:this.player.y+10,target:0,cd:0,face:1,run:0,home:i});}
  this.pets.length=Math.min(this.pets.length,n);
 }
 private updatePets(dt:number){
  const w=this.weapons.find(w=>w.id==='dog'||w.id==='dogPack');if(!w)return;
  const s=this.weaponStats(w);if(this.pets.length!==s.amount)this.syncPets();
  const p=this.player;
  this.pets.forEach((d,i)=>{
   d.cd=Math.max(0,d.cd-dt);
   let t=d.target?this.enemies.find(e=>e.uid===d.target&&!e.dead)??null:null;
   if(t&&Math.hypot(t.x-p.x,t.y-p.y)>380)t=null;
   if(!t&&d.cd<=0){t=this.nearestEnemy(d.x,d.y,320);d.target=t?.uid??0;}
   let tx:number,ty:number,sp=260*s.speed;
   if(t){tx=t.x;ty=t.y;}else{const a=this.time*.8+i/Math.max(1,this.pets.length)*TAU;tx=p.x+Math.cos(a)*40;ty=p.y+18+Math.sin(a)*14;sp=Math.max(160,Math.hypot(tx-d.x,ty-d.y)*4);}
   const dx=tx-d.x,dy=ty-d.y,dist=Math.hypot(dx,dy);
   if(dist>2){const step=Math.min(dist,sp*dt);d.x+=dx/dist*step;d.y+=dy/dist*step;d.run+=dt*12;if(Math.abs(dx)>1)d.face=dx<0?-1:1;}
   if(t&&dist<t.r+14&&d.cd<=0){this.hit(t,s.damage,w.id,s.knockback,d.x,d.y);d.cd=s.cooldown;if(t.dead)d.target=0;}
  });
 }
 private touchPlayer(_dt:number){
  if(this.freeze>0&&!this.king)return;
  const p=this.player;
  // Every insect touching the player bites on its own, each at most every TOUCH_GAP seconds, so a crowd hurts more than one insect.
  // p.hurt is only the blink.
  this.forEachNear(p.x,p.y,p.r,e=>{
   if(e.touch>0||e.def.move==='static')return;
   if(this.freeze>0&&e.def.move!=='boss')return;
   e.touch=TOUCH_GAP;
   const dmg=Math.max(1,e.dmg-this.stats.armor);p.hp-=dmg;p.hurt=.3;this.events.sfx?.('hurt');
  });
 }

 // ── Things on the ground ───────────────────────────────────────────────────────────────────────────────────────────────────
 private collect(dt:number){
  const p=this.player,magnet=64*this.stats.magnet;
  for(const g of this.gems){
   const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy);
   if(!g.fly&&d<magnet)g.fly=true;
   if(g.fly){g.sp=Math.min(900,g.sp+1400*dt);const step=Math.min(d,(g.sp+120)*dt);g.x+=dx/(d||1)*step;g.y+=dy/(d||1)*step;}
   if(d<18){g.v=-g.v;this.gainXp(-g.v);this.events.sfx?.('gem');}
  }
  for(const k of this.pickups){
   k.age+=dt;
   const dx=p.x-k.x,dy=p.y-k.y,d=Math.hypot(dx,dy);
   if(((k.id==='coin'||k.id==='bag')&&d<magnet)||(k.id==='chest'&&d<magnet*1.6))k.fly=true;
   if(k.fly){k.sp=Math.min(800,k.sp+1200*dt);const step=Math.min(d,(k.sp+100)*dt);k.x+=dx/(d||1)*step;k.y+=dy/(d||1)*step;}
   if(d<22){this.take(k.id);k.age=-1;}
  }
 }
 gainXp(v:number){
  this.xp+=v*this.stats.growth;
  while(this.xp>=this.xpNext){this.xp-=this.xpNext;this.level++;this.xpNext=xpToNext(this.level);this.pendingLevels++;}
 }
 private take(id:PickupId){
  const p=this.player;
  switch(id){
   case 'juice':this.heal(30);break;
   case 'coin':this.addCoins(1);break;
   case 'bag':this.addCoins(10);break;
   case 'gust':this.vacuum();break;
   case 'frost':this.freeze=6;this.effects.push({kind:'flash',x:p.x,y:p.y,life:.5,max:.5,r:0,color:'#bfe6ff'});break;
   case 'torch':this.clearScreen();break;
   case 'chest':this.openChest();break;
  }
 }
 addCoins(n:number){const v=Math.round(n*this.stats.greed);this.coins+=v;this.coinsTotal+=v;this.events.sfx?.('coin');}
 vacuum(){for(const g of this.gems)g.fly=true;for(const k of this.pickups)if(k.id==='coin'||k.id==='bag')k.fly=true;}
 clearScreen(){
  const p=this.player,hw=this.view.w/2+40,hh=this.view.h/2+40;
  this.effects.push({kind:'flash',x:p.x,y:p.y,life:.6,max:.6,r:0,color:'#fff1c2'});
  for(const e of this.enemies){if(e.dead||e.def.move==='static'||Math.abs(e.x-p.x)>hw||Math.abs(e.y-p.y)>hh)continue;
   if(e.def.id==='elite'||e.def.id==='king')this.hit(e,e.maxHp*.2,'lantern',0,p.x,p.y);else this.kill(e);}
 }

 // ── Level-ups, chests and shops ────────────────────────────────────────────────────────────────────────────────────────────
 /** The level-up choices: a level more of what the player has, or something new while slots are free. */
 makeChoices():Choice[]{
  const pool:{c:Choice;w:number}[]=[];
  for(const w of this.weapons){const d=WEAPONS[w.id];if(d.evolved||w.level>=WEAPON_MAX_LEVEL)continue;
   pool.push({w:1.4,c:{kind:'weapon',id:w.id,name:d.name,desc:d.levels[w.level-1].text,level:w.level+1,isNew:false}});}
  for(const p of this.passives){const d=PASSIVES[p.id];if(p.level>=d.max)continue;
   pool.push({w:1.2,c:{kind:'passive',id:p.id,name:d.name,desc:d.desc,level:p.level+1,isNew:false}});}
  if(this.weapons.length<MAX_WEAPONS)for(const id of BASE_WEAPONS){
   if(this.hasWeapon(id))continue;const evo=WEAPONS[id].evolve?.into;if(evo&&this.hasWeapon(evo))continue;
   pool.push({w:1,c:{kind:'weapon',id,name:WEAPONS[id].name,desc:WEAPONS[id].desc,level:1,isNew:true}});}
  if(this.passives.length<MAX_PASSIVES)for(const id of PASSIVE_IDS){
   if(this.passives.some(p=>p.id===id))continue;
   pool.push({w:.9,c:{kind:'passive',id,name:PASSIVES[id].name,desc:PASSIVES[id].desc,level:1,isNew:true}});}
  const count=this.rng()<Math.min(.6,.05+(this.stats.luck-1)*1.5)?4:3;
  const out:Choice[]=[];
  while(out.length<count&&pool.length){
   let total=0;for(const o of pool)total+=o.w;let r=this.rng()*total,i=0;
   for(;i<pool.length-1;i++){r-=pool[i].w;if(r<=0)break;}
   out.push(pool[i].c);pool.splice(i,1);
  }
  if(!out.length)out.push({kind:'heal',id:'heal',name:'당근 한 입',desc:'체력 30 회복',level:0,isNew:false},{kind:'coins',id:'coins',name:'당근 코인',desc:'코인 25',level:0,isNew:false});
  return out;
 }
 private offerLevel(){this.choices=this.makeChoices();this.modal='levelup';this.events.sfx?.('level');this.events.levelUp?.(this.choices);}
 choose(i:number){
  const c=this.choices[i];if(this.modal!=='levelup'||!c)return;
  this.apply(c.kind,c.id);
  this.pendingLevels=Math.max(0,this.pendingLevels-1);this.modal=null;this.choices=[];
  if(this.pendingLevels>0)this.offerLevel();
 }
 private apply(kind:Choice['kind'],id:string){
  if(kind==='weapon'){const w=this.weapons.find(w=>w.id===id);if(w)w.level=Math.min(WEAPON_MAX_LEVEL,w.level+1);else this.addWeapon(id as WeaponId);if(id==='dog')this.syncPets();}
  else if(kind==='passive'){const p=this.passives.find(p=>p.id===id);if(p)p.level++;else this.passives.push({id:id as PassiveId,level:1});this.recompute();}
  else if(kind==='heal')this.heal(30);
  else if(kind==='coins')this.addCoins(25);
 }
 /** A weapon at its last level whose paired passive the player has. */
 evolvable():OwnedWeapon|null{
  return this.weapons.find(w=>{const e=WEAPONS[w.id].evolve;return e&&w.level>=WEAPON_MAX_LEVEL&&this.passives.some(p=>p.id===e.with&&p.level>=EVOLVE_PASSIVE_LEVEL);})??null;
 }
 evolve(w:OwnedWeapon):ChestReward{
  const into=WEAPONS[w.id].evolve!.into;w.id=into;w.level=1;w.timer=.2;w.active=0;w.queue=[];
  if(into==='dogPack')this.syncPets();
  this.effects.push({kind:'ring',x:this.player.x,y:this.player.y,life:1,max:1,r:120,color:'#ffd36b'});
  return {kind:'evolve',id:into,name:WEAPONS[into].name,desc:WEAPONS[into].desc};
 }
 /** Up to `n` levels of things the player already has. */
 private levelOwned(n:number):ChestReward[]{
  const out:ChestReward[]=[];
  for(let k=0;k<n;k++){
   const opts=[...this.weapons.filter(w=>!WEAPONS[w.id].evolved&&w.level<WEAPON_MAX_LEVEL).map(w=>({kind:'weapon' as const,id:w.id})),
    ...this.passives.filter(p=>p.level<PASSIVES[p.id].max).map(p=>({kind:'passive' as const,id:p.id}))];
   if(!opts.length)break;
   const o=opts[Math.floor(this.rng()*opts.length)];this.apply(o.kind,o.id);
   if(o.kind==='weapon'){const w=this.weapons.find(w=>w.id===o.id)!;out.push({kind:'weapon',id:o.id,name:WEAPONS[o.id].name,desc:`레벨 ${w.level}`,level:w.level});}
   else{const p=this.passives.find(p=>p.id===o.id)!;out.push({kind:'passive',id:o.id,name:PASSIVES[o.id].name,desc:`레벨 ${p.level}`,level:p.level});}
  }
  return out;
 }
 private openChest(){
  const rewards:ChestReward[]=[];
  const evo=this.evolvable();
  if(evo)rewards.push(this.evolve(evo));
  else rewards.push(...this.levelOwned(this.rng()<.12*this.stats.luck?3:1));
  const coins=10+Math.floor(this.rng()*16);this.addCoins(coins);rewards.push({kind:'coins',id:'coins',name:'당근 코인',desc:`+${Math.round(coins*this.stats.greed)}`});
  this.chestRewards=rewards;this.modal='chest';this.events.sfx?.('chest');this.events.chest?.(rewards);
 }
 closeChest(){if(this.modal!=='chest')return;this.modal=null;this.chestRewards=[];}
 private visitShops(){
  const p=this.player;
  for(const id of SHOP_IDS){const s=SHOPS[id],st=this.shops[id];
   const inside=Math.hypot(p.x-s.x,p.y-s.y)<SHOP_RADIUS;
   if(inside&&!st.inside&&st.openAt<=this.time&&!this.modal){this.openShop=id;st.bought.clear();this.modal='shop';this.events.shop?.(id);}
   st.inside=inside;}
 }
 shopOpen(id:ShopId){return this.shops[id].openAt<=this.time;}
 price(id:ShopId,item:ShopItem){return Math.round(item.price*Math.pow(1.3,this.shops[id].count[item.id]??0));}
 /** Why an item can't be bought now, or null. */
 cannotBuy(id:ShopId,item:ShopItem):string|null{
  const st=this.shops[id];
  if(st.bought.has(item.id))return '이번 방문에 샀어요';
  if(this.coins<this.price(id,item))return '코인이 모자라요';
  if(item.id==='special'&&!this.evolvable()&&!this.weapons.some(w=>!WEAPONS[w.id].evolved&&w.level<WEAPON_MAX_LEVEL))return '강화할 무기가 없어요';
  if(item.id==='panini'&&!this.makeChoicesAvailable())return '더 배울 것이 없어요';
  return null;
 }
 private makeChoicesAvailable(){return this.weapons.some(w=>!WEAPONS[w.id].evolved&&w.level<WEAPON_MAX_LEVEL)||this.passives.some(p=>p.level<PASSIVES[p.id].max)||this.weapons.length<MAX_WEAPONS||this.passives.length<MAX_PASSIVES;}
 /** Buys; returns what happened, for the shop's receipt line. */
 buy(id:ShopId,itemId:ShopItemId):string|null{
  const item=SHOPS[id].items.find(i=>i.id===itemId);if(!item||this.modal!=='shop'||this.cannotBuy(id,item))return null;
  const st=this.shops[id];this.coins-=this.price(id,item);st.bought.add(itemId);st.count[itemId]=(st.count[itemId]??0)+1;this.events.sfx?.('buy');
  const max=this.stats.maxHp;
  switch(itemId){
   case 'juice':this.heal(max*.4);return '체력을 채웠어요';
   case 'latte':this.buffs.latte=this.time+60;this.recompute();return '60초 동안 발걸음이 가벼워요';
   case 'sorbet':this.freeze=8;return '메뚜기들이 꽁꽁 얼었어요';
   case 'soup':this.heal(max);return '체력을 모두 채웠어요';
   case 'jam':this.bonusHp+=20;this.recompute();return '최대 체력 +20';
   case 'panini':this.pendingLevels++;return '가게를 나서면 레벨 업!';
   case 'burger':this.heal(max*.5);this.buffs.burger=this.time+60;this.recompute();return '60초 동안 힘이 솟아요';
   case 'fries':this.vacuum();return '당근이 모두 날아와요';
   case 'special':{const evo=this.evolvable();if(evo){const name=this.evolve(evo).name,code=name.charCodeAt(name.length-1)-0xac00,last=code>=0&&code<11172?code%28:0;return `${name}${last&&last!==8?'으로':'로'} 진화!`;}
    const w=this.weapons.filter(w=>!WEAPONS[w.id].evolved&&w.level<WEAPON_MAX_LEVEL);const pick=w[Math.floor(this.rng()*w.length)];
    pick.level=Math.min(WEAPON_MAX_LEVEL,pick.level+2);return `${WEAPONS[pick.id].name} 레벨 ${pick.level}`;}
  }
  return null;
 }
 leaveShop(){if(this.modal!=='shop'||!this.openShop)return;this.shops[this.openShop].openAt=this.time+SHOP_REST;this.openShop=null;this.modal=null;}

 // ── Endings ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 private die(){
  const p=this.player;
  if(p.revivals>0){p.revivals--;p.hp=this.stats.maxHp*.5;this.clearScreen();this.banner={text:'다시 일어섰다!',until:this.time+2.5};return;}
  this.finish(false);
 }
 /** The king is down: every other insect pops, a shower of glowing coins bursts from where he fell and flies to the player, and the results
  *  follow a moment later (update). */
 private win(x:number,y:number){
  this.won=true;this.winAt=this.time+2.6;this.banner={text:'메뚜기 대왕을 물리쳤다!',until:this.time+3};
  for(const e of this.enemies)if(!e.dead&&e.def.move!=='static'){e.dead=true;this.effects.push({kind:'pop',x:e.x,y:e.y,life:.4,max:.4,r:e.r*1.2,color:'#ffd36b'});}
  for(let k=0;k<24;k++){const a=k/24*TAU,d=30+this.rng()*90;this.pickups.push({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,id:k%6?'coin':'bag',fly:false,sp:0,age:0});}
  this.effects.push({kind:'ring',x,y,life:1.2,max:1.2,r:220,color:'#ffd36b'},{kind:'flash',x,y,life:.8,max:.8,r:0,color:'#fff1c2'});
  this.events.sfx?.('chest');
 }
 private finish(win:boolean){
  this.over=true;this.modal='end';
  this.events.end?.({win,time:this.time,level:this.level,kills:this.kills,coins:this.coins,char:this.char,
   weapons:this.weapons.map(w=>({id:w.id,level:w.level,damage:Math.round(w.damage)}))});
 }
 private age(dt:number){
  for(const s of this.slashes)s.life-=dt;
  for(const f of this.effects)f.life-=dt;
  for(const t of this.texts){t.life-=dt;t.y-=dt*30;}
 }
 private cleanup(){
  const keep=<T,>(list:T[],ok:(x:T)=>boolean)=>{let j=0;for(let i=0;i<list.length;i++)if(ok(list[i]))list[j++]=list[i];list.length=j;};
  keep(this.enemies,e=>!e.dead);keep(this.projectiles,p=>p.life>0);keep(this.puddles,u=>u.life>0);keep(this.slashes,s=>s.life>0);
  keep(this.gems,g=>g.v>0);keep(this.pickups,k=>k.age>=0);keep(this.effects,f=>f.life>0);keep(this.texts,t=>t.life>0);
 }
 /** Seconds until the king comes (0 once he has). */
 get remaining(){return Math.max(0,RUN_SECONDS-this.time);}
}
