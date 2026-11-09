import React from 'react';
import { MessageCircle } from 'lucide-react';

// Banner gradasi (seperti "Special Offers" di Flavora) — ajakan pesan jumlah banyak.
export default function PromoBanner({ image, waHref }) {
  return (
    <aside className="promo" data-reveal>
      <div className="promo-copy">
        <span className="promo-pill">Untuk acara spesialmu</span>
        <h3>Pesan banyak untuk arisan, hampers &amp; acara?</h3>
        <p>Tulis kebutuhanmu di catatan pesanan, atau langsung chat admin untuk konfirmasi.</p>
        <a className="btn-dark" href={waHref} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Chat Admin</a>
      </div>
      <img src={image} alt="" loading="lazy" />
    </aside>
  );
}
