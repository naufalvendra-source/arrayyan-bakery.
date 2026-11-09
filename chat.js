// Vercel Serverless Function → POST /api/chat
import { handleChat } from '../server/chat-core.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  const out = await handleChat(req.body, { ip, env: process.env });
  res.status(out.status).json(out.body);
}
