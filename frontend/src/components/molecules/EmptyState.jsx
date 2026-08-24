import React from 'react';

/**
 * Reusable EmptyState molecule component.
 *
 * @param {React.ReactNode|string} [illustration] - Custom SVG, image element, URL, or emoji illustration.
 * @param {string} heading - Primary bold header text.
 * @param {string} [subtext] - Secondary lighter gray description text.
 * @param {string} [ctaLabel] - Optional text for the primary CTA button.
 * @param {Function} [onCtaClick] - Optional callback triggered on CTA button click.
 * @param {string} [className] - Optional container CSS class overrides.
 */
export default function EmptyState({
  illustration,
  heading,
  subtext,
  ctaLabel,
  onCtaClick,
  className = '',
}) {
  const renderIllustration = () => {
    if (!illustration) {
      return (
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
      );
    }

    if (React.isValidElement(illustration)) {
      return <div className="flex justify-center mb-4">{illustration}</div>;
    }

    if (typeof illustration === 'string' && (illustration.startsWith('http') || illustration.startsWith('/') || illustration.endsWith('.svg') || illustration.endsWith('.png'))) {
      return (
        <div className="flex justify-center mb-4">
          <img src={illustration} alt={heading} className="w-28 h-28 object-contain" />
        </div>
      );
    }

    return (
      <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner">
        {illustration}
      </div>
    );
  };

  return (
    <div
      data-testid="empty-state"
      className={`p-8 sm:p-10 text-center bg-white rounded-2xl border border-border shadow-xs flex flex-col items-center justify-center ${className}`}
    >
      {renderIllustration()}
      <h3 className="text-lg sm:text-xl font-bold text-text tracking-tight">{heading}</h3>
      {subtext && (
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-1.5 leading-relaxed font-normal">
          {subtext}
        </p>
      )}
      {ctaLabel && (
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-6 px-6 py-2.5 bg-primary text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
