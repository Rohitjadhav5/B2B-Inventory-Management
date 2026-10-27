import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';

const CreateOrder = () => {
  const { cart, updateQty, removeFromCart, clearCart, totalCost } = useCart();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [stockFailures, setStockFailures] = useState([]);

  // Navigate to browse if cart is empty
  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Create Order</h1>
        </div>
        <div className="empty-state">
          <span className="empty-icon">🛒</span>
          <p className="empty-title">Your cart is empty</p>
          <p className="empty-text">Browse products and add items first.</p>
          <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/manager/browse')}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const handleQtyChange = (productId, value, stock) => {
    const qty = parseInt(value, 10);
    if (!isNaN(qty) && qty >= 1 && qty <= stock) updateQty(productId, qty);
  };

  const handleSubmit = async () => {
    setError('');
    setStockFailures([]);
    setSubmitting(true);

    const payload = {
      vendorId: cart.vendorId,
      items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };

    try {
      const { data } = await api.post('/orders', payload);
      clearCart();
      navigate(`/manager/orders/${data.data._id}`);
    } catch (err) {
      const res = err.response?.data;
      if (res?.stockFailures) {
        setStockFailures(res.stockFailures);
      }
      setError(res?.message || 'Failed to create order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Review & Submit Order</h1>
        <p className="page-subtitle">Vendor: {cart.vendorName}</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          ⚠️ {error}
          {/* Show per-product stock failures */}
          {stockFailures.length > 0 && (
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem' }}>
              {stockFailures.map((f) => (
                <li key={f.productId}>
                  <strong>{f.productName}</strong>: requested {f.requested}, only {f.available} available
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        {cart.items.map((item) => (
          <div key={item.productId} className="cart-item">
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rs {item.price.toFixed(2)} each</div>
            </div>
            <input
              type="number" min="1" max={item.stock}
              className="qty-input"
              value={item.quantity}
              onChange={(e) => handleQtyChange(item.productId, e.target.value, item.stock)}
            />
            <div style={{ minWidth: 80, textAlign: 'right', fontWeight: 700 }}>
              Rs {(item.price * item.quantity).toFixed(2)}
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => removeFromCart(item.productId)}>🗑</button>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Estimated Total (server will recalculate)</div>
          <div className="cart-total">Rs {totalCost.toFixed(2)}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/manager/browse')}>← Continue Shopping</button>
          <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Placing Order…' : 'Place Order →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
