/**
 * The closing card's paper as one picture with its outline cut out: public/media/ending-card.jpg (the team's pinned paper with the carrot)
 * masked by ending-card-mask.png into public/media/ending-card.webp. The card is drawn with it as a border image (src/cinematic.css), so the
 * card can grow with its list of unread stories while the pin and the carrot keep their shape: only the plain paper in the middle stretches.
 *   node scripts/ending-card.mjs
 * Environment: CODEX_NODE_MODULES (sharp), as scripts/prepare-gpt-art.mjs.
 */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/eh1al/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=createRequire(path.join(runtime,'package.json'))('sharp');
const media=path.join(project,'public/media');
const {width,height}=await sharp(path.join(media,'ending-card.jpg')).metadata();
// The mask's own alpha is the outline (CSS masks with an image's alpha), so it becomes the picture's alpha.
const alpha=await sharp(path.join(media,'ending-card-mask.png')).resize(width,height).ensureAlpha().extractChannel(3).raw().toBuffer();
const out=await sharp(path.join(media,'ending-card.jpg')).joinChannel(alpha,{raw:{width,height,channels:1}}).webp({quality:84,alphaQuality:90,effort:5}).toFile(path.join(media,'ending-card.webp'));
console.log(`ending-card.webp: ${out.width}×${out.height}, ${(out.size/1024).toFixed(0)} KiB`);
