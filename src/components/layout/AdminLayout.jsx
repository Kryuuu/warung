import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Moon, Sun, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import ErrorBoundary from '../ui/ErrorBoundary';
import useAuthStore from '../../stores/authStore';
import useUiStore from '../../stores/uiStore';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUiStore();

  return (
    <div className="flex-1 w-full min-h-screen flex bg-warm-50 dark:bg-dark-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Header */}
        <header className="h-16 md:h-20 bg-white dark:bg-dark-800 border-b border-warm-100 dark:border-dark-600 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-warm-500 hover:bg-warm-100 dark:hover:bg-dark-700 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-warm-900 dark:text-white">Selamat Datang 👋</h2>
              <p className="text-xs text-warm-500 dark:text-warm-400">{user?.name || 'Admin'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2.5 rounded-xl text-warm-500 hover:text-warm-700 hover:bg-warm-100 dark:text-warm-400 dark:hover:bg-dark-700 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-warm-500 hover:text-warm-700 hover:bg-warm-100 dark:text-warm-400 dark:hover:bg-dark-700 transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold ml-1">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <ErrorBoundary>
            <div className="page-enter">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
