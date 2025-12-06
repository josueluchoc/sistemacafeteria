import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import MenuPublico from './pages/MenuPublico';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext'; // <--- Importamos el Carrito
import ProtectedRoute from './components/ProtectedRoute';
import Checkout from './pages/Checkout'; // <--- Importar
import CajaView from './pages/CajaView';
import CocinaView from './pages/CocinaView';
import AdminProducts from './components/admin/AdminProducts';
import AdminShifts from './pages/admin/AdminShifts';
import AdminModifiers from './pages/admin/AdminModifiers';
import ClientOrders from './pages/ClientOrders';
import AdminTables from './pages/admin/AdminTables';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminHistory from './pages/admin/AdminHistory'; // <--- Importar
import { Analytics } from '@vercel/analytics/react';

// Componentes Placeholder (Temporales)

function App() {
  return (
    
    <AuthProvider>
      <CartProvider> {/* <--- Envolvemos la app con el CartProvider */}
        <Router>
          <Toaster position="top-center" richColors />

          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />

            {/* Rutas Protegidas */}

            <Route path="/menu" element={
              <ProtectedRoute>
                <MenuPublico />
              </ProtectedRoute>
            } />

            <Route path="/kitchen" element={
              <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
                <CocinaView />
              </ProtectedRoute>
            } />

            <Route path="/pos" element={
              <ProtectedRoute allowedRoles={['cashier', 'admin']}>
                <CajaView />
              </ProtectedRoute>
            } />

            <Route path="/admin/shifts" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminShifts />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/kitchen" element={
              <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
                <CocinaView />
              </ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProducts />
              </ProtectedRoute>
            } />
            <Route path="/admin/shifts" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminShifts />
              </ProtectedRoute>
            } />
            <Route path="/admin/modifiers" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminModifiers />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <ClientOrders />
              </ProtectedRoute>
            } />
            <Route path="/admin/tables" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTables />
              </ProtectedRoute>
            } />
            {/* RUTA PRINCIPAL ADMIN AHORA ES EL DASHBOARD */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/history" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminHistory />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Analytics />
        </Router>
      </CartProvider>
    </AuthProvider>

  );
}

export default App;