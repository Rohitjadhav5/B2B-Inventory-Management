import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute, RoleRoute } from './routes/Guards';

// Auth pages
import Login    from './pages/Login';
import Register from './pages/Register';

// Vendor pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts  from './pages/vendor/VendorProducts';
import VendorOrders    from './pages/vendor/VendorOrders';

// Manager pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import BrowseProducts   from './pages/manager/BrowseProducts';
import CreateOrder      from './pages/manager/CreateOrder';
import MyOrders         from './pages/manager/MyOrders';

// Shared
import OrderDetail from './pages/OrderDetail';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected: requires valid JWT */}
          <Route element={<ProtectedRoute />}>

            {/* Vendor-only routes */}
            <Route element={<RoleRoute role="vendor" />}>
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
              <Route path="/vendor/products"  element={<VendorProducts />} />
              <Route path="/vendor/orders"    element={<VendorOrders />} />
              <Route path="/vendor/orders/:id" element={<OrderDetail />} />
            </Route>

            {/* Manager-only routes */}
            <Route element={<RoleRoute role="manager" />}>
              <Route path="/manager/dashboard"   element={<ManagerDashboard />} />
              <Route path="/manager/browse"      element={<BrowseProducts />} />
              <Route path="/manager/create-order" element={<CreateOrder />} />
              <Route path="/manager/orders"       element={<MyOrders />} />
              <Route path="/manager/orders/:id"   element={<OrderDetail />} />
            </Route>

          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
