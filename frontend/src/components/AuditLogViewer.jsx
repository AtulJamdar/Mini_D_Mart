import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedMetadata, setSelectedMetadata] = useState(null);

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource = resourceFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

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
  }, [actionFilter, resourceFilter, fromDate, toDate]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  const handleApplyQuickDate = (preset) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === '7days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      setFromDate(past7.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === '30days') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      setFromDate(past30.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === 'all') {
      setFromDate('');
      setToDate('');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setActionFilter('');
    setResourceFilter('');
    setUserSearch('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('AUTH') || act.includes('LOGIN')) return 'bg-info/10 text-info border-info/20';
    if (act.includes('ORDER')) return 'bg-primary/10 text-primary border-primary/20';
    if (act.includes('RETURN')) return 'bg-accent/10 text-accent border-accent/20';
    if (act.includes('STORE')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (act.includes('CATEGORY')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (act.includes('PRODUCT') || act.includes('STOCK')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (act.includes('USER') || act.includes('STAFF')) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Client-side user filter refinement for populated userId name/email
  const filteredLogs = logs.filter((log) => {
    if (!userSearch) return true;
    const actorName = log.userId?.name || '';
    const actorEmail = log.userId?.email || '';
    const term = userSearch.toLowerCase();
    return actorName.toLowerCase().includes(term) || actorEmail.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-4">
      {/* Advanced Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* User Search */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
              Actor / User
            </label>
            <input
              type="text"
              placeholder="Search user name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:border-primary"
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
              Action Name
            </label>
            <input
              type="text"
              placeholder="e.g. LOGIN, STORE, ORDER..."
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:border-primary"
            />
          </div>

          {/* Resource Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
              Target Resource
            </label>
            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:border-primary font-medium"
            >
              <option value="">All Resource Domains</option>
              <option value="AUTH">AUTH (Login / Credentials)</option>
              <option value="USER">USER (Staff & Roles)</option>
              <option value="STORE">STORE (Branch CRUD)</option>
              <option value="CATEGORY">CATEGORY (Catalog Taxonomy)</option>
              <option value="PRODUCT">PRODUCT (Stock & Catalog)</option>
              <option value="ORDER">ORDER (Fulfillment)</option>
              <option value="RETURN_REQUEST">RETURN_REQUEST (Refunds)</option>
            </select>
          </div>

          {/* Date Range Controls */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
              Date Range (From &rarr; To)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-1/2 px-2 py-1 rounded-xl border border-border bg-bg text-[11px] text-text focus:outline-none focus:border-primary"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-1/2 px-2 py-1 rounded-xl border border-border bg-bg text-[11px] text-text focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Quick Date Presets & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-semibold mr-1">Quick Range:</span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Past 7 Days' },
              { id: '30days', label: 'Past 30 Days' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyQuickDate(preset.id)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-bg hover:bg-border text-gray-600 border border-border cursor-pointer transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {(actionFilter || resourceFilter || userSearch || fromDate || toDate) && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
            <span className="text-xs text-gray-500 font-bold">
              {pagination.total} Logged Events
            </span>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-border">
          <p className="text-xs text-gray-500">No security audit logs matching these filter criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="bg-bg border-b border-border text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor / User</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Resource & Target</th>
                  <th className="py-3 px-4">Metadata Payload</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => {
                  const actorRole = log.userId?.role;
                  return (
                    <tr key={log._id} className="hover:bg-bg/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {formatTime(log.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-text">
                          {log.userId?.name || 'System / Automated'}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {log.userId?.email || 'N/A'}
                        </div>
                        {actorRole && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-primary/10 text-primary">
                            {actorRole}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text">{log.resource}</div>
                        <div className="font-mono text-[10px] text-gray-400 truncate max-w-[140px]">
                          {log.resourceId || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-gray-500 max-w-xs truncate font-mono">
                        {log.metadata ? JSON.stringify(log.metadata) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedMetadata(log)}
                          className="px-2.5 py-1 bg-bg hover:bg-border text-text font-semibold text-xs rounded-lg border border-border cursor-pointer transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3.5 py-1.5 rounded-xl border border-border bg-white text-xs font-semibold text-text disabled:opacity-30 cursor-pointer hover:bg-bg transition-colors"
          >
            &larr; Previous
          </button>
          <span className="text-xs text-gray-500 font-medium px-2">
            Page <strong className="text-text">{page}</strong> of {pagination.pages}
          </span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage(page + 1)}
            className="px-3.5 py-1.5 rounded-xl border border-border bg-white text-xs font-semibold text-text disabled:opacity-30 cursor-pointer hover:bg-bg transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      )}

      {/* Metadata Detail Modal */}
      {selectedMetadata && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-text text-base">Audit Log Payload Inspector</h3>
                <span className="text-[11px] text-gray-400 font-mono">
                  Event: {selectedMetadata.action} &bull; ID: {selectedMetadata._id}
                </span>
              </div>
              <button
                onClick={() => setSelectedMetadata(null)}
                className="text-gray-400 hover:text-text font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-bg rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Actor</span>
                  <span className="font-semibold text-text">
                    {selectedMetadata.userId?.name || 'System / Guest'}
                  </span>
                  <span className="text-gray-500 block text-[11px]">
                    {selectedMetadata.userId?.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Timestamp</span>
                  <span className="font-semibold text-text font-mono">
                    {formatTime(selectedMetadata.createdAt)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">
                  Raw JSON Metadata Payload
                </label>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
                  {JSON.stringify(selectedMetadata.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedMetadata(null)}
                className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs cursor-pointer hover:opacity-90 transition-opacity"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
