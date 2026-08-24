import React from 'react';

export default function OtpStep({
  phone,
  otp,
  onOtpChange,
  countdown,
  canResend,
  loading,
  onResendOtp,
  onSubmit,
  onGoBack,
}) {
  const isOtpComplete = otp.trim().length === 6;

  return (
    <form onSubmit={onSubmit} className="space-y-5" data-testid="screen-3-otp">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary text-2xl">
          ✉️
        </div>
        <h2 className="text-2xl font-bold text-text">Verify Mobile Number</h2>
        <p className="text-sm font-medium text-text mt-1">
          OTP Sent via SMS to <span className="font-bold text-primary">+91 {phone}</span>
        </p>
      </div>

      <div>
        <label
          htmlFor="otp-input"
          className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center"
        >
          Enter 6-Digit OTP
        </label>
        <input
          id="otp-input"
          type="text"
          inputMode="numeric"
          autoFocus
          maxLength={6}
          value={otp}
          onChange={onOtpChange}
          placeholder="••••••"
          className="w-full text-center px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-bg text-text text-2xl font-bold tracking-[0.5em] transition-all"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
        <span>Didn't receive the code?</span>
        {canResend ? (
          <button
            type="button"
            onClick={onResendOtp}
            disabled={loading}
            data-testid="resend-otp-btn"
            className="font-bold text-primary hover:underline cursor-pointer transition-colors"
          >
            Resend via SMS
          </button>
        ) : (
          <span className="font-medium text-gray-400 select-none">
            Resend via SMS in <span className="font-bold text-text">{countdown}s</span>
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={!isOtpComplete || loading}
        data-testid="verify-otp-btn"
        className={`w-full py-3 px-4 font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
          isOtpComplete && !loading
            ? 'bg-primary text-white hover:opacity-95 shadow-md shadow-primary/20 cursor-pointer active:scale-[0.99]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Verifying OTP...
          </>
        ) : (
          'Verify OTP'
        )}
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onGoBack}
          data-testid="screen3-goback"
          className="text-xs font-semibold text-gray-500 hover:text-text transition-colors cursor-pointer inline-flex items-center gap-1"
        >
          ← Go Back
        </button>
      </div>
    </form>
  );
}
