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
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [overviewRes, storesRes, catRes, prodRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/stores?all=true'),
        api.get('/categories'),
        api.get('/products'),
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.data);
      if (storesRes.data.success) setStores(storesRes.data.data || []);
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            Administrator Control Center
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            System-wide branch configuration, staff roles, master catalog taxonomy, and audit security logs.
          </p>
        </div>
        <button
          onClick={loadAdminData}
          className="px-4 py-2 border border-border bg-white text-xs font-bold rounded-xl hover:bg-bg cursor-pointer shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5"
        >
          <span>&#8635;</span> Refresh System Data
        </button>
      </div>

      {/* KPI Overview Widgets */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase text-gray-500">Total Revenue</div>
            <div className="text-xl font-bold text-primary mt-1">₹{overview.totalRevenue?.toFixed(2)}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase text-gray-500">Retail Stores</div>
            <div className="text-xl font-bold text-text mt-1">{overview.storeCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase text-gray-500">Catalog SKUs</div>
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
          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase text-gray-500">Audit Events</div>
            <div className="text-xl font-bold text-text mt-1">{overview.auditCount || 0}</div>
          </div>
        </div>
      )}

      {/* Tab Navigation Strip */}
      <div className="flex gap-2 text-xs border-b border-border pb-2 overflow-x-auto scrollbar-none whitespace-nowrap">
        {[
          { id: 'stores', label: `🏪 Retail Stores (${stores.length})` },
          { id: 'users', label: `👥 Staff & Accounts` },
          { id: 'categories', label: `🏷️ Product Categories (${categories.length})` },
          { id: 'inventory', label: `📦 Global Multi-Store Inventory (${products.length})` },
          { id: 'audit', label: `🛡️ Security & Audit Logs` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-bg border border-border'
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
          {/* Tab 1: Stores CRUD */}
          {activeTab === 'stores' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-text">Store Branch Infrastructure</h2>
                <p className="text-xs text-gray-500">Create new store locations, edit street addresses & geo coordinates, and toggle operating status.</p>
              </div>
              <StoreManagementTable stores={stores} onUpdated={loadAdminData} />
            </div>
          )}

          {/* Tab 2: Staff & Account Management */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-text">Staff & Manager Workforce Management</h2>
                <p className="text-xs text-gray-500">Provision manager/staff credentials, assign retail stores, and activate or suspend workforce members.</p>
              </div>
              <UserManagementTable stores={stores} onUpdated={loadAdminData} />
            </div>
          )}

          {/* Tab 3: Categories CRUD */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-text">Catalog Taxonomy & Categories</h2>
                <p className="text-xs text-gray-500">Manage product categories, organize merchandise taxonomy, and enable/disable departments.</p>
              </div>
              <CategoryManagementTable categories={categories} onUpdated={loadAdminData} />
            </div>
          )}

          {/* Tab 4: Global Inventory View across stores */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-text">Global Product Catalog & Cross-Store Inventory</h2>
                <p className="text-xs text-gray-500">Monitor stock levels across all branches, filter by specific store or category, and adjust inventory in real time.</p>
              </div>
              <InventoryTable
                products={products}
                stores={stores}
                categories={categories}
                allowEdit={true}
                onStockUpdated={loadAdminData}
                showStoreFilter={true}
              />
            </div>
          )}

          {/* Tab 5: Audit Log Viewer */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-text">System Audit Logs & Security History</h2>
                <p className="text-xs text-gray-500">Search and filter administrative and authentication events by actor, action type, resource, or date range.</p>
              </div>
              <AuditLogViewer />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
