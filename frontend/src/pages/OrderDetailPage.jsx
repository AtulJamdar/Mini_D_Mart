import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import OrderStatusTimeline from '../components/OrderStatusTimeline';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isStaffOrAdmin = ['store_staff', 'store_manager', 'admin'].includes(user?.role);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await api.patch(`/orders/${id}/cancel`, {
        note: 'Customer requested cancellation',
      });
      if (res.data.success) {
        setSuccessMsg('Order cancelled successfully.');
        setOrder(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusTransition = async (nextStatus) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await api.patch(`/orders/${id}/status`, {
        status: nextStatus,
        note: `Updated to ${nextStatus} via Staff dashboard`,
      });
      if (res.data.success) {
        setSuccessMsg(`Status updated to ${nextStatus.toUpperCase()}`);
        setOrder(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to transition status.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isEligibleForCancel = order && ['placed', 'confirmed'].includes(order.status);

  // Determine valid next staff status options
  const getNextStatusOptions = () => {
    if (!order) return [];
    const isPickup = order.fulfillmentType === 'pickup';
    switch (order.status) {
      case 'placed':
        return ['confirmed'];
      case 'confirmed':
        return ['preparing'];
      case 'preparing':
        return [isPickup ? 'ready_for_pickup' : 'out_for_delivery'];
      case 'ready_for_pickup':
      case 'out_for_delivery':
        return ['completed'];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-border text-center">
        <h2 className="text-xl font-bold text-text mb-2">Order Not Found</h2>
        <p className="text-xs text-gray-500 mb-4">{errorMsg || 'Unable to retrieve order details.'}</p>
        <Link to="/orders" className="text-primary text-sm font-semibold hover:underline">
          &larr; Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/orders" className="text-xs font-semibold text-gray-500 hover:text-text">
              &larr; All Orders
            </Link>
            <span className="text-gray-500">/</span>
            <span className="text-xs font-mono font-bold text-text">{order._id}</span>
          </div>
          <h1 className="text-2xl font-bold text-text mt-1">Order Details</h1>
        </div>

        {isEligibleForCancel && (
          <button
            onClick={handleCancelOrder}
            disabled={actionLoading}
            className="px-4 py-2 bg-error/10 text-error hover:bg-error/20 border border-error/30 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
          {successMsg}
        </div>
      )}

      {/* Visual Status Timeline */}
      <OrderStatusTimeline
        status={order.status}
        fulfillmentType={order.fulfillmentType}
        history={order.statusHistory}
      />

      {/* Staff Action Controls */}
      {isStaffOrAdmin && getNextStatusOptions().length > 0 && (
        <div className="bg-info/5 border border-info/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-info uppercase tracking-wider block">Staff Operations</span>
            <span className="text-xs text-gray-500">Advance order through state machine</span>
          </div>
          <div className="flex gap-2">
            {getNextStatusOptions().map((opt) => (
              <button
                key={opt}
                disabled={actionLoading}
                onClick={() => handleStatusTransition(opt)}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                Advance to {opt.replace(/_/g, ' ').toUpperCase()} &rarr;
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items & Fulfillment info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fulfillment Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Fulfillment Information
            </h3>
            {order.fulfillmentType === 'pickup' ? (
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 font-bold text-primary">
                  <span>🏪 Store Pickup</span>
                </div>
                <div className="text-text font-medium">{order.storeId?.name || 'Mini D-Mart Store'}</div>
                <div className="text-xs text-gray-500">{order.storeId?.address?.street}, {order.storeId?.address?.city}</div>
                {order.pickupSlotId && (
                  <div className="mt-2 p-2.5 bg-bg rounded-xl border border-border text-xs flex justify-between">
                    <span className="text-gray-500">Pickup Slot Window:</span>
                    <span className="font-bold text-text">
                      {formatTime(order.pickupSlotId.startTime)} – {formatTime(order.pickupSlotId.endTime)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 font-bold text-primary">
                  <span>🚚 Home Delivery</span>
                </div>
                <div className="text-text font-medium">
                  {order.address?.street}, {order.address?.city} ({order.address?.pincode})
                </div>
                <div className="mt-2 p-2.5 bg-bg rounded-xl border border-border text-xs flex justify-between">
                  <span className="text-gray-500">Estimated Delivery:</span>
                  <span className="font-bold text-info">Within 30–45 mins of dispatch</span>
                </div>
              </div>
            )}
          </div>

          {/* Ordered Items */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Items in this Order ({order.items.length})
            </h3>
            <div className="divide-y divide-border">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-sm first:pt-0 last:pb-0">
                  <div>
                    <div className="font-semibold text-text">{item.productId?.name || 'Product'}</div>
                    <div className="text-xs text-gray-500">
                      Qty: {item.qty} × ₹{item.priceAtOrder.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-bold text-text">
                    ₹{(item.priceAtOrder * item.qty).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Payment Summary & Status History */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Payment Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Items Subtotal</span>
                <span className="font-medium text-text">₹{(order.totalAmount / 1.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>GST (5%)</span>
                <span className="font-medium text-text">₹{(order.totalAmount - order.totalAmount / 1.05).toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-bold text-text">
                <span>Total Paid</span>
                <span className="text-primary text-base font-bold">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status History Audit Trail */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Status History Log</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {order.statusHistory?.map((h, idx) => (
                <div key={idx} className="text-xs border-l-2 border-primary/30 pl-3 py-0.5 space-y-0.5">
                  <div className="font-bold text-text uppercase text-[11px]">{h.status.replace(/_/g, ' ')}</div>
                  <div className="text-gray-500 text-[10px]">{new Date(h.timestamp).toLocaleString()}</div>
                  {h.note && <div className="text-gray-500 italic text-[11px]">{h.note}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
