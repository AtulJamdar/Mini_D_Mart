import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function ManagerPage() {
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('requested');
  const [msg, setMsg] = useState({ text: '', isError: false });

  const fetchReturnRequests = async (status = statusFilter) => {
    setLoading(true);
    try {
      const res = await api.get('/returns', { params: { status: status || undefined } });
      if (res.data.success) {
        setReturnRequests(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load return requests:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnRequests(statusFilter);
  }, [statusFilter]);

  const handleApprove = async (id, type) => {
    const actionDesc = type === 'return' ? 'restock inventory and issue refund' : 'create replacement exchange order';
    if (!window.confirm(`Approve this ${type} request? This will ${actionDesc}.`)) return;

    setActionLoading(true);
    setMsg({ text: '', isError: false });
    try {
      const res = await api.patch(`/returns/${id}/approve`);
      if (res.data.success) {
        setMsg({ text: `Request approved successfully. ${type === 'exchange' ? 'Replacement order generated.' : 'Inventory restocked.'}`, isError: false });
        fetchReturnRequests(statusFilter);
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to approve request.', isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please enter a rejection reason for the customer:');
    if (!reason || !reason.trim()) return;

    setActionLoading(true);
    setMsg({ text: '', isError: false });
    try {
      const res = await api.patch(`/returns/${id}/reject`, { reason });
      if (res.data.success) {
        setMsg({ text: 'Return request rejected.', isError: false });
        fetchReturnRequests(statusFilter);
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to reject request.', isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Store Manager Portal</h1>
          <p className="text-sm text-gray-500">Review pending returns, exchanges, and audit store actions.</p>
        </div>
      </div>

      {msg.text && (
        <div className={`p-3.5 rounded-xl text-xs font-medium ${msg.isError ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
          {msg.text}
        </div>
      )}

      {/* Queue Filter Tabs */}
      <div className="flex gap-2 text-xs">
        {[
          { label: 'Pending Review', value: 'requested' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'All Requests', value: '' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === tab.value ? 'bg-primary text-white shadow-xs' : 'bg-white text-gray-500 hover:bg-bg border border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Returns Queue List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : returnRequests.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-border shadow-xs">
          <div className="text-3xl mb-2">🎉</div>
          <h3 className="font-bold text-text text-base">Queue Clean</h3>
          <p className="text-xs text-gray-500">No return or exchange requests matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returnRequests.map((req) => (
            <div key={req._id} className="bg-white rounded-2xl border border-border p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-xs">
                <div>
                  <span className="text-gray-500">Request ID:</span>{' '}
                  <span className="font-mono font-bold text-text">{req._id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Customer:</span>{' '}
                  <span className="font-semibold text-text">{req.orderId?.userId?.name || 'Customer'}</span> ({req.orderId?.userId?.email || 'N/A'})
                </div>
                <div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    req.type === 'exchange' ? 'bg-info/10 text-info' : 'bg-accent/10 text-accent'
                  }`}>
                    {req.type === 'exchange' ? '🔄 Exchange' : '💵 Return'}
                  </span>
                </div>
                <div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    req.status === 'approved' ? 'bg-primary/10 text-primary' : req.status === 'rejected' ? 'bg-error/10 text-error' : 'bg-accent/10 text-accent'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>

              {/* Product and Reason Information */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-lg bg-bg border border-border/50 flex-shrink-0 flex items-center justify-center text-xl overflow-hidden">
                    {req.itemId?.images?.[0] ? <img src={req.itemId.images[0]} alt="" className="w-full h-full object-cover" /> : '📦'}
                  </div>
                  <div>
                    <h4 className="font-bold text-text text-sm">{req.itemId?.name || 'Product'}</h4>
                    <p className="text-gray-500">Price: ₹{req.itemId?.price?.toFixed(2)} &bull; Current Stock: {req.itemId?.stock}</p>
                    <p className="text-text font-medium mt-1">Reason: <span className="text-gray-600 italic font-normal">"{req.reason}"</span></p>
                  </div>
                </div>

                {req.evidenceUrls?.length > 0 && (
                  <div className="sm:text-right">
                    <span className="text-gray-500 font-semibold block mb-1">Evidence Photo:</span>
                    <a href={req.evidenceUrls[0]} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">
                      View Photo &rarr;
                    </a>
                  </div>
                )}
              </div>

              {/* One-click Action Buttons (For Pending Requests) */}
              {req.status === 'requested' && (
                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleReject(req._id)}
                    className="px-4 py-2 border border-error/30 text-error hover:bg-error/10 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Reject Request
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove(req._id, req.type)}
                    className="px-5 py-2 bg-primary text-white hover:opacity-90 text-xs font-bold rounded-xl transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    Approve {req.type === 'exchange' ? 'Exchange & Replace' : 'Return & Restock'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
