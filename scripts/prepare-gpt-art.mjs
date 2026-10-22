/**
 * Turns the painted layers made with GPT (art-src/gpt/page-N/*.png, transparent cut-outs plus one opaque backdrop) into pop-up card
 * textures: trimmed to the painted silhouette, given the cream die-cut border of the paper cards, sized for how large the card can
 * appear, saved as WebP in public/art-raster. The backdrop is cropped to its landscape band and framed as a card with a cream border
 * on its sides and top (none at its foot).
 * Run: node scripts/prepare-gpt-art.mjs [page-N]   (prints each card's aspect, which src/story.ts uses for the layer size)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {pathFloor} from './street-floor.mjs';
import {farmFloor} from './farm-floor.mjs';
import {oakFloor} from './kitchen-floor.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/eh1al/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=createRequire(path.join(runtime,'package.json'))('sharp');

// width: texture width in pixels, about 200 px per world unit of the card's largest on-screen size.
const art=[
 // Chapter 1 (v2, art-src/gpt/page-1/new, laid out after its 전체화면.png sketch): a sunny Gujwa view with oreum and wind turbines behind,
 // a tool shed on the left page with the fly swatter and torch for the night rounds hanging on its wall, the farmer and the crate of carrots
 // on the right. The floor (the yard, the basalt wall and the carrot field beyond it) is one painting printed on the page (farm-floor.mjs).
 {dir:'page-1',name:'farm-back',src:'new/1페이지-배경',width:1440,backdrop:{top:0,bottom:773}},
 // The phone's upright page (1.9:1) shows the left part of the same painting, where the sun sets over the sea.
 {dir:'page-1',name:'farm-back-phone',src:'new/1페이지-배경',width:1440,backdrop:{top:0,bottom:773,left:0,right:1477}},
 // The shed and the dog have no cream die-cut border (the user preferred their own painted edge).
 {dir:'page-1',name:'farm-shed',src:'new/빈티지 도구가 있는 나무 헛간',width:1100,clean:60,plain:true},
 {dir:'page-1',name:'farm-swatter',src:'new/빈티지 파리채와 손전등',width:300,clean:60},
 {dir:'page-1',name:'char-farmer',src:'new/당근을 든 미소 짓는 농부-아침7시-좌측빛',width:440,clean:60,shadow:{pad:.04,spread:.62,alpha:.45}},
 // A Jeju dog asleep, curled up at the farmer's feet; a soft shadow under it so it lies on the ground.
 {dir:'page-1',name:'farm-dog',src:'new/제주강아지-웅크린잠자는자세-그림책',width:900,clean:60,plain:true,shadow:{pad:.08,spread:.9,alpha:.42}},
 {dir:'page-1',name:'farm-crate',src:'new/흙 묻은 당근이 가득한 나무 상자',width:560,clean:60},
 // The carrot field in morning light behind a basalt wall seen in perspective, standing behind the farmer and the crate from the right
 // page's outer edge to behind the shed. No die-cut border: the field's own edge meets the floor.
 {dir:'page-1',name:'farm-carrots',src:'new/당근밭-제주현무암재배치-직각윤곽-1500x450',width:1600,clean:60,plain:true},
 // The phone's flat page: the muddy yard laid out for the flat page's UVs and for the turning sheet's (see village-floor-stage below).
 {dir:'page-1',name:'farm-floor-stage',floor:'farm',stage:'page'},
 {dir:'page-1',name:'farm-floor-stage-sheet',floor:'farm',stage:'sheet'},
 {dir:'page-2',name:'village-back',src:'village-back-clouds-lowered-v2',width:1440,backdrop:{top:230,bottom:844}},
 // Chapter 2 (v3): the three real shops (sonongroad, manoa, buggercarrot), the traveler and a mother walking with her
 // daughter and a stroller. Things standing on the page get a soft contact shadow (see the `shadow` note below).
 // The cobbled street (scripts/street-floor.mjs) as the phone's flat page: 'stage' is laid out for the flat page's UVs (the road runs along the page's depth, far edge on
 // the left), 'stage-sheet' for the turning sheet's (near edge at the top, upright). Both are full-bleed page textures, 1080 × 1446 / 1446 × 1080.
 {dir:'page-2',name:'village-floor-stage',src:'village-floor',stage:'page'},
 {dir:'page-2',name:'village-floor-stage-sheet',src:'village-floor',stage:'sheet'},
 // The shops are drawn turned toward the street's centre line (the v4 renderings): buggercarrot at the left end, manoa behind it, sonongroad at the right.
 {dir:'page-2',name:'sonongroad',src:'sonongroad-mobile',width:1100,clean:48},
 {dir:'page-2',name:'manoa',src:'manoa-mobile',width:1000,clean:48},
 {dir:'page-2',name:'buggercarrot',src:'buggercarrot-mobile',width:900,clean:90},
 // The phone's standing book shows buggercarrot from the front (the original rendering).
 // The phone's standing book has its own renderings of the three shops (…-mobile), facing the reader, and a narrower street for its upright page.
 {dir:'page-2',name:'char-traveler',width:300,clean:48,shadow:{pad:.04,spread:.6,alpha:.45}},
 {dir:'page-2',name:'family-walk',width:900,clean:48,shadow:{pad:.05,spread:.8,alpha:.45}},
 // The kitchen (v4, art-src/gpt/page-3/new/new2): a Jeju kitchen wall with a window on the sea, an old fridge on the left page with four
 // magnet notes on its door, and a low table on the right with "나만의 레시피" lying on it. The notes, fridge and table carry their own edges
 // (no die-cut border); the recipe book is a die-cut card like the other clickable things.
 // The wall (jeju-kitchen-dish-shelf, 1445×1088): the open book shows 40–700 px — the painting slid up a little (the user's choice), so the
 // tip of the pot's lid (669 px down) reaches the wall's foot, where the table in front hides it; taller than about 3 units at this width,
 // the wall would leave the frame while a page turns and reach the chapter heading. The phone's upright page (1.91:1) shows all of it, top to bottom, so it looks as little zoomed as possible: the painting is
 // widened to that shape with its own plain plaster (550 px of the left side mirrored, behind the fridge; the 46 px right of the window
 // mirrored back and forth).
 {dir:'page-3',name:'kitchen-back',src:'new/new2/jeju-kitchen-dish-shelf-high-resolution',width:1440,backdrop:{top:40,bottom:700}},
 {dir:'page-3',name:'kitchen-back-phone',src:'new/new2/jeju-kitchen-dish-shelf-high-resolution',width:1440,backdrop:{top:0,bottom:1088,widen:{left:550,right:83,edge:46}}},
 // The phone's flat page: the honey-oak floorboards (scripts/kitchen-floor.mjs), for the flat page's UVs and the turning sheet's.
 {dir:'page-3',name:'kitchen-floor-stage',floor:'kitchen',stage:'page'},
 {dir:'page-3',name:'kitchen-floor-stage-sheet',floor:'kitchen',stage:'sheet'},
 // Simple contact shadows, no shadows of the legs: a soft box under the fridge, a soft oval under the table.
 {dir:'page-3',name:'kitchen-fridge',src:'new/new2/fridge-with-plant-wider-base',width:760,clean:90,plain:true,shadow:{shape:'rect',pad:.035,spread:.95,alpha:.5,cx:.537}},
 {dir:'page-3',name:'kitchen-table-low',src:'new/new2/simple-table-no-book',width:1400,clean:110,plain:true,shadow:{pad:.09,spread:.86,alpha:.5}},
 {dir:'page-3',name:'my-recipe-book',src:'new/new2/my-recipe-book',width:700,clean:150},
 {dir:'page-3',name:'magnet-gnocchi',src:'new/new2/magnet-carrot-gnocchi',width:420,clean:90,plain:true},
 {dir:'page-3',name:'magnet-gimbap',src:'new/new2/magnet-carrot-gimbap',width:420,clean:90,plain:true},
 {dir:'page-3',name:'magnet-cheese-jeon',src:'new/new2/magnet-carrot-cheese-jeon',width:420,clean:90,plain:true},
 {dir:'page-3',name:'magnet-blank',src:'new/new2/magnet-blank',width:420,clean:90,plain:true},
 // Earlier kitchen pieces, no longer in the book (kept so their WebP files can be rebuilt).
 {dir:'page-3',name:'prep-table',src:'new/prep-table',width:1500,clean:110,plain:true,cast:{dy:.1,blur:.011,alpha:.55,rows:.8}},
 {dir:'page-3',name:'recipe-booklet',src:'new/recipe-booklet',width:760,clean:150,cast:{dy:.045,blur:.008,alpha:.6}},
 {dir:'page-3',name:'note-gnocchi',src:'note-carrot-gnocchi',width:520,clean:90,plain:true},
 {dir:'page-3',name:'note-gimbap',src:'note-carrot-gimbap',width:520,clean:90,plain:true},
 {dir:'page-3',name:'note-cheese-jeon',src:'note-carrot-cheese-jeon',width:520,clean:90,plain:true},
 {dir:'page-3',name:'note-blank',src:'new/note-blank',width:520,clean:90,plain:true},
 // The earlier notes are no longer on the wall; their pictures still illustrate the recipes in the structured data (src/seo.ts).
 {dir:'page-3',name:'note-rape',src:'new/note-carrot-rape',width:520,clean:90,plain:true},
 {dir:'page-3',name:'note-soup',src:'new/note-carrot-soup',width:520,clean:90,plain:true},
 {dir:'page-3',name:'note-pickle',src:'new/note-carrot-pickles',width:520,clean:90,plain:true},
 {dir:'page-3',name:'note-burger',src:'new/note-carrot-burger',width:620,clean:90,plain:true},
 {dir:'page-3',name:'note-roast',src:'new/note-carrot-roast',width:520,clean:90,plain:true},
 {dir:'page-3',name:'note-juice',src:'new/note-carrot-juice',width:520,clean:90,plain:true},
 {dir:'page-3',name:'dish-rape',width:480},
 {dir:'page-3',name:'dish-soup',width:520},
 {dir:'page-3',name:'dish-pickle',width:360},
 {dir:'page-3',name:'dish-plate',width:520,shadow:{pad:.1,spread:.85,alpha:.5}},
 {dir:'page-3',name:'dish-juice',width:400,shadow:{pad:.07,spread:.8,alpha:.5}},
 {dir:'page-3',name:'dish-burger',width:480,shadow:{pad:.1,spread:.85,alpha:.5}},
];
const CREAM='#fff9e9';
/**
 * A page's light, so the standing cards sit in the same air as their backdrop: split toning (shadows pulled toward `shadow`, highlights
 * toward `light`), a little less saturation and brightness. Applied to the whole card, die-cut border included (paper in that light).
 */
