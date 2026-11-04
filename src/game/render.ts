/**
 * Draws a frame of the game (src/game/engine.ts) on the canvas: the field, the shops, everything moving, then the heads-up display in
 * screen space. Only baked pictures (src/game/sprites.ts) and a few plain shapes are drawn per frame.
 */
import { MAX_PASSIVES, MAX_WEAPONS, RUN_SECONDS, SHOPS, SHOP_IDS, SHOP_RADIUS, WEAPONS } from './content.ts';
import { SLASH_SWEEP, slashFrom, slashHead, type Game } from './engine.ts';
import { RES, type Sprites } from './sprites.ts';

export type Stick={active:boolean;ox:number;oy:number;x:number;y:number};
// Do Hyeon for numbers and signs, as in the menus (src/game/game.css); IBM Plex Sans KR for small print.
const FONT='"IBM Plex Sans KR", "Apple SD Gothic Neo", sans-serif',SIGN='"Do Hyeon", "IBM Plex Sans KR", sans-serif';
const TAU=Math.PI*2;
let pattern:CanvasPattern|null=null,patternCtx:CanvasRenderingContext2D|null=null;

/** CSS pixels per world unit: about 500 units across the screen's short side, never so small on a phone that the farmer is lost. */
export function zoomFor(w:number,h:number){return Math.min(1.4,Math.max(.8,Math.min(w,h)/500));}
const clock=(t:number)=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;

