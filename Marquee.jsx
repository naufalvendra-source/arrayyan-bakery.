import React from 'react';

const words = ['Bolen Pisang', 'Freshly Baked', 'Banana Strudel', 'Baked With Love', 'Homemade', 'Pastry Lembut'];

// Pita teks berjalan di bawah hero.
export default function Marquee() {
  const row = words.map((w) => <span key={w}>{w}<i>✦</i></span>);
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">{row}{row}{row}{row}</div>
    </div>
  );
}
