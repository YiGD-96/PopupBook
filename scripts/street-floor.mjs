/**
 * The cobbled street printed on chapter 2's floor: a path of small basalt cobbles that is wide at the near edge and narrows toward the far
 * edge (where the painted sea is), on the papyrus of the other pages — no planted edges, no flowers. The cobbles come from the painting
 * art-src/gpt/page-2/village-floor.png (only its middle, away from the planting), shrunk and tiled mirrored so they read small and the
 * seams do not show.
 *   const png = await streetFloor(sharp, project, width, height)   // landscape: across × depth, far edge at the top
 * Used by scripts/create-pages.mjs (the open book's two pages, 2160 × 1446) and scripts/prepare-gpt-art.mjs (the phone's flat page).
 */
import path from 'node:path';

export async function streetFloor(sharp, project, width, height, {stones = .5, farHalf = .09, nearHalf = .46, wash = '#e2c58a', clear = [], spurs = []} = {}) {
 const source = path.join(project, 'art-src/gpt/page-2/village-floor.png');
 const papyrus = path.join(project, 'art-src/else/파피루스.jpg');
 // Cobbles only: the middle of the painting. `stones` is the size of the painting's pixels relative to a 2160-wide spread.
 const scale = stones * width / 2160, cw = Math.round(880 * scale), ch = Math.round(944 * scale);
 const tile = await sharp(source).extract({left: 330, top: 40, width: 880, height: 944}).resize(cw, ch).png().toBuffer();
 // Made seamless: the piece blended with itself shifted by half in both directions (the middle keeps the original, the edges take the
 // shifted copy, whose own edges are neighbours in the original), then repeated. The cobbles are an even scatter, so the repeat is quiet.
 const {data, info} = await sharp(tile).removeAlpha().raw().toBuffer({resolveWithObject: true});
 const w = info.width, h = info.height, seamless = Buffer.alloc(data.length);
 for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const m = Math.min(1, Math.pow(Math.sin(Math.PI * (x + .5) / w) * Math.sin(Math.PI * (y + .5) / h), .55) * 1.15);
  const i = (y * w + x) * 3, j = (((y + (h >> 1)) % h) * w + ((x + (w >> 1)) % w)) * 3;
  for (let c = 0; c < 3; c++) seamless[i + c] = Math.round(data[i + c] * m + data[j + c] * (1 - m));
 }
 const unit = await sharp(seamless, {raw: {width: w, height: h, channels: 3}}).png().toBuffer();
 const mosaic = await sharp({create: {width, height, channels: 3, background: '#c9a965'}}).composite([{input: unit, tile: true}]).png().toBuffer();
 // The path: a winding band (it swings right, then left, and runs out at the near edge as wide as the foot of the shops), its edge broken
 // up by a ragged, uneven line and softened so the stones thin out into the paper like a worn lane rather than a cut-out. `clear` are areas
 // (in the picture's pixels) where the stones fade away completely, so printed words lie on plain paper that belongs to the floor.
 const cx = width / 2, rows = 48, left = [], right = [];
 const bend = t => Math.sin(t * 6.1 + .55) * .115 * (.35 + .65 * t) + Math.sin(t * 15.3 + 1.7) * .006;
 for (let i = 0; i <= rows; i++) {
  const t = i / rows, y = t * height, mid = cx + bend(t) * width;
  const half = (farHalf + (nearHalf - farHalf) * Math.pow(t, 1.15)) * width;
  const rag = k => (Math.sin(i * 2.31 + k * 5.1) * .5 + Math.sin(i * 5.7 + k * 1.9) * .35 + Math.sin(i * 11.3 + k) * .15) * width * (.007 + .012 * t);
  left.push([mid - half + rag(1), y]); right.push([mid + half + rag(2), y]);
 }
 const points = [...left, ...right.reverse()].map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
 const feather = Math.max(3, width * .0055);
 const holes = clear.map(([x0, y0, x1, y1]) => `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="${Math.min(x1 - x0, y1 - y0) * .5}" fill="#000"/>`).join('');
 // `spurs`: side lanes and yards joined to the path (polygons in fractions of the picture), given the same ragged edge, so the ground
 // runs on to a shop's door instead of stopping short of it.
 const ragged = (poly, k) => poly.flatMap(([x, y], i, all) => { const [nx, ny] = all[(i + 1) % all.length]; return [0, .5].map(f => { const r = (Math.sin(i * 3.7 + f * 9 + k) * .6 + Math.sin(i * 8.1 + f * 3 + k) * .4) * .012; return [x + (nx - x) * f + r, y + (ny - y) * f + r * .6]; }); });
 const spurShapes = spurs.map((poly, k) => `<polygon points="${ragged(poly, k).map(([x, y]) => (x * width).toFixed(1) + ',' + (y * height).toFixed(1)).join(' ')}" fill="#fff"/>`).join('');
 const shape = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><polygon points="${points}" fill="#fff"/>${spurShapes}</svg>`)).blur(feather).png().toBuffer();
 const mask = clear.length ? await sharp(shape).composite([{input: await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${holes}</svg>`)).blur(Math.max(8, width * .02)).png().toBuffer(), blend: 'dest-out'}]).png().toBuffer() : shape;
 const cobbles = await sharp(mosaic).ensureAlpha().composite([{input: mask, blend: 'dest-in'}]).png().toBuffer();
 const paper = await sharp(papyrus).resize(width, height, {fit: 'cover'}).composite([{input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${wash}" fill-opacity=".18"/></svg>`)}]).png().toBuffer();
 return sharp(paper).composite([{input: cobbles}]).png().toBuffer();
}
