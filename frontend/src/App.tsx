import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import ReceiptsPage from './pages/ReceiptsPage'
import DeliveriesPage from './pages/DeliveriesPage'
import TransfersPage from './pages/TransfersPage'
import AdjustmentsPage from './pages/AdjustmentsPage'
import MoveHistoryPage from './pages/MoveHistoryPage'
import WarehousesPage from './pages/WarehousesPage'
import LandingPage from './pages/LandingPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" />
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/adjustments" element={<AdjustmentsPage />} />
          <Route path="/history" element={<MoveHistoryPage />} />
          <Route path="/warehouses" element={<WarehousesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
