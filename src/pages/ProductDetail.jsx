import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ShoppingCart, Star, Flame, Plus, Minus, Package } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProductGrid from '../components/product/ProductGrid';
import useCartStore from '../stores/cartStore';
import useProductStore from '../stores/productStore';
import { formatCurrency } from '../utils/helpers';
import { BEST_SELLER_THRESHOLD } from '../utils/constants';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const { products, loading, fetchProducts } = useProductStore();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [products.length, fetchProducts]);

  const product = useMemo(() => 
    products.find(p => p.id === id), 
    [products, id]
  );

  const relatedProducts = useMemo(() => 
    product 
      ? products.filter(p => p.category === product.category && p.id !== product.id && p.stock > 0).slice(0, 4)
      : [],
    [products, product]
  );

  if (loading && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-warm-500 animate-pulse">Menghidangkan detail menu...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center">
          <p className="text-5xl sm:text-6xl mb-4">😕</p>
          <h2 className="text-xl sm:text-2xl font-bold text-warm-800 dark:text-warm-200 mb-2">Menu tidak ditemukan</h2>
          <Link to="/products"><Button variant="secondary" icon={ArrowLeft}>Kembali ke Menu</Button></Link>
        </div>
      </div>
    );
  }

  const isBestSeller = product.order_count >= BEST_SELLER_THRESHOLD;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${quantity}x ${product.name} ditambahkan!`, {
      icon: '🛒',
      style: { borderRadius: '12px', background: '#1a1a1a', color: '#fff', fontSize: '14px' },
    });
  };

  return (
    <div className="w-full">
      <div className="w-full flex justify-center pt-24 sm:pt-28 md:pt-36 pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-warm-500 hover:text-brand-600 dark:text-warm-400 dark:hover:text-brand-400 mb-4 sm:mb-6 transition-colors">
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Image */}
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-square bg-warm-200 dark:bg-dark-700 animate-fade-in">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/600x600/f3efe8/b44712?text=${encodeURIComponent(product.name)}`;
              }}
            />
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-col gap-2">
              {isBestSeller && <Badge variant="bestseller"><Flame size={14} className="mr-1" /> Best Seller</Badge>}
              {product.is_featured && <Badge variant="promo">⭐ Unggulan</Badge>}
              {isOutOfStock && <Badge variant="outofstock">Stok Habis</Badge>}
            </div>
          </div>

          {/* Info */}
          <div className="animate-fade-in-up">
            <p className="text-brand-500 font-semibold text-xs sm:text-sm uppercase tracking-wider mb-2">
              {product.category}
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-warm-900 dark:text-white mb-3 sm:mb-4">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
              <div className="flex items-center gap-1.5">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                <span className="font-bold text-warm-800 dark:text-warm-200 text-sm sm:text-base">{product.rating}</span>
              </div>
              <span className="text-warm-300 dark:text-dark-500">|</span>
              <span className="text-xs sm:text-sm text-warm-500 dark:text-warm-400">{product.order_count} terjual</span>
              <span className="text-warm-300 dark:text-dark-500">|</span>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-warm-500 dark:text-warm-400">
                <Package size={14} /> Stok: {product.stock}
              </div>
            </div>

            <p className="text-2xl sm:text-3xl font-extrabold text-brand-600 dark:text-brand-400 mb-5 sm:mb-6">
              {formatCurrency(product.price)}
            </p>

            <div className="mb-6 sm:mb-8">
              <h3 className="text-xs sm:text-sm font-bold text-warm-800 dark:text-warm-200 uppercase tracking-wider mb-2">Deskripsi</h3>
              <p className="text-sm sm:text-base text-warm-600 dark:text-warm-400 leading-relaxed">{product.description}</p>
            </div>

            {!isOutOfStock && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center border border-warm-200 dark:border-dark-500 rounded-xl overflow-hidden self-start">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-warm-500 hover:bg-warm-50 dark:hover:bg-dark-700 transition-colors active:bg-warm-100">
                    <Minus size={16} />
                  </button>
                  <span className="px-5 py-3 font-bold text-warm-900 dark:text-white min-w-[50px] text-center text-sm">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-3 text-warm-500 hover:bg-warm-50 dark:hover:bg-dark-700 transition-colors active:bg-warm-100">
                    <Plus size={16} />
                  </button>
                </div>

                <Button size="lg" icon={ShoppingCart} onClick={handleAddToCart} className="flex-1 sm:flex-none">
                  Tambah — {formatCurrency(product.price * quantity)}
                </Button>
              </div>
            )}

            {isOutOfStock && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-4">
                <p className="text-red-600 dark:text-red-400 font-medium text-sm">Maaf, produk ini sedang tidak tersedia.</p>
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-extrabold text-warm-900 dark:text-white mb-4 sm:mb-6">
              Menu Serupa 🍽️
            </h2>
            <ProductGrid products={relatedProducts} columns={4} />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
