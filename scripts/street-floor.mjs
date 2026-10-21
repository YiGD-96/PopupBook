/**
 * The cobbled street printed on chapter 2's floor: a path of small basalt cobbles that is wide at the near edge and narrows toward the far
 * edge (where the painted sea is), on the papyrus of the other pages — no planted edges, no flowers. The cobbles come from the painting
 * art-src/gpt/page-2/village-floor.png (only its middle, away from the planting), shrunk and tiled mirrored so they read small and the
 * seams do not show.
 *   const png = await streetFloor(sharp, project, width, height)   // landscape: across × depth, far edge at the top
 * Used by scripts/create-pages.mjs (the open book's two pages, 2160 × 1446) and scripts/prepare-gpt-art.mjs (the phone's flat page).
 */
import path from 'node:path';

export async function streetFloor(sharp, project, width, height, {stones = .5, farHalf = .09, nearHalf = .46, wash = '#e2c58a', clear = [], spurs = [], arc = 0} = {}) {
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
 // `arc` (a fraction of the width) makes one C-shaped sweep instead: the path leaves the far edge, bulges to one side in the middle and comes back to the
 // middle at the near edge, as a lane that curves round the buildings.
 const sway = arc ? t => arc * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), 1.15) + Math.sin(t * 13.1 + .9) * .004 : bend;
 for (let i = 0; i <= rows; i++) {
  const t = i / rows, y = t * height, mid = cx + sway(t) * width;
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

/**
 * The street as one painted piece: art-src/gpt/page-2/village-curved-path-redrawn.png (a winding cobbled path with its far end at the top, widening to the near edge) laid on
 * the same papyrus, trimmed and scaled to the floor's depth so it runs from the back edge to the front edge. The shops are placed along it (src/story.ts).
 *   const png = await pathFloor(sharp, project, width, height, {clear})   // landscape: across × depth, far edge at the top
 * `clear` areas (printed words) are cut out of the path so the lettering lies on plain paper.
 */
export async function pathFloor(sharp, project, width, height, {clear = [], wash = '#e2c58a', scale = 1, shiftX = 0, widenRight = null} = {}) {
 const source = path.join(project, 'art-src/gpt/page-2/village-curved-path-redrawn.png');
 const papyrus = path.join(project, 'art-src/else/파피루스.jpg');
 const {data, info} = await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject: true});
 let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
 for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 16) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
 const h = Math.round(height * scale), trimmed = await sharp(source).extract({left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1}).resize({height: h}).png().toBuffer();
 const w = (await sharp(trimmed).metadata()).width, left = Math.round((width - w) / 2 + shiftX * width), top = height - h;
 const crop = {left: Math.max(0, -left), top: 0, width: Math.min(w, width - Math.max(0, left)) , height: h};
 const piece = await sharp(trimmed).extract({left: crop.left, top: 0, width: Math.min(w - crop.left, width - Math.max(0, left)), height: h}).png().toBuffer();
 let layer = await sharp({create: {width, height, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}}).composite([{input: piece, left: Math.max(0, left), top}]).png().toBuffer();
 // `widenRight` {dx, u0, v0, v1}: a copy of the path moved right by dx (a fraction of the width) is let in, through a soft window (columns from u0 to the edge, rows v0..v1),
 // so one side of the street (the one a shop opens on) runs wider without a new drawing.
 if (widenRight) {
  const {dx, u0, v0, v1} = widenRight, win = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="${u0 * width}" y="${v0 * height}" width="${width}" height="${(v1 - v0) * height}" fill="#fff"/></svg>`)).blur(width * .03).png().toBuffer();
  const moved = await sharp({create: {width, height, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}}).composite([{input: await sharp(layer).extract({left: 0, top: 0, width: width - Math.round(dx * width), height}).png().toBuffer(), left: Math.round(dx * width), top: 0}]).png().toBuffer();
  const windowed = await sharp(moved).composite([{input: win, blend: 'dest-in'}]).png().toBuffer();
  layer = await sharp(layer).composite([{input: windowed}]).png().toBuffer();
 }
 if (clear.length) {
  const holes = clear.map(([a, b, c, d]) => `<rect x="${a}" y="${b}" width="${c - a}" height="${d - b}" rx="${Math.min(c - a, d - b) * .5}" fill="#000"/>`).join('');
  const mask = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${holes}</svg>`)).blur(Math.max(8, width * .02)).png().toBuffer();
  layer = await sharp(layer).composite([{input: mask, blend: 'dest-out'}]).png().toBuffer();
 }
 const paper = await sharp(papyrus).resize(width, height, {fit: 'cover'}).composite([{input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${wash}" fill-opacity=".18"/></svg>`)}]).png().toBuffer();
 return sharp(paper).composite([{input: layer}]).png().toBuffer();
}
