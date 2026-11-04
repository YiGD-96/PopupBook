/**
 * Every picture the game draws, baked once into small canvases when it starts (drawing a baked canvas is cheap; building paths for
 * hundreds of insects every frame is not). The farmer, the traveler and the three shops are the book's own paintings (public/art-raster),
 * shrunk to the size they are drawn at; the insects, the field and the icons are drawn here in the book's paper-cut style: flat colours with
 * a cream rim.
 */
import { BASE } from '../base.ts';
import type { CharId, EnemyId, ShopId } from './content.ts';

/** The game lives one folder below the book (game/index.html), so a relative base reaches the book's files one level up. */
export const ROOT=BASE.startsWith('.')?'../':BASE;
export const art=(name:string)=>`${ROOT}art-raster/${name}.webp`;
/** Baked pictures are drawn at this many pixels per world unit, so they stay sharp on 2× screens. */
export const RES=2;
const CREAM='#fff4dd';

export type Sprite=HTMLCanvasElement;
export type EnemySprites={/** [frame][0 = facing right, 1 = left] */frames:Sprite[][];flash:Sprite[][];w:number;h:number};
export type Sprites={
 ground:Sprite;enemies:Record<EnemyId,EnemySprites>;chars:Record<CharId,{right:Sprite;left:Sprite;w:number;h:number}>;
 shops:Record<ShopId,{img:Sprite;w:number;h:number}>;dog:{frames:Sprite[][];w:number;h:number};
 gems:Sprite[];glow:Sprite;puddle:Sprite;blade:Sprite;windBlade:Sprite;icons:Record<string,Sprite>;
};

function canvas(w:number,h:number){const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c;}
function ctx2d(c:HTMLCanvasElement){return c.getContext('2d')!;}
/** A copy of `src` with a cream rim `width` px wide around its shape. */
function outlined(src:Sprite,width:number,color=CREAM):Sprite{
 const pad=Math.ceil(width)+1,out=canvas(src.width+pad*2,src.height+pad*2),c=ctx2d(out);
 const tint=canvas(src.width,src.height),t=ctx2d(tint);t.drawImage(src,0,0);t.globalCompositeOperation='source-in';t.fillStyle=color;t.fillRect(0,0,tint.width,tint.height);
 for(let a=0;a<16;a++){const r=a/16*Math.PI*2;c.drawImage(tint,pad+Math.cos(r)*width,pad+Math.sin(r)*width);}
 c.drawImage(src,pad,pad);return out;
}
function flipped(src:Sprite):Sprite{const out=canvas(src.width,src.height),c=ctx2d(out);c.translate(src.width,0);c.scale(-1,1);c.drawImage(src,0,0);return out;}
function flashed(src:Sprite):Sprite{const out=canvas(src.width,src.height),c=ctx2d(out);c.drawImage(src,0,0);c.globalCompositeOperation='source-atop';c.fillStyle='rgba(255,255,255,.82)';c.fillRect(0,0,out.width,out.height);return out;}
function withShadow(src:Sprite,shadowW:number):Sprite{
 const out=canvas(src.width,src.height+6),c=ctx2d(out);
 c.fillStyle='rgba(20,12,8,.32)';c.beginPath();c.ellipse(out.width/2,out.height-7,shadowW/2,shadowW*.16,0,0,Math.PI*2);c.fill();
 c.drawImage(src,0,0);return out;
}
function loadImage(src:string):Promise<HTMLImageElement|null>{
 return new Promise(resolve=>{const img=new Image();img.decoding='async';img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});
}
/** The painting shrunk to `h` world units tall (or a plain stand-in if it failed to load). */
function shrink(img:HTMLImageElement|null,h:number,maxW=Infinity):{img:Sprite;w:number;h:number}{
 if(!img){const c=canvas(h*.6*RES,h*RES),x=ctx2d(c);x.fillStyle='#c8743a';x.fillRect(0,0,c.width,c.height);return {img:c,w:h*.6,h};}
 let w=h*img.naturalWidth/img.naturalHeight;if(w>maxW){h=h*maxW/w;w=maxW;}
 // Halve in steps so the small picture keeps its detail.
 let src:CanvasImageSource=img,sw=img.naturalWidth,sh=img.naturalHeight;
 while(sw/2>w*RES*1.5){const c=canvas(sw/2,sh/2);ctx2d(c).drawImage(src,0,0,c.width,c.height);src=c;sw=c.width;sh=c.height;}
 const c=canvas(w*RES,h*RES),x=ctx2d(c);x.imageSmoothingQuality='high';x.drawImage(src,0,0,c.width,c.height);
 return {img:c,w,h};
}

