/**
 * The rug under chapter 3's table, printed on the floor: art-src/gpt/page-3/new/new2/natural-beige-thick-rug.png (a thick beige rug with a
 * terracotta border and rounded corners, painted seen from the front at an angle). The painting is un-warped to the rug as seen from above, then
 * stretched to the size it lies at with its border kept the same thickness all round (nine-slice), and the book's own perspective lays it
 * down again: long across the table in the open book, long along the page's depth on the phone.
 *   await rugImage(sharp, project, width, height)                  // the flat rug, PNG
 *   await kitchenFloor(sharp, project, width, height, {rug})       // papyrus with the kitchen wash and the rug (the phone's flat page)
 * Used by scripts/create-pages.mjs (the open book's right page) and scripts/prepare-gpt-art.mjs (the phone's flat page).
 */
import path from 'node:path';

const SOURCE = 'art-src/gpt/page-3/new/new2/natural-beige-thick-rug.png';
// The rug's top face in the painting (its front edge's thickness below it is left out): top left, top right, bottom right, bottom left.
const QUAD = [[276, 168], [1499, 168], [1747, 718], [29, 718]];
// Seen from above, the rug is about 1.65 times as wide as deep (its border is then about as wide on the sides as at the ends).
const FLAT = [1320, 800];
// The border (terracotta band and the tan line inside it) as a share of the flat rug's depth.
const BORDER = .14;

/** The projective map from the unit square to a quad (Heckbert): [u, v] → [x, y]. */
function squareToQuad([[x0, y0], [x1, y1], [x2, y2], [x3, y3]]) {
 const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
 const det = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / det, h = (dx1 * sy - sx * dy1) / det;
 const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
 return (u, v) => {const w = g * u + h * v + 1; return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w];};
}

async function flatRug(sharp, project) {
 const {data, info} = await sharp(path.join(project, SOURCE)).ensureAlpha().raw().toBuffer({resolveWithObject: true});
 const [W, H] = FLAT, out = Buffer.alloc(W * H * 4), map = squareToQuad(QUAD);
 for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const [sx, sy] = map((x + .5) / W, (y + .5) / H), x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
  for (let c = 0; c < 4; c++) {
   const at = (xx, yy) => data[(Math.min(info.height - 1, Math.max(0, yy)) * info.width + Math.min(info.width - 1, Math.max(0, xx))) * 4 + c];
   out[(y * W + x) * 4 + c] = Math.round(at(x0, y0) * (1 - fx) * (1 - fy) + at(x0 + 1, y0) * fx * (1 - fy) + at(x0, y0 + 1) * (1 - fx) * fy + at(x0 + 1, y0 + 1) * fx * fy);
  }
 }
 if (RECOLOUR) recolour(out);
 return sharp(out, {raw: {width: W, height: H, channels: 4}}).png().toBuffer();
}

// The earlier ivory rug was turned orange and brown (the user's choice then); the beige rug keeps its own colours.
const RECOLOUR = false;
/**
 * Orange and brown only: the ivory field becomes a warm orange and the terracotta border a deep brown, each keeping its
 * pile by following the painting's own light and shade; the tan line between them stays as painted. Blended by how much a pixel belongs
 * to each, so the edges between them stay soft.
 */
const FIELD = [[150, 78, 34], [214, 124, 58], [238, 164, 92]], BAND = [[78, 38, 20], [122, 62, 32], [150, 84, 46]];
function recolour(px) {
 const ramp = (stops, t) => {t = Math.min(1, Math.max(0, t)) * (stops.length - 1); const i = Math.min(stops.length - 2, Math.floor(t)), f = t - i; return stops[i].map((c, k) => c + (stops[i + 1][k] - c) * f);};
 for (let i = 0; i < px.length; i += 4) {
  const r = px[i], g = px[i + 1], b = px[i + 2], lum = .299 * r + .587 * g + .114 * b;
  const ivory = Math.min(1, Math.max(0, (lum - 172) / 34)) * Math.min(1, Math.max(0, 1 - (r - b - 70) / 40));
  const terracotta = Math.min(1, Math.max(0, (r - g - 55) / 30)) * Math.min(1, Math.max(0, (190 - lum) / 30));
  let out = [r, g, b];
  if (ivory > 0) {const c = ramp(FIELD, (lum - 185) / 60); out = out.map((v, k) => v + (c[k] - v) * ivory);}
  if (terracotta > 0) {const c = ramp(BAND, (lum - 70) / 90); out = out.map((v, k) => v + (c[k] - v) * terracotta);}
  px[i] = out[0]; px[i + 1] = out[1]; px[i + 2] = out[2];
 }
}

