import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LogOut, Plus, Minus, PackageCheck, PackageX, RotateCcw, RefreshCw, Lock, History } from 'lucide-react';
import { products as baseProducts, rupiah, isSoldOut, lowStock } from '../data.js';
import { applyStock } from '../../shared/menu.js';
import '../admin.css';

const PW_KEY = 'arrayyan-admin-pw';
const readPw = () => { try { return sessionStorage.getItem(PW_KEY) || ''; } catch { return ''; } };
const REASON = { tambah: 'Tambah stok', terjual: 'Terjual / kurang', koreksi: 'Koreksi', habis: 'Ditandai habis', ready: 'Ready lagi', atur: 'Diatur manual', reset: 'Reset' };
const fmtTime = (t) => new Date(t).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

// Halaman admin stok: /#/admin — lihat stok, tambah/kurangi, tandai habis, ready lagi, riwayat.
export default function AdminPanel() {
  const [pw, setPw] = useState(readPw);
  const [pwInput, setPwInput] = useState('');
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(Boolean(readPw()));
  const [map, setMap] = useState({});
  const [log, setLog] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState('');
  const [drafts, setDrafts] = useState({});

  const items = useMemo(() => applyStock(baseProducts, map), [map]);
  const summary = useMemo(() => ({
    total: items.length,
    out: items.filter(isSoldOut).length,
    low: items.filter(lowStock).length,
    ok: items.filter((p) => !isSoldOut(p) && !lowStock(p)).length,
  }), [items]);

  // Halaman admin tidak boleh muncul di Google
  useEffect(() => {
    const m = document.createElement('meta');
    m.name = 'robots'; m.content = 'noindex,nofollow';
    document.head.appendChild(m);
    const title = document.title;
    document.title = 'Admin Stok — Arrayyan Bakery';
    return () => { m.remove(); document.title = title; };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const call = useCallback(async (password, payload) => {
    const res = await fetch('/api/stock', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(payload),
    });
    let data = {};
    try { data = await res.json(); } catch { /* bukan JSON: biasanya /api belum aktif */ }
    if (!res.ok) {
      const msg = data.error || (res.status === 404 || res.headers.get('content-type')?.includes('text/html')
        ? 'Server stok tidak ditemukan. Jalankan dengan npm run dev, atau deploy ke Vercel/Netlify.' : 'Terjadi kesalahan.');
      const e = new Error(msg); e.status = res.status; throw e;
    }
    return data;
  }, []);

  const logout = useCallback((msg = '') => {
    try { sessionStorage.removeItem(PW_KEY); } catch { /* abaikan */ }
    setPw(''); setAuthed(false); setError(msg);
  }, []);

  const apply = (d) => { setMap(d.stock || {}); if (Array.isArray(d.log)) setLog(d.log); };

  const enter = useCallback(async (password) => {
    setError(''); setChecking(true);
    try {
      const d = await call(password, { action: 'verify' });
      try { sessionStorage.setItem(PW_KEY, password); } catch { /* abaikan */ }
      setPw(password); apply(d); setConfigured(d.configured !== false); setAuthed(true);
    } catch (e) {
      logout(e.message);
    } finally { setChecking(false); }
  }, [call, logout]);

  useEffect(() => { const saved = readPw(); if (saved) enter(saved); else setChecking(false); }, [enter]);

  // Semua perubahan lewat sini: kirim ke server, lalu tampilkan hasil & pesan
  const run = async (key, payload, okMsg, clearDraftIds = []) => {
    setBusy(key); setError('');
    try {
      const d = await call(pw, payload);
      apply(d);
      if (clearDraftIds.length) setDrafts((cur) => { const n = { ...cur }; clearDraftIds.forEach((id) => delete n[id]); return n; });
      setToast(okMsg);
    } catch (e) {
      if (e.status === 401) logout('Sesi berakhir, silakan masuk lagi.'); else setError(e.message);
    } finally { setBusy(''); }
  };

  const adjust = (p, delta) => run(`p${p.id}`, { action: 'adjust', id: p.id, delta }, `${p.name}: stok ${delta > 0 ? 'bertambah' : 'berkurang'} ${Math.abs(delta)}.`, [p.id]);
  const setStock = (p, n) => run(`p${p.id}`, { action: 'set', reason: 'atur', updates: { [p.id]: { stock: n, soldOut: false } } }, `Stok ${p.name} diatur menjadi ${n}.`, [p.id]);
  const markOut = (p) => run(`p${p.id}`, { action: 'set', reason: 'habis', updates: { [p.id]: { soldOut: true } } }, `${p.name} ditandai habis.`, [p.id]);
  const markReady = (p) => run(`p${p.id}`, { action: 'set', reason: 'ready', updates: { [p.id]: { soldOut: false, stock: null } } }, `${p.name} ready lagi.`, [p.id]);
  const noLimit = (p) => run(`p${p.id}`, { action: 'set', reason: 'atur', updates: { [p.id]: { stock: null } } }, `Batas stok ${p.name} dihapus.`, [p.id]);
  const allReady = () => run('all', { action: 'set', reason: 'ready', updates: Object.fromEntries(baseProducts.map((p) => [p.id, { soldOut: false, stock: null }])) }, 'Semua menu ready.');
  const reset = () => {
    if (!window.confirm('Kembalikan semua stok ke pengaturan di file shared/menu.js?')) return;
    run('reset', { action: 'reset' }, 'Dikembalikan ke pengaturan awal.');
    setDrafts({});
  };

  const setDraft = (id, v) => setDrafts((d) => ({ ...d, [id]: v.replace(/[^0-9]/g, '').slice(0, 3) }));

  if (!authed) {
    return (
      <div className="adm">
        <div className="adm-login">
          <span className="adm-lock"><Lock size={22} /></span>
          <h1>Admin Stok</h1>
          <p>Halaman ini khusus pengelola Arrayyan Bakery.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (pwInput) enter(pwInput); }}>
            <label htmlFor="adm-pw">Kata sandi</label>
            <input id="adm-pw" type="password" autoComplete="current-password" value={pwInput} onChange={(e) => setPwInput(e.target.value)} disabled={checking} autoFocus />
            {error && <div className="adm-err" role="alert">{error}</div>}
            <button className="adm-primary" type="submit" disabled={checking || !pwInput}>{checking ? 'Memeriksa…' : 'Masuk'}</button>
          </form>
          <a className="adm-back" href="#/"><ArrowLeft size={15} /> Kembali ke website</a>
        </div>
      </div>
    );
  }

  return (
    <div className="adm">
      <div className="adm-head">
        <div><h1>Stok Barang</h1><p>Lihat stok, tambah atau kurangi, dan tandai habis. Pengunjung website menerima perubahan dalam ±1 menit.</p></div>
        <div className="adm-head-actions">
          <a className="adm-ghost" href="#/"><ArrowLeft size={15} /> Website</a>
          <button className="adm-ghost" onClick={() => logout()}><LogOut size={15} /> Keluar</button>
        </div>
      </div>

      <div className="adm-stats">
        <div><b>{summary.total}</b><span>Menu</span></div>
        <div className="s-ok"><b>{summary.ok}</b><span>Aman</span></div>
        <div className="s-low"><b>{summary.low}</b><span>Hampir habis</span></div>
        <div className="s-out"><b>{summary.out}</b><span>Habis</span></div>
      </div>

      {!configured && (
        <div className="adm-warn" role="alert">
          Penyimpanan stok belum dikonfigurasi, jadi perubahan <b>tidak bisa disimpan</b>. Ikuti bagian "Admin stok" di README (Upstash Redis), atau jalankan lewat <code>npm run dev</code>.
        </div>
      )}
      {error && <div className="adm-err" role="alert">{error}</div>}

      <ul className="adm-list">
        {items.map((p) => {
          const out = isSoldOut(p);
          const counted = typeof p.stock === 'number';
          const draft = drafts[p.id] ?? '';
          const valid = draft !== '' && Number.isInteger(parseInt(draft, 10));
          const working = busy === `p${p.id}` || busy === 'all' || busy === 'reset';
          const canReduce = !out && counted && !working;
          return (
            <li key={p.id} className={out ? 'adm-row out' : 'adm-row'}>
              <img src={p.image} alt="" />
              <div className="adm-info">
                <b>{p.name}</b>
                <span>{rupiah(p.price)}</span>
                <em className={out ? 'badge out' : lowStock(p) ? 'badge low' : 'badge ok'}>
                  {out ? 'Habis' : lowStock(p) ? 'Hampir habis' : counted ? 'Aman' : 'Tersedia'}
                </em>
              </div>
              <div className="adm-qty" aria-label={`Stok ${p.name}`}>
                <b>{out ? 0 : counted ? p.stock : '∞'}</b>
                <span>{out ? 'habis' : counted ? 'stok' : 'tanpa batas'}</span>
              </div>
              <div className="adm-controls">
                <div className="adm-quick">
                  <div>
                    <small>Terjual / kurangi</small>
                    <div className="adm-btnrow">
                      <button className="adm-chip minus" disabled={!canReduce || p.stock < 1} onClick={() => adjust(p, -1)}><Minus size={13} />1</button>
                      <button className="adm-chip minus" disabled={!canReduce || p.stock < 5} onClick={() => adjust(p, -5)}><Minus size={13} />5</button>
                    </div>
                  </div>
                  <div>
                    <small>Tambah stok</small>
                    <div className="adm-btnrow">
                      <button className="adm-chip plus" disabled={working} onClick={() => adjust(p, 1)}><Plus size={13} />1</button>
                      <button className="adm-chip plus" disabled={working} onClick={() => adjust(p, 5)}><Plus size={13} />5</button>
                      <button className="adm-chip plus" disabled={working} onClick={() => adjust(p, 10)}><Plus size={13} />10</button>
                    </div>
                  </div>
                </div>
                <div className="adm-set">
                  <input inputMode="numeric" value={draft} placeholder="Atur jadi…" onChange={(e) => setDraft(p.id, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && valid && !working) setStock(p, parseInt(draft, 10)); }} aria-label={`Atur jumlah stok ${p.name}`} />
                  <button className={valid ? 'adm-primary sm' : 'adm-ghost sm'} disabled={!valid || working} onClick={() => setStock(p, parseInt(draft, 10))}>Simpan jumlah</button>
                  {out ? (
                    <button className="adm-ok sm" disabled={working} onClick={() => markReady(p)}><PackageCheck size={14} /> Ready lagi</button>
                  ) : (
                    <button className="adm-danger sm" disabled={working} onClick={() => markOut(p)}><PackageX size={14} /> Tandai habis</button>
                  )}
                  {!out && counted && <button className="adm-ghost sm" disabled={working} onClick={() => noLimit(p)}>Tanpa batas</button>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="adm-foot">
        <button className="adm-ok" disabled={Boolean(busy)} onClick={allReady}><RefreshCw size={15} /> Semua menu ready (tanpa batas)</button>
        <button className="adm-ghost" disabled={Boolean(busy)} onClick={reset}><RotateCcw size={15} /> Kembalikan ke pengaturan file</button>
      </div>

      <details className="adm-log" open>
        <summary><History size={16} /> Riwayat perubahan stok <small>({log.length})</small></summary>
        {log.length === 0 ? <p className="adm-empty">Belum ada perubahan tercatat.</p> : (
          <ul>
            {log.map((e, i) => (
              <li key={`${e.t}-${e.id}-${i}`}>
                <time>{fmtTime(e.t)}</time>
                <div><b>{e.name}</b><span>{e.from} → {e.to}</span></div>
                <em>{REASON[e.reason] || 'Diatur manual'}</em>
              </li>
            ))}
          </ul>
        )}
      </details>
      {toast && <div className="adm-toast" role="status">{toast}</div>}
    </div>
  );
}