// ── Insects ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
type BugLook={body:string;dark:string;wing:string;eye?:string;crown?:boolean};
const LOOKS:Record<Exclude<EnemyId,'bale'>,BugLook>={
 hopper:{body:'#86b443',dark:'#4f7a25',wing:'#bcd877'},
 cricket:{body:'#3d2e24',dark:'#1d1510',wing:'#6d5644'},
 swarm:{body:'#cdb240',dark:'#8a7322',wing:'#ecdc8c'},
 locust:{body:'#94703c',dark:'#5c4424',wing:'#cdb07a'},
 stinger:{body:'#d0602a',dark:'#8a3414',wing:'#f2a876',eye:'#2a1208'},
 armored:{body:'#3f4f5c',dark:'#222c34',wing:'#8b9ca8',eye:'#e2b13c'},
 bigCricket:{body:'#2a1f18',dark:'#0f0a07',wing:'#5e4838',eye:'#d8342b'},
 elite:{body:'#5f8a2a',dark:'#33521a',wing:'#a9cf6a',eye:'#d8342b',crown:true},
 king:{body:'#4b6a22',dark:'#2a3f12',wing:'#97bf58',eye:'#e0382c',crown:true},
};
/** A grasshopper seen from the side, facing right, `r` world units in radius; `frame` 0/1 swings its legs. */
function drawBug(look:BugLook,r:number,frame:number):Sprite{
 const s=r*RES,W=s*3,H=s*2.6,c=canvas(W,H),x=ctx2d(c);
 x.translate(W*.47,H*.58);x.lineCap='round';x.lineJoin='round';
 // Far legs, darker.
 x.strokeStyle=look.dark;x.lineWidth=s*.12;
 x.beginPath();x.moveTo(s*.35,s*.15);x.lineTo(s*.5,s*.55);x.moveTo(s*.05,s*.15);x.lineTo(-s*.05,s*.58);x.stroke();
 // The big hind leg: thigh up and back, shin down.
 const kick=frame?.22:0;
 x.fillStyle=look.dark;x.beginPath();x.ellipse(-s*.45,-s*.18-kick*s*.3,s*.62,s*.17,-.5-kick,0,Math.PI*2);x.fill();
 x.strokeStyle=look.dark;x.lineWidth=s*.11;x.beginPath();x.moveTo(-s*.95,-s*.45-kick*s*.6);x.lineTo(-s*(1.05-kick),s*.55);x.stroke();
 // Body and head.
 x.fillStyle=look.body;x.beginPath();x.ellipse(-s*.1,0,s*.95,s*.36,0,0,Math.PI*2);x.fill();
 x.fillStyle=look.dark;x.globalAlpha=.35;x.beginPath();x.ellipse(-s*.25,s*.12,s*.75,s*.12,0,0,Math.PI*2);x.fill();x.globalAlpha=1;
 x.fillStyle=look.wing;x.beginPath();x.ellipse(-s*.3,-s*.16,s*.75,s*.2,-.08,0,Math.PI*2);x.fill();
 x.fillStyle=look.body;x.beginPath();x.ellipse(s*.8,-s*.08,s*.36,s*.32,.3,0,Math.PI*2);x.fill();
 x.fillStyle=look.eye??'#1b120c';x.beginPath();x.arc(s*.9,-s*.16,s*.1,0,Math.PI*2);x.fill();
 x.fillStyle='#fff';x.beginPath();x.arc(s*.93,-s*.19,s*.035,0,Math.PI*2);x.fill();
 // Antennae and near legs.
 x.strokeStyle=look.dark;x.lineWidth=s*.06;x.beginPath();x.moveTo(s*.85,-s*.35);x.quadraticCurveTo(s*1.1,-s*1,s*1.45,-s*1.05);x.moveTo(s*.75,-s*.35);x.quadraticCurveTo(s*.8,-s*1.05,s*1.15,-s*1.2);x.stroke();
 x.lineWidth=s*.11;x.beginPath();x.moveTo(s*.55,s*.15);x.lineTo(s*(.75+(frame?.1:-.05)),s*.6);x.moveTo(s*.2,s*.2);x.lineTo(s*(.15+(frame?-.1:.08)),s*.62);x.stroke();
 if(look.crown){x.fillStyle='#f2c240';x.strokeStyle='#a87412';x.lineWidth=s*.04;x.beginPath();
  x.moveTo(s*.55,-s*.38);x.lineTo(s*.6,-s*.78);x.lineTo(s*.75,-s*.55);x.lineTo(s*.88,-s*.85);x.lineTo(s*.98,-s*.55);x.lineTo(s*1.12,-s*.75);x.lineTo(s*1.08,-s*.32);x.closePath();x.fill();x.stroke();}
 return withShadow(outlined(c,Math.max(2,s*.09)),s*1.8);
}
function drawBale(r:number):Sprite{
 const s=r*RES,c=canvas(s*2.6,s*2.2),x=ctx2d(c);x.translate(c.width/2,c.height/2);
 x.fillStyle='#e0bd5e';x.beginPath();x.roundRect(-s*1.1,-s*.8,s*2.2,s*1.6,s*.35);x.fill();
 x.strokeStyle='#b8933c';x.lineWidth=s*.07;for(let i=-3;i<=3;i++){x.beginPath();x.moveTo(-s*1,i*s*.2);x.quadraticCurveTo(0,i*s*.2+s*.06,s,i*s*.2);x.stroke();}
 x.strokeStyle='#8a5a2b';x.lineWidth=s*.12;x.beginPath();x.moveTo(-s*.45,-s*.8);x.lineTo(-s*.45,s*.8);x.moveTo(s*.45,-s*.8);x.lineTo(s*.45,s*.8);x.stroke();
 return withShadow(outlined(c,Math.max(2,s*.08)),s*2.1);
}
function enemySprites(id:EnemyId,r:number):EnemySprites{
 const frames=id==='bale'?[[drawBale(r)],[drawBale(r)]].map(([a])=>[a,a]):[0,1].map(f=>{const right=drawBug(LOOKS[id as Exclude<EnemyId,'bale'>],r,f);return [right,flipped(right)];});
 return {frames,flash:frames.map(pair=>pair.map(flashed)),w:frames[0][0].width/RES,h:frames[0][0].height/RES};
}

