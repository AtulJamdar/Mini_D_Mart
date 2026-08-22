import React, { useState } from 'react';
import api from '../services/api';

export default function ReturnRequestModal({ orderId, item, onClose, onSuccess }) {
  const [type, setType] = useState('return');
  const [reason, setReason] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reason.trim()) {
      setErrorMsg('Please describe the reason for your request.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        orderId,
        itemId: item.productId?._id || item.productId || item._id,
        type,
        reason: reason.trim(),
        evidenceUrls: photoUrl.trim() ? [photoUrl.trim()] : [],
      };

      const res = await api.post('/returns', payload);
      if (res.data.success) {
        onSuccess(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit return request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-border space-y-4">
        <div className="flex justify-between items-start border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold text-text">Request Return or Exchange</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Item: <span className="font-semibold text-text">{item.productId?.name || 'Product'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-text text-xl font-bold p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Resolution Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('return')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  type === 'return'
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                    : 'border-border bg-bg text-gray-500'
                }`}
              >
                <div className="font-bold text-sm">💵 Return & Refund</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Restock item and issue credit</div>
              </button>

              <button
                type="button"
                onClick={() => setType('exchange')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  type === 'exchange'
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                    : 'border-border bg-bg text-gray-500'
                }`}
              >
                <div className="font-bold text-sm">🔄 Exchange Item</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Receive replacement unit</div>
              </button>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Reason for Return / Exchange
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Damaged packaging, wrong item delivered, or quality issue..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Photo Evidence Placeholder */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Evidence Photo URL (Optional)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:border-primary"
            />
            <p className="text-[11px] text-gray-500 mt-1">Provide a picture of damaged/incorrect item for faster approval.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-gray-500 text-xs font-semibold rounded-xl hover:bg-bg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
