import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import api from '../services/api';
import EmptyState from '../components/molecules/EmptyState';
import AccountSidebar from '../components/account/AccountSidebar';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 6 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = async (page = 1, status = '') => {
    setLoading(true);
    try {
      const params = { page, limit: 6 };
      if (status) params.status = status;

      const res = await api.get('/orders', { params });
      if (res.data.success) {
        setOrders(res.data.data.orders || []);
        setPagination(res.data.data.pagination || { total: 0, page: 1, pages: 1, limit: 6 });
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, statusFilter);
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'cancelled':
        return 'bg-error/10 text-error border-error/20';
      case 'preparing':
      case 'ready_for_pickup':
      case 'out_for_delivery':
        return 'bg-info/10 text-info border-info/20';
      default:
        return 'bg-accent/10 text-accent border-accent/20';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    { label: 'All Orders', value: '' },
    { label: 'Placed', value: 'placed' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Preparing', value: 'preparing' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      <AccountSidebar />

      <main className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">My Orders</h1>
            <p className="text-sm text-gray-500">Track current status and review order history</p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity w-fit"
          >
            + New Order
          </Link>
        </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === tab.value
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-gray-500 hover:bg-bg border border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          illustration="📦"
          heading="You do not have any previous orders"
          subtext="Browse from our wide variety of products & exciting offers"
          ctaLabel="START SHOPPING"
          onCtaClick={() => navigate('/shop')}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block bg-white rounded-2xl border border-border p-5 shadow-xs hover:border-primary/50 transition-colors space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                <div>
                  <div className="text-xs text-gray-500">Order ID</div>
                  <div className="font-mono font-bold text-sm text-text">{order._id}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Placed On</div>
                  <div className="text-xs font-medium text-text">{formatDate(order.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Fulfillment</div>
                  <span className="text-xs font-semibold uppercase text-primary">
                    {order.fulfillmentType === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
                  </span>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full border uppercase ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                {order.items?.length || 0} item(s) &bull;{' '}
                {order.items?.map((i) => i.productId?.name || 'Item').slice(0, 3).join(', ')}
                {order.items?.length > 3 ? '...' : ''}
              </div>

              <div className="flex justify-between items-center pt-2 text-xs">
                <span className="text-primary font-bold hover:underline">
                  View Timeline & Details &rarr;
                </span>
                <span className="text-base font-bold text-primary">
                  ₹{order.totalAmount?.toFixed(2)}
                </span>
              </div>
            </Link>
          ))}

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchOrders(pagination.page - 1, statusFilter)}
                className="px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-semibold text-text disabled:opacity-40 cursor-pointer"
              >
                &larr; Previous
              </button>
              <span className="text-xs text-gray-500 px-2">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchOrders(pagination.page + 1, statusFilter)}
                className="px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-semibold text-text disabled:opacity-40 cursor-pointer"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      )}
      </main>
    </div>
  );
}
