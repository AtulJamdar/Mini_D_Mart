import React, { useState } from 'react';
import { Link } from 'react-router';
import api from '../services/api';

export default function OrderQueueList({ orders = [], onStatusUpdated, groupBySlot = false }) {
  const [loadingId, setLoadingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdvanceStatus = async (orderId, targetStatus) => {
    setLoadingId(orderId);
    setErrorMsg('');
    try {
      const res = await api.patch(`/orders/${orderId}/status`, {
        status: targetStatus,
        note: `Fast-tracked via Operations Dashboard to ${targetStatus}`,
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

  const getNextAction = (order) => {
    const isPickup = order.fulfillmentType === 'pickup';
    switch (order.status) {
      case 'placed':
        return { target: 'confirmed', label: 'Confirm', color: 'bg-primary' };
      case 'confirmed':
        return { target: 'preparing', label: 'Start Prep', color: 'bg-info' };
      case 'preparing':
        return isPickup
          ? { target: 'ready_for_pickup', label: 'Mark Ready', color: 'bg-accent' }
          : { target: 'out_for_delivery', label: 'Dispatch', color: 'bg-accent' };
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
      <div className="p-8 text-center bg-white rounded-2xl border border-border">
        <p className="text-xs text-gray-500">No active orders in this queue.</p>
      </div>
    );
  }

  // Render individual order row
  const renderOrderRow = (order) => {
    const action = getNextAction(order);
    const isProcessing = loadingId === order._id;

    return (
      <div
        key={order._id}
        className="bg-white rounded-xl border border-border p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to={`/orders/${order._id}`} className="font-mono font-bold text-xs text-primary hover:underline">
              #{order._id.slice(-6)}
            </Link>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-bg text-gray-600 border border-border">
              {order.status.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-gray-400">
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="text-xs text-text font-medium">
            {order.items?.map((i) => `${i.qty}× ${i.productId?.name || 'Item'}`).join(', ')}
          </div>

          <div className="text-[11px] text-gray-500">
            {order.fulfillmentType === 'pickup' ? (
              <span>Pickup Slot: <strong>{formatSlotTime(order.pickupSlotId)}</strong></span>
            ) : (
              <span>Delivery to: <strong>{order.address?.street}, {order.address?.city}</strong></span>
            )}
            <span className="ml-2 font-bold text-text">&bull; ₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {action && (
            <button
              disabled={isProcessing}
              onClick={() => handleAdvanceStatus(order._id, action.target)}
              className={`px-3.5 py-1.5 ${action.color} text-white font-bold text-xs rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-xs flex items-center gap-1.5`}
            >
              {isProcessing ? 'Updating...' : `${action.label} \u2192`}
            </button>
          )}
          <Link
            to={`/orders/${order._id}`}
            className="p-1.5 rounded-lg border border-border text-gray-500 hover:text-text text-xs"
            title="View Details"
          >
            &#128065;
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
            <div className="flex items-center justify-between bg-bg px-3 py-1.5 rounded-lg border border-border/80">
              <span className="text-xs font-bold text-text">Time Slot: {slotTime}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
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
