/**
 * Offline intro renderer. Production only decodes the resulting MP4 and stills.
 * 1. Rasterizes the SVG art to WebP (once) and bakes the bookbinding textures, including the moving cover's frames
 *    (from scripts/capture-site-cover.mjs, run that first to refresh the magazine cover).
 * 2. Films src/film.tsx — the live book's own meshes, materials and camera — in headless Chrome, frame by frame.
 * 3. Encodes the frames with FFmpeg and writes the cover/open stills, a storyboard and intro-meta.json.
 * Options: --raster-only [--all-raster], --materials-only, --stills (skip the MP4),
 * --standing (the phone intro, film.html?mode=standing, portrait 9:16: book-opening-standing.mp4, book-cover-standing.webp,
 *   book-open-standing.webp, … and intro-meta-standing.json; it films with the textures the open-book render baked, so step 1 is skipped).
 * Environment: CODEX_NODE_MODULES (sharp, @napi-rs/canvas), FFMPEG_PATH, CHROME_PATH, INTRO_WIDTH, INTRO_FPS, INTRO_CRF (x264 quality, 19),
 * INTRO_INSPECT (comma-separated times: only write those frames as PNG to INTRO_INSPECT_DIR).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {makeBookMaterials} from './book-materials.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/eh1al/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const require=createRequire(path.join(runtime,'package.json'));
const {createCanvas,loadImage}=require('@napi-rs/canvas'),sharp=require('sharp');
const ffmpeg=process.env.FFMPEG_PATH||'C:/Program Files/ffmpeg-8.0.1-essentials_build/bin/ffmpeg.exe';
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const standing=process.argv.includes('--standing'),suffix=standing?'-standing':'';
const width=Number(process.env.INTRO_WIDTH||(standing?720:968)),fps=Number(process.env.INTRO_FPS||60),crf=Number(process.env.INTRO_CRF||19);
const media=path.join(project,'public/media');const review=path.join(project,'intro-cache/review');await fs.mkdir(review,{recursive:true});await fs.mkdir(media,{recursive:true});
const raster=path.join(project,'public/art-raster');await fs.mkdir(raster,{recursive:true});

// 1. Art and binding textures.
// The art the intro film itself needs; --all-raster adds every other SVG in public/art.
// The cover art is not an SVG: book-materials.mjs takes it from the captured magazine cover (scripts/capture-site-cover.mjs).
// Chapter 1's scenery is painted (scripts/prepare-gpt-art.mjs), so only its pages are rasterized here.
const priority=['intro-pages','page-0-left','page-0-right'];
if(!standing){
const names=process.argv.includes('--all-raster')?[...priority,...(await fs.readdir(path.join(project,'public/art'))).filter(f=>f.endsWith('.svg')&&f!=='favicon.svg'&&!priority.includes(f.slice(0,-4))).map(f=>f.slice(0,-4))]:priority;
for(const name of names){
 const destination=path.join(raster,`${name}.webp`);
 try{await fs.access(destination);}catch{
  // Texture width follows how large the card can appear (about 1.3 world units for a dish, 2.1 for a shop, 7 for a backdrop).
  const textureWidth={cover:1128,carrot:360,favicon:64,'farm-crate':560}[name]??(name.startsWith('dish-')?480:name.startsWith('shop-')?720:name.startsWith('page-')?1080:1440);
  await fs.writeFile(destination,await sharp(path.join(project,`public/art/${name}.svg`)).resize(textureWidth).webp({quality:90,alphaQuality:100,effort:5}).toBuffer());console.log(`Rasterized ${name}`);
 }
}
if(process.argv.includes('--raster-only')){console.log(`Prepared ${names.length} WebP textures.`);process.exit(0);}
await makeBookMaterials({createCanvas,loadImage,sharp,fs,path,project});
if(process.argv.includes('--materials-only')){console.log('Prepared the baked bookbinding textures.');process.exit(0);}
}

// 2. Serve the project and open the film page in an isolated headless Chrome.
const projectRequire=createRequire(path.join(project,'package.json'));
const {createServer}=await import(pathToFileURL(projectRequire.resolve('vite')).href);
const server=await createServer({root:project,logLevel:'warn',server:{host:'127.0.0.1',port:0,strictPort:false}});await server.listen();
const base=server.resolvedUrls.local[0];
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'jeju-film-'));const port=9400+Math.floor(Math.random()*400);
const browser=spawn(chrome,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--ignore-gpu-blocklist','--hide-scrollbars','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let socket;
async function cleanup(){try{socket?.close();}catch{}browser.kill();await server.close();await sleep(300);await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
try{
 for(let i=0;i<100;i++){try{await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();break;}catch{await sleep(150);}}
 const target=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const waiting=new Map();
 socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id&&waiting.has(message.id)){const {resolve,reject}=waiting.get(message.id);waiting.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result);}
  else if(message.method==='Runtime.exceptionThrown')console.error('film page:',message.params.exceptionDetails.exception?.description??message.params.exceptionDetails.text);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;waiting.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
 const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result.value;};
 await send('Page.enable');await send('Runtime.enable');
 // The viewport holds the whole canvas, which is portrait for the phone film.
 await send('Emulation.setDeviceMetricsOverride',{width:width+40,height:(standing?Math.ceil(width*16/9):width)+40,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:`${base}film.html?width=${width}${standing?'&mode=standing':''}`});
 let state;for(let i=0;i<600;i++){state=await evaluate('window.__film&&{ready:__film.ready,error:__film.error}');if(state?.ready||state?.error)break;await sleep(200);}
 if(!state?.ready)throw new Error('The film page did not get ready: '+(state?.error??'timeout'));
 const meta=await evaluate('__film.meta');
 const frame=async t=>Buffer.from((await evaluate(`__film.render(${t})`)).split(',')[1],'base64');

 // Optional inspection frames: INTRO_INSPECT="0,.5,1" INTRO_INSPECT_DIR=path writes PNGs at those times and stops.
 if(process.env.INTRO_INSPECT){const dir=process.env.INTRO_INSPECT_DIR||path.join(os.tmpdir(),'jeju-film-inspect');await fs.mkdir(dir,{recursive:true});
  for(const time of process.env.INTRO_INSPECT.split(',').map(Number))await fs.writeFile(path.join(dir,`t${time.toFixed(2)}.png`),await frame(time));console.log(`Inspection frames in ${dir}`);}
 else{
 // 3. Stills, storyboard, movie, metadata.
 const pageMiddle=meta.coverHold+1+(meta.pageCount-1)*.07+.31;
 for(const [name,time] of [['book-cover',0],['book-lowering',meta.coverHold+.55],['book-fan',pageMiddle],['book-rise',meta.uiRevealAt+.28],['book-open',meta.duration]])
  // Only the first and last frames ship (the intro's still and its fallback); the in-between stills and the storyboard are for review.
  await fs.writeFile(path.join(['book-cover','book-open'].includes(name)?media:review,`${name}${suffix}.webp`),await sharp(await frame(time)).webp({quality:94}).toBuffer());
 const tiles=[['book-cover',0,0],['book-lowering',meta.width,0],['book-fan',meta.width*2,0],['book-rise',0,meta.height],['book-open',meta.width,meta.height]];
 const composite=await sharp({create:{width:meta.width*3,height:meta.height*2,channels:3,background:meta.background}}).composite(await Promise.all(tiles.map(async([name,left,top])=>({input:await fs.readFile(path.join(['book-cover','book-open'].includes(name)?media:review,`${name}${suffix}.webp`)),left,top})))).png().toBuffer();
 await fs.writeFile(path.join(review,`intro-storyboard${suffix}.jpg`),await sharp(composite).resize(1440).jpeg({quality:90}).toBuffer());
 await fs.writeFile(path.join(media,`intro-meta${suffix}.json`),JSON.stringify({...meta,fps},null,2)+'\n');
 if(process.argv.includes('--stills')){console.log(`Rendered stills ${meta.width}×${meta.height}.`);}
 else{
  const frames=Math.round(meta.duration*fps),output=path.join(media,`book-opening${suffix}.mp4`);
  // Both films are converted with the BT.709 matrix and tagged as sRGB, so browsers decode them to the colours the live book renders
  // (untagged, FFmpeg converts with BT.601 while browsers assume BT.709 for HD video, which shifts saturated colours).
  const colour=['-vf','scale=out_color_matrix=bt709:out_range=tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','iec61966-2-1','-color_range','tv'];
  const encoder=spawn(ffmpeg,['-y','-f','image2pipe','-c:v','png','-framerate',String(fps),'-i','pipe:0','-an',...colour,'-c:v','libx264','-preset','medium','-crf',String(crf),'-pix_fmt','yuv420p','-movflags','+faststart',output],{stdio:['pipe','ignore','pipe']});
  let log='';encoder.stderr.on('data',chunk=>log+=chunk);encoder.stdin.on('error',()=>{});
  for(let f=0;f<frames;f++){if(!encoder.stdin.write(await frame(f/fps)))await once(encoder.stdin,'drain');if(f%fps===0)console.log(`Rendered ${f/fps}/${meta.duration}s`);}
  encoder.stdin.end();const [code]=await once(encoder,'exit');if(code!==0)throw new Error(log);
  const stat=await fs.stat(output);console.log(`Created ${meta.width}×${meta.height}, ${fps} fps, ${meta.duration}s MP4 (${(stat.size/1048576).toFixed(2)} MiB).`);
 }
 }
}finally{await cleanup();}
process.exit(0);
