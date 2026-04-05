import { create } from 'zustand';
import { supabase } from '../services/supabase';

const useProductStore = create((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    
    if (!supabase) {
      const errorMsg = 'Supabase client is not initialized. Please check your .env settings and restart the dev server.';
      set({ error: errorMsg, loading: false });
      console.error('❌', errorMsg);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('order_count', { ascending: false });

      if (error) throw error;
      set({ products: data || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      console.error('❌ Error fetching products:', err);
    }
  },

  getProductById: (id) => {
    return get().products.find(p => p.id === id);
  },

  fetchProductById: async (id) => {
    set({ loading: true });
    
    if (!supabase) {
      console.error('❌ Supabase client is not initialized.');
      set({ loading: false });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      set({ loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  addProduct: async (product) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      if (error) throw error;
      set(state => ({ products: [data, ...state.products], loading: false }));
      return { success: true, data };
    } catch (err) {
      console.error('❌ addProduct error:', err);
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  updateProduct: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      set(state => ({
        products: state.products.map(p => p.id === id ? data : p),
        loading: false
      }));
      return { success: true, data };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      set(state => ({
        products: state.products.filter(p => p.id !== id),
        loading: false
      }));
      return { success: true };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  }
}));

export default useProductStore;
