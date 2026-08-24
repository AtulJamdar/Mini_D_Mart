import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';

export const POPULAR_CATEGORIES_DATA = [
  {
    id: 'dairy',
    name: 'Dairy & Breakfast',
    icon: '🥛',
    query: 'Daily Essentials',
    itemCount: '45+ items',
    bgColor: 'bg-blue-50/80 text-blue-600 border-blue-100',
  },
  {
    id: 'fruits-veg',
    name: 'Fruits & Veggies',
    icon: '🥦',
    query: 'Fresh Fruits & Veggies',
    itemCount: '60+ items',
    bgColor: 'bg-emerald-50/80 text-emerald-600 border-emerald-100',
  },
  {
    id: 'staples',
    name: 'Atta, Rice & Dal',
    icon: '🍚',
    query: 'Daily Essentials',
    itemCount: '30+ items',
    bgColor: 'bg-amber-50/80 text-amber-600 border-amber-100',
  },
  {
    id: 'snacks',
    name: 'Snacks & Munchies',
    icon: '🍪',
    query: 'Snacks & Beverages',
    itemCount: '80+ items',
    bgColor: 'bg-orange-50/80 text-orange-600 border-orange-100',
  },
  {
    id: 'beverages',
    name: 'Drinks & Juices',
    icon: '🧃',
    query: 'Snacks & Beverages',
    itemCount: '40+ items',
    bgColor: 'bg-rose-50/80 text-rose-600 border-rose-100',
  },
  {
    id: 'cleaning',
    name: 'Cleaning & Household',
    icon: '🧼',
    query: 'Household & Cleaning',
    itemCount: '50+ items',
    bgColor: 'bg-teal-50/80 text-teal-600 border-teal-100',
  },
  {
    id: 'personal-care',
    name: 'Bath & Body Care',
    icon: '🧴',
    query: 'Household & Cleaning',
    itemCount: '35+ items',
    bgColor: 'bg-purple-50/80 text-purple-600 border-purple-100',
  },
  {
    id: 'instant-food',
    name: 'Instant Noodles & Pasta',
    icon: '🍜',
    query: 'Snacks & Beverages',
    itemCount: '25+ items',
    bgColor: 'bg-yellow-50/80 text-yellow-600 border-yellow-100',
  },
  {
    id: 'tea-coffee',
    name: 'Tea, Coffee & Health',
    icon: '☕',
    query: 'Snacks & Beverages',
    itemCount: '35+ items',
    bgColor: 'bg-amber-50/80 text-amber-700 border-amber-200',
  },
  {
    id: 'chocolates-sweets',
    name: 'Chocolates & Sweets',
    icon: '🍫',
    query: 'Snacks & Beverages',
    itemCount: '50+ items',
    bgColor: 'bg-pink-50/80 text-pink-600 border-pink-100',
  },
];

export default function PopularCategories() {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollAffordance = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      if (scrollWidth > clientWidth) {
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      } else {
        setShowRightArrow(true);
      }
    }
  };

  useEffect(() => {
    checkScrollAffordance();
    window.addEventListener('resize', checkScrollAffordance);
    return () => window.removeEventListener('resize', checkScrollAffordance);
  }, []);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="space-y-3" aria-labelledby="popular-categories-heading">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 id="popular-categories-heading" className="text-lg sm:text-xl font-bold text-text">
            Popular Categories
          </h2>
          <p className="text-xs text-gray-500">
            Explore 10 top-selling grocery & essential aisles
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll Prev / Next Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 mr-1">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!showLeftArrow}
              className={`w-7 h-7 rounded-full border border-border flex items-center justify-center transition-all ${
                showLeftArrow
                  ? 'bg-white hover:bg-bg text-text shadow-2xs cursor-pointer'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Scroll categories left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!showRightArrow}
              className={`w-7 h-7 rounded-full border border-border flex items-center justify-center transition-all ${
                showRightArrow
                  ? 'bg-white hover:bg-bg text-text shadow-2xs cursor-pointer'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Scroll categories right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <Link
            to="/shop"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group"
          >
            <span>See All (10)</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Horizontal Scrolling Row: 10 Categories with tight padding, 1px border, and 12px gap */}
      <div className="relative group">
        {/* Left Shadow Fade */}
        {showLeftArrow && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-linear-to-r from-bg to-transparent z-10 pointer-events-none" />
        )}

        {/* Categories Horizontal Track */}
        <div
          ref={scrollRef}
          onScroll={checkScrollAffordance}
          className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1 scroll-smooth"
        >
          {POPULAR_CATEGORIES_DATA.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${encodeURIComponent(cat.query)}`}
              className="flex-shrink-0 w-28 sm:w-32 group/card cursor-pointer focus:outline-none"
            >
              {/* Rounded card with 1px border and tight padding */}
              <div
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-xl border p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 group-hover/card:scale-102 group-hover/card:shadow-xs group-hover/card:border-primary/40 bg-white ${cat.bgColor}`}
              >
                {/* Icon */}
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl bg-white shadow-2xs flex items-center justify-center text-2xl sm:text-3xl group-hover/card:scale-105 transition-transform">
                  <span>{cat.icon}</span>
                </div>
                <span className="text-[9px] font-semibold text-gray-500">{cat.itemCount}</span>
              </div>

              {/* Label underneath */}
              <div className="mt-1.5 text-center px-0.5">
                <span className="text-[11px] sm:text-xs font-bold text-text group-hover/card:text-primary transition-colors line-clamp-1">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Right-Edge "→" Affordance Indicator */}
        {showRightArrow && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-1 pointer-events-none z-10">
            <div className="absolute inset-0 bg-linear-to-l from-bg via-bg/80 to-transparent w-12" />
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="relative pointer-events-auto w-8 h-8 rounded-full bg-white text-primary border border-border shadow-md flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer transform hover:scale-105"
              aria-label="Scroll more categories"
              title="Scroll for more categories"
            >
              <ArrowRight className="w-3.5 h-3.5 font-bold" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
