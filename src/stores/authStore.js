import { create } from 'zustand';
import { supabase } from '../services/supabase';

const useAuthStore = create((set, get) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  // Live Supabase Login
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Role will be fetched via session listener
      return { success: true, user: data.user };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  // Live Supabase Register
  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) throw error;
      if (data?.user && !data.session) {
         return { success: true, message: 'Silakan cek email Anda untuk konfirmasi pendaftaran.' };
      }
      
      return { success: true, user: data.user };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  // Logout
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, isAuthenticated: false, isLoading: false });
    localStorage.removeItem('warungku_user'); // Clean up old dummy storage
  },

  // Initialize and Sync Session
  initialize: () => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        get()._handleAuthChange(session.user);
      } else {
        set({ isLoading: false });
      }
    });

    // 2. Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        get()._handleAuthChange(session.user);
      } else {
        set({ user: null, role: null, isAuthenticated: false, isLoading: false });
      }
    });
  },

  // Internal helper to fetch profile/role
  _handleAuthChange: async (supabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        // Retry once if profile haven't been created by trigger yet
        setTimeout(async () => {
          const { data: retryProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();
          
          if (retryProfile) {
            set({ 
              user: { ...supabaseUser, name: retryProfile.name },
              role: retryProfile.role,
              isAuthenticated: true,
              isLoading: false 
            });
          }
        }, 1000);
      } else if (profile) {
        set({ 
          user: { ...supabaseUser, name: profile.name },
          role: profile.role,
          isAuthenticated: true,
          isLoading: false 
        });
      }
    } catch (err) {
      console.error('Error syncing profile:', err);
      set({ isLoading: false });
    }
  },

  // Check if admin
  isAdmin: () => get().role === 'admin',
}));

export default useAuthStore;
