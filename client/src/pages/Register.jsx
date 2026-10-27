import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormInput from '../components/FormInput';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'manager', storeName: '', companyName: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  const handleRoleSelect = (role) => setForm({ ...form, role });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role };
      if (form.role === 'manager' && form.storeName) payload.storeName = form.storeName;
      if (form.role === 'vendor' && form.companyName) payload.companyName = form.companyName;

      const user = await register(payload);
      navigate(user.role === 'vendor' ? '/vendor/dashboard' : '/manager/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        // Map Zod validation errors to field-level display
        const fe = {};
        data.errors.forEach((e) => { fe[e.field] = e.message; });
        setFieldErrors(fe);
      } else {
        setError(data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo">B2BInventory <span>Portal</span></div>
        <p className="auth-tagline">Create your account</p>

        <h1 className="auth-title">Get started</h1>
        <p className="auth-subtitle">Choose your role and fill in your details</p>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Role selector */}
          <div className="form-group">
            <label className="form-label">I am a…</label>
            <div className="role-tabs">
              <button type="button" className={`role-tab ${form.role === 'manager' ? 'active' : ''}`} onClick={() => handleRoleSelect('manager')}>
                🏪 Store Manager
              </button>
              <button type="button" className={`role-tab ${form.role === 'vendor' ? 'active' : ''}`} onClick={() => handleRoleSelect('vendor')}>
                🏭 Vendor
              </button>
            </div>
          </div>

          <FormInput id="name" label="Full name" name="name" value={form.name} onChange={handleChange} placeholder="Jane Doe" required error={fieldErrors.name} />
          <FormInput id="email" label="Email address" type="email" name="email" value={form.email} onChange={handleChange} placeholder="jane@company.com" required error={fieldErrors.email} />
          <FormInput id="password" label="Password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="min. 6 characters" required error={fieldErrors.password} />

          {form.role === 'manager' && (
            <FormInput id="storeName" label="Store name (optional)" name="storeName" value={form.storeName} onChange={handleChange} placeholder="North Store" error={fieldErrors.storeName} />
          )}
          {form.role === 'vendor' && (
            <FormInput id="companyName" label="Company name (optional)" name="companyName" value={form.companyName} onChange={handleChange} placeholder="TechSupply Co." error={fieldErrors.companyName} />
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
