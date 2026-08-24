import React from 'react';

export default function NameStep({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  onSubmit,
  onGoBack,
}) {
  const isFormValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-5" data-testid="screen-2-name">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-accent text-2xl">
          👋
        </div>
        <h2 className="text-2xl font-bold text-text">Help Us Know You Better</h2>
        <p className="text-sm text-gray-500 mt-1">
          Please share your name to create your Mini D-Mart account
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="first-name-input"
            className="block text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            First Name
          </label>
          {!firstName.trim() && (
            <span
              data-testid="firstname-required-chip"
              className="bg-error/10 text-error text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            >
              Required
            </span>
          )}
        </div>
        <input
          id="first-name-input"
          type="text"
          autoFocus
          value={firstName}
          onChange={onFirstNameChange}
          placeholder="e.g. Ramesh"
          className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-bg text-text text-sm transition-all"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="last-name-input"
            className="block text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            Last Name
          </label>
          {!lastName.trim() && (
            <span
              data-testid="lastname-required-chip"
              className="bg-error/10 text-error text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            >
              Required
            </span>
          )}
        </div>
        <input
          id="last-name-input"
          type="text"
          value={lastName}
          onChange={onLastNameChange}
          placeholder="e.g. Sharma"
          className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-bg text-text text-sm transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={!isFormValid}
        data-testid="save-continue-btn"
        className={`w-full py-3 px-4 font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
          isFormValid
            ? 'bg-primary text-white hover:opacity-95 shadow-md shadow-primary/20 cursor-pointer active:scale-[0.99]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Save and Continue
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onGoBack}
          data-testid="screen2-goback"
          className="text-xs font-semibold text-gray-500 hover:text-text transition-colors cursor-pointer inline-flex items-center gap-1"
        >
          ← Go Back
        </button>
      </div>
    </form>
  );
}
