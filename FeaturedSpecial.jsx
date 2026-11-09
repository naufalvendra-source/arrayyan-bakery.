import React from 'react';
import { Plus, ArrowRight, Sparkles } from 'lucide-react';
import { rupiah, isSoldOut } from '../data.js';

// Sorotan satu produk (seperti "Chef's Special" di Flavora).
export default function FeaturedSpecial({ p, onAdd, menuHref }) {
  if (!p) return null;
  return (
    <section className="special" data-reveal>
      <div className="special-img"><img src={p.image} alt={p.name} loading="lazy" /></div>
      <div className="special-copy">
        <span className="eyebrow"><Sparkles size={14} /> Pilihan spesial</span>
        <h2>{p.name}</h2>
        <p>{p.desc} Dibuat segar, cocok untuk dinikmati sendiri maupun dibagi bersama.</p>
        <div className="special-price">{rupiah(p.price)}</div>
        <div className="special-actions">
          {isSoldOut(p)
            ? <button className="btn-berry" disabled>Sedang habis</button>
            : <button className="btn-berry" onClick={(e) => onAdd(p, e)}>Tambah ke keranjang <Plus size={16} /></button>}
          <a className="btn-outline" href={menuHref}>Semua menu <ArrowRight size={16} /></a>
        </div>
      </div>
    </section>
  );
}
