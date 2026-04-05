import { useState, useMemo, useEffect } from 'react';
import SearchBar from '../components/ui/SearchBar';
import ProductGrid from '../components/product/ProductGrid';
import useProductStore from '../stores/productStore';

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedSort, setSelectedSort] = useState('popular');
  
  const { products, loading, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.stock > 0);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'Semua') {
      result = result.filter(p => p.category === selectedCategory);
    }

    switch (selectedSort) {
      case 'popular': result.sort((a, b) => b.order_count - a.order_count); break;
      case 'newest': result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      default: break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedSort]);

  return (
    <div className="w-full">
      {/* Cinematic Header */}
      <div className="relative w-full bg-gradient-hero pt-24 sm:pt-28 md:pt-36 pb-12 sm:pb-16 md:pb-20 overflow-hidden flex justify-center break-words">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 tracking-tight animate-fade-in-up">
              Katalog <span className="text-gradient">Menu</span>
            </h1>
            <p className="text-white/60 text-lg sm:text-xl font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Eksplorasi {products.length} mahakarya kuliner lokal yang diracik dengan bumbu pilihan dan dedikasi penuh.
            </p>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 w-full leading-none translate-y-[1px]">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-[40px] sm:h-[80px] block">
            <path d="M0,0 C320,80 420,80 720,40 C1020,0 1120,0 1440,80 L1440,80 L0,80 Z" className="fill-warm-50 dark:fill-dark-900" />
          </svg>
        </div>
      </div>

      <div className="w-full flex justify-center py-8 sm:py-12 relative z-20">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search & Filter */}
        <div className="mb-5 sm:mb-8">
          <SearchBar
            onSearch={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onSortChange={setSelectedSort}
            selectedCategory={selectedCategory}
            selectedSort={selectedSort}
          />
        </div>

        <div className="mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-warm-500 dark:text-warm-400">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                Memuat menu lezat...
              </span>
            ) : (
              <>Menampilkan <span className="font-semibold text-warm-800 dark:text-warm-200">{filteredProducts.length}</span> menu</>
            )}
          </p>
        </div>

          {loading && products.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-3xl h-80 border border-white/5" />
              ))}
            </div>
          ) : (
            <ProductGrid products={filteredProducts} columns={4} />
          )}
        </div>
      </div>
    </div>
  );
}
