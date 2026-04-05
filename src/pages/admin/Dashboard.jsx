import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, Loader2, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
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

      // Calculate Stats
      const totalRevenue = (orders || [])
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
      
      const recentOrders = (orders || []).slice(0, 5).map(o => ({
        ...o,
        user_name: o.profiles?.name || 'Walk-in'
      }));

      const topProducts = (products || []).slice(0, 5).map(p => ({
        ...p,
        order_count: Number(p.order_count || 0),
        price: Number(p.price || 0)
      }));

      // Generate Chart Data (Simplified for current orders)
      const chartData = generateChartData(orders || [], chartPeriod);

      setStats({
        totalRevenue,
        totalOrders: orders?.length || 0,
        totalProducts: products?.length || 0,
        completedOrders: orders?.filter(o => o.status === 'completed').length || 0,
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
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      const date = new Date(o.created_at);
      if (isNaN(date.getTime())) return;

      const key = period === 'daily' 
        ? date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        : date.toLocaleDateString('id-ID', { month: 'short' });
      
      if (!dataMap[key]) dataMap[key] = { date: key, revenue: 0, orders: 0 };
      dataMap[key].revenue += Number(o.total_price || 0);
      dataMap[key].orders += 1;
    });

    return Object.values(dataMap).reverse().slice(-10); // Last 10 points
  };

  const kpis = [
    { label: 'Total Pendapatan', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'from-green-400 to-emerald-500' },
    { label: 'Total Pesanan', value: stats.totalOrders, icon: ShoppingBag, color: 'from-blue-400 to-blue-600' },
    { label: 'Total Menu', value: stats.totalProducts, icon: Package, color: 'from-purple-400 to-purple-600' },
    { label: 'Pesanan Selesai', value: stats.completedOrders, icon: TrendingUp, color: 'from-amber-400 to-orange-500' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-dark-800 p-3 rounded-xl shadow-elevated border border-warm-100 dark:border-dark-600">
          <p className="text-sm font-bold text-warm-800 dark:text-warm-200">{label}</p>
          <p className="text-sm text-brand-600 dark:text-brand-400 font-semibold">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-xs text-warm-500 dark:text-warm-400">{payload[1].value} pesanan</p>
          )}
        </div>
      );
    }
    return null;
  };

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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-warm-900 dark:text-white mb-1">Dashboard Real-time</h1>
          <p className="text-warm-500 dark:text-warm-400">Ringkasan performa bisnis dari database Supabase</p>
        </div>
        <button onClick={fetchDashboardStats} className="p-2.5 rounded-xl bg-white dark:bg-dark-800 border border-warm-200 dark:border-dark-600 text-warm-500 hover:text-brand-500 transition-colors shadow-sm">
           <TrendingUp size={18} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-5 border-none shadow-xl shadow-black/5 hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-warm-400 mb-1">{kpi.label}</p>
                <p className="text-2xl font-black text-warm-900 dark:text-white">{kpi.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg shadow-black/10`}>
                <kpi.icon size={20} className="text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

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
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e87920" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e87920" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" opacity={0.3} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 700, fill: '#ad9278' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#ad9278' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${v/1000}rb` : v} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#e87920" strokeWidth={3} fill="url(#colorRevenue)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="p-6 border-none shadow-xl shadow-black/5 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-black text-warm-900 dark:text-white flex items-center gap-2">Menu Terlaris <span className="animate-bounce">🔥</span></h3>
             <ArrowUpRight size={18} className="text-warm-300" />
          </div>
          <div className="space-y-4">
            {stats.topProducts.filter(p => p.order_count > 0).length === 0 ? (
               <div className="text-center py-12">
                  <div className="w-12 h-12 bg-warm-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <TrendingUp size={20} className="text-warm-400" />
                  </div>
                  <p className="text-sm font-bold text-warm-400 italic">Belum ada menu yang terjual</p>
                  <p className="text-[10px] text-warm-300 uppercase tracking-widest mt-1">Data akan muncul setelah pesanan sukses</p>
               </div>
            ) : stats.topProducts.map((product, i) => (
              <div key={product.id} className="flex items-center gap-4 group">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-inner ${
                   i === 0 ? 'bg-amber-100 text-amber-600' : 
                   i === 1 ? 'bg-slate-100 text-slate-500' : 
                   i === 2 ? 'bg-orange-50 text-orange-600' : 'bg-warm-50 text-warm-400'
                }`}>
                  {i + 1}
                </span>
                <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-110 transition-transform" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-warm-800 dark:text-warm-200 truncate">{product.name}</p>
                  <div className="flex items-center gap-2">
                     <Badge variant="completed" size="xs">{product.order_count} terjual</Badge>
                     <span className="text-[10px] text-warm-400">Total {formatCurrency(product.price * product.order_count)}</span>
                  </div>
                </div>
                <span className="text-sm font-black text-warm-900 dark:text-white">{formatCurrency(product.price)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-6 border-none shadow-xl shadow-black/5">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-black text-warm-900 dark:text-white">Pesanan Terkini 📋</h3>
             <Link to="/admin/orders" className="text-xs font-bold text-brand-600 hover:underline">Lihat Semua</Link>
          </div>
          <div className="space-y-3">
            {stats.recentOrders.length === 0 ? (
               <div className="text-center py-12">
                  <div className="w-12 h-12 bg-warm-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <ShoppingBag size={20} className="text-warm-400" />
                  </div>
                  <p className="text-sm font-bold text-warm-400 italic">Belum ada pesanan masuk</p>
                  <p className="text-[10px] text-warm-300 uppercase tracking-widest mt-1">Coba buat pesanan di halaman menu</p>
               </div>
            ) : stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-warm-100/30 dark:bg-dark-700/50 hover:bg-white dark:hover:bg-dark-700 transition-all border border-transparent hover:border-warm-200 dark:hover:border-dark-600">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-warm-100 dark:bg-dark-600 rounded-xl flex items-center justify-center font-black text-brand-600 text-xs shadow-inner">
                      {(order.user_name || 'W').charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <p className="text-sm font-black text-warm-900 dark:text-white">{order.user_name}</p>
                     <p className="text-[10px] font-bold text-warm-400 uppercase tracking-tight">{formatShortDate(order.created_at)}</p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-warm-900 dark:text-white">{formatCurrency(order.total_price)}</p>
                  <Badge variant={order.status} size="xs">{getStatusLabel(order.status)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
