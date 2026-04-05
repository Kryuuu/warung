import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { PRODUCT_CATEGORIES, SORT_OPTIONS } from '../../utils/constants';

export default function SearchBar({ 
  onSearch, 
  onCategoryChange, 
  onSortChange,
  selectedCategory = 'Semua',
  selectedSort = 'popular',
  placeholder = 'Cari makanan favorit...',
}) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value) => {
    setQuery(value);
    onSearch?.(value);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch?.('');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-11 pr-10 py-3 rounded-xl border border-warm-200 bg-white
              text-warm-900 placeholder:text-warm-400
              focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20
              transition-all duration-200
              dark:bg-dark-700 dark:border-dark-500 dark:text-warm-100 dark:placeholder:text-warm-600
              dark:focus:border-brand-400"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-warm-400 hover:text-warm-600 hover:bg-warm-100 dark:hover:bg-dark-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200
            ${showFilters 
              ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:border-brand-400 dark:text-brand-400' 
              : 'border-warm-200 bg-white text-warm-600 hover:bg-warm-50 dark:bg-dark-700 dark:border-dark-500 dark:text-warm-300 dark:hover:bg-dark-600'}
          `}
        >
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline text-sm font-medium">Filter</span>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 flex-1">
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange?.(cat)}
                className={`
                  px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200
                  ${selectedCategory === cat
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-warm-100 text-warm-600 hover:bg-warm-200 dark:bg-dark-600 dark:text-warm-300 dark:hover:bg-dark-500'}
                `}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={selectedSort}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="px-4 py-2 rounded-xl border border-warm-200 bg-white text-sm text-warm-700
              focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20
              dark:bg-dark-700 dark:border-dark-500 dark:text-warm-300
              min-w-[160px]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
