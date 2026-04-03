import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, UtensilsCrossed, Grid3X3, Users, Calculator,
  FileText, CreditCard, Package, Calendar, ChevronLeft, ChevronRight,
  LogOut, Coffee
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/admin-panel/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin-panel/menu', icon: UtensilsCrossed, label: 'Menu' },
  { path: '/admin-panel/tables', icon: Grid3X3, label: 'Tables' },
  { path: '/admin-panel/employees', icon: Users, label: 'Employees' },
  { path: '/admin-panel/profit', icon: Calculator, label: 'Profit Calc' },
  { path: '/admin-panel/reports', icon: FileText, label: 'Reports' },
  { path: '/admin-panel/transactions', icon: CreditCard, label: 'Transactions' },
  { path: '/admin-panel/inventory', icon: Package, label: 'Inventory' },
  { path: '/admin-panel/shifts', icon: Calendar, label: 'Shifts' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/admin-panel/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 70 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-screen bg-dark-card border-r border-dark-border flex flex-col fixed left-0 top-0 z-40 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-border min-h-[72px]">
        <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
          <Coffee size={20} className="text-gold" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-bold text-gold font-display text-lg leading-none">KASA</p>
              <p className="text-white/50 text-xs">BREW Admin</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path
          return (
            <Link key={path} to={path}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-gold/15 border border-gold/30 text-gold'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-dark-border">
        <motion.button
          whileHover={{ x: 2 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Collapse toggle */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute -right-3 top-20 w-6 h-6 bg-gold rounded-full flex items-center justify-center shadow-lg"
      >
        {collapsed ? <ChevronRight size={12} className="text-dark" /> : <ChevronLeft size={12} className="text-dark" />}
      </motion.button>
    </motion.aside>
  )
}
