export const APP_NAME = 'WarungKu';
export const APP_TAGLINE = 'Cita Rasa Nusantara, Satu Klik dari Anda';

export const PRODUCT_CATEGORIES = [
  'Semua',
  'Makanan Berat',
  'Makanan Ringan',
  'Minuman',
  'Dessert',
  'Sambal & Bumbu',
];

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Terpopuler' },
  { value: 'newest', label: 'Terbaru' },
  { value: 'price-asc', label: 'Harga Terendah' },
  { value: 'price-desc', label: 'Harga Tertinggi' },
  { value: 'rating', label: 'Rating Tertinggi' },
];

export const ORDER_STATUSES = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'processed', label: 'Diproses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export const PAYMENT_METHODS = [
  {
    id: 'transfer',
    name: 'Transfer Bank',
    description: 'BCA, BNI, BRI, Mandiri',
    icon: 'building-2',
  },
  {
    id: 'qris',
    name: 'QRIS',
    description: 'Scan QR untuk pembayaran instan',
    icon: 'qr-code',
  },
  {
    id: 'cod',
    name: 'Bayar di Tempat',
    description: 'Hanya untuk pencatatan manual admin',
    icon: 'hand-coins',
    isAdminOnly: true,
  },
];

export const BEST_SELLER_THRESHOLD = 10;
export const ITEMS_PER_PAGE = 12;

// Demo mode flag - set to false when Supabase is configured
export const IS_DEMO_MODE = false;
