import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, ShoppingBag, ShoppingCart, Plus, Minus, Trash2, Menu, X, Instagram, MessageCircle, ArrowRight,
  CheckCircle2, CakeSlice, Heart, CreditCard, ChevronDown, ZoomIn, Search, Copy, CalendarDays, Lock,
} from 'lucide-react';
import logo from './assets/logo.jpeg';
import { WA_NUMBER, INSTAGRAM, images, products as baseProducts, steps, faqs, gallery, sortOptions, rupiah, maxQtyOf } from './data.js';
import Assistant from './Assistant.jsx';
import HeroShowcase from './components/HeroShowcase.jsx';
import Marquee from './components/Marquee.jsx';
import CategoryRow from './components/CategoryRow.jsx';
import ProductCard from './components/ProductCard.jsx';
import PromoBanner from './components/PromoBanner.jsx';
import FeaturedSpecial from './components/FeaturedSpecial.jsx';
import StatsStrip from './components/StatsStrip.jsx';
import StepsStrip from './components/StepsStrip.jsx';
import Testimonials from './components/Testimonials.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import ScrollUI from './components/ScrollUI.jsx';
import QuickView from './components/QuickView.jsx';
import BottomNav from './components/BottomNav.jsx';
import Splash from './components/Splash.jsx';
import { categories } from './categories.js';
import { confetti } from './confetti.js';
import { flyToCart } from './fly.js';
import { useStoredState, useModalBehavior, useReveal } from './hooks.js';
import { applyStock } from '../shared/menu.js';
import { fetchStock } from './stock.js';

