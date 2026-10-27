import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [acting, setActing]   = useState(false);

  const fetchOrder = () => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load order.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchOrder, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order? Stock will be restored.')) return;
    setActing(true);
    try {
      await api.patch(`/orders/${id}/cancel`);
      fetchOrder();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel.');
    } finally {
      setActing(false);
    }
  };

  const NEXT_STATUS = { 'Pending Delivery': 'Shipped', Shipped: 'Delivered' };

  const handleStatusUpdate = async () => {
    const next = NEXT_STATUS[order.status];
    if (!next || !window.confirm(`Move to "${next}"?`)) return;
    setActing(true);
    try {
      await api.patch(`/orders/${id}/status`, { status: next });
      fetchOrder();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}>← Back</button>
      </div>
    );
  }

  const isManager = user.role === 'manager';
  const isVendor  = user.role === 'vendor';
  const canCancel = order.status === 'Pending Delivery';
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }} onClick={() => navigate(-1)}>← Back</button>

      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Order Details</h1>
            <p className="page-subtitle" style={{ fontFamily: 'monospace' }}>{order._id}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: '1.5rem' }}>
        {/* Order meta */}
        <div className="card">
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Info</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div><strong>Placed:</strong> {new Date(order.createdAt).toLocaleString()}</div>
            <div><strong>Vendor:</strong> {order.vendor?.companyName || order.vendor?.name}</div>
            <div><strong>Manager:</strong> {order.manager?.name} ({order.manager?.storeName || 'N/A'})</div>
            <div><strong>Total Cost:</strong> <span style={{ fontWeight: 800, color: 'var(--color-brand-dark)', fontSize: '1rem' }}>Rs {order.totalCost.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Actions */}
        <div className="card">
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isVendor && nextStatus && (
              <button className="btn btn-primary" disabled={acting} onClick={handleStatusUpdate}>
                {acting ? '…' : `→ Mark as ${nextStatus}`}
              </button>
            )}
            {canCancel && (
              <button className="btn btn-danger" disabled={acting} onClick={handleCancel}>
                {acting ? '…' : '✕ Cancel Order'}
              </button>
            )}
            {!canCancel && !nextStatus && (
              <div className="alert alert-info" style={{ fontSize: '0.8rem' }}>No further actions available for this order.</div>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="card">
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Items (price snapshot at order time)</h3>
        <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td>Rs {item.unitPrice.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td style={{ fontWeight: 600 }}>Rs {(item.unitPrice * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, borderTop: '2px solid #e2e8f0', paddingTop: '0.75rem' }}>Total</td>
                <td style={{ fontWeight: 800, color: 'var(--color-brand-dark)', borderTop: '2px solid #e2e8f0', paddingTop: '0.75rem' }}>
                  Rs {order.totalCost.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
