import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, QrCode, CheckCircle2, Copy, ArrowLeft, Wallet } from 'lucide-react';
import Button from '../components/ui/Button';
import useCartStore from '../stores/cartStore';
import useAuthStore from '../stores/authStore';
import { formatCurrency } from '../utils/helpers';
import { PAYMENT_METHODS } from '../utils/constants';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const totalPrice = getTotalPrice();

  // Filter out admin-only payment methods
  const availableMethods = PAYMENT_METHODS.filter(m => !m.isAdminOnly);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <p className="text-6xl mb-4">🔒</p>
          <h2 className="text-2xl font-bold text-warm-800 dark:text-warm-200 mb-2">Silakan Masuk Terlebih Dahulu</h2>
          <p className="text-warm-500 dark:text-warm-400 mb-6">Anda perlu login untuk melakukan checkout</p>
          <Link to="/login"><Button>Masuk</Button></Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-2xl font-bold text-warm-800 dark:text-warm-200 mb-2">Keranjang Kosong</h2>
          <Link to="/products"><Button>Jelajahi Menu</Button></Link>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!supabase) {
      toast.error('Koneksi database terputus. Silakan coba lagi.');
      return;
    }

    setIsProcessing(true);
    try {
      // 0. Stock Verification
      const { data: latestProducts, error: stockCheckError } = await supabase
        .from('products')
        .select('id, name, stock')
        .in('id', items.map(item => item.id));
      
      if (stockCheckError) throw stockCheckError;

      for (const item of items) {
        const product = latestProducts.find(p => p.id === item.id);
        if (!product || product.stock < item.quantity) {
          throw new Error(`Stok ${product?.name || 'Menu'} tidak mencukupi (Tersedia: ${product?.stock || 0})`);
        }
      }

      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_price: totalPrice,
          status: 'pending',
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderId(`ORD-${order.id.substring(0, 8).toUpperCase()}`);
      setOrderComplete(true);
      clearCart();
      toast.success('Pesanan berhasil dibuat!');
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Gagal membuat pesanan: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-warm-900 dark:text-white mb-2">
            Pesanan Berhasil! 🎉
          </h2>
          <p className="text-warm-500 dark:text-warm-400 mb-2">
            Nomor pesanan Anda:
          </p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <code className="text-lg font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 px-4 py-2 rounded-lg">
              {orderId}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(orderId); toast.success('Disalin!'); }}
              className="p-2 rounded-lg text-warm-400 hover:bg-warm-100 dark:hover:bg-dark-700 transition-colors"
            >
              <Copy size={16} />
            </button>
          </div>
          <p className="text-sm text-warm-500 dark:text-warm-400 mb-8">
            Silakan lakukan pembayaran melalui {paymentMethod === 'qris' ? 'QRIS' : 'Transfer Bank'}. 
            Pesanan akan diproses setelah pembayaran dikonfirmasi.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/orders"><Button fullWidth>Lihat Pesanan Saya</Button></Link>
            <Link to="/products"><Button fullWidth variant="secondary">Pesan Lagi</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-warm-500 hover:text-brand-600 dark:text-warm-400 dark:hover:text-brand-400 mb-6 transition-colors">
          <ArrowLeft size={16} /> Kembali
        </button>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-warm-900 dark:text-white mb-5 sm:mb-8">
          Checkout 💳
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-warm-100 dark:border-dark-600 p-6 shadow-xl shadow-black/[0.03]">
              <h3 className="text-lg font-bold text-warm-900 dark:text-white mb-4">
                Metode Pembayaran
              </h3>
              <div className="space-y-3">
                {availableMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                      paymentMethod === method.id
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 dark:border-brand-400 ring-4 ring-brand-500/10'
                        : 'border-warm-100 dark:border-dark-700 hover:border-warm-200 dark:hover:border-dark-600'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      paymentMethod === method.id 
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' 
                        : 'bg-warm-100 text-warm-500 dark:bg-dark-700 dark:text-warm-400'
                    }`}>
                      {method.id === 'transfer' ? <Building2 size={22} /> : <QrCode size={22} />}
                    </div>
                    <div>
                      <p className="font-bold text-warm-900 dark:text-white">{method.name}</p>
                      <p className="text-xs text-warm-500 dark:text-warm-400">{method.description}</p>
                    </div>
                    <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      paymentMethod === method.id
                        ? 'border-brand-500 scale-110'
                        : 'border-warm-200 dark:border-dark-600'
                    }`}>
                      {paymentMethod === method.id && (
                        <div className="w-3 h-3 bg-brand-500 rounded-full animate-scale-in" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-warm-100 dark:border-dark-600 p-6 shadow-xl shadow-black/[0.03]">
              <h3 className="text-lg font-bold text-warm-900 dark:text-white mb-4">
                {paymentMethod === 'qris' ? 'Scan QRIS' : 'Detail Transfer'}
              </h3>
              {paymentMethod === 'qris' ? (
                <div className="text-center py-4">
                  <div className="inline-block p-6 bg-white rounded-3xl border-2 border-warm-100 mb-4 shadow-sm">
                    <div className="w-48 h-48 bg-gradient-to-br from-warm-50 to-warm-100 rounded-2xl flex items-center justify-center overflow-hidden">
                      <QrCode size={120} className="text-warm-800" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-warm-600 dark:text-warm-400">
                    Scan QR code di atas dengan aplikasi e-wallet Anda
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { bank: 'BCA', number: '123-456-7890', name: 'WarungKu Official' },
                    { bank: 'BRI', number: '098-765-4321', name: 'WarungKu Official' },
                  ].map((acc) => (
                    <div key={acc.bank} className="flex items-center justify-between p-5 bg-warm-50/50 dark:bg-dark-700/50 border border-warm-100 dark:border-dark-600 rounded-2xl group transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="px-2 py-0.5 bg-brand-500 text-white text-[10px] font-black rounded uppercase">{acc.bank}</span>
                           <p className="text-sm font-bold text-warm-800 dark:text-warm-200">{acc.name}</p>
                        </div>
                        <p className="font-mono text-lg font-black text-warm-900 dark:text-white">{acc.number}</p>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(acc.number.replace(/-/g, '')); toast.success('Disalin!'); }}
                        className="p-3 rounded-xl text-brand-500 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 transition-all shadow-sm"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-warm-100 dark:border-dark-600 p-6 sticky top-24 shadow-xl shadow-black/[0.03]">
              <h3 className="text-lg font-bold text-warm-900 dark:text-white mb-5">
                Ringkasan Pesanan
              </h3>
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-warm-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-warm-500 dark:text-warm-400 font-medium">{item.quantity} porsi x {formatCurrency(item.price)}</p>
                    </div>
                    <p className="text-sm font-black text-warm-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-warm-100 dark:border-dark-600 pt-5 space-y-3 mb-8">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-warm-500 dark:text-warm-400">Subtotal</span>
                  <span className="text-warm-900 dark:text-white">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-warm-500 dark:text-warm-400">Ongkir</span>
                  <span className="text-green-500 font-bold">Gratis</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-warm-100 dark:border-dark-600">
                  <span className="font-bold text-warm-900 dark:text-white">Total Bayar</span>
                  <span className="text-2xl font-black text-brand-600 dark:text-brand-400">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
              <Button fullWidth size="lg" onClick={handleCheckout} loading={isProcessing} className="py-4 shadow-lg shadow-brand-500/20">
                {isProcessing ? 'Memproses Pesanan...' : 'Buat Pesanan Sekarang'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