const AdminPanel = lazy(() => import('./components/AdminPanel.jsx'));
const isAdminHash = () => window.location.hash.replace(/^#/, '') === '/admin';

const PAGES = [
  { id: 'home', path: '/', label: 'Beranda', title: 'Arrayyan Bakery — Freshly Baked With Love' },
  { id: 'menu', path: '/menu', label: 'Menu Roti', title: 'Menu Roti — Arrayyan Bakery' },
  { id: 'cara-pesan', path: '/cara-pesan', label: 'Cara Pesan', title: 'Cara Pesan — Arrayyan Bakery' },
  { id: 'galeri', path: '/galeri', label: 'Galeri', title: 'Galeri — Arrayyan Bakery' },
  { id: 'tentang', path: '/tentang', label: 'Tentang Kami', title: 'Tentang Kami — Arrayyan Bakery' },
  { id: 'faq', path: '/faq', label: 'FAQ', title: 'FAQ — Arrayyan Bakery' },
  { id: 'kontak', path: '/kontak', label: 'Kontak', title: 'Kontak — Arrayyan Bakery' },
];
const pageFromHash = () => {
  const path = window.location.hash.replace(/^#/, '') || '/';
  return (PAGES.find((p) => p.path === path) || PAGES[0]).id;
};

const waLink = (text) => `https://wa.me/${WA_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
const emptyForm = { name: '', phone: '', address: '', notes: '', payment: 'Transfer Bank', method: 'Diantar', date: '' };
const todayStr = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const prettyDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const validPhone = (v) => /^(\+?62|0)8\d{7,12}$/.test(v.replace(/[\s-]/g, ''));

export default function App() {
  const [cart, setCart] = useStoredState('arrayyan-cart', {});
  const [storedForm, setForm] = useStoredState('arrayyan-form', emptyForm);
  const form = { ...emptyForm, ...storedForm, date: storedForm.date >= todayStr() ? storedForm.date : '' };
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [sort, setSort] = useState('default');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  const [errors, setErrors] = useState({});
  const [page, setPage] = useState(pageFromHash);
  const [favs, setFavs] = useStoredState('arrayyan-fav', {});
  const [theme, setTheme] = useStoredState('arrayyan-theme', 'light');
  const [onlyFav, setOnlyFav] = useState(false);
  const [quick, setQuick] = useState(null);
  const [last, setLast] = useStoredState('arrayyan-last', {});
  const [admin, setAdmin] = useState(isAdminHash);
  // Stok dari halaman admin menimpa pengaturan di shared/menu.js
  const [stockMap, setStockMap] = useState({});
  const products = useMemo(() => applyStock(baseProducts, stockMap), [stockMap]);

  useEffect(() => {
    const onHash = () => { setPage(pageFromHash()); setAdmin(isAdminHash()); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = PAGES.find((p) => p.id === page).title;
  }, [page]);
  // Ambil stok terbaru: saat dibuka, saat tab kembali aktif, dan tiap 60 detik
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const m = await fetchStock();
      if (alive && m) setStockMap((prev) => (JSON.stringify(prev) === JSON.stringify(m) ? prev : m));
    };
    load();
    const id = setInterval(load, 60000);
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);
  // Setelah admin selesai mengubah stok dan kembali ke website, langsung ambil stok terbaru
  useEffect(() => {
    if (admin) return undefined;
    let alive = true;
    fetchStock().then((m) => { if (alive && m) setStockMap((prev) => (JSON.stringify(prev) === JSON.stringify(m) ? prev : m)); });
    return () => { alive = false; };
  }, [admin]);
  const navTo = () => setMobileOpen(false);
  const pagePath = (id) => `#${PAGES.find((p) => p.id === id).path}`;

  useEffect(() => { document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light'; }, [theme]);

  const closeCart = useCallback(() => setCartOpen(false), []);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  useModalBehavior(cartOpen, closeCart);
  useModalBehavior(checkoutOpen, closeCheckout);
  useModalBehavior(!!lightbox, closeLightbox);
  const closeQuick = useCallback(() => setQuick(null), []);
  useModalBehavior(quick !== null, closeQuick);
  useReveal(page);

  // Galeri: panah kiri/kanan untuk pindah foto
  const lbMove = useCallback((dir) => setLightbox((l) => {
    if (!l?.list) return l;
    const i = (l.i + dir + l.list.length) % l.list.length;
    return { ...l.list[i], list: l.list, i };
  }), []);
  useEffect(() => {
    if (!lightbox?.list) return undefined;
    const onKey = (e) => { if (e.key === 'ArrowRight') lbMove(1); if (e.key === 'ArrowLeft') lbMove(-1); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightbox?.list, lbMove]);
  const touch = useRef({ x: 0 }).current;

  // Pintasan: tekan "/" untuk langsung mencari menu
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (e.key !== '/' || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable) return;
      e.preventDefault();
      if (window.location.hash !== '#/menu') window.location.hash = '#/menu';
      setTimeout(() => document.querySelector('.search-box input')?.focus(), 80);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Notifikasi hilang otomatis
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  // Buang item keranjang yang produknya sudah tidak ada
  const cartItems = useMemo(
    () => products.filter((p) => cart[p.id]).map((p) => ({ ...p, qty: cart[p.id] })),
    [cart, products],
  );
  const lastValid = Object.fromEntries(Object.entries(last).filter(([id]) => products.some((p) => String(p.id) === id)));
  const totalQty = cartItems.reduce((s, p) => s + p.qty, 0);
  const total = cartItems.reduce((s, p) => s + p.price * p.qty, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? products.filter((p) => `${p.name} ${p.desc} ${p.tag}`.toLowerCase().includes(q)) : [...products];
    if (onlyFav) list = list.filter((p) => favs[p.id]);
    if (sort === 'cheap') list.sort((x, y) => x.price - y.price);
    if (sort === 'pricey') list.sort((x, y) => y.price - x.price);
    return list;
  }, [query, sort, onlyFav, favs, products]);

  // Mengubah jumlah di keranjang dengan mematuhi stok. Mengembalikan true jika ada yang ditambahkan/diubah.
  const change = (id, delta) => {
    const p = products.find((x) => x.id === id);
    const cur = cart[id] || 0;
    let d = delta;
    if (d > 0 && p) {
      const max = maxQtyOf(p);
      if (max <= 0) { setNotice(`${p.name} sedang habis.`); return false; }
      if (cur + d > max) {
        d = max - cur;
        const limited = typeof p.stock === 'number';
        setNotice(limited ? `Stok ${p.name} tinggal ${max}.` : `Maksimal ${max} per menu. Untuk jumlah lebih banyak, hubungi admin.`);
        if (d <= 0) return false;
      }
    }
    setCart((c) => {
      const next = { ...c, [id]: (c[id] || 0) + d };
      if (next[id] <= 0) delete next[id];
      return next;
    });
    return true;
  };
  const addProduct = (p, e) => {
    if (!change(p.id, 1)) return;
    setNotice(`${p.name} ditambahkan ke keranjang.`);
    flyToCart(e?.currentTarget, p.image);
  };
  const addFromAssistant = (items) => {
    const results = items.map(({ id, qty }) => change(id, qty));
    if (results.some(Boolean)) setNotice('Asisten memasukkan pesanan ke keranjang.');
  };

  // Sinkronkan keranjang dengan stok terbaru (mis. keranjang tersimpan sebelum menu habis)
  useEffect(() => {
    const fixes = [];
    const next = { ...cart };
    for (const p of products) {
      const q = cart[p.id];
      if (!q) continue;
      const max = maxQtyOf(p);
      if (q <= max) continue;
      if (max <= 0) { delete next[p.id]; fixes.push(`${p.name} sedang habis dan dikeluarkan`); }
      else { next[p.id] = max; fixes.push(`${p.name} disesuaikan menjadi ${max}`); }
    }
    if (fixes.length) { setCart(next); setNotice(`${fixes.join('; ')}.`); }
  }, [cart, setCart, products]);
  const toggleFav = (id) => setFavs((f) => { const n = { ...f }; if (n[id]) delete n[id]; else n[id] = 1; return n; });
  const pickCategory = (q) => { setQuery(q); setOnlyFav(false); window.location.hash = '#/menu'; };
  const cardProps = (p) => ({ p, qty: cart[p.id] || 0, fav: !!favs[p.id], onAdd: addProduct, onChange: change, onFav: toggleFav, onOpen: setQuick });
  const reorder = () => {
    const next = {};
    const skipped = [];
    for (const [id, q] of Object.entries(lastValid)) {
      const p = products.find((x) => String(x.id) === id);
      const max = maxQtyOf(p);
      if (max <= 0) { skipped.push(p.name); continue; }
      next[id] = Math.min(q, max);
    }
    setCart(() => next);
    setNotice(skipped.length ? `Pesanan terakhir dimasukkan. ${skipped.join(', ')} sedang habis.` : 'Pesanan terakhir dimasukkan ke keranjang.');
  };
  const remove = (id) => setCart((c) => { const n = { ...c }; delete n[id]; return n; });

  const updateForm = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  };

  const sendOrder = (e) => {
    e.preventDefault();
    if (!cartItems.length) return;
    const next = {};
    if (form.name.trim().length < 3) next.name = 'Masukkan nama lengkap.';
    if (!validPhone(form.phone)) next.phone = 'Nomor WhatsApp tidak valid. Contoh: 081234567890';
    if (form.method === 'Diantar' && form.address.trim().length < 10) next.address = 'Alamat terlalu singkat, mohon lengkapi.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const message = buildMessage();
    window.open(waLink(message), '_blank', 'noopener,noreferrer');
    setCheckoutOpen(false);
    setLast(Object.fromEntries(cartItems.map((p) => [p.id, p.qty])));
    setCart({});
    confetti();
    setNotice('Pesanan siap dikirim lewat WhatsApp. Tekan tombol Kirim di WhatsApp untuk menyelesaikan pesanan.');
  };

  const buildMessage = () => {
    const lines = cartItems.map((p) => `• ${p.name} (${p.qty} x ${rupiah(p.price)}) = ${rupiah(p.qty * p.price)}`).join('\n');
    return [
      'Halo Arrayyan Bakery, saya ingin memesan:', '', lines, '',
      `*Total: ${rupiah(total)}*`, '',
      '*Data Pemesan*',
      `Nama: ${form.name.trim()}`,
      `No. WhatsApp: ${form.phone.trim()}`,
      `Pengambilan: ${form.method}${form.date ? ` — ${prettyDate(form.date)}` : ''}`,
      form.method === 'Diantar' ? `Alamat: ${form.address.trim()}` : null,
      `Metode pembayaran: ${form.payment}`,
      `Catatan: ${form.notes.trim() || '-'}`, '',
      'Mohon konfirmasi ketersediaan dan detail pembayarannya. Terima kasih.',
    ].filter((l) => l !== null).join('\n');
  };

  const copyOrder = async () => {
    try { await navigator.clipboard.writeText(buildMessage()); setNotice('Teks pesanan disalin. Tempel di chat WhatsApp admin.'); }
    catch { setNotice('Gagal menyalin. Silakan gunakan tombol Kirim ke WhatsApp.'); }
  };


  if (admin) {
    return (
      <Suspense fallback={<div className="adm-loading">Memuat…</div>}>
        <AdminPanel />
      </Suspense>
    );
  }

  return (
    <>
      <a className="skip-link" href="#isi">Lewati ke konten</a>
      <Splash logo={logo} />
      <ScrollUI />
      <header className="header">
        <a className="brand" href="#/" onClick={navTo}><img src={logo} alt="Logo Arrayyan Bakery" /><span>Arrayyan <b>Bakery</b></span></a>
        <nav className={mobileOpen ? 'nav show' : 'nav'} aria-label="Navigasi utama">
          {PAGES.map((p) => (
            <a key={p.id} href={`#${p.path}`} onClick={navTo} className={page === p.id ? 'active' : ''} aria-current={page === p.id ? 'page' : undefined}>{p.label}</a>
          ))}
        </nav>
        <div className="head-actions">
          <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
          <a className="order-now" href={waLink()} target="_blank" rel="noreferrer">Pesan Sekarang</a>
          <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label={`Buka keranjang, ${totalQty} produk`}>
            <ShoppingBag size={19} /><span>Keranjang</span>{totalQty > 0 && <i>{totalQty}</i>}
          </button>
          <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main id="isi" tabIndex={-1}>

        {page === 'home' && (
          <div className="page" key="home">
        <HeroShowcase products={products} menuHref={pagePath('menu')} waHref={waLink()} />
        <Marquee />
        <StatsStrip products={products} steps={steps} />
        <CategoryRow products={products} onPick={pickCategory} />

        <section className="popular">
          <div className="popular-head" data-reveal>
            <div><span className="eyebrow">Pilihan terbaik untukmu</span><h2>Menu <em>populer</em></h2></div>
            <a className="see-all" href={pagePath('menu')}>Lihat semua <ArrowRight size={16} /></a>
          </div>
          <div className="pgrid">
            {products.slice(0, 5).map((p) => <ProductCard key={p.id} {...cardProps(p)} />)}
            <PromoBanner image={images.cta} waHref={waLink('Halo Arrayyan Bakery, saya ingin pesan dalam jumlah banyak.')} />
          </div>
        </section>

        <FeaturedSpecial p={products.find((p) => p.id === 3)} onAdd={addProduct} menuHref={pagePath('menu')} />

        <StepsStrip steps={steps} href={pagePath('cara-pesan')} />
        <Testimonials />

        <section className="cta-section" data-reveal>
          <div>
            <span className="eyebrow">Sudah tahu mau pilih yang mana?</span>
            <h2>Yuk, pesan roti<br /><em>favoritmu hari ini!</em></h2>
            <p>Masukkan pilihanmu ke keranjang, isi data pemesanan, lalu lanjutkan konfirmasi melalui WhatsApp.</p>
            <a className="light-btn" href={pagePath('menu')}>Lihat Menu <ArrowRight size={18} /></a>
          </div>
          <img src={images.cta} alt="Bolen pisang siap dinikmati" loading="lazy" />
        </section>

          </div>
        )}
        {page === 'menu' && (
          <div className="page" key="menu">
        <section className="menu-section" id="menu">
          <div className="section-heading" data-reveal>
            <span className="eyebrow">Pilihan terbaik untukmu</span>
            <h2>Menu <em>favorit</em> kami</h2>
            <p>Pilih camilan kesukaanmu dan nikmati kelezatannya bersama orang tersayang.</p>
          </div>
          <label className="search-box">
            <Search size={17} />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari bolen, strudel, hazelnut...  (tekan /)" aria-label="Cari menu" />
          </label>
          <div className="sort-chips" role="group" aria-label="Urutkan menu">
            {sortOptions.map((o) => (
              <button key={o.value} className={sort === o.value ? 'chip on' : 'chip'} onClick={() => setSort(o.value)} aria-pressed={sort === o.value}>{o.label}</button>
            ))}
          </div>
          <div className="sort-chips cat-chips" role="group" aria-label="Kategori menu">
            <button className={query === '' && !onlyFav ? 'chip cat-chip on' : 'chip cat-chip'} onClick={() => { setQuery(''); setOnlyFav(false); }}>Semua</button>
            {categories.map((c) => (
              <button key={c.q} className={!onlyFav && query.trim().toLowerCase() === c.q ? 'chip cat-chip on' : 'chip cat-chip'} onClick={() => { setQuery(c.q); setOnlyFav(false); }}>{c.label}</button>
            ))}
            <button className={onlyFav ? 'chip cat-chip on' : 'chip cat-chip'} onClick={() => setOnlyFav(!onlyFav)} aria-pressed={onlyFav}>♥ Favorit ({Object.keys(favs).length})</button>
          </div>
          {filtered.length === 0 ? (
            <p className="no-result">{onlyFav ? 'Belum ada menu favorit. Tekan ikon hati pada produk untuk menyimpannya.' : `Menu “${query}” belum ditemukan. Coba kata kunci lain ya.`}</p>
          ) : (
            <div className="product-grid">
              {filtered.map((p) => <ProductCard key={p.id} {...cardProps(p)} />)}
            </div>
          )}
          <div className="menu-footnote">* Harga mengikuti daftar harga Arrayyan Bakery. Konfirmasi ketersediaan produk melalui WhatsApp.</div>
        </section>

          </div>
        )}
        {page === 'cara-pesan' && (
          <div className="page" key="cara-pesan">
        <section className="steps-section" id="cara-pesan">
          <div className="section-heading" data-reveal>
            <span className="eyebrow">Mudah &amp; cepat</span>
            <h2>Cara <em>pesan</em></h2>
          </div>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title} data-reveal><span className="step-no">{i + 1}</span><h3>{s.title}</h3><p>{s.text}</p></li>
            ))}
          </ol>
        </section>

        <section className="cta-section" data-reveal>
          <div>
            <span className="eyebrow">Sudah tahu mau pilih yang mana?</span>
            <h2>Yuk, pesan roti<br /><em>favoritmu hari ini!</em></h2>
            <p>Masukkan pilihanmu ke keranjang, isi data pemesanan, lalu lanjutkan konfirmasi melalui WhatsApp.</p>
            <a className="light-btn" href={pagePath('menu')}>Lihat Menu <ArrowRight size={18} /></a>
          </div>
          <img src={images.cta} alt="Bolen pisang siap dinikmati" loading="lazy" />
        </section>

          </div>
        )}
        {page === 'galeri' && (
          <div className="page" key="galeri">
        <section className="gallery-section" id="galeri">
          <div className="section-heading" data-reveal>
            <span className="eyebrow">Intip dapur kami</span>
            <h2>Galeri <em>Arrayyan</em></h2>
          </div>
          <div className="gallery-grid">
            {gallery.map((g, i) => (
              <button key={g.alt} className={`g-item g${i}`} onClick={() => setLightbox({ ...g, list: gallery, i })} aria-label={`Perbesar: ${g.alt}`} data-reveal>
                <img src={g.src} alt={g.alt} loading="lazy" />
              </button>
            ))}
          </div>
        </section>

          </div>
        )}
        {page === 'tentang' && (
          <div className="page" key="tentang">
        <section className="story-section" id="tentang">
          <button className="story-image" onClick={() => setLightbox({ src: images.menuPhoto, alt: 'Pricelist Bolen Pisyang Arrayyan Bakery' })} aria-label="Perbesar pricelist Arrayyan Bakery">
            <img src={images.pricePhoto} alt="Pricelist dan produk Arrayyan Bakery" loading="lazy" />
            <span className="zoom-hint"><ZoomIn size={15} /> Lihat pricelist</span>
          </button>
          <div className="story-copy" data-reveal>
            <span className="eyebrow">Cerita dari dapur kami</span>
            <h2>Dibuat dengan cinta,<br /><em>untuk setiap cerita.</em></h2>
            <p>Arrayyan Bakery menghadirkan aneka bolen dan pastry dengan rasa yang istimewa. Kami percaya, camilan sederhana bisa membuat momen bersama keluarga dan teman menjadi lebih hangat.</p>
            <a className="primary-btn" href={waLink()} target="_blank" rel="noreferrer">Hubungi Kami <ArrowRight size={18} /></a>
          </div>
        </section>

          </div>
        )}
        {page === 'faq' && (
          <div className="page" key="faq">
        <section className="faq-section" id="faq">
          <div className="section-heading" data-reveal>
            <span className="eyebrow">Pertanyaan umum</span>
            <h2>Ada yang ingin <em>ditanyakan?</em></h2>
          </div>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <div className={openFaq === i ? 'faq-item open' : 'faq-item'} key={f.q}>
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}>
                  {f.q}<ChevronDown size={18} />
                </button>
                {openFaq === i && <p>{f.a}</p>}
              </div>
            ))}
          </div>
        </section>

          </div>
        )}
        {page === 'kontak' && (
          <div className="page" key="kontak">
        <section className="contact-section">
          <div className="section-heading" data-reveal>
            <span className="eyebrow">Hubungi &amp; pesan</span>
            <h2>Ayo <em>ngobrol</em></h2>
            <p>Tanya menu, pesanan dalam jumlah banyak, atau kebutuhan khusus langsung ke kami.</p>
          </div>
          <div className="contact-grid">
            <a className="contact-card" href={waLink()} target="_blank" rel="noreferrer" data-reveal>
              <MessageCircle size={26} /><b>WhatsApp</b><span>0822-8289-0263</span>
            </a>
            <a className="contact-card" href={`https://instagram.com/${INSTAGRAM}`} target="_blank" rel="noreferrer" data-reveal>
              <Instagram size={26} /><b>Instagram</b><span>@{INSTAGRAM}</span>
            </a>
          </div>
        </section>

          </div>
        )}
      </main>

      <footer>
        <div className="footer-brand"><img src={logo} alt="Arrayyan Bakery" /><div><b>Arrayyan Bakery</b><p>Freshly baked with love.</p></div></div>
        <div className="footer-contact">
          <span>Hubungi & pesan</span>
          <a href={waLink()} target="_blank" rel="noreferrer"><MessageCircle size={17} /> 0822-8289-0263</a>
          <a href={`https://instagram.com/${INSTAGRAM}`} target="_blank" rel="noreferrer"><Instagram size={17} /> @{INSTAGRAM}</a>
        </div>
        <small>© {new Date().getFullYear()} Arrayyan Bakery. Made with ♡</small>
        <a className="admin-btn" href="#/admin"><Lock size={14} /> Login Admin</a>
      </footer>

      {/* Tombol WhatsApp melayang */}
      {!cartOpen && !checkoutOpen && (
        totalQty > 0 ? (
          <button className="float-cart" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={18} /> {totalQty} produk · {rupiah(total)}
          </button>
        ) : (
          <a className="float-wa" href={waLink('Halo Arrayyan Bakery, saya ingin bertanya.')} target="_blank" rel="noreferrer" aria-label="Chat WhatsApp">
            <MessageCircle size={24} />
          </a>
        )
      )}

      <Assistant hidden={cartOpen || checkoutOpen || !!lightbox} onAdd={addFromAssistant} onOpenCart={() => setCartOpen(true)} />

      <BottomNav page={page} totalQty={totalQty} onCart={() => setCartOpen(true)} waHref={waLink()} />

      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />{notice}
          <button onClick={() => setNotice('')} aria-label="Tutup"><X size={16} /></button>
        </div>
      )}

      {lightbox && (
        <div className="overlay lightbox" onMouseDown={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
          onTouchStart={(e) => { touch.x = e.touches[0].clientX; }}
          onTouchEnd={(e) => { const d = e.changedTouches[0].clientX - touch.x; if (lightbox.list && Math.abs(d) > 50) lbMove(d < 0 ? 1 : -1); }}>
          <button className="icon-btn lightbox-close" onClick={closeLightbox} aria-label="Tutup"><X /></button>
          {lightbox.list && <button className="icon-btn lb-nav lb-prev" onClick={() => lbMove(-1)} aria-label="Foto sebelumnya"><ChevronLeft /></button>}
          <img src={lightbox.src} alt={lightbox.alt} />
          {lightbox.list && <button className="icon-btn lb-nav lb-next" onClick={() => lbMove(1)} aria-label="Foto berikutnya"><ChevronRight /></button>}
          {lightbox.list && <span className="lb-count">{lightbox.i + 1} / {lightbox.list.length}</span>}
        </div>
      )}

      {quick !== null && products.find((x) => x.id === quick) && (
        <QuickView p={products.find((x) => x.id === quick)} qty={cart[quick] || 0} fav={!!favs[quick]} onClose={closeQuick} onAdd={addProduct} onChange={change} onFav={toggleFav} />
      )}

      {cartOpen && (
        <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeCart(); }}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Keranjang belanja">
            <div className="drawer-head">
              <div><span className="eyebrow">Belanjaanmu</span><h2>Keranjang <em>Belanja</em></h2></div>
              <button className="icon-btn" onClick={closeCart} aria-label="Tutup keranjang"><X /></button>
            </div>
            {cartItems.length === 0 ? (
              <div className="empty">
                <ShoppingBag size={42} /><h3>Keranjang masih kosong</h3><p>Yuk, pilih roti favoritmu terlebih dahulu.</p>
                {Object.keys(lastValid).length > 0 && <button className="ghost-btn reorder" onClick={reorder}>↺ Pesan ulang pesanan terakhir</button>}
                <a className="primary-btn" href={pagePath('menu')} onClick={closeCart}>Mulai Belanja</a>
              </div>
            ) : (
              <>
                <div className="cart-list">
                  {cartItems.map((p) => (
                    <div className="cart-item" key={p.id}>
                      <img src={p.image} alt="" />
                      <div className="cart-detail">
                        <b>{p.name}</b><span>{rupiah(p.price)}</span>
                        <div className="qty">
                          <button onClick={() => change(p.id, -1)} aria-label={`Kurangi ${p.name}`}><Minus size={14} /></button>
                          <b>{p.qty}</b>
                          <button onClick={() => change(p.id, 1)} disabled={p.qty >= maxQtyOf(p)} aria-label={`Tambah ${p.name}`}><Plus size={14} /></button>
                        </div>
                      </div>
                      <div className="cart-line">
                        <b>{rupiah(p.price * p.qty)}</b>
                        <button className="remove" onClick={() => remove(p.id)} aria-label={`Hapus ${p.name}`}><Trash2 size={17} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <div><span>Total pesanan</span><b>{rupiah(total)}</b></div>
                  <button className="primary-btn full" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Lanjut ke Checkout <ArrowRight size={18} /></button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeCheckout(); }}>
          <div className="checkout-modal" role="dialog" aria-modal="true" aria-label="Data pemesanan">
            <div className="drawer-head">
              <div><span className="eyebrow">Satu langkah lagi</span><h2>Data <em>Pemesanan</em></h2></div>
              <button className="icon-btn" onClick={closeCheckout} aria-label="Tutup"><X /></button>
            </div>
            <div className="checkout-summary">
              <ul>{cartItems.map((p) => <li key={p.id}><span>{p.qty}× {p.name}</span><b>{rupiah(p.qty * p.price)}</b></li>)}</ul>
              <div className="checkout-total"><span>Total belanja ({totalQty} produk)</span><b>{rupiah(total)}</b></div>
            </div>
            <form onSubmit={sendOrder} noValidate>
              <label>Nama lengkap
                <input name="name" value={form.name} onChange={updateForm} placeholder="Masukkan nama lengkap" autoComplete="name" aria-invalid={!!errors.name} />
                {errors.name && <em className="err">{errors.name}</em>}
              </label>
              <label>Nomor WhatsApp
                <input name="phone" type="tel" value={form.phone} onChange={updateForm} placeholder="Contoh: 081234567890" autoComplete="tel" inputMode="tel" aria-invalid={!!errors.phone} />
                {errors.phone && <em className="err">{errors.phone}</em>}
              </label>
              <div className="field-group">
                <span className="fg-label">Pengambilan pesanan</span>
                <div className="seg" role="radiogroup" aria-label="Metode pengambilan">
                  {['Diantar', 'Ambil sendiri'].map((m) => (
                    <button type="button" key={m} role="radio" aria-checked={form.method === m} className={form.method === m ? 'seg-btn on' : 'seg-btn'} onClick={() => setForm((f) => ({ ...f, method: m }))}>{m}</button>
                  ))}
                </div>
              </div>
              <label><span className="lbl-row"><CalendarDays size={14} /> Tanggal diinginkan <small>(opsional)</small></span>
                <input name="date" type="date" min={todayStr()} value={form.date} onChange={updateForm} />
              </label>
              {form.method === 'Diantar' && <label>Alamat lengkap
                <textarea name="address" value={form.address} onChange={updateForm} placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota" rows="3" autoComplete="street-address" aria-invalid={!!errors.address} />
                {errors.address && <em className="err">{errors.address}</em>}
              </label>}
              <label>Metode pembayaran
                <select name="payment" value={form.payment} onChange={updateForm}>
                  <option>Transfer Bank</option><option>E-Wallet</option><option>COD (Bayar di Tempat)</option>
                </select>
              </label>
              <label>Catatan pesanan <small>(opsional)</small>
                <textarea name="notes" value={form.notes} onChange={updateForm} placeholder="Catatan tambahan untuk pesananmu" rows="2" />
              </label>
              <div className="payment-note"><CreditCard size={17} /> Detail rekening atau pembayaran akan dikonfirmasi oleh admin melalui WhatsApp.</div>
              <button className="primary-btn full" type="submit">Kirim Pesanan ke WhatsApp <MessageCircle size={18} /></button>
              <button className="ghost-btn full" type="button" onClick={copyOrder}><Copy size={16} /> Salin teks pesanan</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
