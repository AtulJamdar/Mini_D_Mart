import React from 'react';

export default function PhoneStep({
  phone,
  onPhoneChange,
  onSubmit,
  isPhoneValid,
  loading,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5" data-testid="screen-1-phone">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary text-2xl">
          📱
        </div>
        <h2 className="text-2xl font-bold text-text">Customer Login / Sign Up</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter your mobile number to get an instant login OTP
        </p>
      </div>

      <div>
        <label
          htmlFor="phone-input"
          className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
        >
          Mobile Number
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md text-sm font-semibold text-text border border-border pointer-events-none select-none">
            <span>🇮🇳</span>
            <span>+91</span>
          </div>
          <input
            id="phone-input"
            type="tel"
            inputMode="numeric"
            autoFocus
            value={phone}
            onChange={onPhoneChange}
            placeholder="9876543210"
            maxLength={10}
            className="w-full pl-22 pr-4 py-3 rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-bg text-text text-base font-medium tracking-wide transition-all"
          />
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 pl-1">
          {phone.length}/10 digits entered
        </p>
      </div>

      <button
        type="submit"
        disabled={!isPhoneValid || loading}
        data-testid="continue-btn"
        className={`w-full py-3 px-4 font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
          isPhoneValid && !loading
            ? 'bg-primary text-white hover:opacity-95 shadow-md shadow-primary/20 cursor-pointer active:scale-[0.99]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Sending OTP...
          </>
        ) : (
          'Continue'
        )}
      </button>
    </form>
  );
}
