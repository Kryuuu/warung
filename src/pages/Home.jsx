import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Truck, Shield, Star, Flame, Sparkles } from 'lucide-react';
import ProductGrid from '../components/product/ProductGrid';
import useProductStore from '../stores/productStore';
import { BEST_SELLER_THRESHOLD, APP_TAGLINE } from '../utils/constants';

export default function Home() {
  const { products, loading, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const featuredProducts = useMemo(() => 
    products.filter(p => p.is_featured && p.stock > 0).slice(0, 4), 
    [products]
  );
  
  const bestSellers = useMemo(() => 
    [...products]
      .filter(p => p.order_count >= BEST_SELLER_THRESHOLD && p.stock > 0)
      .sort((a, b) => b.order_count - a.order_count)
      .slice(0, 4),
    [products]
  );

  const features = [
    { icon: ShoppingBag, title: 'Smart Ordering', desc: 'Sistem pemesanan secepat kilat dengan antarmuka yang intuitif.' },
    { icon: Truck, title: 'Hyper Local Delivery', desc: 'Kurir langsung dari dapur ke meja Anda dalam hitungan menit.' },
    { icon: Shield, title: 'Vetted Quality', desc: 'Hanya UMKM terpilih dengan standar keamanan pangan tertinggi.' },
  ];

  return (
    <div className="w-full flex-1">
      {/* ===== CINEMATIC HERO SECTION ===== */}
      <section className="relative w-full min-h-[90vh] bg-gradient-hero flex items-center justify-center pt-20">
        <div className="hero-glow-blob" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl flex flex-col items-center sm:items-start text-center sm:text-left mx-auto sm:mx-0">
            {/* Status Pill */}
            <div className="glass-pill rounded-full px-4 py-2 flex items-center justify-center gap-2 mb-8 animate-fade-in-up shadow-[0_0_15px_rgba(250,90,14,0.3)]">
              <Sparkles size={16} className="text-brand-400" />
              <span className="text-sm font-semibold tracking-wide text-brand-500 uppercase">Platform SaaS #1 UMKM</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1.1] tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Rasa <span className="text-gradient drop-shadow-lg">Nusantara.</span><br />
              <span className="text-white/90">Kualitas Dunia.</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-white/60 mb-10 max-w-2xl font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {APP_TAGLINE}. Platform pintar untuk mengeksplorasi mahakarya kuliner lokal dengan sentuhan teknologi modern.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/products" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 hover:from-brand-500 hover:to-brand-300 text-white font-bold text-lg shadow-[0_4px_24px_rgba(250,90,14,0.4)] hover:shadow-[0_8px_32px_rgba(250,90,14,0.6)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                  Mulai Rasakan <ArrowRight size={20} />
                </button>
              </Link>
              <Link to="/products" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-lg backdrop-blur-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center">
                  Lihat Katalog Menu
                </button>
              </Link>
            </div>

            {/* Premium Stats */}
            <div className="flex gap-8 sm:gap-12 mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {[
                { value: '1.2M+', label: 'Pesanan Sukses' },
                { value: '5K+', label: 'Mitra UMKM' },
                { value: '4.9', label: 'App Rating', icon: Star },
              ].map((stat, i) => (
                <div key={i} className="text-left">
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">{stat.value}</p>
                    {stat.icon && <stat.icon size={18} className="text-brand-400 fill-brand-400 mb-1" />}
                  </div>
                  <p className="text-sm font-medium text-white/50 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cinematic Wave separator */}
        <div className="absolute bottom-0 left-0 w-full leading-none translate-y-[1px]">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-[60px] sm:h-[120px] block">
            <path d="M0,0 C320,120 420,120 720,60 C1020,0 1120,0 1440,120 L1440,120 L0,120 Z" className="fill-warm-50 dark:fill-dark-900" />
          </svg>
        </div>
      </section>

      {/* ===== FEATURES BENTO BOX ===== */}
      <section className="py-16 sm:py-24 relative z-10 flex justify-center w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {features.map((feat, i) => (
              <div key={i} className="group relative overflow-hidden p-8 bg-white dark:bg-dark-800 rounded-3xl border border-warm-200 dark:border-dark-600 hover-lift">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <feat.icon size={120} />
                </div>
                <div className="w-14 h-14 bg-brand-500/10 dark:bg-brand-500/20 rounded-2xl flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 group-hover:opacity-60 transition-opacity" />
                  <feat.icon size={26} className="text-brand-600 dark:text-brand-400 relative z-10" />
                </div>
                <h3 className="text-xl font-bold text-warm-900 dark:text-white mb-3">{feat.title}</h3>
                <p className="text-base text-warm-600 dark:text-warm-400 leading-relaxed font-medium">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== EXCLUSIVE COLLECTIONS ===== */}
      <section className="py-16 sm:py-24 flex justify-center w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-[2px] w-8 bg-brand-500" />
                <p className="text-brand-500 font-bold text-sm uppercase tracking-widest">Koleksi Kurasi</p>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-warm-900 dark:text-white tracking-tight">
                Menu Unggulan
              </h2>
            </div>
            <Link to="/products" className="group flex items-center gap-2 text-sm font-bold text-warm-900 dark:text-white hover:text-brand-500 transition-colors uppercase tracking-widest bg-warm-200/50 dark:bg-dark-800 px-6 py-3 rounded-full">
              Lihat Katalog <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-3xl h-80 border border-white/5" />
              ))}
            </div>
          ) : (
            <ProductGrid products={featuredProducts} columns={4} />
          )}
        </div>
      </section>

      {/* ===== HOT LIST ===== */}
      <section className="py-20 sm:py-32 relative overflow-hidden border-t border-warm-200 dark:border-dark-700 flex justify-center w-full">
        <div className="absolute inset-0 bg-warm-100 dark:bg-dark-800" />
        <div className="absolute left-[10%] top-[40%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center mb-16">
            <Flame size={48} className="text-brand-500 mb-4 animate-float" />
            <h2 className="text-4xl md:text-6xl font-black text-warm-900 dark:text-white tracking-tight mb-4">
              Sedang <span className="text-gradient">Viral</span>
            </h2>
            <p className="text-lg text-warm-600 dark:text-warm-400 font-medium max-w-2xl mx-auto">
              Mahakarya kuliner lokal yang paling banyak diburu minggu ini. Jangan sampai kehabisan.
            </p>
          </div>
          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-3xl h-80 border border-white/5" />
              ))}
            </div>
          ) : (
            <ProductGrid products={bestSellers} columns={4} />
          )}
        </div>
      </section>

      {/* ===== HIGH-END CTA ===== */}
      <section className="py-20 sm:py-32 flex justify-center w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-dark-900">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/20 rounded-full blur-[100px] pointer-events-none translate-x-[20%] -translate-y-[20%]" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-warm-500/10 rounded-full blur-[80px] pointer-events-none -translate-x-[20%] translate-y-[20%]" />
            
            <div className="relative z-10 px-6 py-20 sm:p-24 text-center max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                Tingkatkan Pengalaman Bersantap Anda Hari Ini.
              </h2>
              <p className="text-xl md:text-2xl text-white/60 mb-10 font-light">
                Bergabung dengan {APP_TAGLINE} dan nikmati layanan pesan-antar makanan masa depan yang diciptakan untuk profesional modern.
              </p>
              <div className="flex justify-center">
                <Link to="/products">
                  <button className="px-10 py-5 rounded-2xl bg-white text-dark-900 font-black text-lg shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:shadow-[0_15px_50px_rgba(255,255,255,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3">
                    Mulai Eksplorasi <Sparkles size={20} className="text-brand-500" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
