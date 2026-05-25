import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Package, TrendingUp, Loader2, ArrowUpRight, AlertTriangle, Eye, RefreshCw, Clock, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { supabase } from '../../services/supabase';
import { formatCurrency, formatShortDate, getStatusLabel } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    completedOrders: 0,
    pendingOrders: 0,
    processedOrders: 0,
    cancelledOrders: 0,
    lowStockProducts: [],
    recentOrders: [],
    topProducts: [],
    chartData: []
  });
  const [chartPeriod, setChartPeriod] = useState('daily');

  useEffect(() => {
    fetchDashboardStats();
  }, [chartPeriod]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders for revenue and counts
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, profiles(name, email)')
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;

      // 2. Fetch Products for total count and top items
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('order_count', { ascending: false });
      
      if (productsError) throw productsError;

      // Only 'completed' orders should be counted for revenue, total orders, and charts
      const completedOrdersList = (orders || []).filter(o => o.status === 'completed');

      const totalRevenue = completedOrdersList
        .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
      
      const recentOrders = (orders || []).slice(0, 5).map(o => ({
        ...o,
        user_name: o.profiles?.name || o.guest_name || 'Walk-in'
      }));

      const topProducts = (products || []).slice(0, 5).map(p => ({
        ...p,
        order_count: Number(p.order_count || 0),
        price: Number(p.price || 0)
      }));

      const lowStockProducts = (products || [])
        .filter(p => p.stock <= 5)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);

      // Generate Chart Data (only from completed orders)
      const chartData = generateChartData(completedOrdersList, chartPeriod);

      setStats({
        totalRevenue,
        totalOrders: completedOrdersList.length,
        totalProducts: products?.length || 0,
        completedOrders: orders?.filter(o => o.status === 'completed').length || 0,
        pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
        processedOrders: orders?.filter(o => o.status === 'processed').length || 0,
        cancelledOrders: orders?.filter(o => o.status === 'cancelled').length || 0,
        lowStockProducts,
        recentOrders,
        topProducts,
        chartData
      });

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (orders, period) => {
    const dataMap = {};
    orders.forEach(o => {
      const date = new Date(o.created_at);
      if (isNaN(date.getTime())) return;

      const key = period === 'daily' 
        ? date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        : date.toLocaleDateString('id-ID', { month: 'short' });
      
      if (!dataMap[key]) dataMap[key] = { date: key, revenue: 0, orders: 0 };
      dataMap[key].revenue += Number(o.total_price || 0);
      dataMap[key].orders += 1;
    });

    return Object.values(dataMap).reverse().slice(-10);
  };

  const kpis = [
    { label: 'Total Pendapatan', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'from-green-400 to-emerald-500', shadow: 'shadow-green-500/20' },
    { label: 'Total Pesanan', value: stats.totalOrders, icon: ShoppingBag, color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/20' },
    { label: 'Total Menu', value: stats.totalProducts, icon: Package, color: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-500/20' },
    { label: 'Pesanan Selesai', value: stats.completedOrders, icon: TrendingUp, color: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/20' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl shadow-elevated border border-warm-100 dark:border-dark-600">
          <p className="text-xs font-bold text-warm-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-lg font-black text-brand-600 dark:text-brand-400">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-xs text-warm-500 dark:text-warm-400 mt-1">{payload[1].value} pesanan</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Status distribution bar percentages
  const totalForBar = stats.totalOrders || 1;
  const statusDistribution = [
    { status: 'completed', label: 'Selesai', count: stats.completedOrders, color: 'bg-green-500', pct: ((stats.completedOrders / totalForBar) * 100).toFixed(0) },
    { status: 'processed', label: 'Diproses', count: stats.processedOrders, color: 'bg-blue-500', pct: ((stats.processedOrders / totalForBar) * 100).toFixed(0) },
    { status: 'pending', label: 'Menunggu', count: stats.pendingOrders, color: 'bg-yellow-500', pct: ((stats.pendingOrders / totalForBar) * 100).toFixed(0) },
    { status: 'cancelled', label: 'Dibatalkan', count: stats.cancelledOrders, color: 'bg-red-500', pct: ((stats.cancelledOrders / totalForBar) * 100).toFixed(0) },
  ];

  if (loading && stats.totalOrders === 0) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
         <Loader2 size={48} className="text-brand-500 animate-spin" />
         <p className="text-warm-500 font-bold animate-pulse">Menghitung Data Bisnis Anda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-warm-900 dark:text-white mb-1">Dashboard Real-time</h1>
          <p className="text-warm-500 dark:text-warm-400">Ringkasan performa bisnis dari database Supabase</p>
        </div>
        <Button icon={RefreshCw} variant="secondary" onClick={fetchDashboardStats} loading={loading}>
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-5 border-none shadow-xl shadow-black/5 hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-warm-500 dark:text-warm-400 mb-2">{kpi.label}</p>
                <p className="text-2xl font-black text-warm-900 dark:text-white">{kpi.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg ${kpi.shadow} group-hover:scale-110 transition-transform`}>
                <kpi.icon size={22} className="text-white" />
              </div>
            </div>
            {/* Subtle decorative glow */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${kpi.color} opacity-[0.07] blur-xl group-hover:opacity-[0.12] transition-opacity`}></div>
          </Card>
        ))}
      </div>

      {/* Status Distribution Bar */}
      <Card className="p-6 border-none shadow-xl shadow-black/5 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-warm-900 dark:text-white uppercase tracking-wider">Distribusi Status Pesanan</h3>
          <Link to="/admin/orders" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
            Kelola <ArrowUpRight size={12} />
          </Link>
        </div>
        {/* Progress bar */}
        <div className="h-3 rounded-full bg-warm-100 dark:bg-dark-700 overflow-hidden flex mb-4">
          {statusDistribution.map(s => (
            s.count > 0 && (
              <div 
                key={s.status} 
                className={`${s.color} transition-all duration-700 first:rounded-l-full last:rounded-r-full`} 
                style={{ width: `${Math.max((s.count / totalForBar) * 100, 2)}%` }} 
              />
            )
          ))}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {statusDistribution.map(s => (
            <div key={s.status} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${s.color}`}></div>
              <span className="text-xs font-semibold text-warm-600 dark:text-warm-400">{s.label}</span>
              <span className="text-xs font-black text-warm-900 dark:text-white">{s.count}</span>
              <span className="text-[10px] text-warm-400">({s.pct}%)</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Revenue Chart */}
      <Card className="p-6 border-none shadow-xl shadow-black/5 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-black text-warm-900 dark:text-white">Analisis Pendapatan</h3>
            <p className="text-xs font-medium text-warm-500 dark:text-warm-400">Statistik transaksi {chartPeriod === 'daily' ? 'per hari' : 'per bulan'}</p>
          </div>
          <div className="flex bg-warm-100 dark:bg-dark-700 rounded-xl p-1 shadow-inner">
            {['daily', 'monthly'].map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartPeriod === period
                    ? 'bg-white dark:bg-dark-600 text-brand-600 dark:text-brand-400 shadow-md'
                    : 'text-warm-500 dark:text-warm-400 hover:text-warm-700'
                }`}
              >
                {period === 'daily' ? 'Harian' : 'Bulanan'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80">
          {stats.chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <TrendingUp size={40} className="text-warm-200 dark:text-dark-600 mb-3" />
              <p className="text-sm font-bold text-warm-400 dark:text-warm-500">Belum ada data transaksi</p>
              <p className="text-xs text-warm-300 dark:text-warm-600">Grafik akan muncul setelah pesanan pertama</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e87920" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e87920" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" opacity={0.3} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 700, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#a3a3a3' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${v/1000}rb` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#e87920" strokeWidth={3} fill="url(#colorRevenue)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Bottom Grid: Top Products + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Products — styled like ManageProducts table */}
        <Card className="border-none shadow-xl shadow-black/5 overflow-hidden bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6 pb-0">
            <h3 className="text-lg font-black text-warm-900 dark:text-white flex items-center gap-2">Menu Terlaris <span className="animate-bounce">🔥</span></h3>
            <Link to="/admin/products" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              Kelola Produk <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-100/50 dark:bg-dark-700/50 text-warm-600 dark:text-warm-400 border-y border-warm-200 dark:border-dark-600">
                  <th className="text-left px-6 py-3 font-bold uppercase tracking-wider text-[10px]">#</th>
                  <th className="text-left px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Produk</th>
                  <th className="text-right px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Harga</th>
                  <th className="text-center px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Terjual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 dark:divide-dark-600">
                {stats.topProducts.filter(p => p.order_count > 0).length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <TrendingUp size={32} className="mx-auto text-warm-200 dark:text-dark-600 mb-3" />
                      <p className="text-sm font-bold text-warm-400">Belum ada menu terjual</p>
                      <p className="text-[10px] text-warm-300 dark:text-warm-600 mt-1">Data muncul setelah pesanan pertama</p>
                    </td>
                  </tr>
                ) : stats.topProducts.map((product, i) => (
                  <tr key={product.id} className="group hover:bg-white dark:hover:bg-dark-700/50 transition-colors">
                    <td className="px-6 py-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        i === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 
                        i === 1 ? 'bg-slate-100 text-slate-500 dark:bg-slate-900/30 dark:text-slate-400' : 
                        i === 2 ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-warm-50 text-warm-400 dark:bg-dark-700 dark:text-warm-500'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform shrink-0">
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-warm-900 dark:text-white truncate">{product.name}</p>
                          <p className="text-[10px] text-warm-400 truncate">{product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right font-black text-warm-900 dark:text-white">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant="completed" size="xs">{product.order_count} terjual</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Orders — styled like ManageOrders table */}
        <Card className="border-none shadow-xl shadow-black/5 overflow-hidden bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6 pb-0">
            <h3 className="text-lg font-black text-warm-900 dark:text-white flex items-center gap-2">Pesanan Terkini 📋</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              Lihat Semua <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-100/50 dark:bg-dark-700/50 text-warm-600 dark:text-warm-400 border-y border-warm-200 dark:border-dark-600">
                  <th className="text-left px-6 py-3 font-bold uppercase tracking-wider text-[10px]">ID</th>
                  <th className="text-left px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Pelanggan</th>
                  <th className="text-right px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Total</th>
                  <th className="text-center px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="text-center px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 dark:divide-dark-600">
                {stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <ShoppingBag size={32} className="mx-auto text-warm-200 dark:text-dark-600 mb-3" />
                      <p className="text-sm font-bold text-warm-400">Belum ada pesanan masuk</p>
                      <p className="text-[10px] text-warm-300 dark:text-warm-600 mt-1">Buat pesanan di halaman kasir</p>
                    </td>
                  </tr>
                ) : stats.recentOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-white dark:hover:bg-dark-700/50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="font-mono font-bold text-warm-900 dark:text-warm-200 bg-warm-100 dark:bg-dark-700 px-2 py-1 rounded text-xs">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div>
                        <p className="text-sm font-bold text-warm-900 dark:text-white">{order.user_name}</p>
                        <p className="text-[10px] text-warm-400">{formatShortDate(order.created_at)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right font-black text-warm-900 dark:text-white">{formatCurrency(order.total_price)}</td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant={order.status} size="xs">{getStatusLabel(order.status)}</Badge>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Link 
                        to="/admin/orders" 
                        className="p-2 rounded-lg text-warm-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 transition-all inline-flex"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockProducts.length > 0 && (
        <Card className="border-none shadow-xl shadow-black/5 overflow-hidden bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6 pb-0">
            <h3 className="text-lg font-black text-warm-900 dark:text-white flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Peringatan Stok Rendah
            </h3>
            <Link to="/admin/products" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              Kelola Stok <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50/50 dark:bg-amber-950/10 text-warm-600 dark:text-warm-400 border-y border-warm-200 dark:border-dark-600">
                  <th className="text-left px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Produk</th>
                  <th className="text-left px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Kategori</th>
                  <th className="text-right px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Harga</th>
                  <th className="text-center px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Sisa Stok</th>
                  <th className="text-center px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 dark:divide-dark-600">
                {stats.lowStockProducts.map((product) => (
                  <tr key={product.id} className="group hover:bg-white dark:hover:bg-dark-700/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0">
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-sm font-bold text-warm-900 dark:text-white truncate">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-warm-600 dark:text-warm-400 font-medium">{product.category}</td>
                    <td className="px-6 py-3 text-right font-black text-warm-900 dark:text-white">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant={product.stock === 0 ? 'outofstock' : 'pending'} size="sm">
                        {product.stock === 0 ? 'Habis' : `${product.stock} sisa`}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Link 
                        to="/admin/products" 
                        className="p-2 rounded-lg text-warm-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20 dark:hover:text-blue-400 transition-all inline-flex"
                      >
                        <Pencil size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
