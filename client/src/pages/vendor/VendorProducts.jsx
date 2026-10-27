import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';

const emptyForm = { name: '', sku: '', price: '', stock: '', isActive: true };

const VendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null); // null = create, object = edit
  const [form, setForm]           = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]       = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    api.get('/products')
      .then(({ data }) => setProducts(data.data))
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchProducts, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name, sku: product.sku,
      price: product.price, stock: product.stock,
      isActive: product.isActive,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    // Client-side mirror of server validation
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    if (isNaN(price) || price < 0) { setFormError('Price must be >= 0'); setSaving(false); return; }
    if (!Number.isInteger(stock) || stock < 0) { setFormError('Stock must be a non-negative integer'); setSaving(false); return; }

    const payload = { name: form.name, sku: form.sku, price, stock, isActive: form.isActive };
    try {
      if (editing) {
        await api.put(`/products/${editing._id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      const data = err.response?.data;
      setFormError(data?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch {
      alert('Failed to delete product.');
    }
  };

  const columns = [
    { key: 'name',  label: 'Product Name' },
    { key: 'sku',   label: 'Product Code' },
    { key: 'price', label: 'Price', render: (r) => `Rs ${r.price.toFixed(2)}` },
    {
      key: 'stock', label: 'Stock',
      render: (r) => (
        <span style={{ color: r.stock < 10 ? '#ef4444' : undefined, fontWeight: r.stock < 10 ? 700 : undefined }}>
          {r.stock} {r.stock < 10 && '⚠️'}
        </span>
      ),
    },
    {
      key: 'isActive', label: 'Status',
      render: (r) => <span className={`badge ${r.isActive ? 'badge-delivered' : 'badge-cancelled'}`}>{r.isActive ? 'Active' : 'Inactive'}</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>🗑 Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">My Products</h1>
            <p className="page-subtitle">Manage your product catalogue</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

      <Table columns={columns} data={products} emptyMessage="You haven't added any products yet." />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add New Product'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        {formError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {formError}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <FormInput id="prod-name" label="Product Name *" name="name" value={form.name} onChange={handleChange} required />
          <FormInput id="prod-sku"  label="Product Code *"  name="sku"  value={form.sku}  onChange={handleChange} required />
          <div className="form-grid">
            <FormInput id="prod-price" label="Price (Rs) *" type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" required />
            <FormInput id="prod-stock" label="Stock *" type="number" name="stock" value={form.stock} onChange={handleChange} min="0" step="1" required />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
            Active (visible to managers)
          </label>
        </form>
      </Modal>
    </div>
  );
};

export default VendorProducts;
