/**
 * The room around the live book (src/bookParts.tsx ROOM): a quiet brown wooden floor the book lies on and a beige plaster wall behind it,
 * after the team's reference (a pop-up book on a brown table against a beige wall), in place of the dark walnut desk fading into the dark.
 * Both tile seamlessly (every wave and noise lattice has a whole number of periods across the tile). Written to public/book-materials.
 * Run: node scripts/room-textures.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/eh1al/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=createRequire(path.join(runtime,'package.json'))('sharp');
const destination=path.join(project,'public/book-materials');
const TAU=Math.PI*2;
const random=seed=>()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};

/**
 * Floor: a quiet brown wood with fine streaks running across the screen (along x, so they change from row to row), broken into short
 * dashes and flecks, over broad soft bands, waving slightly; no planks. The grain is the team's first reference's; the colour their
 * muted example's (about rgb(100,55,33), from rgb(78,42,23) to rgb(122,69,42)). Periodic in both directions, so it tiles.
 */
async function floor(){
 const N=1024,data=Buffer.alloc(N*N*3),rand=random(20261029);
 // Periodic 1D value noise across the rows: `cells` values round the tile, smoothly interpolated.
 const rows=cells=>{const g=Float32Array.from({length:cells},()=>rand()*2-1);return y=>{const f=y/N*cells,i=Math.floor(f),t=f-i,s=t*t*(3-2*t);
  return g[((i%cells)+cells)%cells]+(g[(((i+1)%cells)+cells)%cells]-g[((i%cells)+cells)%cells])*s;};};
 const bands=rows(9),streaks=rows(70),fineLines=rows(260),hair=rows(700);
 // Elongated 2D noise (few cells along a streak, many across), periodic: breaks the grain into short dashes and flecks.
 const dashes=(cx,cy)=>{const g=Float32Array.from({length:cx*cy},()=>rand()*2-1),s=t=>t*t*(3-2*t);return (x,y)=>{
  const fx=x/N*cx,fy=y/N*cy,x0=Math.floor(fx),y0=Math.floor(fy),tx=s(fx-x0),ty=s(fy-y0),at=(i,j)=>g[((j%cy+cy)%cy)*cx+((i%cx+cx)%cx)];
  const a=at(x0,y0)+(at(x0+1,y0)-at(x0,y0))*tx,b=at(x0,y0+1)+(at(x0+1,y0+1)-at(x0,y0+1))*tx;return a+(b-a)*ty;};};
 const longDash=dashes(18,220),shortDash=dashes(60,420);
 // The grain wanders a little along its length (whole periods across the tile, so it still tiles).
 const waves=Array.from({length:3},(_,k)=>({m:1+k+Math.floor(rand()*2),a:2+rand()*5,p:rand()*TAU}));
 // Along each streak its tone drifts slowly, so no line is uniform end to end.
 const drift=Array.from({length:4},()=>({m:1+Math.floor(rand()*4),k:2+Math.floor(rand()*6),p:rand()*TAU}));
 const dark=[78,42,23],mid=[99,55,33],light=[122,69,42];
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const u=x/N,warp=waves.reduce((sum,w)=>sum+w.a*Math.sin(TAU*w.m*u+w.p+y/N*TAU),0),at=y+warp;
  const along=drift.reduce((sum,d)=>sum+Math.sin(TAU*(d.m*u+d.k*at/N)+d.p),0)/4;
  let t=bands(at)*.3+streaks(at)*.32+fineLines(at)*.2+hair(at)*.1+along*.14+longDash(x,at)*.42+shortDash(x,at)*.36+(rand()-.5)*.44;
  t=Math.max(-1,Math.min(1,t*1.85));
  for(let c=0;c<3;c++){const v=t<0?mid[c]+(mid[c]-dark[c])*t:mid[c]+(light[c]-mid[c])*t;data[(y*N+x)*3+c]=Math.max(0,Math.min(255,Math.round(v)));}
 }
 await fs.writeFile(path.join(destination,'floor.webp'),await sharp(data,{raw:{width:N,height:N,channels:3}}).webp({quality:78,effort:6}).toBuffer());
}

/** Wall: beige plaster, a soft mottle of larger patches over a fine sand grain, tileable. */
async function wall(){
 const N=512,data=Buffer.alloc(N*N*3),rand=random(20261028);
 // Periodic value noise: a lattice of `cells` per side, smoothly interpolated, wrapping at the edges.
 const lattice=cells=>{const g=Float32Array.from({length:cells*cells},()=>rand()*2-1);return (x,y)=>{
  const fx=x/N*cells,fy=y/N*cells,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0,s=t=>t*t*(3-2*t);
  const at=(i,j)=>g[((j%cells+cells)%cells)*cells+((i%cells+cells)%cells)];
  const a=at(x0,y0)+(at(x0+1,y0)-at(x0,y0))*s(tx),b=at(x0,y0+1)+(at(x0+1,y0+1)-at(x0,y0+1))*s(tx);return a+(b-a)*s(ty);};};
 const broad=lattice(4),mid=lattice(12),small=lattice(40);
 const base=[228,214,190];
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const shade=broad(x,y)*5+mid(x,y)*3.5+small(x,y)*2.5+(rand()-.5)*5;
  for(let c=0;c<3;c++)data[(y*N+x)*3+c]=Math.max(0,Math.min(255,base[c]+shade*(c===2?.8:1)));
 }
 await fs.writeFile(path.join(destination,'wall.webp'),await sharp(data,{raw:{width:N,height:N,channels:3}}).webp({quality:84,effort:5}).toBuffer());
}

await floor();await wall();
for(const name of ['floor','wall']){const stat=await fs.stat(path.join(destination,`${name}.webp`));console.log(`${name}.webp ${Math.round(stat.size/1024)} KiB`);}
