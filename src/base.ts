/**
 * Where the site's own files are, wherever it is deployed: at a domain's root (Vercel), under a sub-path (GitHub Pages:
 * /PopupBook/), or embedded elsewhere. The build's base is relative ('./', vite.config.ts) unless VITE_BASE says otherwise; the book has one
 * page and keeps its place in the #hash, so paths relative to that page always reach the files.
 *   url('/media/logo.webp')  →  './media/logo.webp' (or '/PopupBook/media/logo.webp' with VITE_BASE=/PopupBook/)
 * Read through `import.meta` loosely so the tests (plain Node, no Vite) can load the modules that use it.
 */
export const BASE=(import.meta as {env?:{BASE_URL?:string}}).env?.BASE_URL??'/';
export const url=(path:string)=>BASE+path.replace(/^\//,'');
