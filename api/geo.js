/**
 * The country the reader connects from, for the language switch (src/locale.ts). Vercel attaches it to every request as a header, so
 * this answers without any lookup service. Elsewhere (a dev server has no /api) the browser falls back to a public lookup.
 */
export default function handler(request, response) {
 const country = request.headers['x-vercel-ip-country'];
 response.setHeader('Cache-Control', 'private, no-store');
 response.status(200).json({ country: typeof country === 'string' && country.length === 2 ? country : null });
}
