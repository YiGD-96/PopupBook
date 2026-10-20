/** Baked bookbinding textures shared by the movie and lightweight live meshes. */
export async function makeBookMaterials({createCanvas,loadImage,sharp,fs,path,project}){
 const destination=path.join(project,'public/book-materials');await fs.mkdir(destination,{recursive:true});
 let seed=97016;
 const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 async function save(name,canvas){if(name==='cloth'||name==='cover-edge')return loadImage(canvas.toBuffer('image/png'));const bytes=await sharp(canvas.toBuffer('image/png')).webp({quality:94,effort:5}).toBuffer();await fs.writeFile(path.join(destination,`${name}.webp`),bytes);return loadImage(bytes);}
 function surface(w,h,color,strength=4,cloth=true){
  const canvas=createCanvas(w,h),ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,w,h);
  const data=ctx.getImageData(0,0,w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;
   const weave=cloth?((x%4===0?1:0)-(x%4===1?.65:0)+(y%5===0?.8:0)-(y%5===1?.5:0))*strength:0;
   const n=(random()-.5)*strength*1.4+weave;
   for(let c=0;c<3;c++)data.data[i+c]=Math.max(0,Math.min(255,data.data[i+c]+n));
  }
  ctx.putImageData(data,0,0);return canvas;
 }
 const textures={};
 // cloth and cover-edge are no longer shipped, but are still drawn so the seeded noise of later textures stays identical.
 const cloth=surface(768,1024,'#c68870',3.4);textures.cloth=await save('cloth',cloth);
 // The same cloth as the board faces: the case is one wrapped cloth, and the edges darken only through the baked light.
 textures['cloth-side']=await save('cloth-side',surface(768,1024,'#c68870',3));
 const edge=surface(1024,128,'#b77b64',3);
 const ec=edge.getContext('2d');
 for(let y=0;y<128;y++){
  ec.fillStyle=`rgba(255,233,204,${y<6?.12:y>119?.09:.015})`;ec.fillRect(0,y,1024,1);
  if(y===6||y===119){ec.fillStyle='rgba(101,58,39,.2)';ec.fillRect(0,y,1024,1);}
 }
 for(let i=0;i<180;i++){ec.fillStyle=`rgba(250,211,172,${random()*.22})`;ec.fillRect(random()*1024,random()<.5?random()*8:120+random()*8,2+random()*10,.5+random());}
 textures['cover-edge']=await save('cover-edge',edge);
 const paper=surface(1536,192,'#e7ddc6',2,false),pc=paper.getContext('2d');
 // Horizontal hairlines are actual sheet boundaries; edge UVs keep the stack readable.
 for(let y=2;y<192;y+=2+Math.floor(random()*3)){
  pc.fillStyle=`rgba(105,88,61,${.13+random()*.17})`;pc.fillRect(0,y,1536,.4+random()*.7);
  pc.fillStyle=`rgba(255,252,235,${.15+random()*.22})`;pc.fillRect(0,y+1,1536,.65);
 }
 for(let i=0;i<120;i++){pc.fillStyle=`rgba(112,91,58,${random()*.06})`;pc.fillRect(random()*1536,0,.5+random()*1.5,192);}
 textures['paper-edge']=await save('paper-edge',paper);
 const endpaper=surface(1024,1344,'#eee4cf',2.4,false),ep=endpaper.getContext('2d');
 const gutter=ep.createLinearGradient(0,0,110,0);gutter.addColorStop(0,'rgba(110,83,54,.16)');gutter.addColorStop(.24,'rgba(124,96,66,.07)');gutter.addColorStop(1,'rgba(124,96,66,0)');ep.fillStyle=gutter;ep.fillRect(0,0,110,1344);
 ep.strokeStyle='rgba(157,126,84,.12)';ep.lineWidth=1;ep.strokeRect(28,28,968,1288);
 textures.endpaper=await save('endpaper',endpaper);
 // Front cover: the magazine's cover art printed on uncoated cloth. The finish (grain, bevel, joint, worn edges) is drawn once and
 // laid over the art, so each frame of the moving cover (scripts/capture-site-cover.mjs) gets the identical finish.
 const W=1128,H=1480,grain=new Float32Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)grain[y*W+x]=(random()-.5)*4+((x%4===0?.9:0)-(x%4===1?.6:0)+(y%5===0?.7:0)-(y%5===1?.4:0))*2.4;
 const finish=createCanvas(W,H),fc=finish.getContext('2d');
 const bevel=fc.createLinearGradient(0,0,W,0);
 bevel.addColorStop(0,'rgba(94,47,34,.12)');bevel.addColorStop(.012,'rgba(255,230,197,.1)');bevel.addColorStop(.033,'rgba(255,230,197,0)');bevel.addColorStop(.97,'rgba(75,44,32,0)');bevel.addColorStop(.993,'rgba(93,52,37,.1)');bevel.addColorStop(1,'rgba(255,218,179,.15)');fc.fillStyle=bevel;fc.fillRect(0,0,W,H);
 // A narrow recessed joint, raised binding line and gently worn board corners.
 const groove=fc.createLinearGradient(52,0,101,0);groove.addColorStop(0,'rgba(102,51,35,0)');groove.addColorStop(.36,'rgba(107,54,39,.14)');groove.addColorStop(.58,'rgba(255,219,182,.14)');groove.addColorStop(1,'rgba(255,219,182,0)');fc.fillStyle=groove;fc.fillRect(52,16,49,1448);
 fc.strokeStyle='rgba(255,235,204,.29)';fc.lineWidth=1;fc.strokeRect(7.5,7.5,1113,1465);
 fc.strokeStyle='rgba(126,70,47,.19)';fc.lineWidth=1;fc.strokeRect(10.5,10.5,1107,1459);
 for(let i=0;i<380;i++){
  const x=random()*W,y=random()<.5?random()*5:1475+random()*5;
  fc.fillStyle=`rgba(255,223,180,${.08+random()*.12})`;fc.fillRect(x,y,1+random()*4,.5+random());
 }
 const finishLayer=finish.toBuffer('image/png');
 // Raw pixels through sharp: about 10× faster than canvas pixel access, which matters for the moving cover's ~160 frames.
 const finishCover=async(file,quality)=>{
  const data=await sharp(file).resize(W,H,{fit:'fill'}).removeAlpha().raw().toBuffer(),px=new Uint8ClampedArray(data.buffer,data.byteOffset,data.length);
  // Uncoated cloth slightly softens printed ink while keeping the original cover art.
  for(let i=0,p=0;i<W*H;i++,p+=3){const n=grain[i];px[p]+=n;px[p+1]+=n;px[p+2]+=n;}
  return sharp(data,{raw:{width:W,height:H,channels:3}}).composite([{input:finishLayer}]).webp({quality,effort:4}).toBuffer();
 };
 // The captured site cover, when present, replaces the cover art: its first frame is the still cover everywhere.
 const captured=path.join(project,'intro-cache/site-cover'),motionDir=path.join(project,'intro-cache/cover-texture');
 const capture=await fs.readFile(path.join(captured,'meta.json'),'utf8').then(JSON.parse,()=>null);
 if(capture)await fs.writeFile(path.join(project,'public/art-raster/cover.webp'),await sharp(path.join(captured,'0000.webp')).resize(W,H,{fit:'fill'}).webp({quality:90,effort:5}).toBuffer());
 const coverBytes=await finishCover(path.join(project,'public/art-raster/cover.webp'),94);
 await fs.writeFile(path.join(destination,'cover.webp'),coverBytes);textures.cover=await loadImage(coverBytes);
 if(capture){
  const done=await fs.readFile(path.join(motionDir,'meta.json'),'utf8').then(JSON.parse,()=>null);
  if(done?.capturedAt!==capture.capturedAt){
   await fs.rm(motionDir,{recursive:true,force:true});await fs.mkdir(motionDir,{recursive:true});
   for(let f=0;f<capture.frames;f++){
    const name=`${String(f).padStart(4,'0')}.webp`;
    await fs.writeFile(path.join(motionDir,name),await finishCover(path.join(captured,name),92));
   }
   await fs.writeFile(path.join(motionDir,'meta.json'),JSON.stringify({fps:capture.fps,frames:capture.frames,capturedAt:capture.capturedAt}));
   console.log(`Finished ${capture.frames} moving cover frames.`);
  }
 }
 // Inside of a board: the cloth turned over the edge, with the endpaper pasted down inside it (board 3.5 × 5.02).
 const inside=createCanvas(700,1004),ic=inside.getContext('2d'),turnIn=44;ic.drawImage(cloth,0,0,700,1004);
 ic.drawImage(endpaper,0,0,1024,1344,turnIn,turnIn,700-turnIn*2,1004-turnIn*2);
 ic.strokeStyle='rgba(96,58,40,.28)';ic.lineWidth=1.5;ic.strokeRect(turnIn+.75,turnIn+.75,700-turnIn*2-1.5,1004-turnIn*2-1.5);
 ic.strokeStyle='rgba(255,238,214,.35)';ic.lineWidth=1;ic.strokeRect(turnIn-1.5,turnIn-1.5,700-turnIn*2+3,1004-turnIn*2+3);
 textures.inside=await save('inside',inside);
 textures.desk=await desk({sharp,fs,path,destination,loadImage});
 return textures;
}

