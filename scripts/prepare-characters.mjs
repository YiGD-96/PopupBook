/**
 * Copies the project's character vectors (from the carrot character folder) into art-src/characters and turns each into a pop-up
 * cut-out texture: rasterized, given a cream die-cut border like the paper cards, saved as WebP in public/art-raster.
 * The vectors are large traced drawings, so only the WebP ships. Run: node scripts/prepare-characters.mjs [source folder]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/eh1al/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=createRequire(path.join(runtime,'package.json'))('sharp');
const source=process.argv[2]||'C:/Users/eh1al/Documents/workspace/carrot/02_캐릭터';
const characters=[
 // The farmer and the pony of chapter 1 are now painted (scripts/prepare-gpt-art.mjs); their vectors stay in art-src/characters.
 // The traveler of chapter 2 is now painted too (scripts/prepare-gpt-art.mjs); nothing is left to convert here.
];
const keep=path.join(project,'art-src/characters');await fs.mkdir(keep,{recursive:true});
for(const {name,file,width} of characters){
 const original=path.join(source,file),copy=path.join(keep,`${name}.svg`);
 try{await fs.copyFile(original,copy);}catch{await fs.access(copy);}
 const border=Math.round(width*.022),pad=border*2;
 const body=await sharp(copy,{density:144}).resize(width-pad*2).png().toBuffer();
 const framed=await sharp(body).extend({top:pad,bottom:pad,left:pad,right:pad,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
 const {width:w,height:h}=await sharp(framed).metadata();
 // The die-cut: the silhouette grown by `border` pixels, filled with the paper cream, under the drawing.
 const mask=await sharp(framed).extractChannel('alpha').blur(border*.7).threshold(6).toBuffer();
 const cream=await sharp({create:{width:w,height:h,channels:3,background:'#fff9e9'}}).joinChannel(mask).png().toBuffer();
 const out=await sharp(cream).composite([{input:framed}]).webp({quality:90,alphaQuality:100,effort:5}).toBuffer();
 await fs.writeFile(path.join(project,'public/art-raster',`${name}.webp`),out);
 console.log(`${name}: ${w}×${h}, ${(out.length/1024).toFixed(0)} KiB`);
}
