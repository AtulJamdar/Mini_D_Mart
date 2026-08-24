import React from 'react';
import { Link } from 'react-router';
import { ArrowRight, Sparkles, Zap, ShieldCheck, Clock, Percent } from 'lucide-react';

export default function HeroBanner() {
  return (
    <div className="relative overflow-hidden bg-linear-to-r from-emerald-900 via-primary to-teal-800 text-white shadow-sm border-y sm:border border-emerald-700/50 -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 sm:rounded-none lg:rounded-none">
      {/* Decorative background glow circles */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[300px] lg:min-h-[340px] items-stretch">
        {/* Left Column: Headlines & CTA (Spans 7 cols on desktop) */}
        <div className="lg:col-span-7 px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 flex flex-col justify-center space-y-4 text-left z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-accent font-bold text-xs w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-white">Everyday Wholesale Prices</span>
            <span className="bg-accent text-white px-2 py-0.5 rounded-full text-[10px] font-black">
              SAVE UP TO 50%
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white max-w-xl">
            Fresh Groceries & Daily Essentials Delivered in 2 Hours.
          </h1>

          {/* Subtext */}
          <p className="text-xs sm:text-sm text-emerald-100 max-w-lg font-normal leading-relaxed">
            Shop farm-fresh vegetables, dairy, staples, snacks & household goods at lowest Mini D-Mart prices.
          </p>

          {/* Value Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 font-medium text-white/90">
              <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>2-Hr Slot Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-white/90">
              <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>100% Quality</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-white/90">
              <Percent className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Direct Savings</span>
            </div>
          </div>

          {/* CTA Button: SHOP NOW */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent/90 text-text font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer group"
            >
              <span>SHOP NOW</span>
              <ArrowRight className="w-4 h-4 text-text group-hover:translate-x-1 transition-transform" />
            </Link>

            <span className="text-[11px] text-white/80 font-medium">
              Use code <strong className="text-accent font-bold">MINIDMART50</strong> for ₹50 off
            </span>
          </div>
        </div>

        {/* Right Column: Promotional Image Bleeding Edge-to-Edge */}
        <div className="lg:col-span-5 relative min-h-[220px] sm:min-h-[260px] lg:min-h-full overflow-hidden">
          {/* Edge-to-edge Bleeding Image */}
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000&auto=format&fit=crop&q=80"
            alt="Fresh Grocery Basket & Daily Produce"
            className="absolute inset-0 w-full h-full object-cover object-center lg:object-right"
            loading="eager"
          />

          {/* Subtle gradient overlay to smoothly blend with left green background on medium/desktop */}
          <div className="absolute inset-0 bg-linear-to-r from-primary via-primary/40 to-transparent lg:via-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

          {/* Floating Discount Tag */}
          <div className="absolute top-4 right-4 bg-accent text-text font-black px-3 py-1.5 rounded-xl shadow-xl border-2 border-white text-center transform rotate-3">
            <div className="text-[10px] font-black leading-none">FLAT</div>
            <div className="text-sm font-black leading-tight">₹100 OFF</div>
            <div className="text-[8px] font-bold uppercase tracking-wider text-text/80">ON ₹799+</div>
          </div>

          {/* Bottom Overlay Combo Badge */}
          <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-black/65 backdrop-blur-md border border-white/20 text-white flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider">Super Saver Combo</div>
              <div className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                Monthly Pantry & Fresh Essentials Pack
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] text-gray-300 line-through">₹799</div>
              <div className="text-xs font-black text-accent">₹499</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
