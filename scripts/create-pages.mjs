/**
 * Draws the printed pages under each spread of "당근을 따라, 구좌": papyrus paper (art-src/else/파피루스.jpg) with a faint wash of the
 * spread's scene, the gutter in shade, a thin frame, the chapter's number, kicker and title on the left page, its subtitle and a hint on the
 * right. Also the plain papyrus sheet (intro-pages) the story book's pages and the intro's journal are printed on.
 * Writes the WebP that ships straight to public/art-raster (the overlay SVGs are composed in memory):
 *   node scripts/create-pages.mjs
 * The scenery itself is painted (art-src/gpt → scripts/prepare-gpt-art.mjs).
 * Environment: CODEX_NODE_MODULES (sharp), as scripts/render-intro.mjs.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {pathFloor} from './street-floor.mjs';
import {farmFloor} from './farm-floor.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/eh1al/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=createRequire(path.join(runtime,'package.json'))('sharp');
const papyrus=path.join(project,'art-src/else/파피루스.jpg'),raster=path.join(project,'public/art-raster');
const C={ink:'#4f3a2b'};
// Each page is 620 × 830 in the overlay's units, printed at 1080 × 1446.
const PAGE_W=620,PAGE_H=830,PRINT_W=1080,PRINT_H=1446;
const overlay=body=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PRINT_W}" height="${PRINT_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">${body}</svg>`);

// ---------- Printed pages: section number, English kicker and title in the band in front of the cards ----------
const chapters=[['01','FARMER','구좌를 길러내는 묵묵한 방식','구좌 당근을 키우는 농부의 이야기'],['02','PEOPLE WHO COOK','구좌를 맛보는 다채로운 방식','구좌 당근을 요리하는 사람들의 이야기'],['03','MENU &amp; RECIPE','구좌를 요리하는 가장 쉬운 방식','구좌 당근 레시피 이야기']];
// A faint wash from the back edge tones each spread's papyrus to its scene (dusk field, sunny seaside, lamplit kitchen), so the floor
// the cards stand on still belongs to the painting behind them; the gutter falls into shade toward the binding.
const PAPER=[
 {wash:'#e08a55',washOpacity:.2,frame:'#b08560',corner:'#9d7452',kicker:'#8f6443',sub:'#7d5e46'},
 {wash:'#e2c58a',washOpacity:.16,frame:'#b39a70',corner:'#a08a62',kicker:'#86704f',sub:'#776548'},
 {wash:'#dc9a5c',washOpacity:.18,frame:'#b08b64',corner:'#9d7a54',kicker:'#8b6646',sub:'#7a5c44'},
];
const sheet=sharp(papyrus).resize(PRINT_W,PRINT_H,{fit:'cover'});
// A spread with a printed floor (chapter 1: a muddy farmyard, scripts/farm-floor.mjs; chapter 2: a cobbled street, scripts/street-floor.mjs)
// draws it across both pages (left page = left half, right page = right half) instead of the frame and wash; the printed lines lie on
// plain paper (`clear`) so they stay readable.
const FLOORS={
 0:(w,h,clear)=>farmFloor(sharp,project,w,h,{clear}),
 1:(w,h,clear)=>pathFloor(sharp,project,w,h,{clear,widenRight:{dx:.075,u0:.55,v0:.46,v1:1}}),
};
const only=process.argv[2]; // e.g. "1": write just that chapter's pages
for(const [chapter,[n,kicker,title,subtitle]] of chapters.entries())for(const side of ['left','right']){
 if(only!==undefined&&Number(only)!==chapter)continue;
 const floor=FLOORS[chapter];
 const page=chapter*2+(side==='left'?1:2),tone=PAPER[chapter],gutter=side==='left'?' x1="1" x2="0"':'';
 const text=side==='left'
  ?`<text x="80" y="700" font-family="Georgia,serif" font-size="15" letter-spacing="4" fill="${tone.kicker}">${n} · ${kicker}</text><text x="80" y="738" font-family="Gowun Batang,Batang,serif" font-size="25" fill="${C.ink}">${title}</text>`
  :`<text x="540" y="712" text-anchor="end" font-family="Gowun Batang,Batang,serif" font-size="17" fill="${tone.sub}">${subtitle}</text><text x="540" y="740" text-anchor="end" font-family="Gowun Batang,Batang,serif" font-size="14" fill="${tone.kicker}">사물을 눌러 이야기를 펼쳐 보세요</text>`;
 const body=`<linearGradient id="g"${gutter}><stop stop-color="#5a3f28" stop-opacity=".26"/><stop offset=".09" stop-color="#5a3f28" stop-opacity=".08"/><stop offset=".3" stop-color="#5a3f28" stop-opacity="0"/></linearGradient><linearGradient id="w" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${tone.wash}" stop-opacity="${tone.washOpacity}"/><stop offset=".62" stop-color="${tone.wash}" stop-opacity="0"/></linearGradient><rect width="620" height="830" fill="url(#w)"/><rect width="620" height="830" fill="url(#g)"/><rect x="24" y="25" width="572" height="780" rx="2" stroke="${tone.frame}" fill="none" opacity=".55"/><path d="M42 46h43M42 46v43M578 46h-43M578 46v43M42 784h43M42 784v-43M578 784h-43M578 784v-43" stroke="${tone.corner}" stroke-width="2" fill="none" opacity=".8"/>${text}<text x="310" y="793" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="${tone.kicker}">— 0${page} —</text>`;
 if(floor){
  const tag='';
  const pill='';
  const labelled=`<linearGradient id="g"${gutter}><stop stop-color="#5a3f28" stop-opacity=".3"/><stop offset=".08" stop-color="#5a3f28" stop-opacity=".1"/><stop offset=".26" stop-color="#5a3f28" stop-opacity="0"/></linearGradient><rect width="620" height="830" fill="url(#g)"/>${tag}${pill}${text}<text x="310" y="793" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="${tone.kicker}">— 0${page} —</text>`;
  const K=PRINT_W/PAGE_W,spreadClear=[[62*K,672*K,440*K,760*K],[PRINT_W+170*K,684*K,PRINT_W+575*K,760*K],[PRINT_W-110*K,776*K,PRINT_W+110*K,806*K]];
  const base=sharp(await floor(PRINT_W*2,PRINT_H,spreadClear)).extract({left:side==='left'?0:PRINT_W,top:0,width:PRINT_W,height:PRINT_H});
  await fs.writeFile(path.join(raster,`page-${chapter}-${side}.webp`),await base.composite([{input:overlay(labelled)}]).webp({quality:90,effort:5}).toBuffer());
  continue;
 }
 await fs.writeFile(path.join(raster,`page-${chapter}-${side}.webp`),await sheet.clone().composite([{input:overlay(body)}]).webp({quality:82,effort:5}).toBuffer());
}
// The plain sheet: the story book's pages (src/DetailBook.tsx) and the intro film's journal (src/film.tsx).
if(only===undefined)await fs.writeFile(path.join(raster,'intro-pages.webp'),await sharp(papyrus).resize(1440,1928,{fit:'cover'}).webp({quality:84,effort:5}).toBuffer());
console.log('Wrote the printed pages and the papyrus sheet to public/art-raster.');
