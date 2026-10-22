/**
 * The photos of the web-magazine pages (art-src/gpt/page-2-webzine for the shops, art-src/gpt/page-1/webzine for the farmer's story, whose two
 * photos were taken out of gujwa_carrot_webzine_responsive.html → public/media/webzine, WebP). Their file names are Korean in the source
 * folders; the pages (src/webzine.ts) refer to the short names below.
 *   node scripts/prepare-webzine.mjs
 * Environment: CODEX_NODE_MODULES (sharp), as scripts/prepare-gpt-art.mjs.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/eh1al/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=createRequire(path.join(runtime,'package.json'))('sharp');
const from=path.join(project,'art-src/gpt/page-2-webzine'),to=path.join(project,'public/media/webzine');
// A source starting with '../' is relative to art-src/gpt (the farmer's photos).
// name: [source file, widest side in pixels]
const photos={
 'soo-front':['소농로드 전경(웹진).png',1500],'soo-owner':['소농로드 사장님 인물샷.JPEG',1100],
 'soo-juice':['소농로드 당근주스(웹진).png',1100],'soo-latte':['당근라떼(웹진).png',800],'soo-sorbet':['당근레몬소르베(웹진).png',800],
 'manoa-front':['마노아 식당(웹진).png',1500],'manoa-owner':['마노아 사장님(웹진).png',1100],
 'manoa-soup':['마노아 당근수프(웹진).png',1000],'manoa-jam':['마노아 당근잼 (웹진).png',1000],'manoa-panini':['마노아 당근파니니&피클(웹진).png',1000],
 'manoa-field':['마노아 식당 뒤 당근밭(웹진).png',1300],
 'burger-front':['버거 캐럿 매장(웹진).png',1500],'burger-menu':['버거캐럿 메뉴(웹진).png',1500],
 'farmer-harvest':['../page-1/webzine/수확한 구좌 당근.jpg',1100],'farmer-field':['../page-1/webzine/구좌 당근밭.jpg',1200],
};
await fs.mkdir(to,{recursive:true});
for(const [name,[file,side]] of Object.entries(photos)){
 const out=await sharp(path.join(from,file)).rotate().resize({width:side,height:side,fit:'inside',withoutEnlargement:true}).webp({quality:82,effort:5}).toBuffer();
 await fs.writeFile(path.join(to,`${name}.webp`),out);
 const meta=await sharp(out).metadata();
 console.log(`${name}: ${meta.width}×${meta.height}, ${(out.length/1024).toFixed(0)} KiB`);
}
