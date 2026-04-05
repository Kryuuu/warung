import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronDown, ChevronUp, Package, Loader2 } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import useAuthStore from '../stores/authStore';
import { supabase } from '../services/supabase';
import { formatCurrency, formatDate, getStatusLabel } from '../utils/helpers';
import { ORDER_STATUSES } from '../utils/constants';

export default function OrderHistory() {
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserOrders();
    }
  }, [isAuthenticated, user]);

  const fetchUserOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching user orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <p className="text-6xl mb-4">🔒</p>
          <h2 className="text-2xl font-bold text-warm-800 dark:text-warm-200 mb-2">Silakan Masuk</h2>
          <p className="text-warm-500 mb-6 font-medium">Login untuk melihat riwayat pesanan Anda</p>
          <Link to="/login"><Button>Masuk Sekarang</Button></Link>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter(o => statusFilter === 'all' || o.status === statusFilter);

  return (
    <div className="w-full min-h-screen bg-warm-50 dark:bg-dark-900 transition-colors duration-500">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-36 pb-20">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-warm-900 dark:text-white mb-2 tracking-tight">
            Pesanan Saya 📋
          </h1>
          <p className="text-warm-500 dark:text-warm-400 font-medium">
            Lacak pesanan dan lihat riwayat belanja kuliner Anda
          </p>
        </div>

        {/* Filter Glassmorphism */}
        <div className="flex flex-wrap gap-2 mb-10 p-2 bg-white/50 dark:bg-dark-800/50 backdrop-blur-md rounded-2xl border border-white dark:border-dark-700 shadow-sm overflow-x-auto no-scrollbar">
          {ORDER_STATUSES.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                statusFilter === status.value
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-dark-700'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <Loader2 size={40} className="text-brand-500 animate-spin mb-4" />
             <p className="text-warm-500 font-bold animate-pulse">Menghubungkan ke Database...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-dark-800 rounded-3xl border border-warm-100 dark:border-dark-600 shadow-xl shadow-black/[0.02] animate-fade-in-up">
            <div className="w-24 h-24 bg-warm-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package size={40} className="text-warm-400" />
            </div>
            <h3 className="text-xl font-bold text-warm-900 dark:text-white mb-2">Belum ada pesanan {statusFilter !== 'all' ? `dengan status ${statusFilter}` : ''}</h3>
            <p className="text-warm-500 dark:text-warm-400 mb-8 max-w-xs mx-auto">Mulai jelajahi menu lezat kami dan buat pesanan pertama Anda!</p>
            <Link to="/products"><Button icon={ShoppingBag}>Mulai Pesan Sekarang</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <div 
                key={order.id} 
                className="bg-white dark:bg-dark-800 rounded-3xl border border-warm-100 dark:border-dark-600 overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-brand-500/20"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full flex items-center justify-between p-6 text-left group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <ShoppingBag size={24} className="text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <p className="font-mono font-black text-warm-900 dark:text-white text-base">
                        #{order.id.substring(0, 10).toUpperCase()}
                      </p>
                      <p className="text-xs font-bold text-warm-400 dark:text-warm-500 mt-0.5">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="font-black text-warm-900 dark:text-white text-lg leading-tight">
                        {formatCurrency(order.total_price)}
                      </p>
                      <p className="text-[10px] font-black uppercase text-warm-400 dark:text-warm-500 tracking-widest">
                        {order.order_items?.length || 0} ITEMS
                      </p>
                    </div>
                    <Badge variant={order.status} size="lg">
                      {getStatusLabel(order.status)}
                    </Badge>
                    <div className={`p-2 rounded-full bg-warm-50 dark:bg-dark-700 transition-transform duration-300 ${expandedOrder === order.id ? 'rotate-180 bg-brand-50 dark:bg-brand-900/40' : ''}`}>
                      <ChevronDown size={18} className={expandedOrder === order.id ? 'text-brand-500' : 'text-warm-400'} />
                    </div>
                  </div>
                </button>

                {/* Expanded Detail (Animated Drawer Style) */}
                {expandedOrder === order.id && (
                  <div className="border-t border-warm-100 dark:border-dark-600 bg-warm-50/50 dark:bg-dark-900/10 p-6 animate-slide-down">
                    <div className="space-y-3 mb-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-warm-400 mb-4">Detail Item Pesanan</p>
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3.5 bg-white dark:bg-dark-800 rounded-2xl border border-warm-100 dark:border-dark-700 shadow-sm">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 bg-brand-500 rounded-full" />
                             <span className="text-sm font-bold text-warm-800 dark:text-warm-200">{item.products?.name || 'Produk Tidak Dikenal'}</span>
                             <span className="text-xs font-bold text-warm-400 dark:text-warm-500">x{item.quantity}</span>
                          </div>
                          <span className="font-black text-warm-900 dark:text-white">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-warm-100 dark:border-dark-600">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-warm-400">Pembayaran:</span>
                         <span className="px-3 py-1 bg-warm-100 dark:bg-dark-700 rounded-lg text-xs font-black text-warm-700 dark:text-warm-300 uppercase">
                          {order.payment_method === 'qris' ? 'QRIS' : order.payment_method === 'cod' ? 'Bayar di Tempat (COD)' : 'Transfer Bank'}
                         </span>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-sm font-bold text-warm-500">Total Pembayaran</span>
                         <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                           {formatCurrency(order.total_price)}
                         </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
