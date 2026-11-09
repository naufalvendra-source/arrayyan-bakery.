// Stok yang bisa diubah admin tanpa edit kode. Tidak bergantung pada platform hosting.
// Dipakai oleh: Vercel (api/stock.js), Netlify (netlify/functions/stock.mjs), dev server Vite, dan asisten AI.
//
// Penyimpanan (agar perubahan terlihat oleh semua pengunjung):
//   - Produksi: Upstash Redis lewat REST (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN,
//     atau KV_REST_API_URL + KV_REST_API_TOKEN dari integrasi Vercel). Ada paket gratis.
//   - `npm run dev`: file lokal .data/stock.json (otomatis, tanpa akun).
// Masuk admin memakai ADMIN_PASSWORD (environment variable).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { menu, applyStock, isSoldOut } from '../shared/menu.js';

const KEY = 'arrayyan:stock';
const LOG_KEY = 'arrayyan:stock-log';
const LOG_KEEP = 100;
const LOG_SHOW = 50;
const REASONS = ['tambah', 'terjual', 'koreksi', 'habis', 'ready', 'atur', 'reset'];
const MAX_STOCK = 999;
const FAIL_LIMIT = { windowMs: 10 * 60_000, max: 8 };

function upstashStore(env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const run = async (args) => {
    const res = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(args) });
    if (!res.ok) throw new Error(`store ${res.status}`);
    const j = await res.json();
    if (j.error) throw new Error(String(j.error));
    return j.result;
  };
  return {
    kind: 'upstash',
    async read() { const r = await run(['GET', KEY]); return r ? JSON.parse(r) : {}; },
    async write(map) { await run(['SET', KEY, JSON.stringify(map)]); },
    // Riwayat: entri terbaru di depan (LPUSH), disimpan maksimal LOG_KEEP
    async pushLog(entries) {
      if (!entries.length) return;
      await run(['LPUSH', LOG_KEY, ...entries.map((e) => JSON.stringify(e))]);
      await run(['LTRIM', LOG_KEY, 0, LOG_KEEP - 1]);
    },
    async readLog() {
      const r = await run(['LRANGE', LOG_KEY, 0, LOG_SHOW - 1]);
      return (r || []).map((x) => { try { return JSON.parse(x); } catch { return null; } }).filter(Boolean);
    },
  };
}

function fileStore(file) {
  return {
    kind: 'file',
    async read() { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; } },
    async write(map) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(map, null, 2)); },
    async pushLog(entries) {
      if (!entries.length) return;
      const lf = `${file}.log.json`;
      let cur = [];
      try { cur = JSON.parse(fs.readFileSync(lf, 'utf8')); } catch { /* belum ada */ }
      fs.mkdirSync(path.dirname(lf), { recursive: true });
      fs.writeFileSync(lf, JSON.stringify([...entries].reverse().concat(cur).slice(0, LOG_KEEP)));
    },
    async readLog() { try { return JSON.parse(fs.readFileSync(`${file}.log.json`, 'utf8')).slice(0, LOG_SHOW); } catch { return []; } },
  };
}

export function getStore(env) {
  return upstashStore(env) || (env.STOCK_DEV_FILE ? fileStore(env.STOCK_DEV_FILE) : null);
}

// Hanya menerima bentuk data yang dikenal (id menu valid, tipe benar).
function sanitize(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const m of menu) {
    const o = raw[m.id];
    if (!o || typeof o !== 'object') continue;
    const c = {};
    if (typeof o.soldOut === 'boolean') c.soldOut = o.soldOut;
    if (o.stock === null) c.stock = null;
    else if (Number.isInteger(o.stock) && o.stock >= 0 && o.stock <= MAX_STOCK) c.stock = o.stock;
    if (Object.keys(c).length) out[m.id] = c;
  }
  return out;
}

const describe = (item) => (isSoldOut(item) ? 'Habis' : typeof item.stock === 'number' ? `Sisa ${item.stock}` : 'Tersedia (tanpa batas)');

// Bandingkan sebelum/sesudah, hasilkan entri riwayat hanya untuk menu yang benar-benar berubah.
function diffLog(before, after, reason) {
  const b = applyStock(menu, before);
  const a = applyStock(menu, after);
  const t = Date.now();
  const out = [];
  for (const m of menu) {
    const from = describe(b.find((x) => x.id === m.id));
    const to = describe(a.find((x) => x.id === m.id));
    if (from !== to) out.push({ t, id: m.id, name: m.name, from, to, reason });
  }
  return out;
}

export async function loadLog(env) {
  const store = getStore(env);
  if (!store?.readLog) return [];
  try { return await store.readLog(); } catch { return []; }
}

