import React, { useEffect, useRef, useState } from 'react';
import { rupiah } from '../data.js';

// Angka yang menghitung naik saat terlihat di layar.
function CountUp({ to, format = (n) => String(n) }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduce || !('IntersectionObserver' in window)) { setN(to); return undefined; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / 1300);
        setN(Math.round(to * (1 - (1 - k) ** 3)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{format(n)}</span>;
}

// Semua angka dihitung dari data asli (jumlah menu, harga termurah, jumlah langkah).
export default function StatsStrip({ products, steps }) {
  const min = Math.min(...products.map((p) => p.price));
  const items = [
    { node: <CountUp to={products.length} />, label: 'Varian menu pilihan' },
    { node: <CountUp to={min} format={rupiah} />, label: 'Harga mulai dari' },
    { node: <CountUp to={steps.length} />, label: 'Langkah mudah untuk pesan' },
  ];
  return (
    <section className="stats" data-reveal>
      {items.map((s) => <div key={s.label}><b>{s.node}</b><span>{s.label}</span></div>)}
    </section>
  );
}
