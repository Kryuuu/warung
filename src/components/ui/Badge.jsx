const badgeVariants = {
  bestseller: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
  new: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white',
  outofstock: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  featured: 'bg-gradient-to-r from-purple-400 to-pink-500 text-white',
  promo: 'bg-gradient-to-r from-brand-400 to-brand-600 text-white',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  processed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function Badge({ children, variant = 'bestseller', className = '', size = 'sm' }) {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full whitespace-nowrap
        ${badgeVariants[variant] || badgeVariants.bestseller}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
