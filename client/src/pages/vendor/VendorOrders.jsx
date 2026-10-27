import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import Table from '../../components/Table';

// Status transitions allowed for vendors
const NEXT_STATUS = { 'Pending Delivery': 'Shipped', Shipped: 'Delivered' };

const VendorOrders = () => {
  const [orders, setOrders]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [updating, setUpdating] = useState(null); // order id being updated

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 10 });
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/orders?${params}`)
      .then(({ data }) => {
        setOrders(data.data);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchOrders, [page, statusFilter]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Move order to "${newStatus}"?`)) return;
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const columns = [
    { key: 'createdAt', label: 'Date',    render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'manager',   label: 'Manager', render: (r) => r.manager?.name || '—' },
    { key: 'total',     label: 'Total',   render: (r) => `Rs ${r.totalCost.toFixed(2)}` },
    { key: 'items',     label: 'Items',   render: (r) => `${r.items.length} item(s)` },
    { key: 'status',    label: 'Status',  render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => {
        const next = NEXT_STATUS[r.status];
        return (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/vendor/orders/${r._id}`} className="btn btn-ghost btn-sm">View</Link>
            {next && (
              <button
                className="btn btn-primary btn-sm"
                disabled={updating === r._id}
                onClick={() => handleStatusUpdate(r._id, next)}
              >
                {updating === r._id ? '…' : `→ ${next}`}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Incoming Orders</h1>
        <p className="page-subtitle">Manage orders from your buyers · {total} total</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

      {/* Status filter */}
      <div className="toolbar">
        <select
          className="form-select"
          style={{ maxWidth: 200 }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {['Pending Delivery', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? <Spinner /> : (
        <>
          <Table columns={columns} data={orders} emptyMessage="No orders yet." />
          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VendorOrders;
