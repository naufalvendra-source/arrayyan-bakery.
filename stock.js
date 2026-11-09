// Ambil override stok dari server (diatur admin). Mengembalikan null jika tidak tersedia
// (mis. hosting statis tanpa /api) — dalam kasus itu website memakai stok dari shared/menu.js.
export async function fetchStock() {
  try {
    const r = await fetch('/api/stock', { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();
    return j && typeof j.stock === 'object' && j.stock ? j.stock : null;
  } catch {
    return null;
  }
}
