import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Package, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import useProductStore from '../../stores/productStore';
import { formatCurrency } from '../../utils/helpers';
import { PRODUCT_CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function ManageProducts() {
  const { products, loading, fetchProducts, addProduct, updateProduct, deleteProduct } = useProductStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '', price: '', stock: '', image_url: '', description: '', category: 'Makanan Berat',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({ name: '', price: '', stock: '', image_url: '', description: '', category: 'Makanan Berat' });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      image_url: product.image_url || '',
      description: product.description || '',
      category: product.category || 'Makanan Berat',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock) {
      toast.error('Harap isi semua field wajib!');
      return;
    }

    setSubmitting(true);
    const productData = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    let result;
    if (editingProduct) {
      result = await updateProduct(editingProduct.id, productData);
    } else {
      result = await addProduct({
        ...productData,
        order_count: 0,
        rating: 5, // Default rating for new products
      });
    }

    if (result.success) {
      toast.success(editingProduct ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil ditambahkan!');
      setShowModal(false);
      fetchProducts(); // Refresh list to get fresh data from DB
    } else {
      console.error('Save Product Error:', result.error);
      toast.error(`Gagal menyimpan: ${result.error || 'Kesalahan sistem'}`);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    setSubmitting(true);
    const result = await deleteProduct(id);
    if (result.success) {
      toast.success('Produk berhasil dihapus!');
      setDeleteConfirm(null);
    } else {
      toast.error(result.error || 'Gagal menghapus produk');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-warm-900 dark:text-white mb-1">Kelola Produk</h1>
          <p className="text-warm-500 dark:text-warm-400">{products.length} produk di database Supabase</p>
        </div>
        <Button icon={Plus} onClick={openAddModal}>Tambah Produk</Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk di database..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder:text-warm-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-dark-700 dark:border-dark-500 dark:text-warm-100 dark:placeholder:text-warm-600 shadow-sm"
        />
      </div>

      {/* Products Table */}
      <Card className="overflow-hidden border-none shadow-xl shadow-black/5 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-100/50 dark:bg-dark-700/50 text-warm-600 dark:text-warm-400 border-b border-warm-200 dark:border-dark-600">
                <th className="text-left px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Produk</th>
                <th className="text-left px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Kategori</th>
                <th className="text-right px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Harga</th>
                <th className="text-center px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Stok</th>
                <th className="text-center px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Terjual</th>
                <th className="text-center px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 dark:divide-dark-600">
              {loading && products.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-4"><div className="h-4 bg-warm-200 dark:bg-dark-700 rounded w-full" /></td>
                  </tr>
                ))
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="group hover:bg-white dark:hover:bg-dark-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-200">
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-warm-900 dark:text-warm-100">{product.name}</p>
                        <p className="text-xs font-bold text-brand-500">⭐ {product.rating || 0}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-warm-600 dark:text-warm-400 underline decoration-brand-500/20 underline-offset-4">{product.category}</td>
                  <td className="px-6 py-4 text-right font-black text-warm-900 dark:text-white">{formatCurrency(product.price)}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={product.stock > 0 ? 'completed' : 'outofstock'} size="sm">
                      {product.stock > 0 ? `${product.stock} Tersedia` : 'Stok Habis'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-warm-800 dark:text-warm-300">
                     <span className="px-3 py-1 bg-warm-100 dark:bg-dark-700 rounded-full text-xs">
                        {product.order_count || 0}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(product)} className="p-2.5 rounded-xl text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-all">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => setDeleteConfirm(product.id)} className="p-2.5 rounded-xl text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-20 bg-white/30 dark:bg-dark-800/30">
            <Package size={48} className="mx-auto text-warm-300 dark:text-dark-500 mb-4 opacity-50" />
            <p className="text-lg font-bold text-warm-700 dark:text-warm-300">Tidak ada produk ditemukan</p>
            <p className="text-sm text-warm-500 dark:text-warm-400">Pastikan database Anda sudah memiliki data produk.</p>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? 'Update Detail Menu' : 'Tambah Menu Baru'} size="md">
        <div className="space-y-5 py-2">
          <Input label="Nama Produk *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Nasi Goreng Spesial" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Harga (Rp) *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="25000" />
            <Input label="Stok *" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="50" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-warm-500 dark:text-warm-400 mb-1.5 ml-1">Pilih Kategori</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-3 border-none rounded-xl bg-warm-100 dark:bg-dark-700 text-sm font-semibold text-warm-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none"
            >
              {PRODUCT_CATEGORIES.filter(c => c !== 'Semua').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Input label="URL Gambar Produk (Unsplash/Imgur)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
          <div>
            <label className="block text-xs font-bold uppercase text-warm-500 dark:text-warm-400 mb-1.5 ml-1">Deskripsi Singkat</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Jelaskan kelezatan menu ini..."
              className="w-full px-4 py-3 rounded-xl border-none bg-warm-100 dark:bg-dark-700 text-sm placeholder:text-warm-400 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none dark:text-warm-200 shadow-inner"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" outline onClick={() => setShowModal(false)} fullWidth>Batal</Button>
            <Button onClick={handleSave} fullWidth loading={submitting}>{editingProduct ? 'Simpan Perubahan' : 'Tambah Menu'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hapus Menu?" size="sm">
        <div className="text-center py-4">
           <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} className="text-red-500" />
           </div>
           <h3 className="text-lg font-bold text-warm-900 dark:text-white mb-2">Konfirmasi Penghapusan</h3>
           <p className="text-sm text-warm-500 dark:text-warm-400 mb-8 px-4">
              Apakah Anda yakin ingin menghapus menu ini? Tindakan ini permanen dan tidak dapat dibatalkan di database.
           </p>
           <div className="flex gap-3">
              <Button variant="secondary" outline onClick={() => setDeleteConfirm(null)} fullWidth>Batal</Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm)} fullWidth loading={submitting}>Hapus Permanen</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
