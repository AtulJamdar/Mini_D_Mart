import React, { useState, useEffect } from 'react';
import api from '../services/api';
import OrderQueueList from '../components/OrderQueueList';
import ReturnQueueList from '../components/ReturnQueueList';

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState('pickup');
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const [ordersRes, returnsRes] = await Promise.all([
        api.get('/orders', { params: { limit: 50 } }),
        api.get('/returns', { params: { status: 'requested' } }),
      ]);

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data.orders || []);
      }
      if (returnsRes.data.success) {
        setReturns(returnsRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load staff data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, []);

  const pickupOrders = orders.filter(
    (o) => o.fulfillmentType === 'pickup' && o.status !== 'completed' && o.status !== 'cancelled'
  );

  const deliveryOrders = orders.filter(
    (o) => o.fulfillmentType === 'delivery' && o.status !== 'completed' && o.status !== 'cancelled'
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Staff Counter & POS</h1>
          <p className="text-sm text-gray-500">
            Fulfill store pickup slots, dispatch home deliveries, and inspect customer returns.
          </p>
        </div>
        <button
          onClick={loadStaffData}
          className="px-3.5 py-1.5 border border-border bg-white text-xs font-semibold rounded-xl hover:bg-bg cursor-pointer"
        >
          &#8635; Refresh Queues
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 text-xs border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('pickup')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'pickup'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-gray-500 hover:bg-bg border border-border'
          }`}
        >
          🏪 Pickup Orders by Slot ({pickupOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'delivery'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-gray-500 hover:bg-bg border border-border'
          }`}
        >
          🚚 Delivery Dispatch ({deliveryOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'returns'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-gray-500 hover:bg-bg border border-border'
          }`}
        >
          🔄 Pending Returns ({returns.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div>
          {activeTab === 'pickup' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-text">Today's Pickup Orders (Grouped by Slot)</h2>
              <OrderQueueList
                orders={pickupOrders}
                groupBySlot={true}
                onStatusUpdated={loadStaffData}
              />
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-text">Today's Home Delivery Queue</h2>
              <OrderQueueList
                orders={deliveryOrders}
                groupBySlot={false}
                onStatusUpdated={loadStaffData}
              />
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-text">Customer Returns & Exchanges Queue</h2>
              <ReturnQueueList
                requests={returns}
                allowActions={false}
                onUpdated={loadStaffData}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
