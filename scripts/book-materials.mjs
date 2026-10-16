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
 const art=await loadImage(await fs.readFile(path.join(project,'public/art-raster/cover.webp')));
 const cover=createCanvas(1128,1480),cc=cover.getContext('2d');cc.drawImage(art,0,0,1128,1480);
 const pixels=cc.getImageData(0,0,1128,1480);
 for(let y=0;y<1480;y++)for(let x=0;x<1128;x++){
  const i=(y*1128+x)*4,noise=(random()-.5)*4+((x%4===0?.9:0)-(x%4===1?.6:0)+(y%5===0?.7:0)-(y%5===1?.4:0))*2.4;
  // Uncoated cloth slightly softens printed ink while keeping the original cover art.
  for(let c=0;c<3;c++)pixels.data[i+c]=Math.max(0,Math.min(255,pixels.data[i+c]+noise));
 }
 cc.putImageData(pixels,0,0);
 const bevel=cc.createLinearGradient(0,0,1128,0);
 bevel.addColorStop(0,'rgba(94,47,34,.12)');bevel.addColorStop(.012,'rgba(255,230,197,.1)');bevel.addColorStop(.033,'rgba(255,230,197,0)');bevel.addColorStop(.97,'rgba(75,44,32,0)');bevel.addColorStop(.993,'rgba(93,52,37,.1)');bevel.addColorStop(1,'rgba(255,218,179,.15)');cc.fillStyle=bevel;cc.fillRect(0,0,1128,1480);
 // A narrow recessed joint, raised binding line and gently worn board corners.
 const groove=cc.createLinearGradient(52,0,101,0);groove.addColorStop(0,'rgba(102,51,35,0)');groove.addColorStop(.36,'rgba(107,54,39,.14)');groove.addColorStop(.58,'rgba(255,219,182,.14)');groove.addColorStop(1,'rgba(255,219,182,0)');cc.fillStyle=groove;cc.fillRect(52,16,49,1448);
 cc.strokeStyle='rgba(255,235,204,.29)';cc.lineWidth=1;cc.strokeRect(7.5,7.5,1113,1465);
 cc.strokeStyle='rgba(126,70,47,.19)';cc.lineWidth=1;cc.strokeRect(10.5,10.5,1107,1459);
 for(let i=0;i<380;i++){
  const x=random()*1128,y=random()<.5?random()*5:1475+random()*5;
  cc.fillStyle=`rgba(255,223,180,${.08+random()*.12})`;cc.fillRect(x,y,1+random()*4,.5+random());
 }
 textures.cover=await save('cover',cover);
 // Inside of a board: the cloth turned over the edge, with the endpaper pasted down inside it (board 3.5 × 5.02).
 const inside=createCanvas(700,1004),ic=inside.getContext('2d'),turnIn=44;ic.drawImage(cloth,0,0,700,1004);
 ic.drawImage(endpaper,0,0,1024,1344,turnIn,turnIn,700-turnIn*2,1004-turnIn*2);
 ic.strokeStyle='rgba(96,58,40,.28)';ic.lineWidth=1.5;ic.strokeRect(turnIn+.75,turnIn+.75,700-turnIn*2-1.5,1004-turnIn*2-1.5);
 ic.strokeStyle='rgba(255,238,214,.35)';ic.lineWidth=1;ic.strokeRect(turnIn-1.5,turnIn-1.5,700-turnIn*2+3,1004-turnIn*2+3);
 textures.inside=await save('inside',inside);
 // Soft floor shadow for one board half (5.2 × 6.42 world units around the 3.8 × 5.02 board), baked instead of a live shadow pass.
 const shadow=createCanvas(416,512),sc=shadow.getContext('2d');
 const footprint=(grow,blur,alpha)=>{const w=304+grow*2,h=400+grow*2;sc.save();sc.shadowColor=`rgba(78,56,36,${alpha})`;sc.shadowBlur=blur;sc.shadowOffsetX=4000;sc.fillStyle='#000';sc.fillRect((416-w)/2-4000,(512-h)/2,w,h);sc.restore();};
 footprint(10,44,.34);footprint(-2,10,.42);
 textures.shadow=await save('shadow',shadow);
 return textures;
}
