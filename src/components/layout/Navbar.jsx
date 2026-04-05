import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Moon, Sun, Menu, X, LogOut, LayoutDashboard, ChefHat } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import useCartStore from '../../stores/cartStore';
import useUiStore from '../../stores/uiStore';
import { APP_NAME } from '../../utils/constants';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, role, logout } = useAuthStore();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const { darkMode, toggleDarkMode, mobileMenuOpen, setMobileMenuOpen } = useUiStore();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location, setMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { path: '/', label: 'Beranda' },
    { path: '/products', label: 'Menu' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-out flex justify-center w-full ${
        scrolled ? 'top-2 sm:top-4' : 'top-0'
      }`}>
        <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
          scrolled ? 'sm:px-8' : ''
        }`}>
          <div className={`flex items-center justify-between transition-all duration-500 ${
            scrolled 
              ? 'h-14 sm:h-16 glass-pill rounded-3xl px-4 sm:px-6' 
              : 'h-16 sm:h-20 bg-transparent px-0'
          }`}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
                <ChefHat size={18} className="text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-warm-900 dark:text-white">
                {APP_NAME}
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                      : 'text-warm-600 hover:text-warm-900 hover:bg-warm-100 dark:text-warm-400 dark:hover:text-warm-100 dark:hover:bg-dark-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Dark Mode */}
              <button
                onClick={toggleDarkMode}
                className="p-2 sm:p-2.5 rounded-xl text-warm-500 hover:text-warm-700 hover:bg-warm-100 dark:text-warm-400 dark:hover:text-warm-200 dark:hover:bg-dark-700 transition-all"
                aria-label="Toggle tema"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 sm:p-2.5 rounded-xl text-warm-500 hover:text-warm-700 hover:bg-warm-100 dark:text-warm-400 dark:hover:text-warm-200 dark:hover:bg-dark-700 transition-all"
              >
                <ShoppingCart size={18} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>

              {/* Profile / Auth */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 sm:p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-dark-700 transition-all"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-warm-700 dark:text-warm-300 max-w-[100px] truncate">
                      {user?.name}
                    </span>
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-800 rounded-xl shadow-elevated border border-warm-100 dark:border-dark-600 overflow-hidden animate-scale-in z-20">
                        <div className="px-4 py-3 border-b border-warm-100 dark:border-dark-600">
                          <p className="text-sm font-semibold text-warm-900 dark:text-white truncate">{user?.name}</p>
                          <p className="text-xs text-warm-500 dark:text-warm-400 truncate">{user?.email}</p>
                        </div>
                        {role === 'admin' && (
                          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-sm text-warm-700 hover:bg-warm-50 dark:text-warm-300 dark:hover:bg-dark-700 transition-colors">
                            <LayoutDashboard size={16} /> Dashboard Admin
                          </Link>
                        )}
                        <Link to="/orders" className="flex items-center gap-3 px-4 py-3 text-sm text-warm-700 hover:bg-warm-50 dark:text-warm-300 dark:hover:bg-dark-700 transition-colors">
                          <ShoppingCart size={16} /> Pesanan Saya
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors">
                          <LogOut size={16} /> Keluar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-brand text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all"
                >
                  <User size={16} /> Masuk
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-warm-500 hover:bg-warm-100 dark:text-warm-400 dark:hover:bg-dark-700 transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Full Screen Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-14 left-0 right-0 bg-white dark:bg-dark-800 border-b border-warm-200 dark:border-dark-600 shadow-elevated animate-fade-in safe-bottom">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                      : 'text-warm-700 hover:bg-warm-100 dark:text-warm-300 dark:hover:bg-dark-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="block px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-brand text-center mt-2"
                >
                  Masuk / Daftar
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