export function render(g:Game,x:CanvasRenderingContext2D,sp:Sprites,w:number,h:number,dpr:number,stick:Stick){
 const z=zoomFor(w,h),vw=w/z,vh=h/z;g.view.w=vw;g.view.h=vh;
 const p=g.player,cx=p.x,cy=p.y,left=cx-vw/2,top=cy-vh/2;
 const inView=(ex:number,ey:number,m:number)=>ex>left-m&&ex<left+vw+m&&ey>top-m&&ey<top+vh+m;
 x.setTransform(dpr*z,0,0,dpr*z,dpr*(w/2-cx*z),dpr*(h/2-cy*z));
 x.imageSmoothingEnabled=true;
 if(patternCtx!==x){pattern=x.createPattern(sp.ground,'repeat');patternCtx=x;}
 x.fillStyle=pattern??'#4a3a2e';x.fillRect(left,top,vw,vh);

 // Shops: a ring on the ground where the door is, the painting behind it.
 for(const id of SHOP_IDS){const s=SHOPS[id],img=sp.shops[id];if(!inView(s.x,s.y,260))continue;
  const open=g.shopOpen(id);
  x.fillStyle=open?'rgba(255,214,140,.16)':'rgba(0,0,0,.18)';x.beginPath();x.ellipse(s.x,s.y+10,SHOP_RADIUS,SHOP_RADIUS*.62,0,0,TAU);x.fill();
  x.strokeStyle=open?s.color:'rgba(255,255,255,.25)';x.lineWidth=3;x.setLineDash([10,8]);x.lineDashOffset=-g.time*20;x.stroke();x.setLineDash([]);
  x.drawImage(img.img,s.x-img.w/2,s.y-img.h+20,img.w,img.h);
  const label=open?s.name:`${s.name} · 준비 중 ${Math.ceil(g.shops[id].openAt-g.time)}초`;
  x.font=`17px ${SIGN}`;x.textAlign='center';x.textBaseline='middle';
  const tw=x.measureText(label).width+20;x.fillStyle=open?s.color:'rgba(40,30,24,.88)';x.beginPath();x.roundRect(s.x-tw/2,s.y-img.h+4,tw,26,3);x.fill();
  x.fillStyle='#fff8ec';x.fillText(label,s.x,s.y-img.h+17.5);
 }
 // Soup on the ground, the lantern's light.
 for(const u of g.puddles){x.globalAlpha=Math.min(1,u.life/.4)*.9;x.drawImage(sp.puddle,u.x-u.r,u.y-u.r*.7,u.r*2,u.r*1.4);}x.globalAlpha=1;
 for(const wpn of g.weapons)if(wpn.id==='lantern'||wpn.id==='moonLantern'){const r=58*g.weaponStats(wpn).area,pulse=1+Math.sin(g.time*4)*.03;x.drawImage(sp.glow,p.x-r*pulse,p.y-r*pulse,r*2*pulse,r*2*pulse);}
 // Carrots (experience) and pickups.
 for(const gem of g.gems){if(!inView(gem.x,gem.y,20))continue;const img=sp.gems[gem.v>=20?2:gem.v>=4?1:0],gw=img.width/RES,gh=img.height/RES;x.drawImage(img,gem.x-gw/2,gem.y-gh/2,gw,gh);}
 for(const k of g.pickups){if(!inView(k.x,k.y,30))continue;const s=k.id==='chest'?34:k.id==='coin'?16:24,bob=Math.sin(k.age*4+k.x)*2;
  // A chest shines: a beam of light rising from it, slow rays turning behind it, a pulsing halo.
  if(k.id==='chest'){const pulse=.5+Math.sin(g.time*4)*.5;
   const beam=x.createLinearGradient(0,k.y-180,0,k.y);beam.addColorStop(0,'rgba(255,224,130,0)');beam.addColorStop(1,'rgba(255,224,130,.45)');
   x.fillStyle=beam;x.beginPath();x.moveTo(k.x-16,k.y);x.lineTo(k.x-26,k.y-180);x.lineTo(k.x+26,k.y-180);x.lineTo(k.x+16,k.y);x.fill();
   x.save();x.translate(k.x,k.y);x.rotate(g.time*.6);x.fillStyle=`rgba(255,214,110,${.18+pulse*.12})`;
   for(let r=0;r<8;r++){x.rotate(TAU/8);x.beginPath();x.moveTo(0,0);x.lineTo(-7,-58);x.lineTo(7,-58);x.fill();}x.restore();
   x.drawImage(sp.glow,k.x-40-pulse*6,k.y-40-pulse*6,80+pulse*12,80+pulse*12);}
  // Coins from the fallen king glow too.
  else if(g.won&&(k.id==='coin'||k.id==='bag'))x.drawImage(sp.glow,k.x-18,k.y-18,36,36);
  x.drawImage(sp.icons[k.id],k.x-s/2,k.y-s/2+bob,s,s);}
 // Insects and bales.
 for(const e of g.enemies){if(e.dead||!inView(e.x,e.y,e.r*2))continue;
  const es=sp.enemies[e.def.id],frame=e.def.move==='static'?0:Math.floor(g.time*(e.lunging>0?16:7)+e.uid)%2,set=e.flash>0?es.flash:es.frames,img=set[frame][e.face>0?0:1];
  const hop=e.def.move==='static'?0:Math.abs(Math.sin(g.time*7+e.uid))*(e.lunging>0?6:2);
  // Event insects can be bigger than their kind (engine runEvent `boost`).
  const sc=e.r/e.def.r,ew=es.w*sc,eh=es.h*sc;
  x.drawImage(img,e.x-ew/2,e.y-eh*.58-hop,ew,eh);
  if(e.def.id==='elite'){const bw=40;x.fillStyle='rgba(0,0,0,.45)';x.fillRect(e.x-bw/2,e.y+e.r+4,bw,4);x.fillStyle='#ffcf4a';x.fillRect(e.x-bw/2,e.y+e.r+4,bw*Math.max(0,e.hp/e.maxHp),4);}
 }
 // The dogs, the player.
 for(const d of g.pets){const f=Math.floor(d.run)%2,img=sp.dog.frames[f][d.face>0?0:1];x.drawImage(img,d.x-sp.dog.w/2,d.y-sp.dog.h*.6,sp.dog.w,sp.dog.h);}
 const ch=sp.chars[g.char],bob=p.moving?Math.abs(Math.sin(p.walk))*3:0;
 if(!(p.hurt>0&&Math.floor(p.hurt*30)%2))x.drawImage(p.faceX>0?ch.right:ch.left,p.x-ch.w/2,p.y-ch.h+12-bob,ch.w,ch.h);
 x.fillStyle='rgba(0,0,0,.5)';x.fillRect(p.x-20,p.y+16,40,5);x.fillStyle=p.hp/g.stats.maxHp>.3?'#e2483c':'#ff7a3c';x.fillRect(p.x-20,p.y+16,40*Math.max(0,p.hp/g.stats.maxHp),5);
 // Turbine blades.
 for(const wpn of g.weapons){if(wpn.id!=='turbine'&&wpn.id!=='windFarm')continue;if(wpn.id==='turbine'&&wpn.active<=0)continue;
  const s=g.weaponStats(wpn),radius=74*s.area,img=wpn.id==='windFarm'?sp.windBlade:sp.blade,bw=img.width/RES*s.area,bh=img.height/RES*s.area;
  for(let i=0;i<s.amount;i++){const a=wpn.angle+i/s.amount*TAU,bx=p.x+Math.cos(a)*radius,by=p.y+Math.sin(a)*radius;
   x.save();x.translate(bx,by);x.rotate(wpn.angle*2.2+i);x.drawImage(img,-bw/2,-bh/2,bw,bh);x.restore();}}
 // Projectiles.
 for(const pr of g.projectiles){if(!inView(pr.x,pr.y,30))continue;
  if(pr.kind==='shard'){const a=Math.atan2(pr.vy,pr.vx);x.strokeStyle=pr.src==='blizzardRape'?'#ffd7a8':'#f08a33';x.lineWidth=3.2;x.lineCap='round';
   x.beginPath();x.moveTo(pr.x-Math.cos(a)*12,pr.y-Math.sin(a)*12);x.lineTo(pr.x+Math.cos(a)*6,pr.y+Math.sin(a)*6);x.stroke();
   if(pr.src==='blizzardRape'){x.fillStyle='rgba(225,245,255,.85)';x.beginPath();x.arc(pr.x-Math.cos(a)*16,pr.y-Math.sin(a)*16,2.2,0,TAU);x.fill();}continue;}
  if(pr.kind==='fry'){const a=Math.atan2(pr.vy,pr.vx);x.strokeStyle='#f6c44a';x.lineWidth=4;x.lineCap='round';x.beginPath();x.moveTo(pr.x-Math.cos(a)*7,pr.y-Math.sin(a)*7);x.lineTo(pr.x+Math.cos(a)*7,pr.y+Math.sin(a)*7);x.stroke();continue;}
  const id=pr.kind==='burger'?'burger':pr.kind==='kimbap'?'kimbap':'soup',s=pr.kind==='pot'?26:pr.r*2.4;
  x.save();x.translate(pr.x,pr.y);x.rotate(pr.kind==='pot'?Math.sin(pr.rot)*.4:pr.rot);x.drawImage(sp.icons[id],-s/2,-s/2,s,s);x.restore();
 }
 // Swatter swings: the fan the sweep has covered so far (exactly the area it hits, engine slashHead), lightly filled, with a bright band at
 // the leading edge and a rim along the reach; the swatter rides the leading edge. It fades once the sweep is done.
 for(const s of g.slashes){
  const t=1-s.life/s.max,from=slashFrom(s),head=slashHead(s),R=s.reach,N=16,band=.28*s.dir;
  x.globalAlpha=t<SLASH_SWEEP?1:Math.max(0,1-(t-SLASH_SWEEP)/(1-SLASH_SWEEP));
  const fill=s.evolved?'214,196,255':'255,244,220';
  const fan=(a0:number,a1:number,r0:number)=>{x.beginPath();x.moveTo(s.x+Math.cos(a0)*r0,s.y+Math.sin(a0)*r0);
   for(let k=0;k<=N;k++){const a=a0+(a1-a0)*k/N;x.lineTo(s.x+Math.cos(a)*R,s.y+Math.sin(a)*R);}
   for(let k=N;k>=0;k--){const a=a0+(a1-a0)*k/N;x.lineTo(s.x+Math.cos(a)*r0,s.y+Math.sin(a)*r0);}x.closePath();};
  fan(from,head,14);x.fillStyle=`rgba(${fill},.22)`;x.fill();
  const b0=Math.abs(head-from)>Math.abs(band)?head-band:from;fan(b0,head,R*.45);x.fillStyle=`rgba(${fill},.7)`;x.fill();
  x.beginPath();x.arc(s.x,s.y,R,Math.min(from,head),Math.max(from,head));x.strokeStyle=`rgba(${fill},.85)`;x.lineWidth=2;x.stroke();
  // The swatter icon is drawn tilted 0.5 rad left of upright, head up: turn its head to point outward along the swing.
  const sz=40,hr=R*.84;x.save();x.translate(s.x+Math.cos(head)*hr,s.y+Math.sin(head)*hr);x.rotate(head+Math.PI/2+.5);
  x.drawImage(sp.icons.swatter,-sz/2,-sz/2,sz,sz);x.restore();
 }x.globalAlpha=1;
 // Pops and rings.
 for(const f of g.effects){const t=1-f.life/f.max;if(f.kind==='flash')continue;x.globalAlpha=1-t;x.strokeStyle=f.color;x.lineWidth=f.kind==='ring'?4:3;
  x.beginPath();x.arc(f.x,f.y,f.r*(f.kind==='ring'?t:.4+t*.8),0,TAU);x.stroke();}x.globalAlpha=1;
 // Damage numbers.
 x.font=`15px ${SIGN}`;x.textAlign='center';x.textBaseline='middle';x.lineWidth=3;x.strokeStyle='rgba(40,24,14,.85)';
 for(const t of g.texts){if(!inView(t.x,t.y,20))continue;x.globalAlpha=Math.min(1,t.life*3);x.fillStyle=t.crit?'#ffd24a':'#fff8ec';const s=String(t.v);x.strokeText(s,t.x,t.y);x.fillText(s,t.x,t.y);}x.globalAlpha=1;

 // ── Screen space ──
 x.setTransform(dpr,0,0,dpr,0,0);
 if(g.freeze>0){x.fillStyle=`rgba(170,215,255,${Math.min(.28,g.freeze*.1)})`;x.fillRect(0,0,w,h);}
 for(const f of g.effects)if(f.kind==='flash'){x.globalAlpha=f.life/f.max*.7;x.fillStyle=f.color;x.fillRect(0,0,w,h);}x.globalAlpha=1;
 hud(g,x,sp,w,h,z);
 if(stick.active){x.globalAlpha=.5;x.strokeStyle='#fff4dd';x.lineWidth=3;x.beginPath();x.arc(stick.ox,stick.oy,46,0,TAU);x.stroke();
  x.fillStyle='#fff4dd';x.beginPath();x.arc(stick.x,stick.y,20,0,TAU);x.fill();x.globalAlpha=1;}
}

