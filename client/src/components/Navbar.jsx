import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Icon map – simple emoji icons for zero dependencies
const icons = {
  dashboard: '📊', products: '📦', orders: '📋',
  browse: '🔍', create: '🛒', vendors: '🏢',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Initials for avatar
  const initials = user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const vendorLinks = [
    { to: '/vendor/dashboard', label: 'Dashboard',  icon: icons.dashboard },
    { to: '/vendor/products',  label: 'My Products', icon: icons.products },
    { to: '/vendor/orders',    label: 'Orders',      icon: icons.orders },
  ];

  const managerLinks = [
    { to: '/manager/dashboard', label: 'Dashboard',      icon: icons.dashboard },
    { to: '/manager/browse',    label: 'Browse Products', icon: icons.browse },
    { to: '/manager/create-order', label: `Cart${itemCount ? ` (${itemCount})` : ''}`, icon: icons.create },
    { to: '/manager/orders',    label: 'My Orders',      icon: icons.orders },
  ];

  const links = user?.role === 'vendor' ? vendorLinks : managerLinks;
  const sectionLabel = user?.role === 'vendor' ? 'Vendor Panel' : 'Manager Panel';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        B2B<span>Inventory</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">{sectionLabel}</div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log out">⏻</button>
        </div>
      </div>
    </aside>
  );
};

export default Navbar;