/**
 * The walnut desk the book lies on: planks running away from the reader, each its own shade, with wavy grain, fine pores and dark seams.
 * Seamless both ways (every wave has a whole number of periods across the tile), so the desk repeats without joins. One tile is 3×3
 * world units (src/bookParts.tsx Desk). Its own seed, so it never shifts the other textures.
 */
async function desk({sharp,fs,path,destination,loadImage}){
 const N=1024,PLANKS=5,width=N/PLANKS,data=Buffer.alloc(N*N*3),TAU=Math.PI*2;let seed=20261017;
 const rand=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 const base=[64,42,28];
 const plank=Array.from({length:PLANKS},()=>{
  // Fine grain lines across the plank, 5–14 px apart, and broad soft bands; all bend together along the plank.
  const lines=[];for(let x=rand()*6;x<width;x+=5+rand()*9)lines.push({x,dark:.45+rand()*.55});
  return {shade:.86+rand()*.26,lines,
   waves:Array.from({length:3},()=>({m:1+Math.floor(rand()*3),a:.8+rand()*3,p:rand()*TAU})),
   bands:Array.from({length:3},()=>({k:1+Math.floor(rand()*4),a:.5+rand()*.5,p:rand()*TAU}))};
 });
 const fine=Float32Array.from({length:N*N},()=>rand()-.5);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const i=Math.floor(x/width),pl=plank[i],v=y/N,local=x-i*width;
  const bend=pl.waves.reduce((s,w)=>s+w.a*Math.sin(TAU*w.m*v+w.p),0),at=local+bend;
  let near=99,dark=0;for(const l of pl.lines){const d=Math.abs(at-l.x);if(d<near){near=d;dark=l.dark;}}
  const line=near<.8?-26*dark:near<1.8?-10*dark:near<3?4:0;          // thin dark late-wood line, a faint lit edge beside it
  let band=0;for(const b of pl.bands)band+=b.a*Math.sin(TAU*b.k*(at/width)+b.p);
  const pore=fine[y*N+x]*7+fine[((y*5)%N)*N+x]*6;                      // pores, longer along the grain
  const edge=Math.min(local,width-local);
  const seam=edge<1.5?-34:edge<3?-14:edge<5?7:0;                       // dark joint between planks
  const light=pl.shade*(1+band*.05);
  for(let c=0;c<3;c++)data[(y*N+x)*3+c]=Math.max(0,Math.min(255,base[c]*light+line*(c===0?1:c===1?.75:.55)+pore+seam));
 }
 const bytes=await sharp(data,{raw:{width:N,height:N,channels:3}}).webp({quality:86,effort:5}).toBuffer();
 await fs.writeFile(path.join(destination,'desk.webp'),bytes);return loadImage(bytes);
}
