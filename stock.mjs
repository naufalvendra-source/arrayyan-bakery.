// Netlify Function → /api/stock  (GET: baca stok; POST: admin ubah stok)
import { handleStock } from '../../server/stock-core.js';

export default async (req, context) => {
  let body = null;
  if (req.method === 'POST') { try { body = await req.json(); } catch { /* body tidak valid */ } }
  const out = await handleStock({ method: req.method, body, password: req.headers.get('x-admin-password'), ip: context?.ip || 'unknown', env: process.env });
  return Response.json(out.body, { status: out.status, headers: { 'Cache-Control': 'no-store' } });
};

export const config = { path: '/api/stock' };
