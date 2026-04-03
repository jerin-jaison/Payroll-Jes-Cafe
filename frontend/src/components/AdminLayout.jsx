import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-dark overflow-hidden">
      <Sidebar />
      <motion.main
        className="flex-1 overflow-y-auto ml-[240px] transition-all duration-300"
        id="admin-main-content"
      >
        <div className="p-6 min-h-full">
          <Outlet />
        </div>
      </motion.main>
    </div>
  )
}
