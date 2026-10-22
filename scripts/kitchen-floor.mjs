/**
 * The kitchen's honey-oak floorboards printed on chapter 3's floor: art-src/gpt/page-3/new/new2/honey-oak-floor-only.png, a patch of
 * floor painted seen from the front at an angle. It is un-warped to the boards as seen from above (a projective map of its four corners),
 * then laid over the whole floor with the boards running toward the reader; the book's own perspective lays it down again. As on chapters
 * 1 and 2, the `clear` areas fade back to papyrus, so the printed words lie on paper that belongs to the floor.
 *   const png = await oakFloor(sharp, project, width, height, {clear, boards})   // landscape: across × depth, far edge at the top
 * Used by scripts/create-pages.mjs (the open book's two pages, 2160 × 1446) and scripts/prepare-gpt-art.mjs (the phone's flat page).
 */
import path from 'node:path';

const SOURCE = 'art-src/gpt/page-3/new/new2/honey-oak-floor-only.png';
// The floor's corners in the painting: far left, far right, near right, near left. The far corners sit a little inside the painted edge:
// the boards, not the patch's outline, are what must come out straight.
const QUAD = [[287, 142], [1528, 142], [1764, 756], [52, 756]];
// Seen from above the patch is about 1.55 times as wide as deep (the boards then come out about six times as long as they are wide).
const FLAT = [1700, 1100];

/** The projective map from the unit square to a quad (Heckbert): [u, v] → [x, y]. */
function squareToQuad([[x0, y0], [x1, y1], [x2, y2], [x3, y3]]) {
 const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
 const det = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / det, h = (dx1 * sy - sx * dy1) / det;
 const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
 return (u, v) => {const w = g * u + h * v + 1; return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w];};
}

/** The floorboards seen from above, FLAT px, a hair inside the painted edge so no transparent rim comes along. */
async function flatBoards(sharp, project) {
 const {data, info} = await sharp(path.join(project, SOURCE)).removeAlpha().raw().toBuffer({resolveWithObject: true});
 const [W, H] = FLAT, out = Buffer.alloc(W * H * 3), map = squareToQuad(QUAD), inset = .006;
 for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const u = inset + (1 - 2 * inset) * (x + .5) / W, v = inset + (1 - 2 * inset) * (y + .5) / H;
  const [sx, sy] = map(u, v), x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
  for (let c = 0; c < 3; c++) {
   const at = (xx, yy) => data[(Math.min(info.height - 1, Math.max(0, yy)) * info.width + Math.min(info.width - 1, Math.max(0, xx))) * 3 + c];
   out[(y * W + x) * 3 + c] = Math.round(at(x0, y0) * (1 - fx) * (1 - fy) + at(x0 + 1, y0) * fx * (1 - fy) + at(x0, y0 + 1) * (1 - fx) * fy + at(x0 + 1, y0 + 1) * fx * fy);
  }
 }
 return sharp(out, {raw: {width: W, height: H, channels: 3}}).png().toBuffer();
}

/**
 * The boards laid over `width` × `height`. At `boards` 0 the one painted patch covers the floor at its own scale. Otherwise the floor
 * shows about that many boards across: a strip of the patch's straightest boards (from one board gap to another, near the middle) is
 * repeated side by side — cut at gaps, the strips join on a board line — and runs the floor's full depth, so the boards come longer too.
 */
async function laidBoards(sharp, project, width, height, boards) {
 const flat = await flatBoards(sharp, project);
 if (!boards) return sharp(flat).resize(width, height, {fit: 'cover'}).png().toBuffer();
 // The gaps between boards are the darkest columns, averaged down the patch.
 const {data, info} = await sharp(flat).raw().toBuffer({resolveWithObject: true}), W = info.width, H = info.height;
 const dark = Array.from({length: W}, (_, x) => {let sum = 0; for (let y = 0; y < H; y += 2) {const i = (y * W + x) * 3; sum += data[i] + data[i + 1] + data[i + 2];} return sum;});
 const gapNear = at => {let best = at; for (let x = Math.round(at - W * .04); x <= at + W * .04; x++) if (dark[x] < dark[best]) best = x; return best;};
 const left = gapNear(W * .22), right = gapNear(W * .74), perStrip = Math.round((right - left) / (W / 15));
 const tw = Math.round(width * perStrip / boards);
 const strip = await sharp(flat).extract({left, top: 0, width: right - left, height: H}).resize(tw, height, {fit: 'fill'}).png().toBuffer();
 const parts = [];
 for (let x = 0; x < width; x += tw) parts.push({input: strip, left: x, top: 0});
 const sheet = await sharp({create: {width: Math.ceil(width / tw) * tw, height, channels: 3, background: '#a8682e'}}).composite(parts).png().toBuffer();
 return sharp(sheet).extract({left: 0, top: 0, width, height}).png().toBuffer();
}

export async function oakFloor(sharp, project, width, height, {clear = [], boards = 0} = {}) {
 const papyrus = path.join(project, 'art-src/else/파피루스.jpg');
 // The boards (`boards`: about how many across the floor, or 0 for the patch as painted); the lamp at the back warms the far boards and
 // the near edge falls a little darker.
 const laid = await laidBoards(sharp, project, width, height, boards);
 const light = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffd9a0" stop-opacity=".12"/><stop offset=".5" stop-color="#ffd9a0" stop-opacity="0"/><stop offset="1" stop-color="#3a1f0c" stop-opacity=".14"/></linearGradient><rect width="${width}" height="${height}" fill="url(#l)"/></svg>`);
 const floor = await sharp(laid).composite([{input: light}]).ensureAlpha().png().toBuffer();
 // Words on the floor: the `clear` areas lighten the boards toward papyrus (not all the way, which reads as a stain on wood), grown and
 // softened so the light ends well outside the words.
 const grow = width * .03;
 const holes = clear.map(([x0, y0, x1, y1]) => [x0 - grow, y0 - grow * .7, x1 + grow, y1 + grow * .7]).map(([x0, y0, x1, y1]) => `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="${Math.min(x1 - x0, y1 - y0) * .5}" fill="#000" fill-opacity=".62"/>`).join('');
 const printed = clear.length ? await sharp(floor).composite([{input: await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${holes}</svg>`)).blur(Math.max(10, width * .028)).png().toBuffer(), blend: 'dest-out'}]).png().toBuffer() : floor;
 return sharp(papyrus).resize(width, height, {fit: 'cover'}).composite([{input: printed}]).png().toBuffer();
}