function hud(g:Game,x:CanvasRenderingContext2D,sp:Sprites,w:number,h:number,z:number){
 const safeTop=0;
 // Experience bar.
 x.fillStyle='rgba(30,18,10,.72)';x.fillRect(0,safeTop,w,14);
 x.fillStyle='#f08a2e';x.fillRect(0,safeTop,w*Math.min(1,g.xp/g.xpNext),14);
 x.font=`13px ${SIGN}`;x.textBaseline='middle';x.textAlign='right';x.fillStyle='#efe6d4';x.fillText(`Lv ${g.level}`,w-8,safeTop+7.5);
 // Clock.
 const remain=g.remaining;
 x.textAlign='center';x.font=`${w<500?24:28}px ${SIGN}`;x.lineWidth=4;x.strokeStyle='rgba(30,18,10,.75)';
 const label=g.king?'메뚜기 대왕':clock(g.time);x.strokeText(label,w/2,safeTop+32);x.fillStyle=remain<30&&!g.king?'#ffcf4a':'#fff8ec';x.fillText(label,w/2,safeTop+32);
 // Kills and coins, left of the pause button.
 x.font=`16px ${SIGN}`;x.textAlign='right';x.fillStyle='#efe6d4';const rx=w-58;
 x.strokeText(String(g.kills),rx,safeTop+30);x.fillText(String(g.kills),rx,safeTop+30);let tw=x.measureText(String(g.kills)).width;x.drawImage(sp.icons.kills,rx-tw-22,safeTop+20,20,20);
 x.strokeText(String(g.coins),rx,safeTop+52);x.fillText(String(g.coins),rx,safeTop+52);tw=x.measureText(String(g.coins)).width;x.drawImage(sp.icons.coin,rx-tw-21,safeTop+43,18,18);
 // What the player carries.
 const size=w<500?24:28;let ix=8;const iy=safeTop+20;
 // Five weapon slots on the first row and five item slots under them; empty slots show as frames, so the player sees how many are left.
 for(let i=0;i<MAX_WEAPONS;i++){const wpn=g.weapons[i];if(wpn)slot(x,sp,wpn.id,ix,iy,size,WEAPONS[wpn.id].evolved?'★':String(wpn.level));else emptySlot(x,ix,iy,size);ix+=size+4;}
 ix=8;for(let i=0;i<MAX_PASSIVES;i++){const p=g.passives[i];if(p)slot(x,sp,p.id,ix,iy+size+4,size,String(p.level));else emptySlot(x,ix,iy+size+4,size);ix+=size+4;}
 // Short buffs.
 let by=iy+size*2+14;x.textAlign='left';x.font=`700 11px ${FONT}`;
 for(const [k,label] of [['latte','당근 라떼'],['burger','캐럿버거']] as const){const left=g.buffs[k]-g.time;if(left>0){x.fillStyle='rgba(33,24,18,.7)';x.beginPath();x.roundRect(8,by,96,18,3);x.fill();x.fillStyle='#ffd7a8';x.fillText(`${label} ${Math.ceil(left)}초`,16,by+9.5);by+=22;}}
 // Arrows to the shops that are open and off screen.
 for(const id of SHOP_IDS){const s=SHOPS[id];if(!g.shopOpen(id))continue;
  const dx=(s.x-g.player.x)*z,dy=(s.y-g.player.y)*z;if(Math.abs(dx)<w/2-20&&Math.abs(dy)<h/2-20)continue;
  const m=46,k=Math.min((w/2-m)/Math.abs(dx||1),(h/2-m-50)/Math.abs(dy||1)),ax=w/2+dx*k,ay=h/2+dy*k+(dy<0?25:0),a=Math.atan2(dy,dx);
  x.save();x.translate(ax,ay);x.fillStyle=s.color;x.beginPath();x.arc(0,0,17,0,TAU);x.fill();x.rotate(a);x.beginPath();x.moveTo(26,0);x.lineTo(15,-8);x.lineTo(15,8);x.closePath();x.fill();x.restore();
  x.fillStyle='#fff8ec';x.font=`12px ${SIGN}`;x.textAlign='center';x.fillText(s.name.slice(0,2),ax,ay-1);
  x.font=`600 9px ${FONT}`;x.fillText(`${Math.round(Math.hypot(s.x-g.player.x,s.y-g.player.y)/10)}m`,ax,ay+27);
 }
 // Golden arrows to chests lying off screen.
 for(const k of g.pickups){if(k.id!=='chest')continue;
  const dx=(k.x-g.player.x)*z,dy=(k.y-g.player.y)*z;if(Math.abs(dx)<w/2-20&&Math.abs(dy)<h/2-20)continue;
  const m=40,s=Math.min((w/2-m)/Math.abs(dx||1),(h/2-m-50)/Math.abs(dy||1)),ax=w/2+dx*s,ay=h/2+dy*s+(dy<0?25:0),a=Math.atan2(dy,dx);
  x.save();x.translate(ax,ay);x.fillStyle=`rgba(255,214,110,${.75+Math.sin(g.time*6)*.25})`;x.beginPath();x.arc(0,0,16,0,TAU);x.fill();
  x.rotate(a);x.beginPath();x.moveTo(25,0);x.lineTo(14,-8);x.lineTo(14,8);x.closePath();x.fill();x.restore();
  x.drawImage(sp.icons.chest,ax-11,ay-11,22,22);}
 // Banner.
 if(g.banner.until>g.time&&g.banner.text){const t=g.banner.until-g.time;x.globalAlpha=Math.min(1,t*2);x.font=`${w<500?19:23}px ${SIGN}`;x.textAlign='center';
  x.fillStyle='rgba(33,24,18,.82)';x.fillRect(0,h*.2,w,40);x.fillStyle='#ef7d2a';x.fillRect(0,h*.2,w,2);x.fillRect(0,h*.2+38,w,2);
  x.fillStyle='#efe6d4';x.fillText(g.banner.text,w/2,h*.2+21,w-24);x.globalAlpha=1;}
 // The king's health.
 if(g.king){const bw=Math.min(w-40,520),bx=(w-bw)/2,byy=h-42;x.fillStyle='rgba(33,24,18,.8)';x.fillRect(bx-4,byy-18,bw+8,34);
  x.fillStyle='#4b2a18';x.fillRect(bx,byy,bw,10);x.fillStyle='#e2483c';x.fillRect(bx,byy,bw*Math.max(0,g.king.hp/g.king.maxHp),10);
  x.fillStyle='#efe6d4';x.font=`14px ${SIGN}`;x.textAlign='center';x.fillText('메뚜기 대왕',w/2,byy-8);}
 else if(g.time>RUN_SECONDS-60){x.font=`700 11px ${FONT}`;x.textAlign='center';x.fillStyle='#ffcf4a';x.fillText(`메뚜기 대왕까지 ${Math.ceil(g.remaining)}초`,w/2,safeTop+52);}
}
function emptySlot(x:CanvasRenderingContext2D,ix:number,iy:number,s:number){
 x.fillStyle='rgba(33,24,18,.35)';x.beginPath();x.roundRect(ix,iy,s,s,3);x.fill();
 x.strokeStyle='rgba(239,230,212,.28)';x.lineWidth=1;x.setLineDash([3,3]);x.beginPath();x.roundRect(ix+.5,iy+.5,s-1,s-1,3);x.stroke();x.setLineDash([]);
}
function slot(x:CanvasRenderingContext2D,sp:Sprites,id:string,ix:number,iy:number,s:number,level:string){
 x.fillStyle='rgba(33,24,18,.6)';x.beginPath();x.roundRect(ix,iy,s,s,3);x.fill();
 const img=sp.icons[id];if(img)x.drawImage(img,ix+2,iy+2,s-4,s-4);
 x.font=`11px ${SIGN}`;x.textAlign='right';x.textBaseline='alphabetic';x.lineWidth=3;x.strokeStyle='rgba(30,18,10,.9)';x.strokeText(level,ix+s-1,iy+s-1);x.fillStyle='#fff8ec';x.fillText(level,ix+s-1,iy+s-1);x.textBaseline='middle';
}
