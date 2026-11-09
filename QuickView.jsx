import React from 'react';
import { X, Plus, Minus, Heart, Check } from 'lucide-react';
import { rupiah, isSoldOut, maxQtyOf, lowStock } from '../data.js';

// Jendela "Lihat cepat": detail produk besar tanpa pindah halaman.
export default function QuickView({ p, qty, fav, onClose, onAdd, onChange, onFav }) {
  const out = isSoldOut(p);
  const max = maxQtyOf(p);
  return (
    <div className="qv-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="qv" role="dialog" aria-modal="true" aria-label={p.name}>
        <button className="icon-btn qv-close" onClick={onClose} aria-label="Tutup"><X /></button>
        <div className="qv-img">
          <img src={p.image} alt={p.name} />
          <span className="pc-tag">{out ? 'Habis' : p.tag}</span>
        </div>
        <div className="qv-info">
          <span className="eyebrow">Detail menu</span>
          <h2>{p.name}</h2>
          <p>{p.desc}</p>
          {out && <div className="qv-stock out">Sedang habis</div>}
          {lowStock(p) && <div className="qv-stock">Sisa {p.stock} — buruan pesan</div>}
          <ul className="qv-points">
            <li><Check size={15} /> Stok &amp; ongkir dikonfirmasi admin lewat WhatsApp</li>
            <li><Check size={15} /> Bisa diantar atau ambil sendiri</li>
            <li><Check size={15} /> Pesan jumlah banyak? Tulis di catatan pesanan</li>
          </ul>
          <div className="qv-price">{rupiah(p.price)}</div>
          <div className="qv-actions">
            {out ? (
              <button className="btn-berry" disabled>Menu sedang habis</button>
            ) : qty === 0 ? (
              <button className="btn-berry" onClick={(e) => onAdd(p, e)}>Tambah ke keranjang <Plus size={16} /></button>
            ) : (
              <div className="qv-qty">
                <button onClick={() => onChange(p.id, -1)} aria-label="Kurangi"><Minus size={16} /></button>
                <b>{qty}</b>
                <button onClick={() => onChange(p.id, 1)} disabled={qty >= max} aria-label="Tambah"><Plus size={16} /></button>
                <span>= {rupiah(qty * p.price)}</span>
              </div>
            )}
            <button className={fav ? 'qv-fav on' : 'qv-fav'} onClick={() => onFav(p.id)} aria-pressed={!!fav} aria-label="Favorit">
              <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
