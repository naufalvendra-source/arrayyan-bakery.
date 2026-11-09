import React from 'react';
import { ArrowRight, MessageCircle, Heart } from 'lucide-react';

// Hero gelap ala Flavora: foto produk melayang di sekeliling judul.
export default function HeroShowcase({ products, menuHref, waHref }) {
  const shot = (i) => products[i % products.length];
  // Parallax: foto bergeser halus mengikuti kursor (lihat --mx/--my di extras.css).
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const leave = (e) => { e.currentTarget.style.setProperty('--mx', 0); e.currentTarget.style.setProperty('--my', 0); };
  return (
    <section className="hero2" id="home" onMouseMove={move} onMouseLeave={leave}>
      {['s1', 's2', 's3', 's4', 's5'].map((cls, i) => (
        <img key={cls} className={`shot ${cls}`} src={shot(i).image} alt="" loading={i < 2 ? 'eager' : 'lazy'} />
      ))}
      <div className="hero2-copy">
        <span className="hero2-eyebrow"><Heart size={13} /> Freshly baked with love</span>
        <h1>Manisnya hari,<br /><em>dimulai dari roti.</em></h1>
        <p>Bolen pisang dan aneka pastry pilihan dari Arrayyan Bakery. Dibuat dengan penuh cinta untuk menemani setiap momen istimewa.</p>
        <div className="hero2-actions">
          <a className="btn-white" href={menuHref}>Lihat Menu <ArrowRight size={17} /></a>
          <a className="btn-berry" href={waHref} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Pesan Online</a>
        </div>
        <div className="hero2-badges">
          <span>✦ Fresh &amp; lezat</span><span>✦ Dibuat dengan cinta</span><span>✦ Pesan via WhatsApp</span>
        </div>
      </div>
    </section>
  );
}