// ── The Jeju dog companion ──────────────────────────────────────────────────────────────────────────────────────────────────
function drawDog(frame:number):Sprite{
 const s=12*RES,c=canvas(s*3.4,s*2.8),x=ctx2d(c);x.translate(c.width*.45,c.height*.55);x.lineCap='round';
 const fur='#d9a35a',dark='#a8722f';
 x.strokeStyle=dark;x.lineWidth=s*.26;const leg=frame?.25:-.25;
 x.beginPath();x.moveTo(-s*.6,s*.2);x.lineTo(-s*(.6+leg),s*.85);x.moveTo(s*.55,s*.2);x.lineTo(s*(.55-leg),s*.85);x.stroke();
 x.strokeStyle=fur;x.beginPath();x.moveTo(-s*.35,s*.2);x.lineTo(-s*(.35-leg),s*.88);x.moveTo(s*.8,s*.2);x.lineTo(s*(.8+leg),s*.88);x.stroke();
 x.fillStyle=fur;x.beginPath();x.ellipse(0,0,s*1.05,s*.48,0,0,Math.PI*2);x.fill();
 // Curled tail, Jeju-dog style.
 x.strokeStyle=fur;x.lineWidth=s*.24;x.beginPath();x.arc(-s*1.05,-s*.45,s*.32,.3,Math.PI*1.6);x.stroke();
 x.fillStyle='#f3dcb1';x.beginPath();x.ellipse(s*.2,s*.18,s*.6,s*.22,0,0,Math.PI*2);x.fill();
 x.fillStyle=fur;x.beginPath();x.arc(s*1.05,-s*.45,s*.48,0,Math.PI*2);x.fill();
 x.beginPath();x.moveTo(s*.75,-s*.8);x.lineTo(s*.85,-s*1.25);x.lineTo(s*1.1,-s*.85);x.closePath();x.fill();
 x.beginPath();x.moveTo(s*1.1,-s*.85);x.lineTo(s*1.35,-s*1.25);x.lineTo(s*1.42,-s*.7);x.closePath();x.fill();
 x.fillStyle='#f3dcb1';x.beginPath();x.ellipse(s*1.4,-s*.32,s*.28,s*.2,0,0,Math.PI*2);x.fill();
 x.fillStyle='#2a1b10';x.beginPath();x.arc(s*1.62,-s*.36,s*.09,0,Math.PI*2);x.arc(s*1.15,-s*.55,s*.08,0,Math.PI*2);x.fill();
 return withShadow(outlined(c,Math.max(2,s*.08)),s*2);
}

