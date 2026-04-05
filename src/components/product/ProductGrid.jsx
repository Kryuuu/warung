import ProductCard from './ProductCard';
import { Package } from 'lucide-react';

export default function ProductGrid({ products, columns = 4 }) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <Package size={56} className="mx-auto text-warm-300 dark:text-dark-500 mb-4" />
        <h3 className="text-lg sm:text-xl font-bold text-warm-700 dark:text-warm-300 mb-2">
          Tidak ada menu ditemukan
        </h3>
        <p className="text-sm text-warm-500 dark:text-warm-400">
          Coba ubah filter atau kata kunci pencarian
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-3 sm:gap-4 md:gap-5 stagger-children ${
      columns === 4
        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        : columns === 3
        ? 'grid-cols-2 md:grid-cols-3'
        : 'grid-cols-2'
    }`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
