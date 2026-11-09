// Sumber data tunggal untuk website DAN asisten AI (server).
// Ubah menu, harga, dan FAQ di sini — keduanya otomatis ikut berubah.
// STOK (opsional, per menu) — atur di baris menu yang bersangkutan:
//   soldOut: true   -> tampil "Habis", tidak bisa dipesan. Hapus baris ini saat sudah ready lagi.
//   stock: 0        -> sama dengan habis.
//   stock: 3        -> tersisa 3: pesanan dibatasi 3, dan tampil "Sisa 3" saat sisa 5 atau kurang.
//   (tanpa keduanya) -> tersedia, tidak dibatasi (maks. 50 per pesanan).
export const MAX_QTY = 50;
export const isSoldOut = (m) => m?.soldOut === true || m?.stock === 0;
export const maxQtyOf = (m) => (isSoldOut(m) ? 0 : typeof m?.stock === 'number' ? Math.min(MAX_QTY, m.stock) : MAX_QTY);
export const LOW_STOCK_AT = 5; // tampil "Sisa N" (pelanggan) dan ditandai kuning (admin) saat sisa sebanyak ini atau kurang
export const lowStock = (m) => typeof m?.stock === 'number' && m.stock > 0 && m.stock <= LOW_STOCK_AT;

// Override stok dari halaman admin ({ [id]: { soldOut?: boolean, stock?: number|null } }) menimpa isi file ini.
export function applyStock(items, overrides) {
  if (!overrides) return items;
  return items.map((it) => {
    const o = overrides[it.id];
    if (!o) return it;
    const n = { ...it };
    if (typeof o.soldOut === 'boolean') n.soldOut = o.soldOut;
    if (o.stock === null) delete n.stock;
    else if (Number.isInteger(o.stock)) n.stock = o.stock;
    return n;
  });
}

export const menu = [
  { id: 1, name: 'Bolen Pisang Coklat Keju', desc: 'Perpaduan pisang, cokelat, dan keju dalam pastry lembut.', price: 35000, tag: 'Favorit' },
  { id: 2, name: 'Bolen Pisang Tape Keju', desc: 'Isian tape pilihan dengan keju yang gurih.', price: 35000, tag: 'Lembut & gurih' },
  { id: 3, name: 'Bolen Pisang Hazelnut', desc: 'Rasa hazelnut yang nikmat untuk teman santai.', price: 45000, tag: 'Premium' },
  { id: 4, name: 'Bolen Lilit', desc: 'Bolen berlapis pastry dengan tekstur renyah dan lembut.', price: 35000, tag: 'Best seller' },
  { id: 5, name: 'Banana Strudel', desc: 'Pastry pisang dengan lapisan kulit yang renyah.', price: 40000, tag: 'Pilihan spesial' },
];

export const faqs = [
  { q: 'Apakah pembayaran dilakukan langsung di website?', a: 'Belum. Website hanya menyusun pesananmu dan mengirimkannya ke WhatsApp admin. Pembayaran dikonfirmasi bersama admin.' },
  { q: 'Bagaimana dengan stok dan ongkos kirim?', a: 'Menu yang sedang habis ditandai "Habis" di website. Ketersediaan akhir dan ongkos kirim tetap dikonfirmasi admin lewat WhatsApp setelah pesananmu masuk.' },
  { q: 'Apakah keranjang hilang kalau halaman di-refresh?', a: 'Tidak. Keranjang dan data pemesan tersimpan di perangkatmu, jadi aman walau halaman dimuat ulang.' },
  { q: 'Bisa diantar atau ambil sendiri?', a: 'Pilih metode ambil atau antar saat checkout, lalu tentukan tanggal yang kamu inginkan. Admin akan mengonfirmasi jadwal dan biaya pengantaran.' },
  { q: 'Bisa pesan dalam jumlah banyak?', a: 'Bisa. Tambahkan jumlahnya di keranjang atau tulis kebutuhan khususmu di kolom catatan pesanan.' },
];