// ── The field ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** One seamless 512 × 512 tile of the carrot field: black volcanic soil in furrows, carrot tops in rows, basalt stones. */
function drawGround():Sprite{
 const N=512,c=canvas(N,N),x=ctx2d(c);let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 x.fillStyle='#4a3a2e';x.fillRect(0,0,N,N);
 const wrap=(fn:(dx:number,dy:number)=>void)=>{for(const dx of [-N,0,N])for(const dy of [-N,0,N])fn(dx,dy);};
 // Furrows: soft darker bands every 64 px.
 for(let row=0;row<8;row++){const y=row*64;x.fillStyle='rgba(30,20,14,.28)';x.fillRect(0,y+40,N,16);x.fillStyle='rgba(120,92,66,.16)';x.fillRect(0,y+34,N,5);}
 // Grain of the soil.
 for(let i=0;i<2600;i++){const px=rnd()*N,py=rnd()*N,r=rnd()*1.6+.4;x.fillStyle=rnd()<.5?'rgba(20,12,8,.35)':'rgba(150,120,90,.22)';x.fillRect(px,py,r,r);}
 // Basalt stones, holed.
 for(let i=0;i<9;i++){const sx=rnd()*N,sy=rnd()*N,sr=5+rnd()*10,rot=rnd()*3;
  wrap((dx,dy)=>{x.save();x.translate(sx+dx,sy+dy);x.rotate(rot);x.fillStyle='#2b2a2c';x.beginPath();x.ellipse(0,0,sr,sr*.7,0,0,Math.PI*2);x.fill();
   x.fillStyle='#4a4749';x.beginPath();x.ellipse(-sr*.2,-sr*.2,sr*.6,sr*.35,0,0,Math.PI*2);x.fill();
   x.fillStyle='#1a191b';for(let k=0;k<3;k++){x.beginPath();x.arc((k-1)*sr*.35,sr*.1,sr*.1,0,Math.PI*2);x.fill();}x.restore();});}
 // Carrot tops along the ridges: small, muted tufts with an orange shoulder peeking out, sparse and dim enough that the green insects
 // stand out against them.
 x.globalAlpha=.55;
 for(let row=0;row<8;row++)for(let k=0;k<7;k++){
  if(rnd()<.25)continue;
  const cx=k*(N/7)+(row%2)*36+rnd()*20,cy=row*64+30+rnd()*5;
  wrap((dx,dy)=>{if(cx+dx<-20||cx+dx>N+20||cy+dy<-20||cy+dy>N+20)return;x.save();x.translate(cx+dx,cy+dy);x.scale(.6,.6);
   x.fillStyle='#c76a2a';x.beginPath();x.ellipse(0,4,4.2,3,0,0,Math.PI*2);x.fill();
   x.strokeStyle='#4f7f33';x.lineWidth=2.2;x.lineCap='round';
   for(let l=-2;l<=2;l++){x.beginPath();x.moveTo(0,2);x.quadraticCurveTo(l*4,-6,l*6,-12+Math.abs(l)*1.5);x.stroke();}x.restore();});}
 x.globalAlpha=1;
 return c;
}

// ── Effects and icons ───────────────────────────────────────────────────────────────────────────────────────────────────────
function drawGlow():Sprite{const S=256,c=canvas(S,S),x=ctx2d(c),g=x.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
 g.addColorStop(0,'rgba(255,214,120,.42)');g.addColorStop(.6,'rgba(255,184,80,.22)');g.addColorStop(.92,'rgba(255,170,60,.12)');g.addColorStop(1,'rgba(255,170,60,0)');
 x.fillStyle=g;x.fillRect(0,0,S,S);return c;}
function drawPuddle():Sprite{const S=160,c=canvas(S,S),x=ctx2d(c),g=x.createRadialGradient(S/2,S/2,S*.05,S/2,S/2,S/2);
 g.addColorStop(0,'rgba(245,140,50,.85)');g.addColorStop(.7,'rgba(226,110,36,.7)');g.addColorStop(.95,'rgba(255,220,170,.8)');g.addColorStop(1,'rgba(255,220,170,0)');
 x.fillStyle=g;x.beginPath();x.arc(S/2,S/2,S/2,0,Math.PI*2);x.fill();
 x.fillStyle='rgba(255,236,200,.55)';for(let i=0;i<5;i++){x.beginPath();x.arc(S*(.3+i*.1),S*(.35+(i%2)*.25),S*.035,0,Math.PI*2);x.fill();}return c;}
function drawBlade(color:string,len:number):Sprite{const c=canvas(len*RES*2+8,len*RES*.7+8),x=ctx2d(c);x.translate(c.width/2,c.height/2);
 x.fillStyle=color;x.beginPath();x.moveTo(-len*RES,0);x.quadraticCurveTo(0,-len*RES*.32,len*RES,-2);x.quadraticCurveTo(0,len*RES*.12,-len*RES,0);x.fill();
 x.fillStyle='#d9612e';x.beginPath();x.arc(0,0,len*RES*.12,0,Math.PI*2);x.fill();return outlined(c,2);}
function drawGem(color:string,size:number):Sprite{const s=size*RES,c=canvas(s*1.4,s*1.8),x=ctx2d(c);x.translate(c.width/2,c.height*.6);
 x.fillStyle=color;x.beginPath();x.moveTo(-s*.32,-s*.35);x.quadraticCurveTo(0,-s*.55,s*.32,-s*.35);x.lineTo(0,s*.6);x.closePath();x.fill();
 x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=s*.06;x.beginPath();x.moveTo(-s*.15,-s*.1);x.lineTo(0,-s*.14);x.moveTo(-s*.08,s*.12);x.lineTo(s*.08,s*.1);x.stroke();
 x.strokeStyle='#5f9a3a';x.lineWidth=s*.12;x.lineCap='round';x.beginPath();x.moveTo(0,-s*.45);x.lineTo(-s*.18,-s*.8);x.moveTo(0,-s*.45);x.lineTo(s*.18,-s*.8);x.moveTo(0,-s*.45);x.lineTo(0,-s*.85);x.stroke();
 return outlined(c,Math.max(1.5,s*.07));}

