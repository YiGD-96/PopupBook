// Scene art from scripts/create-scenes.mjs and character cut-outs from scripts/prepare-characters.mjs (first version: _archive/scenes-v1).
const sceneArt=['farm-back','farm-trees-left','farm-trees-right','farm-field','farm-lantern','farm-wall','farm-crate','village-back','village-tree-left','village-tree-right','village-lane','village-front','village-wall','shop-a','shop-b','shop-c','kitchen-back','kitchen-left','kitchen-right','kitchen-front','kitchen-table','dish-plate','dish-rape','dish-juice','dish-soup','dish-burger','dish-pickle','char-farmer','char-traveler','char-pony'];
const rasterArt=new Set(['cover','intro-pages','carrot',...sceneArt,...Array.from({length:3},(_,chapter)=>['left','right'].map(side=>`page-${chapter}-${side}`)).flat()]);

export function artSource(name:string){
 if(name.startsWith('book-'))return `/book-materials/${name.slice(5)}.webp`;
 return rasterArt.has(name)?`/art-raster/${name}.webp`:`/art/${name}.svg`;
}
