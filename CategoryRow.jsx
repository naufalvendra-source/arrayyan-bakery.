import React from 'react';
import { categories } from '../categories.js';

// Kategori bulat (seperti "Browse Categories" di Flavora). Klik → buka Menu dengan pencarian terisi.
export default function CategoryRow({ products, onPick }) {
  return (
    <section className="cats-section">
      <div className="section-heading" data-reveal>
        <span className="eyebrow">Mau yang mana?</span>
        <h2>Jelajahi <em>kategori</em></h2>
      </div>
      <div className="cats">
        {categories.map((c) => {
          const p = products.find((x) => x.id === c.id);
          return (
            <button key={c.q} className="cat" onClick={() => onPick(c.q)} data-reveal>
              <span className="cat-img"><img src={p?.image} alt="" loading="lazy" /></span>
              <b>{c.label}</b>
            </button>
          );
        })}
      </div>
    </section>
  );
}