type Painter=(x:CanvasRenderingContext2D,s:number)=>void;
const circle=(x:CanvasRenderingContext2D,cx:number,cy:number,r:number,fill:string)=>{x.fillStyle=fill;x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill();};
/** Icons drawn in a 64 × 64 box (s = 64). Evolved weapons share their base icon over a gold disc. */
const PAINT:Record<string,Painter>={
 rape:(x,s)=>{x.lineCap='round';const cols=['#f08a33','#e46f1f','#f6a34e'];for(let i=0;i<5;i++){x.strokeStyle=cols[i%3];x.lineWidth=s*.07;x.beginPath();x.moveTo(s*(.18+i*.08),s*.82);x.quadraticCurveTo(s*(.4+i*.05),s*.45,s*(.62+i*.06),s*.16);x.stroke();}},
 lantern:(x,s)=>{circle(x,s*.5,s*.56,s*.4,'rgba(255,205,110,.35)');x.fillStyle='#4a3a2e';x.fillRect(s*.36,s*.24,s*.28,s*.08);x.fillRect(s*.36,s*.78,s*.28,s*.08);
  x.strokeStyle='#4a3a2e';x.lineWidth=s*.05;x.beginPath();x.arc(s*.5,s*.22,s*.1,Math.PI,0);x.stroke();x.fillStyle='#ffd06a';x.fillRect(s*.38,s*.32,s*.24,s*.46);
  x.fillStyle='#ff9a3a';x.beginPath();x.ellipse(s*.5,s*.58,s*.06,s*.11,0,0,Math.PI*2);x.fill();x.strokeStyle='#4a3a2e';x.lineWidth=s*.035;x.strokeRect(s*.38,s*.32,s*.24,s*.46);},
 turbine:(x,s)=>{x.fillStyle='#f4efe6';x.fillRect(s*.47,s*.45,s*.06,s*.47);for(let i=0;i<3;i++){x.save();x.translate(s*.5,s*.42);x.rotate(i*Math.PI*2/3-.4);x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(s*.06,-s*.18,0,-s*.36);x.quadraticCurveTo(-s*.05,-s*.18,0,0);x.fill();x.restore();}
  circle(x,s*.5,s*.42,s*.05,'#d9612e');},
 burger:(x,s)=>{x.fillStyle='#e7a047';x.beginPath();x.ellipse(s*.5,s*.4,s*.32,s*.2,0,Math.PI,0);x.fill();x.fillStyle='#6fae3c';x.fillRect(s*.16,s*.42,s*.68,s*.06);
  x.fillStyle='#e26a22';x.beginPath();x.roundRect(s*.17,s*.48,s*.66,s*.13,s*.05);x.fill();x.fillStyle='#ffd25a';x.fillRect(s*.2,s*.61,s*.6,s*.04);
  x.fillStyle='#e7a047';x.beginPath();x.roundRect(s*.18,s*.65,s*.64,s*.12,s*.06);x.fill();x.fillStyle='#fff1cf';for(let i=0;i<4;i++){x.beginPath();x.ellipse(s*(.34+i*.1),s*(.3+(i%2)*.04),s*.025,s*.015,.4,0,Math.PI*2);x.fill();}},
 soup:(x,s)=>{x.fillStyle='#f4efe6';x.beginPath();x.ellipse(s*.5,s*.55,s*.36,s*.12,0,0,Math.PI*2);x.fill();x.beginPath();x.moveTo(s*.14,s*.55);x.quadraticCurveTo(s*.2,s*.86,s*.5,s*.86);x.quadraticCurveTo(s*.8,s*.86,s*.86,s*.55);x.fill();
  x.fillStyle='#ef8a2e';x.beginPath();x.ellipse(s*.5,s*.55,s*.3,s*.08,0,0,Math.PI*2);x.fill();x.strokeStyle='rgba(255,255,255,.8)';x.lineWidth=s*.04;x.lineCap='round';
  for(let i=0;i<3;i++){x.beginPath();x.moveTo(s*(.36+i*.14),s*.42);x.bezierCurveTo(s*(.3+i*.14),s*.32,s*(.42+i*.14),s*.26,s*(.36+i*.14),s*.14);x.stroke();}},
 kimbap:(x,s)=>{circle(x,s*.5,s*.5,s*.36,'#1f2a22');circle(x,s*.5,s*.5,s*.3,'#fbf6ea');circle(x,s*.42,s*.45,s*.08,'#ef8a2e');circle(x,s*.6,s*.48,s*.07,'#f2d24a');circle(x,s*.48,s*.62,s*.07,'#6fae3c');circle(x,s*.62,s*.64,s*.05,'#ef8a2e');},
 dog:(x,s)=>{const fur='#d9a35a';circle(x,s*.5,s*.55,s*.3,fur);x.fillStyle=fur;x.beginPath();x.moveTo(s*.24,s*.38);x.lineTo(s*.28,s*.1);x.lineTo(s*.46,s*.3);x.fill();x.beginPath();x.moveTo(s*.76,s*.38);x.lineTo(s*.72,s*.1);x.lineTo(s*.54,s*.3);x.fill();
  x.fillStyle='#f3dcb1';x.beginPath();x.ellipse(s*.5,s*.68,s*.16,s*.12,0,0,Math.PI*2);x.fill();circle(x,s*.4,s*.5,s*.035,'#2a1b10');circle(x,s*.6,s*.5,s*.035,'#2a1b10');circle(x,s*.5,s*.63,s*.045,'#2a1b10');},
 gloves:(x,s)=>{x.fillStyle='#efe6d2';x.beginPath();x.roundRect(s*.28,s*.3,s*.44,s*.46,s*.12);x.fill();for(let i=0;i<4;i++){x.beginPath();x.roundRect(s*(.29+i*.11),s*.12,s*.09,s*.28,s*.045);x.fill();}
  x.beginPath();x.roundRect(s*.12,s*.4,s*.2,s*.12,s*.06);x.fill();x.fillStyle='#d9612e';x.fillRect(s*.28,s*.72,s*.44,s*.1);},
 soil:(x,s)=>{x.fillStyle='#2b2a2c';x.beginPath();x.moveTo(s*.15,s*.7);x.lineTo(s*.3,s*.3);x.lineTo(s*.62,s*.2);x.lineTo(s*.86,s*.48);x.lineTo(s*.76,s*.8);x.lineTo(s*.3,s*.84);x.closePath();x.fill();
  for(const [a,b,r] of [[.4,.45,.06],[.6,.6,.05],[.5,.72,.04],[.68,.4,.04]] as const)circle(x,s*a,s*b,s*r,'#161517');},
 tangerine:(x,s)=>{circle(x,s*.5,s*.56,s*.3,'#f39a2a');circle(x,s*.42,s*.48,s*.08,'rgba(255,255,255,.35)');x.fillStyle='#4f8a2e';x.beginPath();x.ellipse(s*.6,s*.24,s*.14,s*.07,-.5,0,Math.PI*2);x.fill();x.fillStyle='#5c4424';x.fillRect(s*.48,s*.22,s*.04,s*.08);},
 blizzard:(x,s)=>{x.strokeStyle='#bfe6ff';x.lineWidth=s*.07;x.lineCap='round';for(let i=0;i<3;i++){x.save();x.translate(s*.5,s*.5);x.rotate(i*Math.PI/3);x.beginPath();x.moveTo(0,-s*.34);x.lineTo(0,s*.34);
  x.moveTo(-s*.1,-s*.24);x.lineTo(0,-s*.16);x.lineTo(s*.1,-s*.24);x.moveTo(-s*.1,s*.24);x.lineTo(0,s*.16);x.lineTo(s*.1,s*.24);x.stroke();x.restore();}},
 oreum:(x,s)=>{x.fillStyle='#7fae55';x.beginPath();x.moveTo(s*.06,s*.8);x.quadraticCurveTo(s*.45,s*.12,s*.94,s*.8);x.fill();x.fillStyle='#5c8f3a';x.beginPath();x.moveTo(s*.4,s*.8);x.quadraticCurveTo(s*.7,s*.36,s*.98,s*.8);x.fill();
  x.fillStyle='#f4efe6';x.fillRect(s*.2,s*.2,s*.025,s*.2);x.fillRect(s*.16,s*.2,s*.1,s*.02);},
 compost:(x,s)=>{x.fillStyle='#5c4424';x.beginPath();x.ellipse(s*.5,s*.76,s*.34,s*.12,0,0,Math.PI*2);x.fill();x.strokeStyle='#5f9a3a';x.lineWidth=s*.06;x.beginPath();x.moveTo(s*.5,s*.74);x.lineTo(s*.5,s*.4);x.stroke();
  x.fillStyle='#86bf55';x.beginPath();x.ellipse(s*.38,s*.38,s*.13,s*.07,.6,0,Math.PI*2);x.fill();x.beginPath();x.ellipse(s*.62,s*.32,s*.15,s*.08,-.6,0,Math.PI*2);x.fill();},
 wind:(x,s)=>{x.strokeStyle='#cfe8f5';x.lineWidth=s*.07;x.lineCap='round';x.beginPath();x.moveTo(s*.12,s*.36);x.lineTo(s*.62,s*.36);x.arc(s*.62,s*.26,s*.1,Math.PI/2,-Math.PI*.8,true);x.stroke();
  x.beginPath();x.moveTo(s*.12,s*.54);x.lineTo(s*.78,s*.54);x.stroke();x.beginPath();x.moveTo(s*.2,s*.72);x.lineTo(s*.56,s*.72);x.arc(s*.56,s*.82,s*.1,-Math.PI/2,Math.PI*.8);x.stroke();},
 boots:(x,s)=>{x.fillStyle='#2f5d3a';x.beginPath();x.moveTo(s*.32,s*.12);x.lineTo(s*.58,s*.12);x.lineTo(s*.58,s*.62);x.lineTo(s*.86,s*.68);x.lineTo(s*.86,s*.84);x.lineTo(s*.3,s*.84);x.closePath();x.fill();x.fillStyle='#1d3a24';x.fillRect(s*.3,s*.78,s*.56,s*.06);},
 basket:(x,s)=>{x.strokeStyle='#8a5a2b';x.lineWidth=s*.05;x.beginPath();x.arc(s*.5,s*.46,s*.26,Math.PI,0);x.stroke();for(let i=0;i<3;i++)circle(x,s*(.36+i*.14),s*.48,s*.08,'#ef8a2e');
  x.fillStyle='#c48a46';x.beginPath();x.moveTo(s*.16,s*.5);x.lineTo(s*.84,s*.5);x.lineTo(s*.74,s*.84);x.lineTo(s*.26,s*.84);x.closePath();x.fill();x.strokeStyle='#8a5a2b';x.lineWidth=s*.03;for(let i=0;i<3;i++){x.beginPath();x.moveTo(s*.2,s*(.6+i*.08));x.lineTo(s*.8,s*(.6+i*.08));x.stroke();}},
 seeds:(x,s)=>{x.fillStyle='#d8c39a';x.beginPath();x.moveTo(s*.3,s*.34);x.quadraticCurveTo(s*.14,s*.86,s*.5,s*.86);x.quadraticCurveTo(s*.86,s*.86,s*.7,s*.34);x.closePath();x.fill();x.fillStyle='#8a5a2b';x.fillRect(s*.32,s*.28,s*.36,s*.07);
  x.fillStyle='#d8c39a';x.beginPath();x.moveTo(s*.34,s*.28);x.lineTo(s*.28,s*.14);x.lineTo(s*.5,s*.22);x.lineTo(s*.72,s*.14);x.lineTo(s*.66,s*.28);x.fill();for(let i=0;i<4;i++)circle(x,s*(.4+(i%2)*.18),s*(.56+Math.floor(i/2)*.14),s*.04,'#5c4424');},
 hareubang:(x,s)=>{x.fillStyle='#6b6a6e';x.beginPath();x.roundRect(s*.3,s*.12,s*.4,s*.18,s*.1);x.fill();x.beginPath();x.roundRect(s*.26,s*.26,s*.48,s*.6,s*.18);x.fill();
  circle(x,s*.42,s*.42,s*.05,'#3a393c');circle(x,s*.58,s*.42,s*.05,'#3a393c');x.fillStyle='#55545a';x.beginPath();x.ellipse(s*.5,s*.54,s*.07,s*.09,0,0,Math.PI*2);x.fill();x.fillRect(s*.3,s*.66,s*.4,s*.05);},
 juice:(x,s)=>{x.fillStyle='rgba(255,255,255,.7)';x.beginPath();x.moveTo(s*.28,s*.2);x.lineTo(s*.72,s*.2);x.lineTo(s*.66,s*.86);x.lineTo(s*.34,s*.86);x.closePath();x.fill();
  x.fillStyle='#f08a2e';x.beginPath();x.moveTo(s*.3,s*.34);x.lineTo(s*.7,s*.34);x.lineTo(s*.66,s*.84);x.lineTo(s*.34,s*.84);x.closePath();x.fill();x.strokeStyle='#5f9a3a';x.lineWidth=s*.05;x.beginPath();x.moveTo(s*.56,s*.4);x.lineTo(s*.7,s*.08);x.stroke();},
 gust:(x,s)=>{x.strokeStyle='#e9f6ff';x.lineWidth=s*.08;x.lineCap='round';x.beginPath();for(let a=0;a<Math.PI*3.6;a+=.2){const r=s*.04+a*s*.03;x.lineTo(s*.5+Math.cos(a)*r,s*.5+Math.sin(a)*r);}x.stroke();},
 frost:(x,s)=>{circle(x,s*.5,s*.5,s*.4,'rgba(170,220,255,.55)');PAINT.blizzard(x,s);},
 torch:(x,s)=>{circle(x,s*.5,s*.5,s*.42,'rgba(255,220,130,.45)');PAINT.lantern(x,s);},
 coin:(x,s)=>{circle(x,s*.5,s*.5,s*.34,'#e7b53b');circle(x,s*.5,s*.5,s*.27,'#f6cf57');x.fillStyle='#e07a2c';x.beginPath();x.moveTo(s*.42,s*.36);x.lineTo(s*.58,s*.36);x.lineTo(s*.5,s*.68);x.fill();
  x.strokeStyle='#5f9a3a';x.lineWidth=s*.05;x.beginPath();x.moveTo(s*.5,s*.36);x.lineTo(s*.5,s*.26);x.stroke();},
 bag:(x,s)=>{x.fillStyle='#b88a4a';x.beginPath();x.moveTo(s*.36,s*.3);x.quadraticCurveTo(s*.1,s*.86,s*.5,s*.86);x.quadraticCurveTo(s*.9,s*.86,s*.64,s*.3);x.closePath();x.fill();x.fillStyle='#8a5a2b';x.fillRect(s*.36,s*.24,s*.28,s*.08);
  x.save();x.translate(s*.18,s*.22);x.scale(.62,.62);PAINT.coin(x,s);x.restore();},
 xp:(x,s)=>{x.drawImage(drawGem('#ef8a2e',s/2.2),s*.18,s*.06,s*.64,s*.84);},
 kills:(x,s)=>{x.save();x.translate(s*.04,s*.12);const bug=drawBug(LOOKS.hopper,s/(3*RES)*.95,0);x.drawImage(bug,0,0,s*.92,s*.92*bug.height/bug.width);x.restore();},
};
function icon(id:string,swatter:HTMLImageElement|null,crate:HTMLImageElement|null):Sprite{
 const S=64,c=canvas(S,S),x=ctx2d(c);
 const base:Record<string,string>={ghostSwatter:'swatter',blizzardRape:'rape',moonLantern:'lantern',windFarm:'turbine',burgerSet:'burger',manoaSoup:'soup',kimbapStorm:'kimbap',dogPack:'dog'};
 const key=base[id]??id;
 if(base[id]){const g=x.createRadialGradient(S/2,S/2,4,S/2,S/2,S/2);g.addColorStop(0,'#fff0b0');g.addColorStop(1,'#e8a21e');x.fillStyle=g;x.beginPath();x.arc(S/2,S/2,S/2-1,0,Math.PI*2);x.fill();}
 const img=key==='swatter'?swatter:key==='crate'||key==='chest'?crate:null;
 if(img){const h=S*.92,w=Math.min(S*.92,h*img.naturalWidth/img.naturalHeight),hh=w*img.naturalHeight/img.naturalWidth;x.save();if(key==='swatter'){x.translate(S/2,S/2);x.rotate(-.5);x.translate(-S/2,-S/2);}x.drawImage(img,(S-w)/2,(S-hh)/2,w,hh);x.restore();}
 else PAINT[key]?.(x,S);
 return c;
}
export const ICON_IDS=['swatter','rape','lantern','turbine','burger','soup','kimbap','dog','ghostSwatter','blizzardRape','moonLantern','windFarm','burgerSet','manoaSoup','kimbapStorm','dogPack',
 'gloves','soil','crate','tangerine','blizzard','oreum','compost','wind','boots','basket','seeds','hareubang','juice','gust','frost','torch','coin','bag','chest','xp','kills'];

