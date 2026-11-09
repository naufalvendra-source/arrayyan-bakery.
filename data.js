import menuPhoto from './assets/menu.jpeg';
import pricePhoto from './assets/pricelist.jpeg';
import fotoA from './assets/foto-a.jpg';
import fotoB from './assets/foto-b.jpg';
import fotoC from './assets/foto-c.jpg';
import fotoD from './assets/foto-d.jpg';
import fotoE from './assets/foto-e.jpg';

import { menu, faqs, isSoldOut, maxQtyOf, lowStock } from '../shared/menu.js';

export const WA_NUMBER = '628222890263';
export const INSTAGRAM = 'arrayyanbakery';

export const images = { menuPhoto, pricePhoto, hero: fotoA, cta: fotoE };

export const gallery = [
  { src: fotoA, alt: 'Bolen pisang dalam kemasan box' },
  { src: fotoD, alt: 'Bolen pisang coklat keju close-up' },
  { src: fotoB, alt: 'Bolen pisang tape keju' },
  { src: fotoC, alt: 'Aneka bolen siap kirim' },
  { src: fotoE, alt: 'Bolen pisang hasil panggang' },
  { src: pricePhoto, alt: 'Pricelist Arrayyan Bakery' },
];

export const sortOptions = [
  { value: 'default', label: 'Urutan awal' },
  { value: 'cheap', label: 'Termurah' },
  { value: 'pricey', label: 'Termahal' },
];

const imageById = { 1: fotoD, 2: fotoB, 3: fotoC, 4: fotoA, 5: fotoE };
export const products = menu.map((m) => ({ ...m, image: imageById[m.id] }));

export const steps = [
  { title: 'Pilih menu', text: 'Pilih bolen atau pastry favoritmu dan atur jumlahnya.' },
  { title: 'Isi data pemesan', text: 'Lengkapi nama, nomor WhatsApp, dan alamat pengiriman.' },
  { title: 'Kirim ke WhatsApp', text: 'Pesanan tersusun otomatis, tinggal tekan kirim ke admin.' },
  { title: 'Konfirmasi & bayar', text: 'Admin mengonfirmasi stok, ongkir, dan detail pembayaran.' },
];

export { faqs, isSoldOut, maxQtyOf, lowStock };

export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
