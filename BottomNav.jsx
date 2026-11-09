import React from 'react';
import { Home, CakeSlice, ShoppingBag, MessageCircle } from 'lucide-react';

// Bilah navigasi bawah ala aplikasi — hanya tampil di layar HP.
export default function BottomNav({ page, totalQty, onCart, waHref }) {
  return (
    <nav className="bnav" aria-label="Navigasi cepat">
      <a href="#/" className={page === 'home' ? 'on' : ''}><Home size={21} /><span>Beranda</span></a>
      <a href="#/menu" className={page === 'menu' ? 'on' : ''}><CakeSlice size={21} /><span>Menu</span></a>
      <button onClick={onCart} aria-label={`Keranjang, ${totalQty} produk`}>
        <span className="bnav-ico"><ShoppingBag size={21} />{totalQty > 0 && <i>{totalQty}</i>}</span><span>Keranjang</span>
      </button>
      <a href={waHref} target="_blank" rel="noreferrer"><MessageCircle size={21} /><span>WhatsApp</span></a>
    </nav>
  );
}
