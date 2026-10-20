/**
 * Records the moving hero of the web magazine (https://gujwa-carrot.vercel.app) for the intro film's book cover.
 * The site animates its cover painting with its own WebGL shader (sea, juice, leaves, soup steam) and sets the title over it.
 * Here the site runs in headless Chrome at a portrait size matching the book board, the page's requestAnimationFrame is driven
 * by hand at the film's frame rate, and the hero — painting, shade and text exactly as the site draws them — is captured each frame.
 * Output: intro-cache/site-cover/NNNN.webp (not shipped; render-intro.mjs turns them into the cover texture of each film frame).
 * Environment: CHROME_PATH, SITE_URL, COVER_SECONDS (default: until the cover has opened), INTRO_FPS.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {BOOK_BOARD} from '../src/bookStructure.ts';
import {COVER_HOLD_MS} from '../src/introPlayback.ts';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url=process.env.SITE_URL||'https://gujwa-carrot.vercel.app/';
const fps=Number(process.env.INTRO_FPS||60);
// The cover stays in view for the hold and the 1.55 s it takes to open (film.tsx timeline).
const seconds=Number(process.env.COVER_SECONDS||COVER_HOLD_MS/1000+1.6);
const output=path.join(project,'intro-cache/site-cover');
// The site's painting is 1792×878 and its hero keeps the painting at full height, so a hero 878 tall and as wide as the
// board's proportion shows the same portrait crop the site shows on a phone (centred on its text anchor).
const IMAGE_HEIGHT=878,width=Math.round(IMAGE_HEIGHT*BOOK_BOARD.width/BOOK_BOARD.depth),scale=2;

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=9300+Math.floor(Math.random()*200),profile=path.join(project,'intro-cache',`chrome-${port}`);
const proc=spawn(chrome,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--no-first-run','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','about:blank'],{stdio:'ignore'});
try{
 for(let i=0;i<60;i++){try{await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();break;}catch{await sleep(200);}}
 const target=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(resolve=>ws.onopen=resolve);
 let id=0;const waiting=new Map();
 ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id&&waiting.has(m.id)){const {resolve,reject}=waiting.get(m.id);waiting.delete(m.id);m.error?reject(new Error(m.error.message)):resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;waiting.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 const evaluate=async expression=>(await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})).result.value;
 await send('Page.enable');await send('Emulation.setScrollbarsHidden',{hidden:true});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 const viewport=(height,pageWidth=width)=>send('Emulation.setDeviceMetricsOverride',{width:pageWidth,height,deviceScaleFactor:scale,mobile:false});
 await viewport(1000);
 // The page's animation clock: frames run only when __step is called, with timestamps that advance exactly 1/fps.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{let queue=[],id=0,now=0;
  window.requestAnimationFrame=callback=>{queue.push([++id,callback]);return id;};
  window.cancelAnimationFrame=handle=>{queue=queue.filter(entry=>entry[0]!==handle);};
  window.__step=ms=>{now+=ms;const run=queue;queue=[];for(const [,callback] of run){try{callback(now);}catch(error){console.error(error);}}};})();`});
 await send('Page.navigate',{url});
 const step=()=>evaluate(`window.__step(${1000/fps})`);
 const pump=async ms=>{for(const end=Date.now()+ms;Date.now()<end;){await step();await sleep(15);}};
 // Wait for the shader to go live, then let the site's own fade-in (text, motion amplitude) finish.
 for(let i=0;i<400&&!await evaluate(`!!document.querySelector('.cover__motion.is-live')`);i++){await step();await sleep(25);}
 if(!await evaluate(`!!document.querySelector('.cover__motion.is-live')`))throw new Error('The site cover motion did not start (WebGL unavailable or the page changed).');
 // The hero can be narrower than the window (a reserved scrollbar gutter), so size the window from the hero itself.
 const header=await evaluate(`document.querySelector('.cover__hero').getBoundingClientRect().top+scrollY`);
 const gutter=width-await evaluate(`document.querySelector('.cover__hero').getBoundingClientRect().width`);
 await viewport(Math.round(header+IMAGE_HEIGHT),width+Math.round(gutter));await pump(3500);
 const hero=await evaluate(`(()=>{const r=document.querySelector('.cover__hero').getBoundingClientRect();return {x:r.left,y:r.top+scrollY,width:r.width,height:r.height};})()`);
 if(Math.abs(hero.width-width)>1||Math.abs(hero.height-IMAGE_HEIGHT)>1)throw new Error(`Unexpected hero size ${hero.width}×${hero.height}`);
 await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output,{recursive:true});
 const frames=Math.ceil(seconds*fps);
 for(let f=0;f<frames;f++){
  if(f)await step();
  const {data}=await send('Page.captureScreenshot',{format:'webp',quality:96,clip:{...hero,scale:1},captureBeyondViewport:false});
  await fs.writeFile(path.join(output,`${String(f).padStart(4,'0')}.webp`),Buffer.from(data,'base64'));
  if(f%fps===0)console.log(`Captured ${f/fps}s`);
 }
 await fs.writeFile(path.join(output,'meta.json'),JSON.stringify({source:url,fps,frames,width:hero.width*scale,height:hero.height*scale,capturedAt:new Date().toISOString()},null,1));
 console.log(`Captured ${frames} frames of the site cover (${hero.width*scale}×${hero.height*scale}) into ${path.relative(project,output)}.`);
 ws.close();
}finally{proc.kill();await sleep(400);await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
process.exit(0);
