import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ToastProvider } from './components/ui/Toast'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { FullPageSpinner } from './components/ui/Spinner'

// Auth pages
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { FrequentadorRegisterPage } from './pages/auth/FrequentadorRegisterPage'
import { VendorRegisterPage } from './pages/auth/VendorRegisterPage'

// Frequentador
import { FrequentadorApp } from './pages/frequentador/FrequentadorApp'
import { MapView } from './pages/frequentador/MapView'
import { VendorProfilePage } from './pages/frequentador/VendorProfilePage'
import { MyOrdersPage } from './pages/frequentador/MyOrdersPage'
import { OrderTrackingPage } from './pages/frequentador/OrderTrackingPage'

// Vendedor
import { VendedorApp } from './pages/vendedor/VendedorApp'
import { VendedorDashboard } from './pages/vendedor/VendedorDashboard'
import { MenuManagementPage } from './pages/vendedor/MenuManagementPage'
import { VendedorProfilePage } from './pages/vendedor/VendedorProfilePage'

// Admin
import { AdminApp } from './pages/admin/AdminApp'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminMapPage } from './pages/admin/AdminMapPage'
import { VendorsManagementPage } from './pages/admin/VendorsManagementPage'
import { OrdersManagementPage } from './pages/admin/OrdersManagementPage'
import { VendorApplicationsPage } from './pages/admin/VendorApplicationsPage'
import { CustomersPage } from './pages/admin/CustomersPage'

function RootRedirect() {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'vendedor') return <Navigate to="/vendedor" replace />
  if (profile?.role === 'administrador') return <Navigate to="/admin" replace />
  return <Navigate to="/app" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/cadastro" element={<FrequentadorRegisterPage />} />
      <Route path="/cadastro-vendedor" element={<VendorRegisterPage />} />

      {/* Frequentador */}
      <Route
        path="/app"
        element={
          <ProtectedRoute allowedRoles={['frequentador']}>
            <FrequentadorApp />
          </ProtectedRoute>
        }
      >
        <Route index element={<MapView />} />
        <Route path="vendedor/:vendorId" element={<VendorProfilePage />} />
        <Route path="pedidos" element={<MyOrdersPage />} />
        <Route path="rastreamento/:orderId" element={<OrderTrackingPage />} />
      </Route>

      {/* Vendedor */}
      <Route
        path="/vendedor"
        element={
          <ProtectedRoute allowedRoles={['vendedor']}>
            <VendedorApp />
          </ProtectedRoute>
        }
      >
        <Route index element={<VendedorDashboard />} />
        <Route path="cardapio" element={<MenuManagementPage />} />
        <Route path="perfil" element={<VendedorProfilePage />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['administrador']}>
            <AdminApp />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="mapa" element={<AdminMapPage />} />
        <Route path="vendedores" element={<VendorsManagementPage />} />
        <Route path="pedidos" element={<OrdersManagementPage />} />
        <Route path="cadastros" element={<VendorApplicationsPage />} />
        <Route path="clientes" element={<CustomersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
