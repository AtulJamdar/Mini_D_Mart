import React from 'react';
import { Link } from 'react-router';
import {
  Sparkles,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Percent,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import HeroBanner from '../components/home/HeroBanner';
import PopularCategories from '../components/home/PopularCategories';
import ProductCard from '../components/ProductCard';
import useProducts from '../hooks/useProducts';

export default function HomePage() {
  const { products, loading } = useProducts();

  // Pick top 4-8 products for the Featured Deals section
  const featuredProducts = products.slice(0, 8);

  const valuePerks = [
    {
      icon: Truck,
      title: '2-Hour Delivery',
      desc: 'Superfast delivery straight from your local Mini D-Mart store',
      bg: 'bg-emerald-50 text-primary',
    },
    {
      icon: Percent,
      title: 'Everyday Low Prices',
      desc: 'Save more on your monthly grocery bill with direct wholesale rates',
      bg: 'bg-amber-50 text-accent',
    },
    {
      icon: ShieldCheck,
      title: '100% Quality Guaranteed',
      desc: 'Handpicked fresh fruits, vegetables, and genuine branded goods',
      bg: 'bg-blue-50 text-info',
    },
    {
      icon: RotateCcw,
      title: 'Hassle-Free Returns',
      desc: 'Doorstep return & instant refund policy for maximum peace of mind',
      bg: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="space-y-10 sm:space-y-12 pb-8">
      {/* 1. Hero Banner with Rounded Corners */}
      <HeroBanner />

      {/* 2. Popular Categories Section with Right-Edge "→" Affordance */}
      <PopularCategories />

      {/* 3. Value Perks Section */}
      <section aria-label="Why shop with Mini D-Mart" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {valuePerks.map((perk, idx) => {
          const Icon = perk.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-border p-4 shadow-2xs flex items-start gap-3.5 hover:border-primary/40 hover:shadow-xs transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${perk.bg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-text text-sm">{perk.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{perk.desc}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* 4. Featured Super Saver Deals Section (Reuses ProductCard & useProducts) */}
      <section aria-labelledby="featured-deals-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent/15 text-accent">
              <Zap className="w-5 h-5 fill-accent" />
            </div>
            <div>
              <h2 id="featured-deals-heading" className="text-xl sm:text-2xl font-bold text-text">
                Featured Super Saver Deals
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Handpicked top discounts & daily essentials at special prices
              </p>
            </div>
          </div>

          <Link
            to="/shop"
            className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1 group"
          >
            <span>View All Deals</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-4 h-72 animate-pulse flex flex-col justify-between">
                <div className="h-40 bg-gray-100 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="h-8 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center space-y-3">
            <div className="text-4xl">🛍️</div>
            <h3 className="font-bold text-text text-base">Catalog Preparing</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Our store catalog is currently being updated with fresh items and deals.
            </p>
            <Link
              to="/shop"
              className="inline-block px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Promotional Loyalty / Mobile Strip */}
      <section className="rounded-2xl sm:rounded-3xl bg-linear-to-r from-emerald-900 via-primary to-teal-800 text-white p-6 sm:p-8 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left z-10">
          <span className="px-2.5 py-1 rounded-full bg-accent text-text text-[10px] font-black uppercase tracking-wider">
            Mini D-Mart Express
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Get ₹50 Cashback on Your First Online Order!
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-md">
            Order grocery items anytime, choose pickup or home delivery with live status tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <Link
            to="/shop"
            className="px-6 py-3 bg-white text-primary hover:bg-bg font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
          >
            Start Shopping Now
          </Link>
        </div>
      </section>
    </div>
  );
}
