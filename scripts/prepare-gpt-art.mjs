/**
 * Turns the painted layers made with GPT (art-src/gpt/page-N/*.png, transparent cut-outs plus one opaque backdrop) into pop-up card
 * textures: trimmed to the painted silhouette, given the cream die-cut border of the paper cards, sized for how large the card can
 * appear, saved as WebP in public/art-raster. The backdrop is cropped to its landscape band and framed as a rounded card.
 * Run: node scripts/prepare-gpt-art.mjs   (prints each card's aspect, which src/story.ts uses for the layer size)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
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
 {dir:'page-2',name:'village-tree-left',width:440},
 {dir:'page-2',name:'village-tree-right',width:400},
 {dir:'page-2',name:'village-lane',width:1440},
 {dir:'page-2',name:'shop-a',width:720},
 {dir:'page-2',name:'shop-b',width:720},
 {dir:'page-2',name:'shop-c',width:560},
 {dir:'page-2',name:'char-traveler',width:300},
 {dir:'page-2',name:'village-front',width:1280},
 {dir:'page-3',name:'kitchen-back',width:1440,backdrop:{top:230,bottom:850}},
 {dir:'page-3',name:'kitchen-left',width:400},
 {dir:'page-3',name:'kitchen-right',width:400},
 {dir:'page-3',name:'kitchen-table',width:1440},
 {dir:'page-3',name:'dish-rape',width:480},
 {dir:'page-3',name:'dish-soup',width:520},
 {dir:'page-3',name:'dish-pickle',width:360},
 {dir:'page-3',name:'dish-plate',width:520},
 {dir:'page-3',name:'dish-juice',width:400},
 {dir:'page-3',name:'dish-burger',width:480},
 {dir:'page-3',name:'kitchen-front',width:960},
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
async function backdrop(file,width,{top,bottom}){
 const meta=await sharp(file).metadata(),border=Math.round(width*.008),radius=Math.round(width*.014);
 const inner=width-border*2,band=await sharp(file).extract({left:0,top,width:meta.width,height:bottom-top}).resize(inner).png().toBuffer();
 const {height:ih}=await sharp(band).metadata(),w=width,h=ih+border*2;
 const round=(rw,rh,r)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${rw}" height="${rh}"><rect width="${rw}" height="${rh}" rx="${r}" fill="#fff"/></svg>`);
 const painted=await sharp(band).composite([{input:round(inner,ih,Math.max(2,radius-border)),blend:'dest-in'}]).png().toBuffer();
 const card=await sharp({create:{width:w,height:h,channels:4,background:CREAM}}).composite([{input:round(w,h,radius),blend:'dest-in'},{input:painted,left:border,top:border}]).png().toBuffer();
 return {image:sharp(card),w,h};
}
for(const item of art){
 const file=path.join(project,'art-src/gpt',item.dir,`${item.name}.png`);
 let {image,w,h}=item.backdrop?await backdrop(file,item.width,item.backdrop):await cutout(file,item.width);
 if(!item.backdrop&&GRADES[item.dir])image=await grade(sharp(await image.png().toBuffer()),GRADES[item.dir]);
 const out=await image.webp({quality:88,alphaQuality:100,effort:5}).toBuffer();
 await fs.writeFile(path.join(project,'public/art-raster',`${item.name}.webp`),out);
 console.log(`${item.name}: ${w}×${h} (aspect ${(w/h).toFixed(3)}), ${(out.length/1024).toFixed(0)} KiB`);
}
