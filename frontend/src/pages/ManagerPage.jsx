import React, { useState, useEffect } from 'react';
import api from '../services/api';
import InventoryTable from '../components/InventoryTable';
import OrderQueueList from '../components/OrderQueueList';
import ReturnQueueList from '../components/ReturnQueueList';

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [analytics, setAnalytics] = useState({
    todaySales: 0,
    activeOrdersCount: 0,
    lowStockCount: 0,
    pendingReturnsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadManagerData = async () => {
    setLoading(true);
    try {
      // 1. Load Stores to get primary store ID
      const storeRes = await api.get('/stores');
      const storeId = storeRes.data.data?.[0]?._id;

      const [prodRes, ordersRes, returnsRes, analyticsRes] = await Promise.all([
        api.get('/products'),
        api.get('/orders', { params: { limit: 50 } }),
        api.get('/returns'),
        storeId ? api.get(`/stores/${storeId}/analytics`) : Promise.resolve({ data: { success: false } }),
      ]);

      if (prodRes.data.success) setProducts(prodRes.data.data || []);
      if (ordersRes.data.success) setOrders(ordersRes.data.data.orders || []);
      if (returnsRes.data.success) setReturns(returnsRes.data.data || []);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
    } catch (err) {
      console.error('Failed to load manager data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagerData();
  }, []);

  const pickupOrders = orders.filter(
    (o) => o.fulfillmentType === 'pickup' && o.status !== 'completed' && o.status !== 'cancelled'
  );

  const deliveryOrders = orders.filter(
    (o) => o.fulfillmentType === 'delivery' && o.status !== 'completed' && o.status !== 'cancelled'
  );

  const pendingReturns = returns.filter((r) => r.status === 'requested');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Store Manager Portal</h1>
          <p className="text-sm text-gray-500">Live store metrics, inventory replenishment, and operations control.</p>
        </div>
        <button
          onClick={loadManagerData}
          className="px-3.5 py-1.5 border border-border bg-white text-xs font-semibold rounded-xl hover:bg-bg cursor-pointer"
        >
          &#8635; Refresh Dashboard
        </button>
      </div>

      {/* Store KPI Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <div className="text-[11px] font-bold uppercase text-gray-500">Today's Sales</div>
          <div className="text-2xl font-bold text-primary mt-1">₹{analytics.todaySales.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <div className="text-[11px] font-bold uppercase text-gray-500">Active Orders</div>
          <div className="text-2xl font-bold text-info mt-1">{analytics.activeOrdersCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <div className="text-[11px] font-bold uppercase text-gray-500">Low-Stock Alerts</div>
          <div className="text-2xl font-bold text-accent mt-1">{analytics.lowStockCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <div className="text-[11px] font-bold uppercase text-gray-500">Pending Returns</div>
          <div className="text-2xl font-bold text-error mt-1">{pendingReturns.length}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'inventory' ? 'bg-primary text-white shadow-xs' : 'bg-white text-gray-500 hover:bg-bg border border-border'
          }`}
        >
          📦 Inventory & Stock ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('pickup')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'pickup' ? 'bg-primary text-white shadow-xs' : 'bg-white text-gray-500 hover:bg-bg border border-border'
          }`}
        >
          🏪 Pickup Slots ({pickupOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'delivery' ? 'bg-primary text-white shadow-xs' : 'bg-white text-gray-500 hover:bg-bg border border-border'
          }`}
        >
          🚚 Deliveries ({deliveryOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'returns' ? 'bg-primary text-white shadow-xs' : 'bg-white text-gray-500 hover:bg-bg border border-border'
          }`}
        >
          🔄 Returns Queue ({pendingReturns.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div>
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-text">Store Inventory & Real-time Stock Editing</h2>
              <InventoryTable products={products} allowEdit={true} onStockUpdated={loadManagerData} />
            </div>
          )}

          {activeTab === 'pickup' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-text">Store Pickup Orders (Grouped by Slot)</h2>
              <OrderQueueList orders={pickupOrders} groupBySlot={true} onStatusUpdated={loadManagerData} />
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-text">Home Delivery Dispatch Queue</h2>
              <OrderQueueList orders={deliveryOrders} groupBySlot={false} onStatusUpdated={loadManagerData} />
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-text">Customer Returns & Exchanges Approval Queue</h2>
              <ReturnQueueList requests={returns} allowActions={true} onUpdated={loadManagerData} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