/** The flat rug at `width` × `height` px, its border `BORDER` of the flat rug's depth thick on every side (scaled to the target). */
export async function rugImage(sharp, project, width, height, {border} = {}) {
 const flat = await flatRug(sharp, project), [W, H] = FLAT, b = Math.round(H * BORDER);
 const t = Math.round(border ?? Math.min(width, height) * BORDER);
 const cut = (left, top, w, h) => sharp(flat).extract({left, top, width: w, height: h});
 const cols = [[0, b, 0, t], [b, W - 2 * b, t, width - 2 * t], [W - b, b, width - t, t]];
 const rows = [[0, b, 0, t], [b, H - 2 * b, t, height - 2 * t], [H - b, b, height - t, t]];
 const parts = [];
 for (const [sx, sw, dx, dw] of cols) for (const [sy, sh, dy, dh] of rows)
  parts.push({input: await cut(sx, sy, sw, sh).resize(dw, dh, {fit: 'fill'}).png().toBuffer(), left: dx, top: dy});
 return sharp({create: {width, height, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}}).composite(parts).png().toBuffer();
}

/**
 * The rug lying on the floor, on a transparent canvas of `width` × `height` with its top face at `rug` (x, y, w, h px). It has body: its
 * near edge (toward the reader, +y) shows the pile's depth as a darker band `thick` px deep (the rug itself, shaded), the face is lit a
 * little toward the far edge, and it casts a soft shadow that spreads most in front.
 */
export async function rugLayer(sharp, project, width, height, rug) {
 const {w, h} = rug, x = Math.round(rug.x), y = Math.round(rug.y), thick = Math.round(rug.thick ?? Math.min(w, h) * .06);
 const face = await rugImage(sharp, project, w, h, {border: rug.border});
 // The pile's depth: the rug once more, darkened and slightly desaturated, shifted toward the reader under the face.
 const side = await sharp(face).modulate({brightness: .5, saturation: .85}).png().toBuffer();
 // Light from the lamp at the back: the far part of the face a touch brighter, the near part a touch darker.
 const light = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff3dc" stop-opacity=".16"/><stop offset=".55" stop-color="#fff3dc" stop-opacity="0"/><stop offset="1" stop-color="#2a1608" stop-opacity=".12"/></linearGradient><rect width="${w}" height="${h}" fill="url(#l)"/></svg>`);
 const lit = await sharp(face).composite([{input: light, blend: 'atop'}]).png().toBuffer();
 const blur = Math.max(3, Math.min(w, h) * .05);
 const shadow = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="${x - blur * .2}" y="${y + thick * .6}" width="${w + blur * .4}" height="${h + thick * 1.6}" rx="${blur * .8}" fill="#2a1608" fill-opacity=".42"/></svg>`);
 return sharp({create: {width, height, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}})
  .composite([{input: await sharp(shadow).blur(blur).png().toBuffer()}, {input: side, left: x, top: y + thick}, {input: lit, left: x, top: y}]).png().toBuffer();
}

export async function kitchenFloor(sharp, project, width, height, {rug, wash = '#dc9a5c'}) {
 const papyrus = path.join(project, 'art-src/else/파피루스.jpg');
 const tone = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${wash}" fill-opacity=".14"/></svg>`);
 return sharp(papyrus).resize(width, height, {fit: 'cover'}).composite([{input: tone}, {input: await rugLayer(sharp, project, width, height, rug)}]).png().toBuffer();
}
