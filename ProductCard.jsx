import React from 'react';
import { Plus, Minus, Heart, Eye } from 'lucide-react';
import { rupiah, isSoldOut, maxQtyOf, lowStock } from '../data.js';

// Kartu produk: foto besar, tombol favorit, badge, dan tombol tambah / pengatur jumlah.
export default function ProductCard({ p, qty, fav, onAdd, onChange, onFav, onOpen }) {
  const out = isSoldOut(p);
  const max = maxQtyOf(p);
  return (
    <article className={out ? 'pc sold-out' : 'pc'} data-reveal>
      <div className="pc-img">
        <img src={p.image} alt={p.name} loading="lazy" onClick={() => onOpen && onOpen(p.id)} style={onOpen ? { cursor: 'pointer' } : undefined} />
        <span className="pc-tag">{out ? 'Habis' : p.tag}</span>
        <button className={fav ? 'pc-fav on' : 'pc-fav'} onClick={() => onFav(p.id)} aria-pressed={!!fav} aria-label={`Favorit: ${p.name}`}>
          <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
        </button>
        {onOpen && <button className="pc-quick" onClick={() => onOpen(p.id)}><Eye size={14} /> Lihat cepat</button>}
        {qty > 0 && <span className="pc-incart">{qty} di keranjang</span>}
      </div>
      <div className="pc-body">
        <h3>{p.name}</h3>
        <p>{p.desc}</p>
        {lowStock(p) && <small className="pc-stocknote">Sisa {p.stock} — buruan pesan</small>}
        <div className="pc-bottom">
          <b>{rupiah(p.price)}</b>
          {out ? (
            <button className="pc-add" disabled>Habis</button>
          ) : qty === 0 ? (
            <button className="pc-add" onClick={(e) => onAdd(p, e)}>Tambah <Plus size={15} /></button>
          ) : (
            <div className="pc-qty">
              <button onClick={() => onChange(p.id, -1)} aria-label={`Kurangi ${p.name}`}><Minus size={14} /></button>
              <b>{qty}</b>
              <button onClick={() => onChange(p.id, 1)} disabled={qty >= max} aria-label={`Tambah ${p.name}`}><Plus size={14} /></button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
