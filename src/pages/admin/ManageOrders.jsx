import { useState, useEffect } from 'react';
import { Eye, ChevronDown, ChevronUp, Package, Plus, User, Calendar, CreditCard, ShoppingBag, Trash2, Search, X } from 'lucide-react';
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
        user_name: o.profiles?.name || 'Walk-in',
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

  const updateStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      
      toast.success(`Status pesanan diperbarui ke "${getStatusLabel(newStatus)}"`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Gagal memperbarui status');
    }
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

      toast.success('Pesanan offline berhasil dicatat! 🎉');
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
                      >
                        <Eye size={16} />
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Add Order Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Kasir Digital (Manual Order)" size="xl">
        <div className="flex flex-col lg:flex-row gap-10 min-h-[500px] justify-center py-10 lg:py-16">
          <div className="lg:w-[450px] space-y-8 flex flex-col my-auto">
            <div className="flex-1 space-y-6">
              <div className="space-y-4 p-6 bg-warm-100/30 dark:bg-dark-700/30 rounded-3xl border border-warm-200 dark:border-dark-600 shadow-inner">
                <div className="flex items-center gap-2 mb-2 ml-1">
                  <div className="w-6 h-6 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-600">
                    <Plus size={14} strokeWidth={3} />
                  </div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-warm-500 dark:text-warm-400">Pilih Menu & Jumlah</label>
                </div>
                
                <div className="space-y-4">
                  <select 
                    className="w-full bg-white dark:bg-dark-800 border border-warm-100 dark:border-dark-600 rounded-2xl px-5 py-4 text-sm font-bold ring-0 outline-none focus:ring-4 focus:ring-brand-500/10 text-warm-900 dark:text-white shadow-sm transition-all"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <option value="">-- Sentuh untuk memilih menu --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</option>
                    ))}
                  </select>
                  
                  <div className="flex gap-4">
                    <div className="flex-1 flex items-center bg-white dark:bg-dark-800 border border-warm-100 dark:border-dark-600 rounded-2xl px-4 shadow-sm focus-within:ring-4 focus-within:ring-brand-500/10 transition-all">
                      <span className="text-[10px] font-black text-warm-400 uppercase tracking-widest mr-4">Jumlah</span>
                      <input 
                        type="number"
                        min="1"
                        className="flex-1 bg-transparent border-none py-4 text-lg font-black text-warm-900 dark:text-white ring-0 outline-none"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <button 
                      onClick={handleAddItemToManual}
                      className="px-8 bg-brand-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/30 active:scale-95"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </div>

            <div className="space-y-4">
               <div className="flex items-center gap-2 mb-2 ml-1">
                  <Package size={14} className="text-warm-400" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-warm-500 dark:text-warm-400">Nama Customer / Meja</label>
               </div>
               <input 
                  className="w-full bg-warm-100/50 dark:bg-dark-700/50 border border-warm-200 dark:border-dark-600 rounded-2xl px-5 py-4 placeholder:text-warm-400 text-sm font-bold focus:ring-4 focus:ring-brand-500/10 outline-none transition-all dark:text-white"
                  placeholder="Contoh: Meja 05 / Bapak Budi"
                  value={manualOrderUser.name}
                  onChange={(e) => setManualOrderUser({...manualOrderUser, name: e.target.value})}
                />
            </div>
          </div> { /* End of flex-1 space-y-6 (line 335) */ }

            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-3">
               <CreditCard className="text-orange-500 shrink-0" size={24} />
               <div>
                  <p className="text-sm font-bold text-warm-900 dark:text-white">Bayar Tunai di Kasir</p>
                  <p className="text-[10px] text-warm-600 dark:text-warm-400">Pastikan uang tunai sudah diterima sesuai total belanja.</p>
               </div>
            </div>
          </div>

          <div className="flex-1 bg-warm-100/30 dark:bg-dark-900/40 rounded-[2.5rem] p-10 flex flex-col border border-warm-200 dark:border-dark-800 shadow-inner min-h-[520px] my-auto">
             <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                      <ShoppingBag size={24} className="text-white" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-warm-900 dark:text-white">Ringkasan Pesanan</h3>
                      <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">Detail receipt / nota digital</p>
                   </div>
                </div>
                <Badge variant="pending" size="sm">UNPAID</Badge>
             </div>
             
             <div className="flex-1 space-y-4 overflow-y-auto mb-8 pr-2 custom-scrollbar">
                {manualOrderItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 transform scale-110">
                     <div className="w-24 h-24 rounded-full border-4 border-dashed border-warm-300 dark:border-warm-700 flex items-center justify-center mb-6">
                        <Package size={40} className="text-warm-400" />
                     </div>
                     <p className="text-sm font-black uppercase tracking-[0.3em] text-warm-500">Nota Kosong</p>
                  </div>
                ) : manualOrderItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between group">
                     <div>
                        <p className="text-sm font-bold text-warm-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-warm-500">{item.quantity} porsi x {formatCurrency(item.price)}</p>
                     </div>
                     <button onClick={() => removeItemFromManual(item.id)} className="p-1.5 text-warm-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <X size={14} />
                     </button>
                  </div>
                ))}
             </div>

             <div className="border-t border-warm-200 dark:border-dark-600 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-sm font-bold text-warm-500">Total Transaksi</span>
                   <span className="text-xl font-black text-brand-600 dark:text-brand-400">{formatCurrency(manualTotal)}</span>
                </div>
                <Button fullWidth onClick={handleSaveManualOrder} loading={submitting}>Simpan & Cetak Nota</Button>
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

            <div className="flex gap-3">
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
