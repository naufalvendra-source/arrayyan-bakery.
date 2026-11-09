import React, { useEffect, useState } from 'react';

// Layar pembuka singkat dengan logo — hanya sekali per sesi browser.
export default function Splash({ logo }) {
  const [phase, setPhase] = useState(() => {
    try {
      if (sessionStorage.getItem('arrayyan-splash') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'off';
      sessionStorage.setItem('arrayyan-splash', '1');
    } catch { /* abaikan */ }
    return 'on';
  });
  // Satu efek saat mount saja, supaya timer kedua tidak ikut terhapus saat fase berganti.
  useEffect(() => {
    if (phase !== 'on') return undefined;
    const a = setTimeout(() => setPhase('leave'), 1100);
    const b = setTimeout(() => setPhase('off'), 1700);
    return () => { clearTimeout(a); clearTimeout(b); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (phase === 'off') return null;
  return (
    <div className={phase === 'leave' ? 'splash leave' : 'splash'} aria-hidden="true">
      <img src={logo} alt="" />
      <b>Arrayyan <em>Bakery</em></b>
      <small>Freshly baked with love</small>
    </div>
  );
}
