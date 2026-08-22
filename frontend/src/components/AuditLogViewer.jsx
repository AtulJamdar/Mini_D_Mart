import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource = resourceFilter;

      const res = await api.get('/admin/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data.logs || []);
        setPagination(res.data.data.pagination || { total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [actionFilter, resourceFilter, page]);

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action) => {
    if (action.includes('AUTH')) return 'bg-info/10 text-info';
    if (action.includes('ORDER')) return 'bg-primary/10 text-primary';
    if (action.includes('RETURN')) return 'bg-accent/10 text-accent';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Filter action (e.g. LOGIN, ORDER)..."
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-border bg-white text-xs text-text focus:outline-none focus:border-primary"
          />
          <select
            value={resourceFilter}
            onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-border bg-white text-xs text-text focus:outline-none focus:border-primary"
          >
            <option value="">All Resources</option>
            <option value="AUTH">AUTH</option>
            <option value="ORDER">ORDER</option>
            <option value="RETURN_REQUEST">RETURN_REQUEST</option>
            <option value="USER">USER</option>
          </select>
        </div>

        <span className="text-xs text-gray-500 font-semibold">
          {pagination.total} Logged Events
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-border">
          <p className="text-xs text-gray-500">No audit logs matching this criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg border-b border-border text-gray-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource ID</th>
                <th className="py-3 px-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-bg/40">
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                    {formatTime(log.createdAt)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-text">
                    {log.userId?.name || log.userId?.email || 'System / Guest'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-600">
                    {log.resourceId || '—'}
                  </td>
                  <td className="py-3 px-4 text-[11px] text-gray-500 max-w-xs truncate">
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-semibold text-text disabled:opacity-40 cursor-pointer"
          >
            &larr; Prev
          </button>
          <span className="text-xs text-gray-500">Page {page} of {pagination.pages}</span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-semibold text-text disabled:opacity-40 cursor-pointer"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
