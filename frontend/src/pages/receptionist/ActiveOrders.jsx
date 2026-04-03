import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, ChevronRight, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { orderAPI } from '../../api/axios'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'badge-yellow', next: 'in_progress', nextLabel: '→ In Progress' },
  in_progress: { label: 'In Progress', color: 'badge-blue', next: 'served', nextLabel: '→ Mark Served' },
  served: { label: 'Served', color: 'badge-green', next: null, nextLabel: null },
  cancelled: { label: 'Cancelled', color: 'badge-red', next: null, nextLabel: null },
}

export default function ActiveOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchOrders = () => {
    orderAPI.list({ status: 'pending' })
      .then(({ data: pending }) => {
        orderAPI.list({ status: 'in_progress' })
          .then(({ data: inProg }) => setOrders([...pending, ...inProg]))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus)
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`)
      fetchOrders()
    } catch { toast.error('Update failed') }
  }

  return (
    <div className="min-h-screen bg-dark p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
          <h1 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <Clock size={20} className="text-gold" /> Active Orders ({orders.length})
          </h1>
          <button onClick={fetchOrders} className="btn-ghost ml-auto p-2"><RefreshCw size={15} /></button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
          </div>
        ) : orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order, i) => {
              const s = STATUS_CONFIG[order.status]
              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-white text-lg">Table {order.table_number}</p>
                      <p className="text-white/40 text-xs">Order #{order.id} • {order.employee_name || 'No staff'}</p>
                    </div>
                    <span className={s.color}>{s.label}</span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-white/70">{item.menu_item_name} × {item.quantity}</span>
                        <span className="text-white/60">₹{item.subtotal}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-dark-border">
                    <span className="text-gold font-bold">₹{order.total_amount}</span>
                    <div className="flex gap-2">
                      {order.payment_method === 'pending' && (
                        <button onClick={() => navigate(`/payment/${order.id}`)} className="btn-gold text-xs py-1.5 px-3">Pay Now</button>
                      )}
                      {s.next && (
                        <button onClick={() => handleStatusUpdate(order.id, s.next)} className="btn-outline text-xs py-1.5 px-3">
                          {s.nextLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <Clock size={64} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-lg">No active orders</p>
          </div>
        )}
      </div>
    </div>
  )
}
