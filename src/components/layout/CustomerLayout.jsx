import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import useCartStore from '../../stores/cartStore';
import { formatCurrency } from '../../utils/helpers';

export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, getTotalPrice } = useCartStore();
  
  const hideFloatingCart = ['/cart', '/checkout'].includes(location.pathname);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = getTotalPrice();

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col justify-start overflow-x-hidden bg-warm-50 dark:bg-dark-900 relative">
      <Navbar />
      {/* Padding bottom is added conditionally so content isn't hidden behind the floating bar on mobile */}
      <main className={`flex-1 w-full ${!hideFloatingCart && totalItems > 0 ? 'pb-24' : ''}`}>
        <Outlet />
      </main>
      <Footer />
      
      {/* Floating Cart Popup */}
      {!hideFloatingCart && totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 z-50 animate-fade-in-up">
          <div 
            onClick={() => navigate('/cart')}
            className="bg-brand-600 dark:bg-brand-500 hover:bg-brand-700 dark:hover:bg-brand-600 text-white rounded-2xl p-4 shadow-2xl shadow-brand-600/30 flex items-center justify-between cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="relative bg-white/20 p-2.5 rounded-xl">
                <ShoppingBag size={20} className="text-white" />
                <span className="absolute -top-2 -right-2 bg-white text-brand-600 text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                  {totalItems}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white/80">Total Pesanan</span>
                <span className="font-black text-lg leading-tight">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 font-bold text-sm bg-white/20 px-4 py-2 rounded-xl">
              Checkout <ChevronRight size={16} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
