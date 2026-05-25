import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, Bell, ShoppingBag, Package, ChevronRight } from 'lucide-react';
import Sidebar from './Sidebar';
import ErrorBoundary from '../ui/ErrorBoundary';
import useAuthStore from '../../stores/authStore';
import useUiStore from '../../stores/uiStore';
import { supabase } from '../../services/supabase';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState({ pendingOrders: 0, outOfStock: 0 });
  
  const { user } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUiStore();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { count: pendingCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
          
        const { count: outOfStockCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .lte('stock', 0);
          
        setNotifications({ 
          pendingOrders: pendingCount || 0, 
          outOfStock: outOfStockCount || 0 
        });
      } catch (err) {
        console.error('Error fetching notifications', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalNotifs = notifications.pendingOrders + notifications.outOfStock;

  return (
    <div className="flex-1 w-full min-h-screen flex bg-warm-50 dark:bg-dark-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Header */}
        <header className="h-16 md:h-20 bg-white dark:bg-dark-800 border-b border-warm-100 dark:border-dark-600 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-warm-500 hover:bg-warm-100 dark:hover:bg-dark-700 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-warm-900 dark:text-white">Selamat Datang 👋</h2>
              <p className="text-xs text-warm-500 dark:text-warm-400">{user?.name || 'Admin'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl text-warm-500 hover:text-warm-700 hover:bg-warm-100 dark:text-warm-400 dark:hover:bg-dark-700 transition-colors"
              >
                <Bell size={20} />
                {totalNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                )}
              </button>
              
              {/* Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-dark-800 rounded-2xl shadow-xl shadow-black/10 border border-warm-100 dark:border-dark-600 overflow-hidden z-50 animate-scale-in">
                  <div className="p-4 border-b border-warm-100 dark:border-dark-600 bg-warm-50/50 dark:bg-dark-700/50">
                    <h3 className="font-bold text-warm-900 dark:text-white">Notifikasi</h3>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {totalNotifs === 0 ? (
                      <div className="p-6 text-center text-warm-500 dark:text-warm-400 text-sm">
                        Tidak ada notifikasi baru
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {notifications.pendingOrders > 0 && (
                          <button 
                            onClick={() => { navigate('/admin/orders'); setShowNotifications(false); }}
                            className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-colors text-left"
                          >
                            <div className="p-2 bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 rounded-lg shrink-0">
                              <ShoppingBag size={16} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-warm-900 dark:text-white">Pesanan Baru</p>
                              <p className="text-xs text-warm-500 dark:text-warm-400">{notifications.pendingOrders} pesanan menunggu diproses.</p>
                            </div>
                            <ChevronRight size={14} className="text-warm-400 self-center" />
                          </button>
                        )}
                        
                        {notifications.outOfStock > 0 && (
                          <button 
                            onClick={() => { navigate('/admin/products'); setShowNotifications(false); }}
                            className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
                          >
                            <div className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg shrink-0">
                              <Package size={16} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-warm-900 dark:text-white">Stok Habis</p>
                              <p className="text-xs text-warm-500 dark:text-warm-400">{notifications.outOfStock} menu kehabisan stok.</p>
                            </div>
                            <ChevronRight size={14} className="text-warm-400 self-center" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-warm-500 hover:text-warm-700 hover:bg-warm-100 dark:text-warm-400 dark:hover:bg-dark-700 transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold ml-1">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <ErrorBoundary>
            <div className="page-enter">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
