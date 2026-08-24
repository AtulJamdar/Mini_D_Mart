import React, { useState } from 'react';
import { Link } from 'react-router';
import { Clock, MapPin, Package, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import EmptyState from './molecules/EmptyState';

export default function OrderQueueList({ orders = [], onStatusUpdated, groupBySlot = false }) {
  const [loadingId, setLoadingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdvanceStatus = async (orderId, targetStatus) => {
    setLoadingId(orderId);
    setErrorMsg('');
    try {
      const res = await api.patch(`/orders/${orderId}/status`, {
        status: targetStatus,
        note: `Fast-tracked via Operations Dashboard to ${targetStatus.toUpperCase()}`,
      });
      if (res.data.success && onStatusUpdated) {
        onStatusUpdated(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Status transition failed');
    } finally {
      setLoadingId(null);
    }
  };

  const formatSlotTime = (slot) => {
    if (!slot?.startTime) return 'Standard / Unscheduled';
    const s = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const e = new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${s} - ${e}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'placed':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ready_for_pickup':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextAction = (order) => {
    const isPickup = order.fulfillmentType === 'pickup';
    switch (order.status) {
      case 'placed':
        return { target: 'confirmed', label: 'Confirm Order', color: 'bg-primary' };
      case 'confirmed':
        return { target: 'preparing', label: 'Start Preparing', color: 'bg-info' };
      case 'preparing':
        return isPickup
          ? { target: 'ready_for_pickup', label: 'Mark Ready', color: 'bg-accent' }
          : { target: 'out_for_delivery', label: 'Dispatch for Delivery', color: 'bg-accent' };
      case 'ready_for_pickup':
        return { target: 'completed', label: 'Mark Picked Up', color: 'bg-primary' };
      case 'out_for_delivery':
        return { target: 'completed', label: 'Mark Delivered', color: 'bg-primary' };
      default:
        return null;
    }
  };

  if (orders.length === 0) {
    return (
      <EmptyState
        illustration="📋"
        heading="No Active Orders"
        subtext="No active orders in this queue. Incoming customer orders will appear here automatically."
      />
    );
  }

  // Render individual order row
  const renderOrderRow = (order) => {
    const action = getNextAction(order);
    const isProcessing = loadingId === order._id;

    return (
      <div
        key={order._id}
        className="bg-white rounded-xl border border-border p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-colors"
      >
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/orders/${order._id}`} className="font-mono font-bold text-xs text-primary hover:underline">
              #{order._id.slice(-6).toUpperCase()}
            </Link>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${getStatusBadge(order.status)}`}>
              {order.status.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-gray-400">
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="text-xs text-text font-medium line-clamp-1">
            {order.items?.map((i) => `${i.qty}× ${i.productId?.name || 'Item'}`).join(', ')}
          </div>

          <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1">
            {order.fulfillmentType === 'pickup' ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                Slot: <strong className="text-text">{formatSlotTime(order.pickupSlotId)}</strong>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" />
                To: <strong className="text-text">{order.address?.street}, {order.address?.city}</strong>
              </span>
            )}
            <span className="font-bold text-primary">&bull; ₹{Number(order.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {action && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleAdvanceStatus(order._id, action.target)}
              className={`px-3.5 py-2 ${action.color} text-white font-bold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center gap-1.5`}
            >
              {isProcessing ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{action.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
          <Link
            to={`/orders/${order._id}`}
            className="p-2 rounded-xl border border-border text-gray-500 hover:text-primary hover:bg-bg transition-colors"
            title="View Order Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  };

  // Group by slot if requested
  if (groupBySlot) {
    const slotMap = new Map();
    orders.forEach((order) => {
      const slotKey = formatSlotTime(order.pickupSlotId);
      if (!slotMap.has(slotKey)) slotMap.set(slotKey, []);
      slotMap.get(slotKey).push(order);
    });

    return (
      <div className="space-y-6">
        {errorMsg && <div className="p-3 rounded-xl bg-error/10 text-error text-xs font-medium">{errorMsg}</div>}
        {Array.from(slotMap.entries()).map(([slotTime, slotOrders]) => (
          <div key={slotTime} className="space-y-2">
            <div className="flex items-center justify-between bg-bg px-3.5 py-2 rounded-xl border border-border">
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Pickup Slot: {slotTime}</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {slotOrders.length} Order(s)
              </span>
            </div>
            <div className="space-y-2">{slotOrders.map(renderOrderRow)}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {errorMsg && <div className="p-3 rounded-xl bg-error/10 text-error text-xs font-medium">{errorMsg}</div>}
      {orders.map(renderOrderRow)}
    </div>
  );
}
