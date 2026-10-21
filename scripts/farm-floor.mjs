/**
 * The farmyard printed on chapter 1's floor: one painting (art-src/gpt/page-1/new/진흙길-아침햇빛-옅은바퀴자국-생성원본.png) of bare
 * packed soil in low morning sun, faint tyre tracks running toward the reader and a fringe of basalt stones and weeds on the left.
 * It is painted wide and low (1836 × 857) for the floor as the reader sees it, nearly edge-on, and is laid over the page from `top` (just
 * behind the backdrop's foot, where the visible floor begins) to the near edge. As on chapter 2's street, `clear` areas fade back to
 * papyrus, so the printed words lie on paper that belongs to the floor.
 *   const png = await farmFloor(sharp, project, width, height, {top})   // landscape: across × depth, far edge at the top
 * Used by scripts/create-pages.mjs (the open book's two pages, 2160 × 1446) and scripts/prepare-gpt-art.mjs (the phone's flat page).
 */
import path from 'node:path';

export async function farmFloor(sharp, project, width, height, {top = .12, clear = [], wash = '#e08a55'} = {}) {
 const papyrus = path.join(project, 'art-src/else/파피루스.jpg');
 const from = Math.round(height * top);
 const yard = await sharp(path.join(project, 'art-src/gpt/page-1/new/진흙길-아침햇빛-옅은바퀴자국-생성원본.png'))
  .resize(width, height - from, {fit: 'fill', kernel: 'lanczos3'}).png().toBuffer();
 // Above `top` the page is hidden behind the standing backdrop, but it shows while the cards lie folded as the book opens: the painting
 // runs on there, its own far edge mirrored, so the page is printed to its top edge.
 const cap = from ? [{input: await sharp(yard).extract({left: 0, top: 0, width, height: from}).flip().png().toBuffer(), top: 0, left: 0}] : [];
 const ground = await sharp({create: {width, height, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}}).composite([...cap, {input: yard, top: from, left: 0}]).png().toBuffer();
 // Words on paper: the `clear` areas fade the ground away, grown a little so the fade ends outside the words (the mud is busier than the
 // cobbles of chapter 2).
 const grow = width * .022;
 const holes = clear.map(([x0, y0, x1, y1]) => [x0 - grow, y0 - grow * .7, x1 + grow, y1 + grow * .7]).map(([x0, y0, x1, y1]) => `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="${Math.min(x1 - x0, y1 - y0) * .5}" fill="#000"/>`).join('');
 const printed = clear.length ? await sharp(ground).composite([{input: await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${holes}</svg>`)).blur(Math.max(8, width * .02)).png().toBuffer(), blend: 'dest-out'}]).png().toBuffer() : ground;
 const paper = await sharp(papyrus).resize(width, height, {fit: 'cover'}).composite([{input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${wash}" fill-opacity=".14"/></svg>`)}]).png().toBuffer();
 return sharp(paper).composite([{input: printed}]).png().toBuffer();
}
