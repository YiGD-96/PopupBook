import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { PAGE_TITLE, headTags, llmsTxt, robotsTxt, sitemapXml, textVersion } from './src/seo.ts';

/**
 * Writes the search/answer-engine content into index.html (head tags, JSON-LD, the text version of the book) and emits robots.txt,
 * sitemap.xml and llms.txt, all from the book's own data (src/seo.ts). VITE_SITE_URL (the deployed address) makes URLs absolute.
 */
function seo(siteUrl?: string): Plugin {
 return {
  name: 'book-seo',
  transformIndexHtml: { order: 'pre', handler: html => html
   .replace(/<title>[\s\S]*?<\/title>/, `<title>${PAGE_TITLE}</title>`)
   .replace('<!-- seo:head -->', headTags(siteUrl))
   .replace('<!-- seo:text -->', textVersion()) },
  generateBundle() {
   this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(siteUrl) });
   this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt(siteUrl) });
   if (siteUrl) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(siteUrl, new Date().toISOString().slice(0, 10)) });
  },
 };
}
export default defineConfig(({ mode }) => {
 const env = loadEnv(mode, '.', 'VITE_'); // .env files and VITE_* variables of the build's environment (the deploy workflow's)
 const siteUrl = env.VITE_SITE_URL?.replace(/\/$/, '') || undefined;
 // Relative by default, so one build works at a domain's root (Vercel), under a sub-path (GitHub Pages: /PopupBook/) or anywhere else;
 // VITE_BASE pins it to an absolute path when a host needs that. The app's own paths go through src/base.ts.
 const base = env.VITE_BASE || './';
 return { base, plugins: [react(), seo(siteUrl)], resolve: { preserveSymlinks: true }, build: { chunkSizeWarningLimit: 1200 } };
});
