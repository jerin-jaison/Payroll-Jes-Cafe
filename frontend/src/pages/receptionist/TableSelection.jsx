import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Coffee, ShoppingBag, Clock, History } from 'lucide-react'
import { tableAPI } from '../../api/axios'

const STATUS_COLORS = {
  available: { bg: 'from-green-500/20 to-green-500/10 border-green-500/40', text: 'text-green-400', dot: 'bg-green-400', label: 'Available', clickable: true },
  occupied: { bg: 'from-red-500/20 to-red-500/10 border-red-500/40', text: 'text-red-400', dot: 'bg-red-400', label: 'Occupied', clickable: true },
  reserved: { bg: 'from-yellow-500/20 to-yellow-500/10 border-yellow-500/40', text: 'text-yellow-400', dot: 'bg-yellow-400', label: 'Reserved', clickable: false },
}

export default function TableSelection() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    tableAPI.list().then(({ data }) => setTables(data)).catch(() => {}).finally(() => setLoading(false))
    const interval = setInterval(() => {
      tableAPI.list().then(({ data }) => setTables(data)).catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleTableClick = (table) => {
    if (table.status === 'reserved') return
    if (table.status === 'occupied' && table.active_order_id) {
      navigate(`/order/${table.id}?order=${table.active_order_id}`)
    } else {
      navigate(`/order/${table.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-dark/80 backdrop-blur-lg border-b border-dark-border px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
              <Coffee size={22} className="text-gold" />
            </div>
            <div>
              <h1 className="font-bold text-gold font-display text-xl">KASA BREW</h1>
              <p className="text-white/40 text-xs">Select a table to start an order</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/orders')} className="btn-ghost text-sm">
              <Clock size={15} /> Active Orders
            </button>
            <button onClick={() => navigate('/history')} className="btn-ghost text-sm">
              <History size={15} /> Today's Orders
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Legend */}
        <div className="flex items-center gap-6 mb-6">
          {Object.entries(STATUS_COLORS).map(([status, c]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
              <span className="text-sm text-white/50 capitalize">{status}</span>
            </div>
          ))}
          <span className="text-sm text-white/30 ml-auto">{tables.length} tables total</span>
        </div>

        {/* Table Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {tables.map((table, i) => {
              const s = STATUS_COLORS[table.status]
              return (
                <motion.button
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  whileHover={s.clickable ? { scale: 1.06, y: -4 } : {}}
                  whileTap={s.clickable ? { scale: 0.97 } : {}}
                  onClick={() => handleTableClick(table)}
                  className={`relative rounded-2xl border bg-gradient-to-br p-4 text-center ${s.bg} ${s.clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} transition-all duration-200`}
                >
                  <div className={`w-2 h-2 rounded-full ${s.dot} mx-auto mb-3`} />
                  <p className="text-2xl font-bold text-white font-display">T{table.number}</p>
                  <p className="text-xs text-white/40 mt-1">{table.capacity} seats</p>
                  <p className={`text-xs font-semibold mt-2 ${s.text}`}>{s.label}</p>
                  {table.status === 'occupied' && table.active_order_id && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                  )}
                </motion.button>
              )
            })}
          </div>
        )}

        {tables.length === 0 && !loading && (
          <div className="text-center py-24">
            <Coffee size={64} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-lg">No tables available</p>
            <p className="text-white/20 text-sm mt-1">Ask admin to add tables</p>
          </div>
        )}
      </div>
    </div>
  )
}
