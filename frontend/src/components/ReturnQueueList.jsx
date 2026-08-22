import React, { useState } from 'react';
import api from '../services/api';

export default function ReturnQueueList({
  requests = [],
  allowActions = false,
  onUpdated,
}) {
  const [loadingId, setLoadingId] = useState(null);
  const [msg, setMsg] = useState({ text: '', isError: false });

  const handleApprove = async (id, type) => {
    const actionDesc = type === 'return' ? 'restock product and approve refund' : 'create replacement exchange order';
    if (!window.confirm(`Approve this ${type} request? This will ${actionDesc}.`)) return;

    setLoadingId(id);
    setMsg({ text: '', isError: false });
    try {
      const res = await api.patch(`/returns/${id}/approve`);
      if (res.data.success) {
        setMsg({
          text: `Approved! ${type === 'exchange' ? 'Replacement order generated.' : 'Inventory restocked.'}`,
          isError: false,
        });
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Approval failed', isError: true });
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please enter a rejection reason:');
    if (!reason || !reason.trim()) return;

    setLoadingId(id);
    setMsg({ text: '', isError: false });
    try {
      const res = await api.patch(`/returns/${id}/reject`, { reason });
      if (res.data.success) {
        setMsg({ text: 'Request rejected.', isError: false });
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Rejection failed', isError: true });
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-border">
        <p className="text-xs text-gray-500">No return or exchange requests in this queue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {msg.text && (
        <div
          className={`p-3 rounded-xl text-xs font-medium ${
            msg.isError ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
          }`}
        >
          {msg.text}
        </div>
      )}

      {requests.map((req) => {
        const isProcessing = loadingId === req._id;
        const isPending = req.status === 'requested';

        return (
          <div
            key={req._id}
            className="bg-white rounded-xl border border-border p-4 shadow-xs space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-text">#{req._id.slice(-6)}</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    req.type === 'exchange' ? 'bg-info/10 text-info' : 'bg-accent/10 text-accent'
                  }`}
                >
                  {req.type === 'exchange' ? 'Exchange' : 'Return'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    req.status === 'approved'
                      ? 'bg-primary/10 text-primary'
                      : req.status === 'rejected'
                      ? 'bg-error/10 text-error'
                      : 'bg-accent/10 text-accent'
                  }`}
                >
                  {req.status}
                </span>
              </div>
              <div className="text-gray-500">
                Customer: <strong>{req.orderId?.userId?.name || 'Customer'}</strong>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <div>
                <div className="font-semibold text-text">{req.itemId?.name || 'Product'}</div>
                <div className="text-gray-500 italic mt-0.5">Reason: "{req.reason}"</div>
              </div>
              {req.evidenceUrls?.[0] && (
                <a
                  href={req.evidenceUrls[0]}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-semibold hover:underline text-[11px]"
                >
                  View Photo &rarr;
                </a>
              )}
            </div>

            {allowActions && isPending && (
              <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
                <button
                  disabled={isProcessing}
                  onClick={() => handleReject(req._id)}
                  className="px-3 py-1.5 border border-error/30 text-error text-xs font-bold rounded-lg hover:bg-error/10 cursor-pointer disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => handleApprove(req._id, req.type)}
                  className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : `Approve ${req.type === 'exchange' ? 'Exchange' : 'Return'}`}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
