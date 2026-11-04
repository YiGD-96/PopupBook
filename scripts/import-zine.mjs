/**
 * Brings the recipe content of the 3D-character webzine (../3D캐릭터 웹진, the team's static site) into the book, so the fridge on the third
 * spread opens all of it (src/FridgeBook.tsx): the ingredient dictionary, the 15 recipes (ingredients with required/optional and confirmed
 * substitutes, steps, tips, the three Shorts) and their photos, plus the pony character and the carrot (the phone's tap hint). The webzine stays the source: change it there
 * (its js/data.js, media/recipes) and run this again.
 *   node scripts/import-zine.mjs
 * Writes src/zine-data.json and public/media/zine/*.webp. Environment: CODEX_NODE_MODULES (sharp), as scripts/prepare-gpt-art.mjs.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const zine=path.resolve(project,'..','3D캐릭터 웹진');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/eh1al/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=createRequire(path.join(runtime,'package.json'))('sharp');
// The webzine's data module is UMD: required here it hands back its object (module.exports).
const Z=createRequire(import.meta.url)(path.join(zine,'js/data.js'));

const out=path.join(project,'public/media/zine');
await fs.mkdir(out,{recursive:true});
const recipes=[];
for(const r of Z.RECIPES){
 const file=`recipe-${r.id}.webp`;
 const image=await sharp(path.join(zine,r.photo)).rotate().resize({width:720,withoutEnlargement:true}).webp({quality:80,effort:5}).toBuffer();
 await fs.writeFile(path.join(out,file),image);
 const meta=await sharp(image).metadata();
 recipes.push({id:r.id,name:r.name,meal:r.meal,source:r.source,desc:r.desc,tags:r.tags,servings:r.servings,
  photo:`/media/zine/${file}`,photoW:meta.width,photoH:meta.height,
  ingredients:r.ingredients.map(i=>({id:i.id,label:i.label,qty:i.qty||'',req:!!i.req,...(i.sub?{sub:true}:{})})),
  ...(r.subs?{subs:r.subs}:{}),steps:r.steps,tip:r.tip||null,...(r.video?{video:{id:r.video.id,title:r.video.title,duration:r.video.duration}}:{}),
  related:r.related||[]});
 console.log(`${file}: ${meta.width}×${meta.height}, ${(image.length/1024).toFixed(0)} KiB`);
}
{
 const pony=await sharp(path.join(zine,'media/character/pony-full.webp')).resize({width:320}).webp({quality:82,alphaQuality:90,effort:5}).toBuffer();
 await fs.writeFile(path.join(out,'pony.webp'),pony);
 console.log(`pony.webp: ${(pony.length/1024).toFixed(0)} KiB`);
}
{
 // The webzine's 3D carrot: the tap hint that wobbles on the phone's clickable cards (src/standingBook.tsx TapCarrot).
 // A soft dark shadow is baked around it, so it stands out on the cards' orange glow.
 const body=await sharp(path.join(zine,'media/character/carrot.webp')).trim().resize({width:220}).png().toBuffer();
 const {width:cw,height:ch}=await sharp(body).metadata(),pad=24;
 const blurred=await sharp(body).extend({top:pad,bottom:pad,left:pad,right:pad,background:{r:0,g:0,b:0,alpha:0}}).ensureAlpha().extractChannel('alpha').blur(9).linear(.55,0).toBuffer();
 const shade=await sharp({create:{width:cw+pad*2,height:ch+pad*2,channels:3,background:'#2a1608'}}).joinChannel(blurred).png().toBuffer();
 const carrot=await sharp(shade).composite([{input:body,left:pad,top:pad-4}]).webp({quality:84,alphaQuality:90,effort:5}).toBuffer();
 await fs.writeFile(path.join(out,'carrot.webp'),carrot);
 const meta=await sharp(carrot).metadata();
 console.log(`carrot.webp: ${meta.width}×${meta.height}, ${(carrot.length/1024).toFixed(0)} KiB`);
}
const data={source:'3D캐릭터 웹진 js/data.js',categories:Z.CATEGORIES,ingredients:Z.INGREDIENTS,prefs:Z.PREFS,meals:Z.MEALS,recipes};
await fs.writeFile(path.join(project,'src/zine-data.json'),JSON.stringify(data,null,1)+'\n');
console.log(`src/zine-data.json: ${recipes.length} recipes, ${Object.keys(Z.INGREDIENTS).length} ingredients`);
