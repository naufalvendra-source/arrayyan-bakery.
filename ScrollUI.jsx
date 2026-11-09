import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

// Garis progres scroll di atas layar + tombol "kembali ke atas".
export default function ScrollUI() {
  const [p, setP] = useState(0);
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? Math.min(1, window.scrollY / h) : 0);
      setShow(window.scrollY > 700);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <div className="scroll-progress" style={{ transform: `scaleX(${p})` }} aria-hidden="true" />
      <button className={show ? 'to-top show' : 'to-top'} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Kembali ke atas" tabIndex={show ? 0 : -1}>
        <ArrowUp size={18} />
      </button>
    </>
  );
}
