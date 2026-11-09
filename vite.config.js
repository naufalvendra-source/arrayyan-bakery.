import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Saat `npm run dev`, /api/chat dilayani langsung oleh Vite (tanpa Vercel/Netlify CLI).
function devApi(env) {
  return {
    name: 'dev-api-chat',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        const send = (status, body) => { res.statusCode = status; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(body)); };
        if (req.method !== 'POST') return send(405, { error: 'Method not allowed' });
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body = null;
        try { body = JSON.parse(raw); } catch { /* abaikan */ }
        const { handleChat } = await server.ssrLoadModule('/server/chat-core.js');
        const out = await handleChat(body, { ip: req.socket.remoteAddress, env: { ...env, ASSISTANT_DEBUG: '1', STOCK_DEV_FILE: path.resolve('.data/stock.json') } });
        return send(out.status, out.body);
      });

      // Stok: baca (GET) dan ubah oleh admin (POST). Saat dev, disimpan di .data/stock.json.
      server.middlewares.use('/api/stock', async (req, res) => {
        const send = (status, body) => { res.statusCode = status; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(body)); };
        let body = null;
        if (req.method === 'POST') {
          let raw = '';
          for await (const chunk of req) raw += chunk;
          try { body = JSON.parse(raw); } catch { /* abaikan */ }
        }
        const { handleStock } = await server.ssrLoadModule('/server/stock-core.js');
        const out = await handleStock({ method: req.method, body, password: req.headers['x-admin-password'], ip: req.socket.remoteAddress, env: { ...env, STOCK_DEV_FILE: path.resolve('.data/stock.json') } });
        return send(out.status, out.body);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return { plugins: [react(), devApi(env)] };
});
