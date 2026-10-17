/**
 * Draws the scene art for the three chapters of "당근을 따라, 구좌" as SVG paper cut-outs (cream die-cut edge, flat colours, paper grain),
 * plus the printed pages under them. Rasterize afterwards: node scripts/render-intro.mjs --raster-only --all-raster
 * Characters come from scripts/prepare-characters.mjs. Proportions follow the layer sizes in src/story.ts (width : height in world units).
 */
import {writeFileSync} from 'node:fs';
const art=new URL('../public/art/',import.meta.url);
const C={cream:'#fff9e9',paper:'#fbf3df',ink:'#5e4738',carrot:'#e88d51',carrotDark:'#c96a33',leaf:'#5f8a4f',leafLight:'#86ad62',soil:'#5a4c43',soilLight:'#6d5d52',stone:'#55504c',stoneLight:'#6a6460',sea:'#9cc3c4',seaDeep:'#7fb0b4',sky:'#eef1e4',sage:'#a9b393',oreum:'#9db087',oreumLight:'#b8c6a0',wood:'#b8875c',woodDark:'#8e6442'};
const defs=`<pattern id="grain" width="11" height="13" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".7" fill="#604d34" opacity=".12"/><circle cx="8" cy="9" r=".5" fill="#fff" opacity=".5"/></pattern>
<style>.cut *{fill:${C.cream}!important;stroke:${C.cream}!important;stroke-width:22px!important;stroke-linejoin:round;stroke-linecap:round}</style>`;
const svg=(name,w,h,body)=>writeFileSync(new URL(`${name}.svg`,art),`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`);
/** A free-standing cut-out: the drawing once as a cream silhouette (the die-cut margin), then in colour, then the paper grain. */
const cutout=(body,clip='')=>`<g class="cut">${body}</g>${body}${clip?`<path d="${clip}" fill="url(#grain)"/>`:''}`;
/** A scenery card with a softly waved top edge, like the first version's cards. */
const cardOutline=(w,h,top,waves=4)=>{let d=`M10 ${h-6}V${top+18}`;for(let i=0;i<waves;i++){const x0=10+(w-20)*i/waves,x1=10+(w-20)*(i+1)/waves,mid=(x0+x1)/2;d+=`Q${mid} ${top-18+(i%2)*10} ${x1} ${top+14-(i%2)*8}`;}return d+`V${h-6}Z`;};
const card=(name,w,h,top,body,waves)=>{const o=cardOutline(w,h,top,waves);svg(name,w,h,`<clipPath id="c"><path d="${o}"/></clipPath><path d="${o}" fill="${C.cream}" stroke="${C.cream}" stroke-width="18"/><g clip-path="url(#c)">${body}</g><path d="${o}" fill="url(#grain)"/>`);};
const rng=(seed=7)=>()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
const carrot=(x,y,s=1,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0Q-30-37-12-46Q5-38 8-8Q5-57 22-52Q35-37 13-5Q40-30 45-14Q42 1 18 8" fill="${C.leaf}"/><path d="M-17 6Q8-5 31 13Q25 62 5 96Q-10 62-17 6Z" fill="${C.carrot}"/><path d="M-13 27l16 4M14 46l11-2M-4 65l11 3" stroke="${C.carrotDark}" stroke-width="3" fill="none"/></g>`;

// ---------- Chapter 1 · 구좌를 길러내는 묵묵한 방식 (FARMER) ----------
// Chapter 1 now uses painted layers (art-src/gpt/page-1, scripts/prepare-gpt-art.mjs); these earlier SVG cards (kept in
// _archive/scenes-v2) are only drawn again on request: node scripts/create-scenes.mjs --old-farm
if(process.argv.includes('--old-farm')){
 const W=1000,H=352,r=rng(11);
 const turbine=(x,y,s,a)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-3 0L-1.5-120H1.5L3 0Z" fill="#fbfbf5"/><g transform="translate(0 -120) rotate(${a})">${[0,120,240].map(b=>`<path d="M0 0L-4 -2L-2-62L2-62L4-2Z" fill="#fbfbf5" transform="rotate(${b})"/>`).join('')}<circle r="5" fill="#e6e6dc"/></g></g>`;
 card('farm-back',W,H,62,`<rect width="${W}" height="${H}" fill="${C.sky}"/><circle cx="790" cy="110" r="34" fill="#f3d27e"/>
  <g fill="#fffdf6"><path d="M150 120q8-24 34-16q14-22 38-6q24-2 22 22H146q-8 0 4 0Z"/><path d="M560 92q8-20 30-14q12-18 32-4q20 0 18 18H556Z"/></g>
  <path d="M0 262H${W}V300H0Z" fill="${C.sea}"/><path d="M40 274h80M190 282h60M300 272h90M700 280h70M820 270h60" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/>
  <path d="M60 300Q190 120 330 236Q360 160 420 160Q470 160 500 236Q640 140 780 300Z" fill="${C.oreum}"/><path d="M380 182Q420 168 460 182" stroke="#8a9c74" stroke-width="5" fill="none"/>
  <path d="M520 300Q700 170 1000 250V300Z" fill="${C.oreumLight}"/><path d="M0 300Q60 230 180 300Z" fill="${C.oreumLight}"/>
  ${turbine(760,230,.75,15)}${turbine(840,222,.6,55)}${turbine(910,236,.5,100)}
  <path d="M0 296Q250 280 500 298T1000 292V${H}H0Z" fill="#a9ba8a"/>`);
 // The field: rows of feathery carrot tops on black volcanic soil, a few orange shoulders showing.
 const FW=1000,FH=150;let rows='';
 for(let row=0;row<4;row++){const y=46+row*26;rows+=`<path d="M0 ${y+14}Q500 ${y+4} ${FW} ${y+14}" stroke="${C.soilLight}" stroke-width="6" fill="none"/>`;
  for(let x=10+(row%2)*20;x<FW;x+=40){const s=.7+r()*.35,c=r()<.5?C.leaf:C.leafLight;rows+=`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 8Q-18-14-6-26Q2-10 2 4Q-2-30 10-30Q18-14 6 6Q20-18 28-8Q24 6 6 10" fill="${c}"/>${r()<.28?`<path d="M-6 8Q2 2 10 9Q8 16 2 18Q-4 14-6 8Z" fill="${C.carrot}"/>`:''}</g>`;}}
 card('farm-field',FW,FH,30,`<rect width="${FW}" height="${FH}" fill="${C.soil}"/>${rows}`,5);
 // Batdam: the black basalt field wall, stones stacked loosely with light gaps, rapeseed flowers along the top.
 const SW=1000,SH=96;let stones='',flowers='';
 for(let course=0;course<2;course++)for(let x=-10+course*24;x<SW;){const w=40+r()*34,h=30+r()*8,y=34+course*28+r()*4;stones+=`<path d="M${x} ${y+h*.4}Q${x+2} ${y} ${x+w*.45} ${y+2}Q${x+w} ${y-2} ${x+w-2} ${y+h*.5}Q${x+w} ${y+h} ${x+w*.5} ${y+h}Q${x} ${y+h} ${x} ${y+h*.4}Z" fill="${r()<.5?C.stone:C.stoneLight}"/><circle cx="${x+w*.3}" cy="${y+h*.4}" r="2.5" fill="#7c7671"/><circle cx="${x+w*.62}" cy="${y+h*.62}" r="2" fill="#7c7671"/>`;x+=w+4;}
 for(let x=20;x<SW;x+=64+r()*30)flowers+=`<g transform="translate(${x} ${30+r()*5}) scale(.8)"><path d="M0 12V-6" stroke="${C.leaf}" stroke-width="3"/>${[[-6,-10],[0,-14],[6,-9],[-2,-5],[4,-3]].map(([dx,dy])=>`<circle cx="${dx}" cy="${dy}" r="4.5" fill="#f2cf55"/>`).join('')}</g>`;
 card('farm-wall',SW,SH,24,`<rect width="${SW}" height="${SH}" fill="#d9cfb8"/>${stones}${flowers}`,6);
 // The harvest crate (opens the harvest story).
 svg('farm-crate',600,460,cutout(`<path d="M70 200H530L505 430H95Z" fill="${C.wood}"/><path d="M80 260H520M88 330H512M96 400H504" stroke="${C.woodDark}" stroke-width="10"/>
  ${[[150,150,-12],[230,128,8],[300,140,-4],[370,124,14],[440,150,-10]].map(([x,y,a])=>carrot(x,y,1.45,a+180)).join('')}
  ${[[190,182],[260,176],[330,186],[400,174]].map(([x,y])=>`<path d="M${x} ${y}Q${x-30} ${y-80} ${x-6} ${y-110}Q${x+10} ${y-60} ${x+6} ${y}" fill="${C.leafLight}"/>`).join('')}
  <rect x="210" y="282" width="180" height="56" rx="10" fill="${C.paper}"/><text x="300" y="320" text-anchor="middle" font-family="Gowun Batang,Batang,serif" font-size="30" font-weight="700" fill="${C.ink}">구좌 당근</text>`));
}

// ---------- Chapter 2 · 구좌를 맛보는 다채로운 방식 (PEOPLE WHO COOK) ----------
{
 const W=1000,H=352,r=rng(23);
 const house=(x,w,h,roof,wall='#efe6d4')=>`<path d="M${x} 300V${300-h}H${x+w}V300Z" fill="${wall}"/><path d="M${x-8} ${300-h+4}L${x+w/2} ${300-h-26}L${x+w+8} ${300-h+4}Z" fill="${roof}"/><rect x="${x+w*.38}" y="${300-h*.55}" width="${w*.24}" height="${h*.55}" fill="#8e7a66"/>`;
 card('village-back',W,H,62,`<rect width="${W}" height="${H}" fill="${C.sky}"/><circle cx="160" cy="104" r="30" fill="#f3d27e"/>
  <path d="M0 180H${W}V300H0Z" fill="${C.sea}"/><path d="M0 222H${W}V300H0Z" fill="${C.seaDeep}"/>${[40,240,480,700,880].map(x=>`<path d="M${x} ${200+r()*14}h${50+r()*40}" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".75"/>`).join('')}
  <path d="M600 180Q700 120 820 180Z" fill="${C.oreum}"/>
  <path d="M0 252Q500 236 ${W} 252V300H0Z" fill="#d6c7a6"/>
  ${house(60,90,70,'#6e93a8')}${house(170,110,84,'#d9874f')}${house(300,80,62,'#4f8a83')}${house(620,100,78,'#6e93a8')}${house(740,90,66,'#c7684a')}${house(850,110,88,'#d9874f')}
  <g transform="translate(470 300)"><path d="M0 0Q-6-70 4-150" stroke="#8e6a4a" stroke-width="10" fill="none"/>${[-60,-20,20,60,100].map(a=>`<path d="M4-150Q${40*Math.cos(a*Math.PI/180)} ${-150-30*Math.sin(a*Math.PI/180)-10} ${70*Math.cos(a*Math.PI/180)} ${-150+20}" stroke="${C.leaf}" stroke-width="12" fill="none" stroke-linecap="round"/>`).join('')}</g>
  <path d="M0 300H${W}V${H}H0Z" fill="#cbb994"/>`);
 // Three places to eat, one per interview. Each is its own card so it can be clicked.
 const sign=(x,y,n,icon)=>`<g transform="translate(${x} ${y})"><rect x="-70" y="-40" width="140" height="80" rx="14" fill="${C.paper}"/><text x="0" y="-6" text-anchor="middle" font-family="Georgia,serif" font-size="22" letter-spacing="3" fill="${C.ink}">NO.0${n}</text>${icon}</g>`;
 svg('shop-a',800,640,cutout(`<path d="M60 630V170H740V630Z" fill="#f2e7d2"/><path d="M60 170H740V250H60Z" fill="${C.woodDark}"/>
  <path d="M40 250H760L730 330H70Z" fill="${C.carrot}"/>${[0,1,2,3,4,5,6].map(i=>`<path d="M${70+i*96} 250l40 0l-10 80h-40Z" fill="#fbf0dc"/>`).join('')}
  <rect x="110" y="380" width="240" height="180" rx="10" fill="#9fc0c4"/><path d="M230 380V560M110 470H350" stroke="${C.cream}" stroke-width="10"/>
  <rect x="450" y="370" width="200" height="260" rx="12" fill="#7a5a44"/><circle cx="615" cy="510" r="10" fill="#f3d27e"/>
  ${sign(400,210,1,`<ellipse cx="0" cy="22" rx="34" ry="10" fill="#fff" stroke="${C.ink}" stroke-width="3"/>`)}`));
 svg('shop-b',800,640,cutout(`<path d="M80 630V200Q80 120 160 120H640Q720 120 720 200V630Z" fill="#fbf6ea"/>
  <circle cx="260" cy="380" r="110" fill="#a8c9c9"/><path d="M260 270V490M150 380H370" stroke="${C.cream}" stroke-width="10"/>
  <path d="M480 340H640V630H480Z" fill="#6f9a6a"/><circle cx="505" cy="490" r="9" fill="#f3d27e"/>
  <path d="M110 560H420" stroke="${C.wood}" stroke-width="14"/>${[150,220,290,360].map(x=>`<path d="M${x} 560v-30q-14-24 0-40q14 16 0 40" fill="${C.leafLight}"/>`).join('')}
  ${sign(560,230,2,`<path d="M-14 6h28l-4 26h-20Z" fill="${C.carrot}"/><path d="M6 6l8-16" stroke="${C.leaf}" stroke-width="3"/>`)}`));
 svg('shop-c',800,640,cutout(`<path d="M90 630V320H710V630Z" fill="${C.stone}"/>${Array.from({length:18},(_,i)=>`<circle cx="${130+(i%6)*100+(Math.floor(i/6)%2)*40}" cy="${370+Math.floor(i/6)*80}" r="${20+(i%3)*4}" fill="${C.stoneLight}"/>`).join('')}
  <path d="M40 330Q400 60 760 330Z" fill="#d8b77c"/><path d="M110 300Q400 90 690 300M200 320Q400 150 600 320" stroke="#b9945a" stroke-width="8" fill="none"/>${[160,260,360,440,540,640].map(x=>`<path d="M${x} ${330-((x-400)**2>40000?20:120)}V330" stroke="#a8844c" stroke-width="5"/>`).join('')}
  <rect x="320" y="420" width="160" height="210" rx="10" fill="${C.wood}"/><path d="M400 420V630" stroke="${C.woodDark}" stroke-width="6"/>
  <path d="M300 410Q400 360 500 410" stroke="${C.leaf}" stroke-width="10" fill="none"/>${carrot(330,404,.55,190)}${carrot(400,384,.55,180)}${carrot(470,404,.55,170)}
  ${sign(400,250,3,`<circle cx="0" cy="22" r="12" fill="${C.carrot}"/><path d="M-3 10l3-12 3 12" fill="${C.leaf}"/>`)}`));
 // A low wall with pots in front of the shops.
 const SW=1000,SH=120;let stones='';for(let x=-10;x<SW;){const w=40+r()*36;stones+=`<rect x="${x}" y="${64+r()*8}" width="${w}" height="${40+r()*10}" rx="16" fill="${r()<.5?C.stone:C.stoneLight}"/>`;x+=w+4;}
 card('village-wall',SW,SH,30,`<rect width="${SW}" height="${SH}" fill="#dccfb4"/>${stones}${[90,330,620,900].map(x=>`<g transform="translate(${x} 60)"><path d="M-22 0h44l-6 30h-32Z" fill="#c9774f"/><path d="M0 0q-20-30-4-46q10 22 4 46q2-34 20-38q2 22-20 38" fill="${C.leafLight}"/></g>`).join('')}`,6);
}

// ---------- Chapter 3 · 구좌를 요리하는 가장 쉬운 방식 (MENU & RECIPE) ----------
{
 const W=1000,H=352;
 let tiles='';for(let y=60;y<300;y+=36)for(let x=0;x<W;x+=36)tiles+=`<rect x="${x+2}" y="${y+2}" width="32" height="32" rx="3" fill="#f6eedc"/>`;
 const jar=(x,y,h,fill)=>`<rect x="${x}" y="${y-h}" width="46" height="${h}" rx="10" fill="#f8f3e6"/><rect x="${x+5}" y="${y-h*.7}" width="36" height="${h*.62}" rx="7" fill="${fill}"/><rect x="${x-2}" y="${y-h-12}" width="50" height="14" rx="4" fill="${C.woodDark}"/>`;
 card('kitchen-back',W,H,58,`<rect width="${W}" height="${H}" fill="#e9dfca"/>${tiles}
  <rect x="380" y="86" width="240" height="150" rx="10" fill="${C.sea}"/><path d="M380 186H620V236H380Z" fill="${C.seaDeep}"/><path d="M500 86V236M380 160H620" stroke="${C.cream}" stroke-width="10"/><path d="M420 186Q470 150 520 186Z" fill="${C.oreum}"/>
  <path d="M40 150H330M670 150H960" stroke="${C.woodDark}" stroke-width="12"/><path d="M40 250H330M670 250H960" stroke="${C.woodDark}" stroke-width="12"/>
  ${jar(60,146,64,C.carrot)}${jar(130,146,52,'#e9c46a')}${jar(200,146,70,'#9cbf7a')}${jar(270,146,48,C.carrot)}${jar(690,146,56,'#d97a4a')}${jar(760,146,70,'#f0b46c')}${jar(840,146,50,'#9cbf7a')}${jar(900,146,62,C.carrot)}
  <g transform="translate(150 182)">${carrot(0,0,.7,175)}${carrot(40,6,.7,185)}${carrot(80,0,.7,170)}<path d="M-6 0H96" stroke="#c9a46a" stroke-width="5"/></g>
  <g transform="translate(760 246)"><path d="M-30 0h60l-8-44h-44Z" fill="#c9774f"/><path d="M0-44q-30-40-6-70q14 30 6 70q4-50 30-56q4 34-30 56" fill="${C.leafLight}"/></g>
  <path d="M0 300H${W}V${H}H0Z" fill="#d8c8a8"/>`);
 // The counter front, with a striped cloth.
 card('kitchen-table',1000,150,24,`<rect width="1000" height="150" fill="${C.wood}"/>${[0,1,2,3,4,5,6,7].map(i=>`<path d="M0 ${44+i*14}H1000" stroke="${C.woodDark}" stroke-width="2" opacity=".35"/>`).join('')}<path d="M0 24H1000V60H0Z" fill="${C.paper}"/>${Array.from({length:25},(_,i)=>`<rect x="${i*40}" y="24" width="20" height="36" fill="${C.carrot}" opacity=".55"/>`).join('')}`,5);
 // Six dishes, one per card story.
 const D=600;
 svg('dish-plate',D,D,cutout(`<ellipse cx="300" cy="360" rx="250" ry="120" fill="#fbf6ea"/><ellipse cx="300" cy="352" rx="200" ry="88" fill="#f3ead6"/>
  ${[[200,330,-20],[280,320,-8],[360,326,6],[430,340,18]].map(([x,y,a])=>`<g transform="translate(${x} ${y}) rotate(${a+90})"><path d="M-14 -70Q0-84 14-70Q10 30 0 70Q-10 30-14-70Z" fill="#e37a3c"/><path d="M-8-30h12M-6 10h10" stroke="${C.carrotDark}" stroke-width="3"/></g>`).join('')}
  <path d="M170 300q20-40 50-20q-10 30-50 20M420 296q30-30 50 0q-26 22-50 0" fill="${C.leafLight}"/><path d="M240 400q60 14 120 0" stroke="#f0d9a6" stroke-width="8" fill="none"/>`));
 svg('dish-rape',D,D,cutout(`<path d="M110 300Q120 470 300 480Q480 470 490 300Z" fill="#9fc0c4"/><ellipse cx="300" cy="300" rx="190" ry="54" fill="#bcd5d6"/>
  ${Array.from({length:46},(_,i)=>{const a=i*.8,x=300+Math.cos(a)*(30+i*3)*1.1,y=262+Math.sin(a)*(10+i*.7);return `<path d="M${x} ${y}q${14+i%5} ${-10+i%7} ${30} ${4}" stroke="${i%3?C.carrot:'#f2a160'}" stroke-width="7" stroke-linecap="round" fill="none"/>`;}).join('')}
  <path d="M250 216q14-30 36-14q-14 20-36 14M330 210q20-24 38-6q-18 18-38 6" fill="${C.leaf}"/><circle cx="300" cy="236" r="6" fill="#e9c46a"/><circle cx="270" cy="250" r="5" fill="#e9c46a"/>`));
 svg('dish-juice',D,D,cutout(`<path d="M210 120H390L370 520Q368 540 348 540H252Q232 540 230 520Z" fill="#f8f2e4"/><path d="M216 220H384L370 520Q368 532 348 532H252Q232 532 230 520Z" fill="${C.carrot}"/>
  <path d="M216 220Q300 240 384 220" stroke="#f3b47c" stroke-width="8" fill="none"/><path d="M330 120L370 20" stroke="${C.leaf}" stroke-width="14" stroke-linecap="round"/>
  <circle cx="230" cy="150" r="48" fill="#f3e07a"/><circle cx="230" cy="150" r="36" fill="#f8ec9e"/><path d="M230 114V186M194 150H266M205 125L255 175M255 125L205 175" stroke="#f3e07a" stroke-width="4"/>`));
 svg('dish-soup',D,D,cutout(`<path d="M100 320Q110 500 300 506Q490 500 500 320Z" fill="#fbf6ea"/><ellipse cx="300" cy="320" rx="200" ry="56" fill="#fbf6ea"/><ellipse cx="300" cy="324" rx="172" ry="40" fill="#f2a64d"/>
  <path d="M170 322q60-20 130-2q70 18 130-2" stroke="#f7c27a" stroke-width="8" fill="none" stroke-linecap="round"/>
  ${[[250,300,-12],[300,320,10],[350,296,-6]].map(([x,y,a])=>`<rect x="${x-14}" y="${y-12}" width="28" height="24" rx="4" fill="#d99a52" transform="rotate(${a} ${x} ${y})"/>`).join('')}
  ${[220,300,380].map(x=>`<path d="M${x} 250q-20-34 0-64q20-30 0-60" stroke="${C.cream}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".9"/>`).join('')}`));
 svg('dish-burger',D,D,cutout(`<path d="M120 300Q126 180 300 172Q474 180 480 300Z" fill="#e4ad6c"/>${[[230,230],[290,206],[350,230],[310,262]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="8" ry="5" fill="#fff6dd"/>`).join('')}
  <path d="M110 306Q150 282 190 308Q230 282 270 308Q310 282 350 308Q390 282 430 308Q470 284 490 306L482 326H118Z" fill="#7fa564"/>
  <path d="M124 338H476" stroke="${C.carrot}" stroke-width="26" stroke-linecap="round"/>${[150,200,250,300,350,400,450].map(x=>`<path d="M${x} 330l14 16" stroke="${C.carrotDark}" stroke-width="4"/>`).join('')}
  <rect x="120" y="356" width="360" height="44" rx="20" fill="#6b4a37"/><path d="M122 412H478Q474 486 300 490Q126 486 122 412Z" fill="#dc9c5c"/>`));
 svg('dish-pickle',D,D,cutout(`<rect x="170" y="150" width="260" height="380" rx="44" fill="#eef4ee"/><rect x="186" y="230" width="228" height="284" rx="34" fill="#f4e7b4" opacity=".85"/>
  ${[210,250,290,330,370].map((x,i)=>`<rect x="${x}" y="${250+(i%2)*20}" width="26" height="${230-(i%2)*20}" rx="12" fill="${i%2?'#f0a35e':C.carrot}"/>`).join('')}
  <path d="M230 300q30-40 14-70M330 290q-10-40 20-60" stroke="${C.leaf}" stroke-width="6" fill="none"/>${[[240,420],[310,380],[360,450]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#c9b36a"/>`).join('')}
  <rect x="160" y="110" width="280" height="56" rx="14" fill="${C.carrot}"/><rect x="200" y="330" width="200" height="70" rx="10" fill="${C.paper}"/><text x="300" y="376" text-anchor="middle" font-family="Gowun Batang,Batang,serif" font-size="30" font-weight="700" fill="${C.ink}">PICKLE</text>`));
}

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
console.log('Wrote the chapter art to public/art.');
