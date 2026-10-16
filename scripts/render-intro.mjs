/** Offline movie/material renderer. Production only decodes the resulting MP4. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {makeBookMaterials} from './book-materials.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/eh1al/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const require=createRequire(path.join(runtime,'package.json'));
const {createCanvas,loadImage}=require('@napi-rs/canvas'),sharp=require('sharp');
const ffmpeg=process.env.FFMPEG_PATH||'C:/Program Files/ffmpeg-8.0.1-essentials_build/bin/ffmpeg.exe';
const view=await fs.readFile(path.join(project,'src/bookView.ts'),'utf8');
const number=name=>Number(view.match(new RegExp(`${name}\\s*=\\s*([\\d.]+)`))[1]);
const worldWidth=number('BOOK_FRAME_WIDTH'),worldHeight=number('BOOK_FRAME_HEIGHT'),targetY=number('BOOK_TARGET_Y');
const camera=view.match(/BOOK_CAMERA_POSITION\s*=\s*\[([^\]]+)\]/)[1].split(',').map(Number);
const width=Number(process.env.INTRO_WIDTH||960),height=Math.round(width*worldHeight/worldWidth/2)*2;
const fps=Number(process.env.INTRO_FPS||60),duration=4.6,sceneryStartsAt=2.8,uiRevealAt=2.8,frames=Math.round(duration*fps);
const scale=width/worldWidth,elevation=Math.atan2(camera[1]-targetY,camera[2]),ce=Math.cos(elevation),se=Math.sin(elevation);
const canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
const media=path.join(project,'public/media');await fs.mkdir(media,{recursive:true});
const raster=path.join(project,'public/art-raster');await fs.mkdir(raster,{recursive:true});
const images={},priority=['cover','intro-pages','page-0-left','page-0-right','hills','field','wall','flowers','carrot'];
const names=process.argv.includes('--all-raster')?[...priority,...(await fs.readdir(path.join(project,'public/art'))).filter(f=>f.endsWith('.svg')&&!priority.includes(f.slice(0,-4))).map(f=>f.slice(0,-4))]:priority;
for(const name of names){
 const destination=path.join(raster,`${name}.webp`);let bytes;
 try{bytes=await fs.readFile(destination);}catch{
  const textureWidth={cover:1128,carrot:360,lighthouse:660,tree:720,favicon:64}[name]||1440;
  bytes=await sharp(path.join(project,`public/art/${name}.svg`)).resize(textureWidth).webp({quality:90,alphaQuality:100,effort:5}).toBuffer();
  await fs.writeFile(destination,bytes);console.log(`Rasterized ${name}`);
 }images[name]=await loadImage(bytes);
}
if(process.argv.includes('--raster-only')){console.log(`Prepared ${names.length} WebP textures.`);process.exit(0);}
const materials=await makeBookMaterials({createCanvas,loadImage,sharp,fs,path,project});
if(process.argv.includes('--materials-only')){console.log('Prepared six baked bookbinding textures.');process.exit(0);}
const layers=[['hills',0,.258,-1.65,7.1,2.5],['field',0,.268,-.5,7,1.4],['wall',-.55,.278,.25,5.7,.8],['carrot',.7,.298,.95,1.05,1.35],['flowers',.1,.288,1.5,6.3,1.15]];
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);},ease=x=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
const projectPoint=([x,y,z])=>[width/2+x*scale,height/2-((y-targetY)*ce-z*se)*scale],depth=([,y,z])=>y*se+z*ce;
const rotateX=([x,y,z],a)=>[x,y*Math.cos(a)-z*Math.sin(a),y*Math.sin(a)+z*Math.cos(a)];
const rotateY=([x,y,z],a)=>[x*Math.cos(a)+z*Math.sin(a),y,-x*Math.sin(a)+z*Math.cos(a)];
const rotateZ=([x,y,z],a)=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),z];
let pose={rootX:-1.8,tilt:1.04,yaw:-.19,lift:targetY+.08,scale:1.15},surfaces=[];
const normal=p=>rotateY(rotateX(p,pose.tilt),pose.yaw);
function world(p){const cx=pose.rootX+1.8,q=normal([(p[0]-cx)*pose.scale,(p[1]+.08)*pose.scale,p[2]*pose.scale]);return[q[0]+cx,q[1]-.08+pose.lift,q[2]];}
function imageSurface(image,a,b,c,{sx=0,sw=image.width,alpha=1,transform=p=>p}={}){
 const points=[a,b,c].map(p=>world(transform(p)));surfaces.push({image,points,sx,sw,alpha,depth:points.reduce((s,p)=>s+depth(p),0)/3});
}
function paintSurface({image,points,sx,sw,alpha}){
 const[a,b,c]=points.map(projectPoint),ih=image.height;ctx.save();ctx.globalAlpha=alpha;
 ctx.transform((b[0]-a[0])/sw,(b[1]-a[1])/sw,(c[0]-a[0])/ih,(c[1]-a[1])/ih,a[0],a[1]);
 ctx.drawImage(image,sx,0,sw,ih,-.12,0,sw+.24,ih);ctx.restore();
}
function flush(){surfaces.sort((a,b)=>a.depth-b.depth);surfaces.forEach(paintSurface);surfaces=[];}
function box(x,y,z,w,h,d,maps,{alpha=1,transform=p=>p,rotation=0}={}){
 const l=x-w/2,r=x+w/2,t=y+h/2,b=y-h/2,f=z+d/2,n=z-d/2;
 const faces=[[[r,t,f],[r,t,n],[r,b,f],[1,0,0],maps.side],[[l,t,n],[l,t,f],[l,b,n],[-1,0,0],maps.side],[[l,t,n],[r,t,n],[l,t,f],[0,1,0],maps.top],[[r,b,n],[l,b,n],[r,b,f],[0,-1,0],maps.bottom||maps.top],[[l,t,f],[r,t,f],[l,b,f],[0,0,1],maps.edge||maps.side],[[r,t,n],[l,t,n],[r,b,n],[0,0,-1],maps.edge||maps.side]];
 for(const[a,b,c,norm,map]of faces){const n=normal(rotation?rotateZ(norm,rotation):norm);if(n[1]*se+n[2]*ce>0)imageSurface(map,a,b,c,{alpha,transform});}
}
function bookBase(rootX,open){
 const side={top:materials.cloth,side:materials['cloth-side'],edge:materials['cover-edge']},paper={top:materials.endpaper,side:materials['paper-edge']};
 box(rootX+1.8,-.33,0,3.8,.18,5.02,side);box(rootX+1.8,-.07,0,3.57,.32,4.78,paper);
 const alpha=smooth((open-.35)/.4);
 if(alpha>0){box(rootX-1.8,-.33,0,3.8,.18,5.02,side,{alpha});box(rootX-1.8,-.07,0,3.57,.32,4.78,paper,{alpha});}
 if(open<.99)box(rootX-.085,-.07,0,.15,.52,4.99,{top:materials.cloth,side:materials['cloth-side'],edge:materials['cover-edge']},{alpha:1-smooth((open-.7)/.29)});
}
function paperPoint(u,v,p=0){
 const angle=p*Math.PI,curl=Math.sin(p*Math.PI)*.95,distance=u*3.55;
 const x=Math.abs(curl)<.00001?distance*Math.cos(angle):3.55/curl*(Math.sin(angle)-Math.sin(angle-curl*u));
 const y=Math.abs(curl)<.00001?distance*Math.sin(angle):3.55/curl*(Math.cos(angle-curl*u)-Math.cos(angle));
 return[x,.13+y+.055*Math.exp(-u*12)+Math.sin(p*Math.PI)*u*u*Math.sin(v*Math.PI)*.12,(v-.5)*4.75];
}
function page(image,{left=false,progress=0,raise=0,rootX=0,alpha=1}={}){
 const columns=48;
 for(let i=0;i<columns;i++){
  const a=i/columns,b=(i+1)/columns,sourceA=left?1-b:a,sourceB=left?1-a:b;
  const point=(u,v)=>{const p=paperPoint(u,v,progress);if(left)p[0]*=-1;p[0]+=rootX;p[1]+=raise;return p;};
  imageSurface(image,point(left?b:a,0),point(left?a:b,0),point(left?b:a,1),{sx:sourceA*image.width,sw:(sourceB-sourceA)*image.width,alpha});
 }
}
function scenery(time){
 for(const[index,[name,x,y,z,w,h]]of layers.entries()){
  const rise=smooth((time-index*.075)/.85),angle=-(1-rise)*Math.PI/2,top=[x-w/2,y+h*Math.cos(angle),z+h*Math.sin(angle)];
  imageSurface(images[name],top,[x+w/2,top[1],top[2]],[x-w/2,y,z]);
 }
}
function frontCover(rootX,open){
 const angle=open*Math.PI,hingeY=.22-.55*smooth(open),transform=point=>{const p=rotateZ(point,angle);return[p[0]+rootX,p[1]+hingeY,p[2]];};
 box(1.8,0,0,3.8,.18,5.02,{top:materials.cover,bottom:materials.endpaper,side:materials['cloth-side'],edge:materials['cover-edge']},{transform,rotation:angle});
}
function draw(time){
 ctx.fillStyle='#f4f1e7';ctx.fillRect(0,0,width,height);surfaces=[];
 // The cover opens while the solid volume is still lowering, without a flat-pose pause.
 const lowering=ease(time/1.4),opening=ease((time-.12)/1.43),rootX=-1.8*(1-opening);
 pose={rootX,tilt:1.04*(1-lowering),yaw:-.19*(1-lowering),lift:(targetY+.08)*(1-lowering),scale:1+.15*(1-lowering)};
 bookBase(rootX,opening);flush();
 const alpha=smooth((opening-.35)/.4),showingScenery=time>=sceneryStartsAt;
 if(opening>.5&&opening<.9999){frontCover(rootX,opening);flush();}
 page(images[showingScenery?'page-0-right':'intro-pages'],{rootX});
 if(alpha>0)page(images[showingScenery?'page-0-left':'intro-pages'],{left:true,rootX,alpha});
 flush();
 if(opening<=.5){frontCover(rootX,opening);flush();}
 if(time>=1&&time<2.95){
  const local=[];for(let i=0;i<10;i++)local.push({i,p:smooth((time-1-i*.14)/.62)});
  for(const{i,p}of local.filter(x=>x.p>0&&x.p<1).reverse())page(images['intro-pages'],{rootX,progress:p,raise:.025+(10-i)*.005});
 }
 flush();
 if(showingScenery){scenery(time-sceneryStartsAt);flush();}
}
const metadata={width,height,fps,duration,worldWidth,worldHeight,targetY,camera,pageCount:10,sceneryStartsAt,uiRevealAt,background:'#f4f1e7',materials:{bottomCover:{width:3.8,height:.18,depth:5.02,y:-.33},paperBlock:{width:3.57,height:.32,depth:4.78,y:-.07},frontCover:{width:3.8,height:.18,depth:5.02,hingeY:.22,artY:.096},source:'book-materials',shadows:false}};
await fs.writeFile(path.join(media,'intro-meta.json'),JSON.stringify(metadata,null,2)+'\n');
for(const[name,time]of[['book-cover',0],['book-open',duration],['book-lowering',.55],['book-fan',1.8],['book-rise',3.08]]){draw(time);await fs.writeFile(path.join(media,`${name}.webp`),await sharp(canvas.toBuffer('image/png')).webp({quality:94}).toBuffer());}
const composite=await sharp({create:{width:width*3,height:height*2,channels:3,background:'#f4f1e7'}}).composite(await Promise.all([['book-cover',0,0],['book-lowering',width,0],['book-fan',width*2,0],['book-rise',0,height],['book-open',width,height]].map(async([name,left,top])=>({input:await fs.readFile(path.join(media,`${name}.webp`)),left,top})))).png().toBuffer();
const storyboard=await sharp(composite).resize(1440).jpeg({quality:90}).toBuffer();await fs.writeFile(path.join(media,'intro-storyboard.jpg'),storyboard);
if(process.argv.includes('--stills')){console.log(`Rendered stills ${width}×${height}.`);process.exit(0);}
const child=spawn(ffmpeg,['-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${width}x${height}`,'-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',path.join(media,'book-opening.mp4')],{stdio:['pipe','ignore','pipe']});
let encoderLog='';child.stderr.on('data',chunk=>encoderLog+=chunk);child.stdin.on('error',()=>{});
for(let f=0;f<frames;f++){draw(f/fps);if(!child.stdin.write(canvas.data()))await once(child.stdin,'drain');if(f%fps===0)console.log(`Rendered ${f/fps}/${duration}s`);}
child.stdin.end();const[exitCode]=await once(child,'exit');if(exitCode!==0)throw new Error(encoderLog);
const stat=await fs.stat(path.join(media,'book-opening.mp4'));console.log(`Created ${width}×${height}, ${fps} fps, ${duration}s MP4 (${(stat.size/1048576).toFixed(2)} MiB).`);
