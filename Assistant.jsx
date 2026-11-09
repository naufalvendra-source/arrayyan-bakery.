import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, ShoppingBag, MessageCircle } from 'lucide-react';
import { products, WA_NUMBER } from './data.js';

const GREETING = 'Halo! Saya Asisten Arrayyan 👋 Mau saya bantu pilihkan menu atau langsung masukkan pesananmu ke keranjang?';
const SUGGESTIONS = [
  'Rekomendasi bolen untuk acara 20 orang',
  'Menu apa yang paling laris?',
  'Masukkan 2 bolen coklat keju ke keranjang',
];
const nameOf = (id) => products.find((p) => p.id === id)?.name || 'Produk';

export default function Assistant({ hidden, onAdd, onOpenCart }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING, local: true }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, loading, open]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next.filter((m) => !m.local && !m.error).map(({ role, content: c }) => ({ role, content: c })) }),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.reply) { const e = new Error(data.error || 'gagal'); e.detail = data.detail; e.status = res.status; throw e; }
      const added = Array.isArray(data.cart) ? data.cart : [];
      if (added.length) onAdd(added);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply, added }]);
    } catch (err) {
      const msg = err?.status === 429
        ? err.message
        : `Maaf, asisten sedang tidak bisa dihubungi. Kamu bisa langsung bertanya ke admin lewat WhatsApp.${err?.detail ? `\n\n[Info pengembang] ${err.detail}` : ''}`;
      setMessages((m) => [...m, { role: 'assistant', content: msg, error: true }]);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const submit = (e) => { e.preventDefault(); send(input); };
  const showSuggestions = messages.length === 1;

  return (
    <div hidden={hidden}>
      {!open && (
        <button className="ai-fab" onClick={() => setOpen(true)} aria-label="Buka Asisten Arrayyan">
          <Sparkles size={20} /><span>Tanya Asisten</span>
        </button>
      )}
      {open && (
        <section className="ai-panel" role="dialog" aria-label="Asisten Arrayyan">
          <header className="ai-head">
            <div className="ai-title"><span className="ai-avatar"><Sparkles size={16} /></span><div><b>Asisten Arrayyan</b><small>Dibantu AI · jawaban bisa keliru</small></div></div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Tutup asisten"><X size={18} /></button>
          </header>
          <div className="ai-body" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                <p>{m.content}</p>
                {m.added?.length > 0 && (
                  <div className="ai-added">
                    <ul>{m.added.map((a) => <li key={a.id}>✓ {a.qty}× {nameOf(a.id)}</li>)}</ul>
                    <button onClick={() => { setOpen(false); onOpenCart(); }}><ShoppingBag size={14} /> Buka keranjang</button>
                  </div>
                )}
                {m.error && (
                  <a className="ai-wa" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> Chat admin</a>
                )}
              </div>
            ))}
            {loading && <div className="ai-msg assistant"><p className="ai-typing" aria-label="Asisten sedang mengetik"><i /><i /><i /></p></div>}
            {showSuggestions && (
              <div className="ai-suggest">
                {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}
              </div>
            )}
            <div ref={endRef} />
          </div>
          <p className="ai-note">Percakapan diproses layanan AI pihak ketiga. Jangan kirim data pribadi atau pembayaran di sini.</p>
          <form className="ai-form" onSubmit={submit}>
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tulis pertanyaan atau pesananmu..." maxLength={500} aria-label="Pesan untuk asisten" />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Kirim"><Send size={17} /></button>
          </form>
        </section>
      )}
    </div>
  );
}
