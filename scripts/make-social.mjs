/**
 * The link-preview image (public/media/og-image.jpg, 1200×630: the open book with the magazine's title) and the home-screen icon
 * (public/media/apple-touch-icon.png). Run after render-intro.mjs when the first spread changes: node scripts/make-social.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/eh1al/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=createRequire(path.join(runtime,'package.json'))('sharp');
const media=path.join(project,'public/media');
const W=1200,H=630,bg='#ece6d6';
const book=await sharp(path.join(media,'book-open.webp')).resize({height:560}).toBuffer();
const {width:bw}=await sharp(book).metadata();
const text=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
 <text x="64" y="232" font-family="Georgia,serif" font-size="15" letter-spacing="3.5" fill="#a07254">JEJU LOCAL MAGAZINE — VOL. 01</text>
 <text x="60" y="318" font-family="Gowun Batang,Batang,Malgun Gothic,serif" font-size="64" font-weight="700" fill="#186049">당근을 따라,</text>
 <text x="60" y="398" font-family="Gowun Batang,Batang,Malgun Gothic,serif" font-size="64" font-weight="700" fill="#186049">구좌</text>
 <text x="64" y="462" font-family="Malgun Gothic,Noto Sans KR,sans-serif" font-size="24" fill="#5e4738">어디서나 곁들임이던 채소가,</text>
 <text x="64" y="498" font-family="Malgun Gothic,Noto Sans KR,sans-serif" font-size="24" fill="#5e4738">구좌를 찾아오는 이유가 된다.</text>
 <text x="64" y="572" font-family="Malgun Gothic,Noto Sans KR,sans-serif" font-size="18" fill="#8a7a62">구좌 당근을 만나는 사람들 · 팝업북</text>
</svg>`);
await sharp({create:{width:W,height:H,channels:3,background:bg}})
 .composite([{input:book,left:W-bw+70,top:40},{input:text,left:0,top:0}])
 .jpeg({quality:86,progressive:true,mozjpeg:true}).toFile(path.join(media,'og-image.jpg'));
await sharp(path.join(project,'public/art/favicon.svg'),{density:600}).resize(180,180).png().toFile(path.join(media,'apple-touch-icon.png'));
for(const f of ['og-image.jpg','apple-touch-icon.png'])console.log(f,((await fs.stat(path.join(media,f))).size/1024).toFixed(0),'KiB');
