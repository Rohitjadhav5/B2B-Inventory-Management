import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch(() => setError('Failed to load dashboard stats.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const statuses = ['Pending Delivery', 'Shipped', 'Delivered', 'Cancelled'];
  const totalOrders = statuses.reduce((sum, s) => sum + (stats?.ordersByStatus?.[s] ?? 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user.name} 👋</h1>
        <p className="page-subtitle">{user.storeName || 'Manager Dashboard'} · Procurement overview</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon indigo">📋</div>
              <div className="stat-body">
                <div className="stat-label">Total Orders</div>
                <div className="stat-value">{totalOrders}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">🚚</div>
              <div className="stat-body">
                <div className="stat-label">Pending Delivery</div>
                <div className="stat-value">{stats.ordersByStatus?.['Pending Delivery'] ?? 0}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">✅</div>
              <div className="stat-body">
                <div className="stat-label">Delivered</div>
                <div className="stat-value">{stats.ordersByStatus?.['Delivered'] ?? 0}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">💸</div>
              <div className="stat-body">
                <div className="stat-label">Total Spend</div>
                <div className="stat-value">Rs {stats.totalSpend?.toFixed(2) ?? '0.00'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', marginTop: 0 }}>Orders by Status</h2>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {statuses.map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StatusBadge status={s} />
                  <span style={{ fontWeight: 700 }}>{stats.ordersByStatus?.[s] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManagerDashboard;
