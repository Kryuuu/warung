import { Link } from 'react-router-dom';
import { ChefHat, Globe, MessageCircle, Mail } from 'lucide-react';
import { APP_NAME } from '../../utils/constants';

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-warm-400 safe-bottom border-t border-white/5 relative z-10 flex justify-center w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                <ChefHat size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-warm-500 max-w-xs leading-relaxed">
              Platform makanan UMKM terbaik untuk menikmati cita rasa Nusantara.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <a href="#" className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-warm-500 hover:text-brand-400 transition-colors">
                <Globe size={18} />
              </a>
              <a href="#" className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-warm-500 hover:text-brand-400 transition-colors">
                <MessageCircle size={18} />
              </a>
              <a href="#" className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-warm-500 hover:text-brand-400 transition-colors">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
            <Link to="/products" className="hover:text-brand-400 transition-colors">Menu</Link>
            <Link to="/cart" className="hover:text-brand-400 transition-colors">Keranjang</Link>
            <Link to="/orders" className="hover:text-brand-400 transition-colors">Pesanan</Link>
            <Link to="/login" className="hover:text-brand-400 transition-colors">Masuk</Link>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-8 text-center flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-warm-600">
            © {new Date().getFullYear()} {APP_NAME}. Dibuat dengan ❤️ untuk UMKM Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
