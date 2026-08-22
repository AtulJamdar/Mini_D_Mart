import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import ReturnRequestModal from '../components/ReturnRequestModal';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedReturnItem, setSelectedReturnItem] = useState(null);
  const [eligibilityMap, setEligibilityMap] = useState({});

  const isStaffOrAdmin = ['store_staff', 'store_manager', 'admin'].includes(user?.role);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
        if (res.data.data.status === 'completed') {
          checkItemsEligibility(res.data.data);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  const checkItemsEligibility = async (orderData) => {
    const newMap = {};
    for (const item of orderData.items) {
      const prodId = item.productId?._id || item.productId;
      try {
        const res = await api.get(`/returns/eligibility/${orderData._id}/${prodId}`);
        if (res.data.success) {
          newMap[prodId] = res.data.data;
        }
      } catch (err) {
        newMap[prodId] = { isEligible: false, reason: 'Eligibility check unavailable' };
      }
    }
    setEligibilityMap(newMap);
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await api.patch(`/orders/${id}/cancel`, { note: 'Customer cancellation' });
      if (res.data.success) {
        setSuccessMsg('Order cancelled. Inventory released.');
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
      const res = await api.patch(`/orders/${id}/status`, { status: nextStatus });
      if (res.data.success) {
        setSuccessMsg(`Status updated to ${nextStatus.toUpperCase()}`);
        setOrder(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isEligibleForCancel = order && ['placed', 'confirmed'].includes(order.status);

  const getNextStatusOptions = () => {
    if (!order) return [];
    const isPickup = order.fulfillmentType === 'pickup';
    switch (order.status) {
      case 'placed': return ['confirmed'];
      case 'confirmed': return ['preparing'];
      case 'preparing': return [isPickup ? 'ready_for_pickup' : 'out_for_delivery'];
      case 'ready_for_pickup':
      case 'out_for_delivery': return ['completed'];
      default: return [];
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
        <Link to="/orders" className="text-primary text-sm font-semibold hover:underline">&larr; All Orders</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <Link to="/orders" className="font-semibold text-gray-500 hover:text-text">&larr; Orders</Link>
            <span className="text-gray-500">/</span>
            <span className="font-mono font-bold text-text">{order._id}</span>
          </div>
          <h1 className="text-2xl font-bold text-text mt-1">Order Details</h1>
        </div>

        {isEligibleForCancel && (
          <button
            onClick={handleCancelOrder}
            disabled={actionLoading}
            className="px-4 py-2 bg-error/10 text-error hover:bg-error/20 border border-error/30 text-xs font-bold rounded-xl cursor-pointer"
          >
            Cancel Order
          </button>
        )}
      </div>

      {errorMsg && <div className="p-3 rounded-xl bg-error/10 text-error text-xs font-medium">{errorMsg}</div>}
      {successMsg && <div className="p-3 rounded-xl bg-primary/10 text-primary text-xs font-medium">{successMsg}</div>}

      <OrderStatusTimeline status={order.status} fulfillmentType={order.fulfillmentType} history={order.statusHistory} />

      {/* Staff Transition Actions */}
      {isStaffOrAdmin && getNextStatusOptions().length > 0 && (
        <div className="bg-info/5 border border-info/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-info uppercase">Staff Operations</span>
            <span className="text-xs text-gray-500 block">Advance order through state machine</span>
          </div>
          <div className="flex gap-2">
            {getNextStatusOptions().map((opt) => (
              <button
                key={opt}
                disabled={actionLoading}
                onClick={() => handleStatusTransition(opt)}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 cursor-pointer"
              >
                Mark {opt.replace(/_/g, ' ').toUpperCase()} &rarr;
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items and Return Triggers */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Fulfillment Details</h3>
            {order.fulfillmentType === 'pickup' ? (
              <div className="text-sm space-y-1">
                <div className="font-bold text-primary">🏪 Store Pickup: {order.storeId?.name}</div>
                {order.pickupSlotId && (
                  <div className="text-xs text-gray-500">
                    Slot: {formatTime(order.pickupSlotId.startTime)} – {formatTime(order.pickupSlotId.endTime)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm space-y-1">
                <div className="font-bold text-primary">🚚 Home Delivery</div>
                <div className="text-xs text-gray-500">{order.address?.street}, {order.address?.city}</div>
                <div className="text-xs font-semibold text-info">ETA: Within 30–45 mins of dispatch</div>
              </div>
            )}
          </div>

          {/* Ordered items with return eligibility */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Order Items</h3>
            <div className="divide-y divide-border">
              {order.items.map((item, idx) => {
                const prodId = item.productId?._id || item.productId;
                const eligibility = eligibilityMap[prodId];

                return (
                  <div key={idx} className="py-3 flex flex-wrap justify-between items-center gap-2 first:pt-0 last:pb-0">
                    <div>
                      <div className="font-semibold text-text text-sm">{item.productId?.name || 'Product'}</div>
                      <div className="text-xs text-gray-500">Qty: {item.qty} &bull; ₹{item.priceAtOrder.toFixed(2)} each</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-text text-sm">₹{(item.priceAtOrder * item.qty).toFixed(2)}</span>

                      {/* Return/Exchange button if order completed */}
                      {order.status === 'completed' && (
                        <div>
                          {eligibility?.isEligible ? (
                            <button
                              onClick={() => setSelectedReturnItem(item)}
                              className="px-3 py-1 bg-accent/10 hover:bg-accent/20 text-accent font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              title={`Eligible for return (${eligibility.timeRemainingHours}h remaining)`}
                            >
                              Return / Exchange
                            </button>
                          ) : (
                            <span
                              className="text-[10px] px-2 py-1 bg-gray-100 text-gray-500 rounded-lg cursor-help border border-border"
                              title={eligibility?.reason || 'Non-returnable or window expired'}
                            >
                              Non-Returnable ℹ️
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payment and Status History */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-2 text-xs">
            <h3 className="text-xs font-bold uppercase text-gray-500">Summary</h3>
            <div className="flex justify-between text-gray-500"><span>Total</span><span className="font-bold text-primary text-sm">₹{order.totalAmount.toFixed(2)}</span></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase text-gray-500">Audit History</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {order.statusHistory?.map((h, i) => (
                <div key={i} className="text-xs border-l-2 border-primary/40 pl-2.5 py-0.5">
                  <div className="font-bold text-text uppercase text-[10px]">{h.status}</div>
                  <div className="text-gray-500 text-[10px]">{new Date(h.timestamp).toLocaleTimeString()}</div>
                  {h.note && <div className="text-gray-500 text-[10px] italic">{h.note}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedReturnItem && (
        <ReturnRequestModal
          orderId={order._id}
          item={selectedReturnItem}
          onClose={() => setSelectedReturnItem(null)}
          onSuccess={() => {
            setSelectedReturnItem(null);
            setSuccessMsg('Return request submitted successfully.');
            fetchOrder();
          }}
        />
      )}
    </div>
  );
}