export async function loadSprites():Promise<Sprites>{
 const [farmer,traveler,sonongroad,manoa,buggercarrot,swatter,crate]=await Promise.all(
  ['char-farmer','char-traveler','sonongroad','manoa','buggercarrot','farm-swatter','farm-crate'].map(n=>loadImage(art(n))));
 const char=(img:HTMLImageElement|null)=>{const s=shrink(img,62);const right=withShadow(s.img,s.w*RES*.9);return {right,left:flipped(right),w:right.width/RES,h:right.height/RES};};
 const radii:Record<EnemyId,number>={hopper:12,cricket:12,swarm:10,locust:20,stinger:13,armored:23,bigCricket:17,elite:30,king:58,bale:18};
 const icons:Record<string,Sprite>={};for(const id of ICON_IDS)icons[id]=icon(id,swatter,crate);
 const dogFrames=[0,1].map(f=>{const r=drawDog(f);return [r,flipped(r)];});
 return {
  ground:drawGround(),
  enemies:Object.fromEntries((Object.keys(radii) as EnemyId[]).map(id=>[id,enemySprites(id,radii[id])])) as Record<EnemyId,EnemySprites>,
  chars:{farmer:char(farmer),traveler:char(traveler)},
  shops:{sonongroad:shrink(sonongroad,190,230),manoa:shrink(manoa,180,230),buggercarrot:shrink(buggercarrot,220,170)},
  dog:{frames:dogFrames,w:dogFrames[0][0].width/RES,h:dogFrames[0][0].height/RES},
  gems:[drawGem('#ef8a2e',9),drawGem('#f2c240',11),drawGem('#b05ad6',14)],
  glow:drawGlow(),puddle:drawPuddle(),blade:drawBlade('#f4efe6',16),windBlade:drawBlade('#ffffff',22),icons,
 };
}
/** An icon as a data URL for the menus (src/game/Game.tsx). */
const urls=new Map<string,string>();
export function iconUrl(sprites:Sprites|null,id:string){
 if(!sprites)return '';let u=urls.get(id);if(!u){const c=sprites.icons[id];u=c?c.toDataURL():'';urls.set(id,u);}return u;
}
