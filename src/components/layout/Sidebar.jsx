import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  ChefHat, 
  X,
  ArrowLeft
} from 'lucide-react';
import { APP_NAME } from '../../utils/constants';

const sidebarLinks = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/admin/products', label: 'Produk', icon: Package },
  { path: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white dark:bg-dark-800 
        border-r border-warm-100 dark:border-dark-600
        z-50 transition-transform duration-300 ease-out
        lg:translate-x-0 lg:static lg:z-auto
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 md:h-20 shrink-0 px-5 border-b border-warm-100 dark:border-dark-600">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <ChefHat size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-warm-900 dark:text-white">{APP_NAME}</span>
              <p className="text-[10px] font-medium text-brand-500 uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-warm-400 hover:bg-warm-100 dark:hover:bg-dark-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-brand-50 text-brand-600 shadow-sm dark:bg-brand-950/40 dark:text-brand-400'
                  : 'text-warm-600 hover:bg-warm-50 hover:text-warm-900 dark:text-warm-400 dark:hover:bg-dark-700 dark:hover:text-warm-200'}
              `}
            >
              <link.icon size={20} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Back to Store */}
        <div className="p-4 border-t border-warm-100 dark:border-dark-600 shrink-0">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-warm-500 hover:bg-warm-50 hover:text-warm-700 dark:text-warm-400 dark:hover:bg-dark-700 dark:hover:text-warm-200 transition-all duration-200"
          >
            <ArrowLeft size={18} />
            Kembali ke Toko
          </NavLink>
        </div>
      </aside>
    </>
  );
}
