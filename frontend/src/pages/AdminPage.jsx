import React, { useState, useEffect } from 'react';
import api from '../services/api';
import InventoryTable from '../components/InventoryTable';
import UserManagementTable from '../components/UserManagementTable';
import StoreManagementTable from '../components/StoreManagementTable';
import CategoryManagementTable from '../components/CategoryManagementTable';
import AuditLogViewer from '../components/AuditLogViewer';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('stores');
  const [overview, setOverview] = useState(null);
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [overviewRes, storesRes, usersRes, catRes, prodRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/stores?all=true'),
        api.get('/admin/users'),
        api.get('/categories'),
        api.get('/products'),
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.data);
      if (storesRes.data.success) setStores(storesRes.data.data || []);
      if (usersRes.data.success) setUsers(usersRes.data.data.users || []);
      if (catRes.data.success) setCategories(catRes.data.data || []);
      if (prodRes.data.success) setProducts(prodRes.data.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Administrator Control Center</h1>
          <p className="text-sm text-gray-500">System-wide branch configuration, staff roles, master catalog, and audit logs.</p>
        </div>
        <button
          onClick={loadAdminData}
          className="px-3.5 py-1.5 border border-border bg-white text-xs font-semibold rounded-xl hover:bg-bg cursor-pointer"
        >
          &#8635; Refresh System Data
        </button>
      </div>

      {/* KPI Overview Widgets */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase text-gray-500">Total Revenue</div>
            <div className="text-xl font-bold text-primary mt-1">₹{overview.totalRevenue?.toFixed(2)}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase text-gray-500">Stores / Branches</div>
            <div className="text-xl font-bold text-text mt-1">{overview.storeCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase text-gray-500">Catalog Products</div>
            <div className="text-xl font-bold text-info mt-1">{overview.productCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase text-gray-500">Staff Accounts</div>
            <div className="text-xl font-bold text-accent mt-1">{overview.staffCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase text-gray-500">Customers</div>
            <div className="text-xl font-bold text-text mt-1">{overview.customerCount}</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-border pb-2">
        {[
          { id: 'stores', label: `🏪 Stores (${stores.length})` },
          { id: 'users', label: `👥 Staff & Accounts (${users.length})` },
          { id: 'categories', label: `🏷️ Categories (${categories.length})` },
          { id: 'inventory', label: `📦 Global Inventory (${products.length})` },
          { id: 'audit', label: `🛡️ Security & Audit Logs` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === tab.id
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
      ) : (
        <div>
          {activeTab === 'stores' && (
            <StoreManagementTable stores={stores} onUpdated={loadAdminData} />
          )}

          {activeTab === 'users' && (
            <UserManagementTable users={users} stores={stores} onUpdated={loadAdminData} />
          )}

          {activeTab === 'categories' && (
            <CategoryManagementTable categories={categories} onUpdated={loadAdminData} />
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-text">Global Product Catalog & Cross-Store Inventory</h2>
              <InventoryTable products={products} allowEdit={true} onStockUpdated={loadAdminData} />
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-text">System Audit Logs & Security History</h2>
              <AuditLogViewer />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
