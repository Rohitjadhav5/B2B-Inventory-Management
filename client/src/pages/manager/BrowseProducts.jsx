import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';
import { useCart } from '../../context/CartContext';

const BrowseProducts = () => {
  const { addToCart, cart } = useCart();

  const [vendors, setVendors]   = useState([]);
  const [vendorId, setVendorId] = useState('');
  const [search, setSearch]     = useState('');
  const [products, setProducts] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  // qty per product for this session
  const [quantities, setQuantities] = useState({});

  // Load vendor list for dropdown
  useEffect(() => {
    api.get('/vendors').then(({ data }) => setVendors(data.data)).catch(() => {});
  }, []);

  // Fetch products whenever filters change
  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page, limit: 10 });
    if (vendorId) params.set('vendorId', vendorId);
    if (search)   params.set('search', search);
    api.get(`/products?${params}`)
      .then(({ data }) => {
        setProducts(data.data);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false));
  }, [page, vendorId, search]);

  const handleAddToCart = (product) => {
    const qty = parseInt(quantities[product._id] || '1', 10);
    if (!qty || qty < 1) { alert('Quantity must be >= 1'); return; }
    if (qty > product.stock) { alert(`Only ${product.stock} in stock.`); return; }
    const vendor = vendors.find((v) => v._id === product.vendor._id || v._id === product.vendor);
    addToCart(
      product.vendor._id || product.vendor,
      vendor?.companyName || vendor?.name || 'Vendor',
      product,
      qty
    );
    alert(`"${product.name}" added to cart!`);
  };

  const inCart = (productId) => cart?.items.some((i) => i.productId === productId);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Browse Products</h1>
        <p className="page-subtitle">Find products from vendors and add them to your order · {total} results</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

      {/* Filters */}
      <div className="toolbar" style={{ marginBottom: '1.5rem' }}>
        <select
          className="form-select"
          style={{ maxWidth: 220 }}
          value={vendorId}
          onChange={(e) => { setVendorId(e.target.value); setPage(1); }}
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v._id} value={v._id}>{v.companyName || v.name}</option>
          ))}
        </select>

        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="form-input"
            placeholder="Search products…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {products.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🔍</span>
              <p className="empty-title">No products found</p>
              <p className="empty-text">Try a different vendor or search term</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {products.map((product) => (
                <div key={product._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Product header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{product.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Product Code: {product.sku}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--color-brand-dark)', fontSize: '1rem' }}>
                      Rs {product.price.toFixed(2)}
                    </div>
                  </div>
                  {/* Vendor & stock */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    🏭 {product.vendor?.companyName || product.vendor?.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: product.stock < 10 ? '#ef4444' : 'var(--text-secondary)', fontWeight: product.stock < 10 ? 700 : 400 }}>
                    Stock: {product.stock} {product.stock < 10 && '⚠️'}
                  </div>
                  {/* Qty + add button */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number" min="1" max={product.stock}
                      className="qty-input"
                      value={quantities[product._id] || '1'}
                      onChange={(e) => setQuantities({ ...quantities, [product._id]: e.target.value })}
                    />
                    <button
                      className={`btn btn-sm ${inCart(product._id) ? 'btn-success' : 'btn-primary'}`}
                      style={{ flex: 1 }}
                      disabled={product.stock === 0}
                      onClick={() => handleAddToCart(product)}
                    >
                      {product.stock === 0 ? 'Out of Stock' : inCart(product._id) ? '✓ Update Cart' : '+ Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

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

export default BrowseProducts;
