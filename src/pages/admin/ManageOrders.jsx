import { useState, useEffect } from 'react';
import { Eye, ChevronDown, ChevronUp, Package, Plus, User, Calendar, CreditCard, ShoppingBag, Trash2, Search, X, Printer } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import { formatCurrency, formatDate, getStatusLabel } from '../../utils/helpers';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function ManageOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // For manual order creation
  const [manualOrderItems, setManualOrderItems] = useState([]);
  const [manualOrderUser, setManualOrderUser] = useState({ name: '' });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (!error) setProducts(data);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (name, email),
          order_items (
            *,
            products (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedOrders = data.map(o => ({
        ...o,
        user_name: o.profiles?.name || o.guest_name || 'Walk-in',
        items: (o.order_items || []).map(item => ({
          ...item,
          product_name: item.products?.name || 'Produk Tidak Dikenal'
        }))
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Gagal mengambil data pesanan');
    } finally {
      setLoading(false);
    }
  };

  const restoreStock = async (orderId) => {
    // Fetch order items to know which products and quantities to restore
    const { data: items, error } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (error) throw error;
    if (!items || items.length === 0) return;

    // Restore stock and decrement order_count for each product
    for (const item of items) {
      // Get current product data
      const { data: product } = await supabase
        .from('products')
        .select('stock, order_count')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({
            stock: product.stock + item.quantity,
            order_count: Math.max(0, (product.order_count || 0) - item.quantity)
          })
          .eq('id', item.product_id);
      }
    }
  };

  const deductStock = async (orderId) => {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (error) throw error;
    if (!items || items.length === 0) return;

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock, order_count')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({
            stock: Math.max(0, product.stock - item.quantity),
            order_count: (product.order_count || 0) + item.quantity
          })
          .eq('id', item.product_id);
      }
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const oldStatus = order ? order.status : null;

      // Deduct stock when an order is completed
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        await deductStock(orderId);
      }

      // Restore stock ONLY if a completed order is cancelled
      if (newStatus === 'cancelled' && oldStatus === 'completed') {
        await restoreStock(orderId);
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      
      let extraMsg = '';
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        extraMsg = ' Stok produk telah dikurangi.';
      } else if (newStatus === 'cancelled' && oldStatus === 'completed') {
        extraMsg = ' Stok produk telah dikembalikan.';
      }

      toast.success(`Status pesanan diperbarui ke "${getStatusLabel(newStatus)}".${extraMsg}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Gagal memperbarui status');
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId);

      // Restore stock only if the order was completed and is now being deleted
      if (order && order.status === 'completed') {
        await restoreStock(orderId);
      }

      // Delete order_items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      if (itemsError) throw itemsError;

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      if (orderError) throw orderError;

      setOrders(prev => prev.filter(o => o.id !== orderId));
      setSelectedOrder(null);
      toast.success('Pesanan berhasil dihapus. Stok telah dikembalikan.');
    } catch (err) {
      console.error('Error deleting order:', err);
      toast.error('Gagal menghapus pesanan');
    }
  };

  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast.error('Pop-up diblokir. Izinkan pop-up untuk mencetak struk.');
      return;
    }
    
    // Support both structured formats from table (items) and modal (order_items)
    const orderItems = order.items || order.order_items || [];
    
    const html = `
      <html>
        <head>
          <title>Struk Pesanan #${order.id.substring(0, 8).toUpperCase()}</title>
          <style>
            @page { margin: 0; size: 58mm auto; }
            body { font-family: monospace; width: 58mm; margin: 0; padding: 10px; font-size: 12px; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { font-size: 11px; padding: 2px 0; text-align: left; vertical-align: top; }
            .amt { text-align: right; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 16px;">WARUNGKU</div>
          <div class="center" style="font-size: 10px;">Jl. Raya Kuliner No. 123<br>Telp: 0812-3456-7890</div>
          <div class="divider"></div>
          <div>Tgl: ${formatDate(order.created_at)}</div>
          <div>ID : #${order.id.substring(0, 8).toUpperCase()}</div>
          <div>Plg: ${order.user_name}</div>
          <div class="divider"></div>
          <table>
            ${orderItems.map(item => `
              <tr>
                <td colspan="2">${item.product_name || item.products?.name || 'Produk'}</td>
              </tr>
              <tr>
                <td>${item.quantity}x ${formatCurrency(item.price)}</td>
                <td class="amt">${formatCurrency(item.quantity * item.price)}</td>
              </tr>
            `).join('')}
          </table>
          <div class="divider"></div>
          <table>
            <tr class="bold" style="font-size: 12px;">
              <td>TOTAL</td>
              <td class="amt">${formatCurrency(order.total_price)}</td>
            </tr>
            <tr>
              <td>METODE</td>
              <td class="amt">${order.payment_method.toUpperCase()}</td>
            </tr>
          </table>
          <div class="divider"></div>
          <div class="center" style="font-size: 10px;">Terima kasih atas<br>kunjungan Anda!</div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleAddItemToManual = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    // 0. Check stock level
    if (product.stock < itemQuantity) {
      toast.error(`Stok tidak mencukupi. Tersedia: ${product.stock}`);
      return;
    }

    const existing = manualOrderItems.find(item => item.id === product.id);
    if (existing) {
      const newQty = existing.quantity + itemQuantity;
      if (newQty > product.stock) {
        toast.error(`Total kuantitas melebihi stok (${product.stock})`);
        return;
      }
      setManualOrderItems(manualOrderItems.map(item => 
        item.id === product.id ? { ...item, quantity: newQty } : item
      ));
    } else {
      setManualOrderItems([...manualOrderItems, { ...product, quantity: itemQuantity }]);
    }
    
    setSelectedProductId('');
    setItemQuantity(1);
  };

  const removeItemFromManual = (id) => {
    setManualOrderItems(manualOrderItems.filter(item => item.id !== id));
  };

  const handleSaveManualOrder = async () => {
    if (manualOrderItems.length === 0) {
      toast.error('Pilih minimal satu menu');
      return;
    }
    if (!manualOrderUser.name) {
      toast.error('Masukkan nama pelanggan');
      return;
    }

    setSubmitting(true);
    try {
      // 0. Final Stock Check (Fresh check from DB is better, but this uses the list in memory)
      for (const item of manualOrderItems) {
        if (item.quantity > item.stock) {
          throw new Error(`Stok ${item.name} tidak cukup (${item.stock})`);
        }
      }

      const totalPrice = manualOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // 1. Create order (Automatically associated with Admin's UID)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          total_price: totalPrice,
          status: 'completed',
          payment_method: 'cod'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create items
      const itemsToInsert = manualOrderItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // 3. Deduct stock & increment order_count for each product
      for (const item of manualOrderItems) {
        const { data: currentProduct } = await supabase
          .from('products')
          .select('stock, order_count')
          .eq('id', item.id)
          .single();

        if (currentProduct) {
          await supabase
            .from('products')
            .update({
              stock: Math.max(0, currentProduct.stock - item.quantity),
              order_count: (currentProduct.order_count || 0) + item.quantity
            })
            .eq('id', item.id);
        }
      }

      // 4. Refresh product list
      fetchProducts();

      toast.success('Pesanan offline berhasil dicatat! Stok diperbarui. 🎉');
      setIsAddModalOpen(false);
      setManualOrderItems([]);
      setManualOrderUser({ name: '' });
      fetchOrders();
    } catch (err) {
      console.error('Error saving manual order:', err);
      toast.error('Gagal menyimpan pesanan');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.profiles?.name || 'Walk-in').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processed: orders.filter(o => o.status === 'processed').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const manualTotal = manualOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-warm-900 dark:text-white mb-1">Kelola Pesanan</h1>
          <p className="text-warm-500 dark:text-warm-400">{orders.length} total pesanan dari database</p>
        </div>
        <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>Catat Pesanan Offline (COD)</Button>
      </div>

      {/* Search & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID Pesanan atau Nama Pelanggan..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-warm-200 bg-white dark:bg-dark-800 text-warm-900 dark:text-white placeholder:text-warm-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
          />
        </div>
        <div className="flex bg-warm-100 dark:bg-dark-700 rounded-2xl p-1 gap-1">
          {ORDER_STATUSES.filter(s => ['all', 'pending', 'processed', 'completed'].includes(s.value)).map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === status.value
                  ? 'bg-white dark:bg-dark-600 text-brand-600 dark:text-brand-400 shadow-md translate-y-[-1px]'
                  : 'text-warm-500 dark:text-warm-400 hover:text-warm-700'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden border-none shadow-xl shadow-black/5 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-100/50 dark:bg-dark-700/50 text-warm-600 dark:text-warm-400 border-b border-warm-200 dark:border-dark-600">
                <th className="text-left px-6 py-4 font-bold uppercase tracking-wider text-[10px]">ID Pesanan</th>
                <th className="text-left px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Pelanggan</th>
                <th className="text-left px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Tanggal</th>
                <th className="text-right px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Metode</th>
                <th className="text-right px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Total</th>
                <th className="text-center px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                <th className="text-center px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 dark:divide-dark-600">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="7" className="px-6 py-4"><div className="h-4 bg-warm-200 dark:bg-dark-700 rounded w-full" /></td>
                  </tr>
                ))
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-white dark:hover:bg-dark-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-warm-900 dark:text-warm-200 bg-warm-100 dark:bg-dark-700 px-2 py-1 rounded text-xs">
                      #{order.id.substring(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-warm-900 dark:text-white">{order.user_name}</td>
                  <td className="px-6 py-4 text-warm-500 dark:text-warm-400 text-xs">{formatDate(order.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 bg-warm-100 dark:bg-dark-700 rounded text-warm-500 dark:text-warm-400">
                      {order.payment_method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-warm-900 dark:text-white">
                    {formatCurrency(order.total_price)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={order.status} size="sm">{getStatusLabel(order.status)}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 rounded-lg text-warm-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 transition-all"
                        title="Detail Pesanan"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(order)}
                        className="p-2 rounded-lg text-warm-500 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/20 dark:hover:text-orange-400 transition-all"
                        title="Cetak Struk"
                      >
                        <Printer size={16} />
                      </button>
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => updateStatus(order.id, 'processed')}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white text-[11px] font-bold transition-all"
                        >
                          Proses
                        </button>
                      )}
                      {order.status === 'processed' && (
                        <button 
                          onClick={() => updateStatus(order.id, 'completed')}
                          className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white text-[11px] font-bold transition-all"
                        >
                          Selesai
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'processed') && (
                        <button 
                          onClick={() => {
                            if (window.confirm('Batalkan pesanan ini? Stok akan dikembalikan secara otomatis.')) {
                              updateStatus(order.id, 'cancelled');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white text-[11px] font-bold transition-all"
                        >
                          Batalkan
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (window.confirm('Hapus pesanan ini secara permanen? Data tidak bisa dikembalikan.')) {
                            deleteOrder(order.id);
                          }
                        }}
                        className="p-2 rounded-lg text-warm-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-all"
                        title="Hapus pesanan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Add Order Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="" size="full">
        <div className="flex flex-col lg:flex-row gap-0 min-h-[70vh]">
          
          {/* ──── LEFT PANEL: Order Form ──── */}
          <div className="lg:w-[55%] p-6 md:p-10 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <ShoppingBag size={26} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-warm-900 dark:text-white tracking-tight">Kasir Digital</h2>
                <p className="text-xs text-warm-400 font-medium">Buat pesanan walk-in / offline secara manual</p>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              {/* ── Step 1: Menu Selection ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-black shadow-md shadow-brand-500/20">1</div>
                  <label className="text-xs font-bold uppercase tracking-widest text-warm-600 dark:text-warm-300">Pilih Menu</label>
                </div>
                <select 
                  className="w-full bg-white dark:bg-dark-700 border-2 border-warm-200 dark:border-dark-500 rounded-2xl px-5 py-4 text-sm font-semibold ring-0 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-warm-900 dark:text-white transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23a3a3a3' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center' }}
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">Ketuk untuk memilih menu...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)} {p.stock <= 5 ? `(Sisa ${p.stock})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* ── Step 2: Quantity ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-black shadow-md shadow-brand-500/20">2</div>
                  <label className="text-xs font-bold uppercase tracking-widest text-warm-600 dark:text-warm-300">Jumlah Porsi</label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white dark:bg-dark-700 border-2 border-warm-200 dark:border-dark-500 rounded-2xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      className="w-14 h-14 flex items-center justify-center text-warm-500 hover:bg-warm-100 dark:hover:bg-dark-600 hover:text-brand-500 transition-all text-xl font-bold active:scale-90 cursor-pointer"
                    >−</button>
                    <input 
                      type="number"
                      min="1"
                      className="w-16 text-center bg-transparent border-x-2 border-warm-200 dark:border-dark-500 py-4 text-xl font-black text-warm-900 dark:text-white ring-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <button 
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                      className="w-14 h-14 flex items-center justify-center text-warm-500 hover:bg-warm-100 dark:hover:bg-dark-600 hover:text-brand-500 transition-all text-xl font-bold active:scale-90 cursor-pointer"
                    >+</button>
                  </div>
                  <button 
                    onClick={handleAddItemToManual}
                    disabled={!selectedProductId}
                    className="flex-1 h-14 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold text-sm uppercase tracking-wider rounded-2xl hover:from-brand-700 hover:to-brand-600 transition-all shadow-xl shadow-brand-500/25 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    Tambah ke Nota
                  </button>
                </div>
              </div>

              {/* ── Step 3: Customer Name ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-black shadow-md shadow-brand-500/20">3</div>
                  <label className="text-xs font-bold uppercase tracking-widest text-warm-600 dark:text-warm-300">Nama / Meja</label>
                </div>
                <div className="relative">
                  <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-warm-400" />
                  <input 
                    className="w-full bg-white dark:bg-dark-700 border-2 border-warm-200 dark:border-dark-500 rounded-2xl pl-13 pr-5 py-4 placeholder:text-warm-400 text-sm font-semibold focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all dark:text-white"
                    placeholder="Contoh: Meja 05 / Bapak Budi"
                    value={manualOrderUser.name}
                    onChange={(e) => setManualOrderUser({...manualOrderUser, name: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Payment Info Banner */}
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 dark:border-amber-500/10 rounded-2xl flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <CreditCard className="text-amber-600 dark:text-amber-400" size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-warm-900 dark:text-white">Pembayaran Tunai (COD)</p>
                <p className="text-xs text-warm-500 dark:text-warm-400 mt-0.5">Pastikan uang tunai sudah diterima sebelum menyimpan nota.</p>
              </div>
            </div>
          </div>

          {/* ──── RIGHT PANEL: Receipt / Nota ──── */}
          <div className="lg:w-[45%] bg-warm-50/80 dark:bg-dark-900/60 border-l border-warm-200 dark:border-dark-700 flex flex-col relative overflow-hidden">
            {/* Decorative receipt top edge */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600"></div>
            
            {/* Receipt Header */}
            <div className="px-8 pt-8 pb-6 border-b-2 border-dashed border-warm-200 dark:border-dark-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-md shadow-brand-500/20">
                    <Package size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-warm-900 dark:text-white tracking-tight">Nota Pesanan</h3>
                    <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-widest">Preview Struk Digital</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={manualOrderItems.length > 0 ? "processed" : "pending"} size="sm">
                    {manualOrderItems.length > 0 ? `${manualOrderItems.length} ITEM` : 'KOSONG'}
                  </Badge>
                </div>
              </div>
              
              {/* Customer info on receipt */}
              {manualOrderUser.name && (
                <div className="mt-4 flex items-center gap-2 text-xs text-warm-500 dark:text-warm-400">
                  <User size={12} />
                  <span className="font-semibold">{manualOrderUser.name}</span>
                </div>
              )}
            </div>
            
            {/* Receipt Items */}
            <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
              {manualOrderItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 rounded-full border-[3px] border-dashed border-warm-300/50 dark:border-warm-700/50 flex items-center justify-center mb-5 animate-float">
                    <ShoppingBag size={32} className="text-warm-300 dark:text-warm-600" />
                  </div>
                  <p className="text-sm font-bold text-warm-400 dark:text-warm-500 mb-1">Belum ada item</p>
                  <p className="text-xs text-warm-300 dark:text-warm-600 text-center max-w-[200px]">Pilih menu dari panel kiri untuk mulai membuat pesanan</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {manualOrderItems.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="group flex items-center gap-4 py-3 px-4 -mx-4 rounded-xl hover:bg-white dark:hover:bg-dark-700/50 transition-all animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/15 flex items-center justify-center shrink-0">
                        <span className="text-brand-600 dark:text-brand-400 font-black text-sm">{item.quantity}×</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-warm-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-warm-400 mt-0.5">@ {formatCurrency(item.price)}</p>
                      </div>
                      <p className="text-sm font-black text-warm-900 dark:text-white shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                      <button 
                        onClick={() => removeItemFromManual(item.id)} 
                        className="p-2 rounded-lg text-warm-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Receipt Footer / Total */}
            <div className="border-t-2 border-dashed border-warm-200 dark:border-dark-600 px-8 py-6 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm space-y-4">
              {manualOrderItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-warm-400">
                    <span>Subtotal ({manualOrderItems.reduce((sum, i) => sum + i.quantity, 0)} item)</span>
                    <span>{formatCurrency(manualTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-warm-400">
                    <span>Pajak</span>
                    <span className="text-warm-300">—</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-warm-200 dark:border-dark-600">
                <span className="text-sm font-bold text-warm-600 dark:text-warm-300">Total Bayar</span>
                <span className="text-2xl font-black text-brand-600 dark:text-brand-400 tabular-nums">{formatCurrency(manualTotal)}</span>
              </div>
              <Button 
                fullWidth 
                size="lg" 
                onClick={handleSaveManualOrder} 
                loading={submitting}
                disabled={manualOrderItems.length === 0 || !manualOrderUser.name}
              >
                <Package size={18} />
                Simpan & Cetak Nota
              </Button>
              {(manualOrderItems.length === 0 || !manualOrderUser.name) && (
                <p className="text-[10px] text-center text-warm-400 dark:text-warm-500">
                  {manualOrderItems.length === 0 ? 'Tambahkan minimal 1 item' : 'Masukkan nama pelanggan'} untuk melanjutkan
                </p>
              )}
            </div>
          </div>

        </div>
      </Modal>

      {/* Detail View Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Rincian Pesanan Database" size="md">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-warm-100 dark:bg-dark-700 rounded-2xl">
              <div>
                <p className="text-[10px] font-bold uppercase text-warm-500 dark:text-warm-400">Order ID</p>
                <p className="font-mono font-black text-warm-900 dark:text-white">#{selectedOrder.id.substring(0, 12).toUpperCase()}</p>
              </div>
              <Badge variant={selectedOrder.status} size="lg">{getStatusLabel(selectedOrder.status)}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-warm-100 dark:border-dark-600">
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-warm-400" />
                  <p className="text-[10px] font-bold uppercase text-warm-500 dark:text-warm-400">Pelanggan</p>
                </div>
                <p className="font-bold text-warm-900 dark:text-white">{selectedOrder.user_name}</p>
                <p className="text-xs text-warm-500 dark:text-warm-400">{selectedOrder.profiles?.email || 'Walk-in Customer'}</p>
              </div>
              <div className="p-4 rounded-2xl border border-warm-100 dark:border-dark-600">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-warm-400" />
                  <p className="text-[10px] font-bold uppercase text-warm-500 dark:text-warm-400">Waktu Transaksi</p>
                </div>
                <p className="font-bold text-warm-900 dark:text-white">{formatDate(selectedOrder.created_at)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-warm-500 dark:text-warm-400 mb-3 ml-1">Detail Menu Pesanan</p>
              <div className="space-y-2">
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-white dark:bg-dark-700/50 border border-warm-100 dark:border-dark-600 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-warm-100 dark:bg-dark-700 rounded-lg flex items-center justify-center">
                        <Package size={20} className="text-warm-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-warm-900 dark:text-white">Menu ID: {item.product_id.substring(0, 8)}</p>
                        <p className="text-xs text-warm-500 dark:text-warm-400">{item.quantity} porsi x {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                    <p className="font-black text-warm-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-brand-500/5 border border-brand-500/10 rounded-2xl flex items-center justify-between">
               <span className="text-sm font-bold text-warm-700 dark:text-warm-400">Total Pembayaran ({selectedOrder.payment_method.toUpperCase()})</span>
               <span className="text-xl font-black text-brand-600 dark:text-brand-400">{formatCurrency(selectedOrder.total_price)}</span>
            </div>

            <div className="flex gap-3 mt-2">
               <Button variant="secondary" className="flex-1" onClick={() => handlePrintReceipt(selectedOrder)}>
                 <Printer size={16} className="mr-2 inline" /> Cetak Struk
               </Button>
               {selectedOrder.status === 'pending' && (
                 <>
                   <Button variant="danger" outline className="flex-1" onClick={() => updateStatus(selectedOrder.id, 'cancelled')}>Batalkan</Button>
                   <Button className="flex-1" onClick={() => updateStatus(selectedOrder.id, 'processed')}>Proses Sekarang</Button>
                 </>
               )}
               {selectedOrder.status === 'processed' && (
                 <Button variant="success" fullWidth onClick={() => updateStatus(selectedOrder.id, 'completed')}>Tandai Selesai</Button>
               )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
