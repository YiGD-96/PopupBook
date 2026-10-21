/**
 * Turns the painted layers made with GPT (art-src/gpt/page-N/*.png, transparent cut-outs plus one opaque backdrop) into pop-up card
 * textures: trimmed to the painted silhouette, given the cream die-cut border of the paper cards, sized for how large the card can
 * appear, saved as WebP in public/art-raster. The backdrop is cropped to its landscape band and framed as a rounded card.
 * Run: node scripts/prepare-gpt-art.mjs [page-N]   (prints each card's aspect, which src/story.ts uses for the layer size)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {streetFloor} from './street-floor.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/eh1al/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=createRequire(path.join(runtime,'package.json'))('sharp');

// width: texture width in pixels, about 200 px per world unit of the card's largest on-screen size.
const art=[
 {dir:'page-1',name:'farm-back',width:1440,backdrop:{top:200,bottom:790}},
 {dir:'page-1',name:'farm-trees-left',width:440},
 {dir:'page-1',name:'farm-trees-right',width:400},
 {dir:'page-1',name:'farm-field',width:1440},
 {dir:'page-1',name:'char-pony',width:420},
 {dir:'page-1',name:'char-farmer',width:400},
 {dir:'page-1',name:'farm-crate',width:560},
 {dir:'page-1',name:'farm-wall',width:1280},
 {dir:'page-1',name:'farm-lantern',width:280},
 {dir:'page-2',name:'village-back',width:1440,backdrop:{top:200,bottom:800}},
 // Chapter 2 (v3): the three real shops (sonongroad, manoa, buggercarrot), the traveler and a mother walking with her
 // daughter and a stroller. Things standing on the page get a soft contact shadow (see the `shadow` note below).
 // The cobbled street (scripts/street-floor.mjs) as the phone's flat page: 'stage' is laid out for the flat page's UVs (the road runs along the page's depth, far edge on
 // the left), 'stage-sheet' for the turning sheet's (near edge at the top, upright). Both are full-bleed page textures, 1080 × 1446 / 1446 × 1080.
 {dir:'page-2',name:'village-floor-stage',src:'village-floor',stage:'page'},
 {dir:'page-2',name:'village-floor-stage-sheet',src:'village-floor',stage:'sheet'},
 // The shops are drawn turned toward the street's centre line (the v4 renderings): buggercarrot at the left end, manoa behind it, sonongroad at the right.
 {dir:'page-2',name:'sonongroad',src:'sonongroad-right-v4',width:1100,clean:48},
 {dir:'page-2',name:'manoa',src:'manoa-turn-v4',width:1000,clean:48},
 {dir:'page-2',name:'buggercarrot',src:'buggercarrot-left-v4',width:900,clean:48},
 {dir:'page-2',name:'char-traveler',width:300,clean:48,shadow:{pad:.04,spread:.6,alpha:.45}},
 {dir:'page-2',name:'family-walk',width:900,clean:48,shadow:{pad:.05,spread:.8,alpha:.45}},
 // The kitchen (v2): tiled wall with a string for the notes, a round table, the table's things, post-it papers. Cards that stand on the table
 // or the page get a soft contact shadow under their foot (`shadow`: padding as a fraction of the card's height, ellipse width as a fraction of its width).
 {dir:'page-3',name:'kitchen-back',width:1440,backdrop:{top:56,bottom:677}},
 {dir:'page-3',name:'kitchen-table-round',width:1100,clean:48,shadow:{pad:.05,spread:.4,alpha:.5}},
 {dir:'page-3',name:'kitchen-pot',width:520,clean:48,shadow:{pad:.09,spread:.8,alpha:.5}},
 {dir:'page-3',name:'kitchen-kettle',width:480,clean:48,shadow:{pad:.09,spread:.8,alpha:.5}},
 {dir:'page-3',name:'kitchen-basket',width:560,clean:48,shadow:{pad:.07,spread:.85,alpha:.45}},
 {dir:'page-3',name:'note-rape-card',width:520,plain:true},
 {dir:'page-3',name:'note-soup-card',width:520,plain:true},
 {dir:'page-3',name:'note-pickle-card',width:520,plain:true},
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
async function grounded(card,w,h,{pad,spread,alpha}){
 const extra=Math.round(h*pad),total=h+extra,rx=Math.round(w*spread/2),ry=Math.max(3,Math.round(extra*.62));
 const ellipse=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${total}"><ellipse cx="${w/2}" cy="${h-Math.round(extra*.12)}" rx="${rx}" ry="${ry}" fill="#2a1608" fill-opacity="${alpha}"/></svg>`);
 const shadow=await sharp(ellipse).blur(Math.max(2,extra*.32)).png().toBuffer();
 const image=sharp({create:{width:w,height:total,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:shadow},{input:await card.png().toBuffer(),top:0,left:0}]);
 return {image,w,h:total,pad:extra/total};
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
async function backdrop(file,width,{top,bottom,overlays=[]}){
 if(overlays.length){
  const pasted=await Promise.all(overlays.map(async o=>({input:await sharp(path.join(project,'art-src/gpt/page-3',o.file)).resize(o.width).png().toBuffer(),left:o.left,top:o.top})));
  file=await sharp(file).composite(pasted).png().toBuffer();
 }
 const meta=await sharp(file).metadata(),border=Math.round(width*.008),radius=Math.round(width*.014);
 const inner=width-border*2,band=await sharp(file).extract({left:0,top,width:meta.width,height:bottom-top}).resize(inner).png().toBuffer();
 const {height:ih}=await sharp(band).metadata(),w=width,h=ih+border*2;
 const round=(rw,rh,r)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${rw}" height="${rh}"><rect width="${rw}" height="${rh}" rx="${r}" fill="#fff"/></svg>`);
 const painted=await sharp(band).composite([{input:round(inner,ih,Math.max(2,radius-border)),blend:'dest-in'}]).png().toBuffer();
 const card=await sharp({create:{width:w,height:h,channels:4,background:CREAM}}).composite([{input:round(w,h,radius),blend:'dest-in'},{input:painted,left:border,top:border}]).png().toBuffer();
 return {image:sharp(card),w,h};
}
const only=process.argv[2]; // e.g. "page-3": prepare just that page's art
for(const item of art){
 if(only&&item.dir!==only)continue;
 let file=path.join(project,'art-src/gpt',item.dir,`${item.src??item.name}.png`);
 if(item.stage){
  const flat=item.stage==='page',buf=await sharp(await streetFloor(sharp,project,1446,1080)).rotate(flat?270:180).webp({quality:84,effort:5}).toBuffer();
  await fs.writeFile(path.join(project,'public/art-raster',`${item.name}.webp`),buf);console.log(`${item.name}: ${(buf.length/1024).toFixed(0)} KiB (floor texture)`);continue;
 }
 if(item.clean)file=await cleaned(file,item.clean);
 let {image,w,h}=item.backdrop?await backdrop(file,item.width,item.backdrop):item.plain?await plain(file,item.width):await cutout(file,item.width);
 let padNote='';
 if(item.shadow){const g=await grounded(image,w,h,item.shadow);image=g.image;h=g.h;padNote=`, foot padding ${(g.pad*100).toFixed(1)}%`;}
 if(!item.backdrop&&GRADES[item.dir])image=await grade(sharp(await image.png().toBuffer()),GRADES[item.dir]);
 const out=await image.webp({quality:88,alphaQuality:100,effort:5}).toBuffer();
 await fs.writeFile(path.join(project,'public/art-raster',`${item.name}.webp`),out);
 console.log(`${item.name}: ${w}×${h} (aspect ${(w/h).toFixed(3)}), ${(out.length/1024).toFixed(0)} KiB${padNote}`);
}
