import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import useCartStore from '../stores/cartStore';
import { formatCurrency } from '../utils/helpers';

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const totalPrice = getTotalPrice();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center animate-fade-in-up">
          <p className="text-6xl sm:text-7xl mb-4">🛒</p>
          <h2 className="text-xl sm:text-2xl font-bold text-warm-800 dark:text-warm-200 mb-2">Keranjang Kosong</h2>
          <p className="text-sm sm:text-base text-warm-500 dark:text-warm-400 mb-6">Yuk mulai belanja makanan favoritmu!</p>
          <Link to="/products"><Button icon={ShoppingBag}>Jelajahi Menu</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full flex justify-center pt-24 sm:pt-28 md:pt-36 pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-warm-900 dark:text-white">Keranjang 🛒</h1>
          <button onClick={clearCart} className="text-xs sm:text-sm text-red-500 hover:text-red-600 font-medium transition-colors">Hapus Semua</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 sm:gap-4 bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl border border-warm-100 dark:border-dark-600 p-3 sm:p-4">
                <img src={item.image_url} alt={item.name} className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg sm:rounded-xl flex-shrink-0 bg-warm-200" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-warm-900 dark:text-white truncate">{item.name}</h3>
                  <p className="text-brand-600 dark:text-brand-400 font-bold text-sm sm:text-base mt-0.5">{formatCurrency(item.price)}</p>

                  <div className="flex items-center justify-between mt-2 sm:mt-3">
                    <div className="flex items-center border border-warm-200 dark:border-dark-500 rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 text-warm-500 hover:bg-warm-50 dark:hover:bg-dark-700 transition-colors active:bg-warm-100"><Minus size={12} /></button>
                      <span className="px-2 sm:px-3 text-xs sm:text-sm font-bold text-warm-900 dark:text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 text-warm-500 hover:bg-warm-50 dark:hover:bg-dark-700 transition-colors active:bg-warm-100"><Plus size={12} /></button>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="font-bold text-xs sm:text-sm text-warm-800 dark:text-warm-200">{formatCurrency(item.price * item.quantity)}</span>
                      <button onClick={() => removeItem(item.id)} className="p-1.5 sm:p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl border border-warm-100 dark:border-dark-600 p-4 sm:p-6 lg:sticky lg:top-24">
              <h3 className="text-base sm:text-lg font-bold text-warm-900 dark:text-white mb-3 sm:mb-4">Ringkasan</h3>
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-warm-500 dark:text-warm-400">Subtotal ({items.length} item)</span>
                  <span className="font-medium text-warm-800 dark:text-warm-200">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-warm-500 dark:text-warm-400">Ongkos Kirim</span>
                  <span className="font-medium text-green-500">Gratis</span>
                </div>
                <div className="border-t border-warm-100 dark:border-dark-600 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm sm:text-base text-warm-900 dark:text-white">Total</span>
                    <span className="text-lg sm:text-xl font-extrabold text-brand-600 dark:text-brand-400">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
              </div>
              <Link to="/checkout"><Button fullWidth size="lg" icon={ArrowRight} iconPosition="right">Checkout</Button></Link>
              <Link to="/products" className="block text-center mt-3">
                <span className="text-xs sm:text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium transition-colors">+ Tambah Menu Lain</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
