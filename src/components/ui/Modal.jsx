import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw] lg:max-w-6xl',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasTitle = title && title.length > 0;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizes[size]} bg-white dark:bg-dark-800
          rounded-[2rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.5)] animate-scale-in
          max-h-[90vh] flex flex-col overflow-hidden
          ${className}
        `}
      >
        {/* Header */}
        {hasTitle && (
          <div className="flex items-center justify-between px-8 py-6 border-b border-warm-100 dark:border-dark-700 bg-warm-50/50 dark:bg-dark-900/50 backdrop-blur-sm">
            <h3 className="text-xl font-black text-warm-900 dark:text-white uppercase tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl text-warm-400 hover:text-warm-900 hover:bg-warm-200/50 dark:text-warm-500 dark:hover:text-white dark:hover:bg-dark-600 transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Floating close button when no title header */}
        {!hasTitle && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 p-2.5 rounded-2xl bg-warm-100/80 dark:bg-dark-700/80 text-warm-500 hover:text-warm-900 hover:bg-warm-200 dark:text-warm-400 dark:hover:text-white dark:hover:bg-dark-600 transition-all active:scale-90 backdrop-blur-sm"
          >
            <X size={20} />
          </button>
        )}

        {/* Body */}
        <div className={`overflow-y-auto flex-1 custom-scrollbar ${hasTitle ? 'px-8 py-8' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

