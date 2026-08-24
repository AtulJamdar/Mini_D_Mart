import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import useProducts from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/molecules/EmptyState';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCategory = searchParams.get('category') || '';
  const querySearch = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(querySearch);

  const { products, loading, refetch } = useProducts({
    category: queryCategory,
  });

  // Sync search input when url param changes
  useEffect(() => {
    setSearchInput(querySearch);
  }, [querySearch]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set('search', val.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleClearFilter = () => {
    setSearchInput('');
    setSearchParams({});
    refetch();
  };

  const filteredProducts = products.filter((p) => {
    const term = searchInput.toLowerCase().trim();
    if (!term) return true;
    return (
      p.name.toLowerCase().includes(term) ||
      p.categoryId?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {queryCategory ? `${queryCategory}` : 'Daily Grocery & Essentials'}
          </h1>
          <p className="text-sm text-gray-500">
            {queryCategory
              ? `Browse top fresh selections in ${queryCategory}`
              : 'Pick fresh essentials at everyday low Mini D-Mart prices.'}
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Filter items, milk, rice..."
            value={searchInput}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-primary shadow-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          illustration="🔍"
          heading={searchInput || queryCategory ? "No matching products found" : "No Products Found"}
          subtext="We couldn't find any products matching your criteria. Try resetting your search or filter."
          ctaLabel="CLEAR FILTERS"
          onCtaClick={handleClearFilter}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
