import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'

// Receptionist pages
import TableSelection from './pages/receptionist/TableSelection'
import OrderTaking from './pages/receptionist/OrderTaking'
import Payment from './pages/receptionist/Payment'
import ActiveOrders from './pages/receptionist/ActiveOrders'
import OrderHistory from './pages/receptionist/OrderHistory'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import MenuManagement from './pages/admin/MenuManagement'
import TableManagement from './pages/admin/TableManagement'
import EmployeeManagement from './pages/admin/EmployeeManagement'
import ProfitCalculator from './pages/admin/ProfitCalculator'
import Transactions from './pages/admin/Transactions'
import Inventory from './pages/admin/Inventory'
import ShiftManagement from './pages/admin/ShiftManagement'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#FFD700', secondary: '#0a0a0a' } },
          }}
        />
        <Routes>
          {/* Receptionist routes (no login required) */}
          <Route path="/" element={<TableSelection />} />
          <Route path="/order/:tableId" element={<OrderTaking />} />
          <Route path="/payment/:orderId" element={<Payment />} />
          <Route path="/orders" element={<ActiveOrders />} />
          <Route path="/history" element={<OrderHistory />} />

          {/* Admin routes */}
          <Route path="/admin-panel/login" element={<AdminLogin />} />
          <Route path="/admin-panel" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin-panel/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="tables" element={<TableManagement />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="profit" element={<ProfitCalculator />} />
            <Route path="reports" element={<ProfitCalculator />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="shifts" element={<ShiftManagement />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
