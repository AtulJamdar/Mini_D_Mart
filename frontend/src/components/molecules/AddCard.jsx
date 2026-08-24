import React from 'react';
import { Plus } from 'lucide-react';

/**
 * Reusable AddCard molecule component with dashed border variant for adding items (e.g. addresses, payment methods).
 *
 * @param {string} [title='+ ADD NEW ADDRESS'] - Main button/action label.
 * @param {string} [subtitle] - Optional helper text below label.
 * @param {Function} [onClick] - Click handler when the card is pressed.
 * @param {React.ReactNode} [icon] - Custom icon or plus symbol.
 * @param {string} [className] - Optional custom className.
 */
export default function AddCard({
  title = '+ ADD NEW ADDRESS',
  subtitle,
  onClick,
  icon,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-6 border-2 border-dashed border-border hover:border-primary/60 bg-bg/40 hover:bg-primary/5 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-white group-hover:bg-primary/10 text-primary border border-border group-hover:border-primary/30 flex items-center justify-center mb-2.5 transition-colors shadow-2xs">
        {icon || <Plus className="w-5 h-5" strokeWidth={2.5} />}
      </div>
      <span className="text-xs sm:text-sm font-bold text-primary tracking-wide group-hover:underline">
        {title}
      </span>
      {subtitle && (
        <span className="text-[11px] text-gray-500 mt-1 max-w-xs">{subtitle}</span>
      )}
    </button>
  );
}
