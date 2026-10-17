/**
 * Draws the printed pages under each spread of "당근을 따라, 구좌" as SVG: paper toned to the spread's scene, the chapter's number,
 * kicker and title on the left page, its subtitle and a hint on the right. Rasterize afterwards (the pages' WebP is what ships):
 * node scripts/render-intro.mjs --raster-only --all-raster   (only missing WebP are made, so delete page-*.webp first to redraw)
 * The scenery itself is painted (art-src/gpt → scripts/prepare-gpt-art.mjs).
 */
import {writeFileSync} from 'node:fs';
const art=new URL('../public/art/',import.meta.url);
const C={cream:'#fff9e9',paper:'#fbf3df',ink:'#5e4738',carrot:'#e88d51',carrotDark:'#c96a33',leaf:'#5f8a4f',leafLight:'#86ad62',soil:'#5a4c43',soilLight:'#6d5d52',stone:'#55504c',stoneLight:'#6a6460',sea:'#9cc3c4',seaDeep:'#7fb0b4',sky:'#eef1e4',sage:'#a9b393',oreum:'#9db087',oreumLight:'#b8c6a0',wood:'#b8875c',woodDark:'#8e6442'};
const defs=`<pattern id="grain" width="11" height="13" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".7" fill="#604d34" opacity=".12"/><circle cx="8" cy="9" r=".5" fill="#fff" opacity=".5"/></pattern>
<style>.cut *{fill:${C.cream}!important;stroke:${C.cream}!important;stroke-width:22px!important;stroke-linejoin:round;stroke-linecap:round}</style>`;
const svg=(name,w,h,body)=>writeFileSync(new URL(`${name}.svg`,art),`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`);

// ---------- Printed pages: section number, English kicker and title in the band in front of the cards ----------
const chapters=[['01','FARMER','구좌를 길러내는 묵묵한 방식','구좌 당근을 키우는 농부의 이야기'],['02','PEOPLE WHO COOK','구좌를 맛보는 다채로운 방식','구좌 당근을 요리하는 사람들의 이야기'],['03','MENU &amp; RECIPE','구좌를 요리하는 가장 쉬운 방식','구좌 당근 레시피 이야기']];
// Each spread's paper is toned to its scene, so the floor the cards stand on belongs to the painting behind them. Page 1 is the dusk
// field: apricot light near the backdrop fading to warm sand in front; page 2 is the sunny seaside: pale beach sand; page 3 the lamplit kitchen: warm honey. `wash` is the colour that falls from the back edge.
const PAPER=[
 {gutter:'#d6a582',mid:'#f4d6b8',outer:'#efcda9',edge:'#dfb48f',wash:'#ec9a68',washOpacity:.42,frame:'#d2a37f',corner:'#c48f68',kicker:'#a07254',sub:'#8d6a52'},
 {gutter:'#d8c6a2',mid:'#f8ecd3',outer:'#f5e7cb',edge:'#e3cfa9',wash:'#e6c993',washOpacity:.34,frame:'#d3bf98',corner:'#c1aa81',kicker:'#998461',sub:'#85755a'},
 {gutter:'#d4b48f',mid:'#f6e2c6',outer:'#f2dcbd',edge:'#e0c39e',wash:'#e2a565',washOpacity:.36,frame:'#d1b089',corner:'#bf9a70',kicker:'#9c7a58',sub:'#87694f'},
];
chapters.forEach(([n,kicker,title,subtitle],chapter)=>{for(const side of ['left','right']){
 const page=chapter*2+(side==='left'?1:2),gradient=side==='left'?' x1="1" x2="0"':'',tone=PAPER[chapter];
 const text=side==='left'
  ?`<text x="80" y="700" font-family="Georgia,serif" font-size="15" letter-spacing="4" fill="${tone.kicker}">${n} · ${kicker}</text><text x="80" y="738" font-family="Gowun Batang,Batang,serif" font-size="25" fill="${C.ink}">${title}</text>`
  :`<text x="540" y="712" text-anchor="end" font-family="Gowun Batang,Batang,serif" font-size="17" fill="${tone.sub}">${subtitle}</text><text x="540" y="740" text-anchor="end" font-family="Gowun Batang,Batang,serif" font-size="14" fill="${tone.kicker}">사물을 눌러 이야기를 펼쳐 보세요</text>`;
 svg(`page-${chapter}-${side}`,620,830,`<linearGradient id="g"${gradient}><stop stop-color="${tone.gutter}"/><stop offset=".15" stop-color="${tone.mid}"/><stop offset=".85" stop-color="${tone.outer}"/><stop offset="1" stop-color="${tone.edge}"/></linearGradient><linearGradient id="w" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${tone.wash}" stop-opacity="${tone.washOpacity}"/><stop offset=".62" stop-color="${tone.wash}" stop-opacity="0"/></linearGradient><rect width="620" height="830" fill="url(#g)"/><rect width="620" height="830" fill="url(#w)"/><rect width="620" height="830" fill="url(#grain)"/><rect x="24" y="25" width="572" height="780" rx="2" stroke="${tone.frame}" fill="none" opacity=".8"/><path d="M42 46h43M42 46v43M578 46h-43M578 46v43M42 784h43M42 784v-43M578 784h-43M578 784v-43" stroke="${tone.corner}" stroke-width="2" fill="none"/>${text}<text x="310" y="793" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="${tone.kicker}">— 0${page} —</text>`);
}});
console.log('Wrote the printed pages to public/art.');