// Empty: the painted cards keep their own colours (the user preferred them); a page can opt in if it ever needs it.
const GRADES={
};
async function grade(image,{shadow,light,strength,saturation,brightness}){
 const {data,info}=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true}),px=new Uint8ClampedArray(data.buffer,data.byteOffset,data.length);
 for(let i=0;i<px.length;i+=4){
  if(px[i+3]===0)continue;
  const r=px[i]/255,g=px[i+1]/255,b=px[i+2]/255,l=.299*r+.587*g+.114*b;
  const out=[r,g,b].map((c,k)=>{const toned=c*(1-strength)+strength*(l<.5?2*l*shadow[k]:1-2*(1-l)*(1-light[k]));return (l+(toned-l)*saturation)*brightness;});
  px[i]=out[0]*255;px[i+1]=out[1]*255;px[i+2]=out[2]*255;
 }
 return sharp(data,{raw:{width:info.width,height:info.height,channels:4}});
}

/** Drops the faint halo GPT leaves around some cut-outs (alpha below `floor`), so it neither widens the die-cut border nor shows as a fringe. */
async function cleaned(file,floor){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=3;i<data.length;i+=4)if(data[i]<floor)data[i]=0;
 return sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
}
/** A finished paper object (a post-it with its own edge and shadow): resized as it is, without the die-cut border. */
async function plain(file,width){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=-1,y1=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=10){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const image=sharp(file).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(width),{width:w,height:h}=await sharp(await image.png().toBuffer()).metadata();
 return {image,w,h};
}
/** A soft elliptical contact shadow under a card's foot: extends the card downward by `pad` of its height and draws the shadow beneath it. */
// `shape` 'rect' gives a soft box instead (a fridge's footprint); `cx` centres it under the body when the picture is not centred (a plant
// hanging off one side).
async function grounded(card,w,h,{pad,spread,alpha,shape='ellipse',cx=.5}){
 const extra=Math.round(h*pad),total=h+extra,rx=Math.round(w*spread/2),ry=Math.max(3,Math.round(extra*.62)),x=Math.round(w*cx);
 const form=shape==='rect'
  ?`<rect x="${x-rx}" y="${h-Math.round(extra*.55)}" width="${rx*2}" height="${Math.round(extra*1.1)}" rx="${Math.round(extra*.3)}" fill="#2a1608" fill-opacity="${alpha}"/>`
  :`<ellipse cx="${x}" cy="${h-Math.round(extra*.12)}" rx="${rx}" ry="${ry}" fill="#2a1608" fill-opacity="${alpha}"/>`;
 const ellipse=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${total}">${form}</svg>`);
 const shadow=await sharp(ellipse).blur(Math.max(2,extra*.32)).png().toBuffer();
 const image=sharp({create:{width:w,height:total,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:shadow},{input:await card.png().toBuffer(),top:0,left:0}]);
 return {image,w,h:total,pad:extra/total};
}
/** A shadow that follows the card's own silhouette: the card's shape, darkened, softened and moved down by `dy` of its height (only the top `rows` of it casts, so a table's legs throw none), drawn beneath it (the canvas grows by that much). Used for things lying or standing close to the page, where an oval would float apart from them. */
async function cast(card,w,h,{dy,blur,alpha,rows=1}){
 const shift=Math.round(h*dy),total=h+shift,png=await card.png().toBuffer();
 const {data}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const shape=Buffer.alloc(w*total*4);
 for(let y=0;y<Math.round(h*rows);y++)for(let x=0;x<w;x++){const o=((y+shift)*w+x)*4;shape[o]=0x2a;shape[o+1]=0x16;shape[o+2]=0x08;shape[o+3]=Math.round(data[(y*w+x)*4+3]*alpha);}
 const soft=await sharp(shape,{raw:{width:w,height:total,channels:4}}).blur(Math.max(.5,w*blur)).png().toBuffer();
 const image=sharp({create:{width:w,height:total,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:soft},{input:png,top:0,left:0}]);
 return {image,w,h:total,pad:shift/total};
}
async function cutout(file,width){
 // Trim to the solid silhouette (soft alpha fringes below 24 are dropped), then grow a cream die-cut border under it.
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=-1,y1=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=24){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const border=Math.max(4,Math.round(width*.016)),pad=border*2;
 const body=await sharp(file).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(width-pad*2).png().toBuffer();
 const framed=await sharp(body).extend({top:pad,bottom:pad,left:pad,right:pad,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
 const {width:w,height:h}=await sharp(framed).metadata();
 const mask=await sharp(framed).extractChannel('alpha').blur(border*.7).threshold(6).toBuffer();
 const cream=await sharp({create:{width:w,height:h,channels:3,background:CREAM}}).joinChannel(mask).png().toBuffer();
 return {image:sharp(cream).composite([{input:framed}]),w,h};
}
/**
 * Widens a painting by mirroring its own plain edges: `left` px of its left side, flipped, before it; after it, its last `edge` px
 * (plain wall right of the window), flipped back and forth until `right` px are filled. Coordinates (top, bottom, left, right) of the
 * backdrop crop then refer to the widened picture.
 */
async function widened(file,{left=0,right=0,edge=right}){
 const {width:w,height:h}=await sharp(file).metadata(),parts=[];
 if(left)parts.push({input:await sharp(file).extract({left:0,top:0,width:left,height:h}).flop().png().toBuffer(),left:0,top:0});
 parts.push({input:await sharp(file).png().toBuffer(),left,top:0});
 for(let x=0,flip=true;x<right;x+=edge,flip=!flip){const n=Math.min(edge,right-x);const strip=sharp(file).extract({left:flip?w-n:w-edge,top:0,width:n,height:h});parts.push({input:await (flip?strip.flop():strip).png().toBuffer(),left:left+w+x,top:0});}
 return sharp({create:{width:w+left+right,height:h,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts).png().toBuffer();
}
async function backdrop(file,width,{top,bottom,left=0,right,overlays=[],widen}){
 if(overlays.length){
  const pasted=await Promise.all(overlays.map(async o=>({input:await sharp(path.join(project,'art-src/gpt/page-3',o.file)).resize(o.width).png().toBuffer(),left:o.left,top:o.top})));
  file=await sharp(file).composite(pasted).png().toBuffer();
 }
 if(widen)file=await widened(file,widen);
 const meta=await sharp(file).metadata(),border=Math.round(width*.008),radius=Math.round(width*.014);
 const inner=width-border*2,band=await sharp(file).extract({left,top,width:(right??meta.width)-left,height:bottom-top}).resize(inner).png().toBuffer();
 // The cream border runs along the sides and the top only: at the foot the painting meets the printed floor directly.
 const {height:ih}=await sharp(band).metadata(),w=width,h=ih+border;
 // Rounded top corners, square foot (the rectangle runs on below the canvas, so its lower corners are cut off).
 const round=(rw,rh,r)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${rw}" height="${rh}"><rect width="${rw}" height="${rh+r*2}" rx="${r}" fill="#fff"/></svg>`);
 const painted=await sharp(band).composite([{input:round(inner,ih,Math.max(2,radius-border)),blend:'dest-in'}]).png().toBuffer();
 const card=await sharp({create:{width:w,height:h,channels:4,background:CREAM}}).composite([{input:round(w,h,radius),blend:'dest-in'},{input:painted,left:border,top:border}]).png().toBuffer();
 return {image:sharp(card),w,h};
}
const only=process.argv[2]; // e.g. "page-3": prepare just that page's art
for(const item of art){
 if(only&&item.dir!==only)continue;
 let file=path.join(project,'art-src/gpt',item.dir,`${item.src??item.name}.png`);
 if(item.stage){
  const flat=item.stage==='page',floor=item.floor==='farm'?await farmFloor(sharp,project,1446,1080,{top:0}):item.floor==='kitchen'?await oakFloor(sharp,project,1446,1080):await pathFloor(sharp,project,1446,1080,{widenRight:{dx:.12,u0:.62,v0:.42,v1:1}});
  const buf=await sharp(floor).rotate(flat?270:180).webp({quality:item.floor==='farm'?90:84,effort:5}).toBuffer();
  await fs.writeFile(path.join(project,'public/art-raster',`${item.name}.webp`),buf);console.log(`${item.name}: ${(buf.length/1024).toFixed(0)} KiB (floor texture)`);continue;
 }
 if(item.clean)file=await cleaned(file,item.clean);
 // `shear`: the rendering leans (its horizontals run downhill); a vertical shear by this slope levels them, so the building stands square.
 if(item.shear)file=await sharp(file).ensureAlpha().affine([[1,0],[-item.shear,1]],{background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
 let {image,w,h}=item.backdrop?await backdrop(file,item.width,item.backdrop):item.plain?await plain(file,item.width):await cutout(file,item.width);
 let padNote='';
 if(item.shadow||item.cast){const g=item.cast?await cast(image,w,h,item.cast):await grounded(image,w,h,item.shadow);image=g.image;h=g.h;padNote=`, foot padding ${(g.pad*100).toFixed(1)}%`;}
 if(!item.backdrop&&GRADES[item.dir])image=await grade(sharp(await image.png().toBuffer()),GRADES[item.dir]);
 const out=await image.webp({quality:88,alphaQuality:100,effort:5}).toBuffer();
 await fs.writeFile(path.join(project,'public/art-raster',`${item.name}.webp`),out);
 console.log(`${item.name}: ${w}×${h} (aspect ${(w/h).toFixed(3)}), ${(out.length/1024).toFixed(0)} KiB${padNote}`);
}
