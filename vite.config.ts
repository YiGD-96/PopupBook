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
 const siteUrl = loadEnv(mode, '.', 'VITE_').VITE_SITE_URL?.replace(/\/$/, '') || undefined;
 return { plugins: [react(), seo(siteUrl)], resolve: { preserveSymlinks: true }, build: { chunkSizeWarningLimit: 1200 } };
});
