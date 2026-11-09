// Hujan confetti kecil setelah pesanan dikirim.
export function confetti() {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#d8456c', '#f06a8d', '#f2b35e', '#fff', '#8d4c2a', '#ffd3dc'];
    const root = document.createElement('div');
    root.className = 'confetti';
    document.body.appendChild(root);
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('i');
      const size = 6 + Math.random() * 7;
      c.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size * (Math.random() > 0.5 ? 1 : 0.5)}px;background:${colors[i % colors.length]};border-radius:${Math.random() > 0.6 ? '50%' : '2px'}`;
      root.appendChild(c);
      c.animate(
        [
          { transform: 'translateY(-20px) rotate(0)', opacity: 1 },
          { transform: `translate(${(Math.random() - 0.5) * 240}px,${window.innerHeight + 40}px) rotate(${Math.random() * 900}deg)`, opacity: 0.8 },
        ],
        { duration: 1800 + Math.random() * 1600, delay: Math.random() * 500, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' },
      );
    }
    setTimeout(() => root.remove(), 4200);
  } catch { /* abaikan */ }
}
