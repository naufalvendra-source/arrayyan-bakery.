// Netlify Function → POST /api/chat
import { handleChat } from '../../server/chat-core.js';

export default async (req, context) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  let body = null;
  try { body = await req.json(); } catch { /* body tidak valid */ }
  const out = await handleChat(body, { ip: context?.ip || 'unknown', env: process.env });
  return Response.json(out.body, { status: out.status });
};

export const config = { path: '/api/chat' };
