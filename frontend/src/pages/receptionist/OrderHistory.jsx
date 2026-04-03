import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, History, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { orderAPI, tableAPI } from '../../api/axios'

const STATUS_BADGE = {
  pending: 'badge-yellow', in_progress: 'badge-blue', served: 'badge-green', cancelled: 'badge-red'
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTable, setFilterTable] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const navigate = useNavigate()

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = { today: 'true' }
      if (filterTable) params.table = filterTable
      if (filterPayment) params.payment = filterPayment
      const [ordRes, tabRes] = await Promise.all([orderAPI.list(params), tableAPI.list()])
      setOrders(ordRes.data)
      setTables(tabRes.data)
    } catch { toast.error('Failed') }
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [filterTable, filterPayment])

  const totalRevenue = orders.filter(o => o.status === 'served').reduce((s, o) => s + parseFloat(o.total_amount), 0)

  return (
    <div className="min-h-screen bg-dark p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
          <h1 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <History size={20} className="text-gold" /> Today's Orders
          </h1>
          <span className="badge-gold ml-auto">Revenue: ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <select className="select-field flex-1" value={filterTable} onChange={e => setFilterTable(e.target.value)}>
            <option value="">All Tables</option>
            {tables.map(t => <option key={t.id} value={t.id}>Table {t.number}</option>)}
          </select>
          <select className="select-field flex-1" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
            <option value="">All Payments</option>
            <option value="cash">Cash</option>
            <option value="gpay">GPay</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white">Table {order.table_number}</p>
                      <span className="text-white/30 text-xs">#{order.id}</span>
                      <span className={STATUS_BADGE[order.status]}>{order.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-white/40">
                      {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      {order.employee_name ? ` • ${order.employee_name}` : ''}
                      {order.payment_method !== 'pending' ? ` • ${order.payment_method.toUpperCase()}` : ''}
                    </p>
                    <p className="text-xs text-white/30 mt-1 truncate max-w-xs">{order.items.map(i => `${i.menu_item_name}×${i.quantity}`).join(', ')}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-gold font-bold text-lg">₹{order.total_amount}</p>
                    {order.status === 'served' && (
                      <button onClick={async () => {
                        try {
                          const { data } = await (await import('../../api/axios')).orderAPI.receipt(order.id)
                          const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
                          const a = document.createElement('a'); a.href = url; a.download = `receipt_${order.id}.pdf`; a.click()
                          URL.revokeObjectURL(url)
                        } catch { toast.error('Receipt not available') }
                      }} className="btn-ghost text-xs py-1 px-2 mt-1">
                        Receipt
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <History size={48} className="mx-auto mb-3 opacity-30" />
                <p>No orders today</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
