import React from 'react';
import { testimonials } from '../testimonials.js';

// Kartu ulasan yang bisa digeser. Disembunyikan otomatis kalau src/testimonials.js masih kosong.
export default function Testimonials() {
  if (!testimonials.length) return null;
  return (
    <section className="testi">
      <div className="section-heading" data-reveal>
        <span className="eyebrow">Cerita pelanggan</span>
        <h2>Kata <em>mereka</em></h2>
      </div>
      <div className="testi-row">
        {testimonials.map((t) => (
          <figure className="testi-card" key={t.name + t.text} data-reveal>
            <span className="testi-q">“</span>
            <blockquote>{t.text}</blockquote>
            <figcaption><b>{t.name}</b>{t.where && <small>{t.where}</small>}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