export async function loadOverrides(env) {
  const store = getStore(env);
  if (!store) return {};
  try { return sanitize(await store.read()); } catch (err) { console.error('[stok] gagal membaca:', err.message); return {}; }
}

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const samePassword = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

const fails = new Map();
const tooManyFails = (ip) => {
  const now = Date.now();
  const arr = (fails.get(ip) || []).filter((t) => now - t < FAIL_LIMIT.windowMs);
  fails.set(ip, arr);
  return arr.length >= FAIL_LIMIT.max;
};
const noteFail = (ip) => { fails.set(ip, [...(fails.get(ip) || []), Date.now()]); };

export async function handleStock({ method, body, password, ip = 'unknown', env = {} }) {
  const store = getStore(env);

  if (method === 'GET') {
    return { status: 200, body: { stock: await loadOverrides(env), configured: Boolean(store) } };
  }
  if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };

  if (!env.ADMIN_PASSWORD) {
    return { status: 503, body: { error: 'Admin belum dikonfigurasi: isi ADMIN_PASSWORD di environment variable.' } };
  }
  if (tooManyFails(ip)) return { status: 429, body: { error: 'Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.' } };
  if (!password || !samePassword(password, env.ADMIN_PASSWORD)) {
    noteFail(ip);
    return { status: 401, body: { error: 'Kata sandi salah.' } };
  }

  const action = body?.action;
  if (action === 'verify') {
    return { status: 200, body: { ok: true, configured: Boolean(store), stock: await loadOverrides(env), log: await loadLog(env) } };
  }
  if (!store) {
    return { status: 503, body: { error: 'Penyimpanan stok belum dikonfigurasi (Upstash Redis). Lihat README bagian "Admin stok".' } };
  }
  try {
    if (action === 'reset') {
      const before = await loadOverrides(env);
      await store.write({});
      await store.pushLog(diffLog(before, {}, 'reset'));
      return { status: 200, body: { ok: true, stock: {}, log: await loadLog(env) } };
    }
    if (action === 'adjust') {
      // Tambah/kurangi stok relatif terhadap angka saat ini (dihitung di server agar tidak salah hitung)
      const id = Number(body?.id);
      const delta = Number(body?.delta);
      const item0 = menu.find((m) => m.id === id);
      if (!item0 || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > MAX_STOCK) {
        return { status: 400, body: { error: 'Data tidak valid.' } };
      }
      const reason = REASONS.includes(body?.reason) ? body.reason : delta > 0 ? 'tambah' : 'terjual';
      const current = await loadOverrides(env);
      const item = applyStock(menu, current).find((m) => m.id === id);
      let next;
      if (isSoldOut(item)) {
        if (delta < 0) return { status: 400, body: { error: `${item.name} sudah habis.` } };
        next = Math.min(MAX_STOCK, delta); // menambah stok pada menu habis = ready lagi dengan jumlah itu
      } else if (typeof item.stock === 'number') {
        next = Math.max(0, Math.min(MAX_STOCK, item.stock + delta));
      } else if (delta > 0) {
        next = Math.min(MAX_STOCK, delta); // mulai menghitung stok dari angka ini
      } else {
        return { status: 400, body: { error: `Atur jumlah stok ${item.name} dulu sebelum mengurangi.` } };
      }
      const updated = { ...current, [id]: { ...(current[id] || {}), stock: next, soldOut: false } };
      await store.write(updated);
      await store.pushLog(diffLog(current, updated, reason));
      return { status: 200, body: { ok: true, stock: updated, log: await loadLog(env) } };
    }
    if (action === 'set') {
      const updates = body?.updates;
      if (!updates || typeof updates !== 'object') return { status: 400, body: { error: 'Data tidak valid.' } };
      const current = await loadOverrides(env);
      const clean = sanitize(updates);
      if (!Object.keys(clean).length) return { status: 400, body: { error: 'Tidak ada perubahan yang valid.' } };
      const next = { ...current };
      for (const [id, o] of Object.entries(clean)) next[id] = { ...(current[id] || {}), ...o };
      await store.write(next);
      const reason = REASONS.includes(body?.reason) ? body.reason : 'atur';
      await store.pushLog(diffLog(current, next, reason));
      return { status: 200, body: { ok: true, stock: next, log: await loadLog(env) } };
    }
    return { status: 400, body: { error: 'Aksi tidak dikenal.' } };
  } catch (err) {
    console.error('[stok] gagal menyimpan:', err.message);
    return { status: 502, body: { error: 'Gagal menyimpan ke penyimpanan. Coba lagi.' } };
  }
}
