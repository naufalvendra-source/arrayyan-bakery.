// Animasi "terbang ke keranjang": titik foto produk melayang dari tombol Tambah ke ikon keranjang.
export function flyToCart(fromEl, image) {
  try {
    const target = document.querySelector('.cart-btn');
    if (!fromEl || !target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = fromEl.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const sx = a.left + a.width / 2;
    const sy = a.top + a.height / 2;
    const dx = b.left + b.width / 2 - sx;
    const dy = b.top + b.height / 2 - sy;
    const dot = document.createElement('div');
    dot.className = 'fly-dot';
    if (image) dot.style.backgroundImage = `url("${image}")`;
    dot.style.left = `${sx - 22}px`;
    dot.style.top = `${sy - 22}px`;
    document.body.appendChild(dot);
    const anim = dot.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 90}px) scale(.85)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: 0.35 },
      ],
      { duration: 780, easing: 'cubic-bezier(.45,0,.75,.45)' },
    );
    anim.onfinish = () => {
      dot.remove();
      target.classList.remove('bump');
      void target.offsetWidth;
      target.classList.add('bump');
    };
  } catch { /* abaikan */ }
}
