// Every picture ships as WebP: painted scene cards (scripts/prepare-gpt-art.mjs), printed pages and intro paper (scripts/create-pages.mjs,
// rasterized by scripts/render-intro.mjs), the cover (scripts/book-materials.mjs); `book-*` names are the baked binding materials.
export function artSource(name:string){
 return name.startsWith('book-')?`/book-materials/${name.slice(5)}.webp`:`/art-raster/${name}.webp`;
}
