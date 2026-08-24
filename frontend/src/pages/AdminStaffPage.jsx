import React, { useState, useEffect } from 'react';
import api from '../services/api';
import UserManagementTable from '../components/UserManagementTable';

export default function AdminStaffPage() {
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);

  const loadStores = async () => {
    setLoadingStores(true);
    try {
      const res = await api.get('/stores?all=true');
      if (res.data.success) {
        setStores(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load stores:', err.message);
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Staff & Store Workforce Management</h1>
          <p className="text-sm text-gray-500">
            Create staff accounts, assign branch stores, manage credentials, and monitor workforce status.
          </p>
        </div>
      </div>

      <UserManagementTable stores={stores} onUpdated={loadStores} />
    </div>
  );
}
