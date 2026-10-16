const rasterArt=new Set(['cover','intro-pages','hills','field','wall','flowers','carrot','alley','coast','grasses','village','tree','sea','lighthouse',...Array.from({length:3},(_,chapter)=>['left','right'].map(side=>`page-${chapter}-${side}`)).flat()]);

export function artSource(name:string){
 if(name.startsWith('book-'))return `/book-materials/${name.slice(5)}.webp`;
 return rasterArt.has(name)?`/art-raster/${name}.webp`:`/art/${name}.svg`;
}
