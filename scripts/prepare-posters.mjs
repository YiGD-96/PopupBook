/**
 * The recipe posters of the third spread (art-src/gpt/page-3/new/poster → public/media/posters, WebP): one per dish and language. The
 * source names are Korean, with " en" / " ch" for the English and Chinese versions; the poster book (src/PosterBook.tsx) uses the short
 * names below, e.g. gnocchi-zh.webp. Also the real photo of each dish (art-src/gpt/page-3/new/new2/…_실사.png → photo-<dish>.webp), shown on
 * the poster book's left page. And the recipe call (gujwa-recipe-call-poster-transparent.png → public/media/recipe-share.webp), shown when the
 * "나만의 레시피" book is pressed (details.ts recipe-share `sheet`; its buttons' boxes are measured on each picture), with its English and
 * Chinese versions (recipe-call-en / -zh-cn-transparent.png → recipe-share-en / -zh.webp).
 *   node scripts/prepare-posters.mjs
 * Environment: CODEX_NODE_MODULES (sharp), as scripts/prepare-gpt-art.mjs.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/eh1al/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=createRequire(path.join(runtime,'package.json'))('sharp');
const from=path.join(project,'art-src/gpt/page-3/new/poster'),to=path.join(project,'public/media/posters');
const dishes={gnocchi:'당근 뇨끼',gimbap:'당근 김밥',jeon:'당근전'},langs={ko:'',en:' en',zh:' ch'};
await fs.mkdir(to,{recursive:true});
for(const [name,file] of Object.entries(dishes))for(const [lang,suffix] of Object.entries(langs)){
 const out=await sharp(path.join(from,`${file}${suffix}.png`)).resize({width:1024,withoutEnlargement:true}).webp({quality:86,effort:5}).toBuffer();
 await fs.writeFile(path.join(to,`${name}-${lang}.webp`),out);
 const meta=await sharp(out).metadata();
 console.log(`${name}-${lang}: ${meta.width}×${meta.height}, ${(out.length/1024).toFixed(0)} KiB`);
}
const photos={gnocchi:'당근 뇨끼_실사',gimbap:'당근김밥_실사',jeon:'당근치즈전_실사'};
for(const [name,file] of Object.entries(photos)){
 const out=await sharp(path.join(project,'art-src/gpt/page-3/new/new2',`${file}.png`)).resize({width:900,withoutEnlargement:true}).webp({quality:82,effort:5}).toBuffer();
 await fs.writeFile(path.join(to,`photo-${name}.webp`),out);
 const meta=await sharp(out).metadata();
 console.log(`photo-${name}: ${meta.width}×${meta.height}, ${(out.length/1024).toFixed(0)} KiB`);
}
// The recipe call in each language (recipe-share.webp is Korean; -en and -zh are shown to English and Chinese readers).
// The English picture came with a wider empty margin (its paper 939 × 1337 px, the others' about 1021 × 1418): its paper is cut out and
// scaled to the same height (1418 px, 10 px from the top, centred), so all three sheets show at one size.
async function samePaper(file){
 const trimmed=await sharp(file).trim({threshold:10}).png().toBuffer({resolveWithObject:true});
 const scale=1418/trimmed.info.height,w=Math.round(trimmed.info.width*scale);
 const paper=await sharp(trimmed.data).resize(w,1418).png().toBuffer();
 return sharp({create:{width:1086,height:1448,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:paper,left:Math.round((1086-w)/2),top:10}]).png().toBuffer();
}
for(const [name,file] of Object.entries({'recipe-share':'gujwa-recipe-call-poster-transparent','recipe-share-en':'recipe-call-en-transparent','recipe-share-zh':'recipe-call-zh-cn-transparent'})){
 const source=path.join(project,'art-src/gpt/page-3/new/new2',`${file}.png`);
 const out=await sharp(name==='recipe-share-en'?await samePaper(source):source).resize({width:1086,withoutEnlargement:true}).webp({quality:84,alphaQuality:90,effort:5}).toBuffer();
 await fs.writeFile(path.join(project,'public/media',`${name}.webp`),out);
 const meta=await sharp(out).metadata();
 console.log(`${name}: ${meta.width}×${meta.height}, ${(out.length/1024).toFixed(0)} KiB`);
}
