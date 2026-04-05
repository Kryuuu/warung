import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Flame } from 'lucide-react';
import Badge from '../ui/Badge';
import useCartStore from '../../stores/cartStore';
import { formatCurrency } from '../../utils/helpers';
import { BEST_SELLER_THRESHOLD } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);
  const isBestSeller = product.order_count >= BEST_SELLER_THRESHOLD;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product);
    toast.success(`${product.name} ditambahkan!`, {
      icon: '🛒',
      style: { borderRadius: '12px', background: '#1a1a1a', color: '#fff', fontSize: '14px' },
    });
  };

  return (
    <Link to={`/products/${product.id}`} className="block group">
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-warm-100 dark:border-white/5 overflow-hidden hover-lift h-full flex flex-col relative group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-warm-200 dark:bg-dark-600">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/600x400/f3efe8/b44712?text=${encodeURIComponent(product.name)}`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

          {/* Badges */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1">
            {isBestSeller && (
              <Badge variant="bestseller" size="xs">
                <Flame size={10} className="mr-0.5" /> Best Seller
              </Badge>
            )}
            {product.is_featured && (
              <Badge variant="promo" size="xs">⭐ Unggulan</Badge>
            )}
            {isOutOfStock && (
              <Badge variant="outofstock" size="xs">Habis</Badge>
            )}
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 bg-white/90 dark:bg-dark-800/90 backdrop-blur-sm px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-warm-800 dark:text-warm-200">{product.rating}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          <p className="text-[10px] sm:text-xs text-brand-500 font-medium mb-0.5 sm:mb-1">{product.category}</p>
          <h3 className="text-sm sm:text-base font-bold text-warm-900 dark:text-white mb-1 line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm text-warm-500 dark:text-warm-400 line-clamp-2 mb-2 sm:mb-3 leading-relaxed flex-1">
            {product.description}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-sm sm:text-base font-bold text-brand-600 dark:text-brand-400">
              {formatCurrency(product.price)}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`
                p-2 sm:p-2.5 rounded-xl transition-all duration-200
                ${isOutOfStock
                  ? 'bg-warm-100 text-warm-400 cursor-not-allowed dark:bg-dark-600 dark:text-dark-400'
                  : 'bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white active:scale-95 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500 dark:hover:text-white dark:hover:shadow-[0_0_15px_rgba(250,90,14,0.4)]'}
              `}
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
