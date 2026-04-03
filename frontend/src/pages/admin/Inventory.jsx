import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, Edit } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../../components/Modal'
import { inventoryAPI } from '../../api/axios'

const pageAnim = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }

export default function Inventory() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ stock_qty: '', low_stock_threshold: '' })

  const fetch = async () => {
    setLoading(true)
    try { const { data: d } = await inventoryAPI.get(); setData(d) }
    catch { toast.error('Failed') }
    setLoading(false)
  }
  useEffect(() => { fetch() }, [])

  const handleUpdate = async () => {
    await inventoryAPI.update({ id: editItem.id, stock_qty: form.stock_qty, low_stock_threshold: form.low_stock_threshold })
    toast.success('Stock updated!'); setEditItem(null); fetch()
  }

  const items = data?.items || []
  const lowStock = items.filter(i => i.is_low_stock && i.is_available)
  const outOfStock = items.filter(i => i.stock_qty === 0)

  return (
    <motion.div {...pageAnim}>
      <div className="mb-6">
        <h1 className="page-header">Inventory & Stock</h1>
        <p className="page-subtitle">Manage item stock levels and low-stock alerts</p>
      </div>

      {/* Alert badges */}
      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="mb-4 p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 flex items-center gap-3">
          <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-400">
            <strong>{lowStock.length} items</strong> are low on stock: {lowStock.slice(0, 3).map(i => i.name).join(', ')}{lowStock.length > 3 ? '...' : ''}
          </p>
        </motion.div>
      )}
      {outOfStock.length > 0 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3">
          <Package size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">
            <strong>{outOfStock.length} items</strong> are out of stock and hidden from menu.
          </p>
        </motion.div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Item</th><th>Category</th><th>Price</th><th>Stock Qty</th><th>Threshold</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? [...Array(8)].map((_, i) => (
              <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton h-4 rounded" /></td>)}</tr>
            )) : items.map((item) => (
              <tr key={item.id}>
                <td className="font-medium text-white">{item.name}</td>
                <td className="text-white/50 text-xs">{item.category_name}</td>
                <td className="text-gold">₹{item.price_inr}</td>
                <td>
                  <span className={`font-bold ${item.stock_qty === 0 ? 'text-red-400' : item.is_low_stock ? 'text-yellow-400' : 'text-green-400'}`}>
                    {item.stock_qty}
                  </span>
                </td>
                <td className="text-white/50">{item.low_stock_threshold}</td>
                <td>
                  {item.stock_qty === 0 ? (
                    <span className="badge-red">Out of Stock</span>
                  ) : item.is_low_stock ? (
                    <span className="badge-yellow">Low Stock</span>
                  ) : (
                    <span className="badge-green">OK</span>
                  )}
                </td>
                <td>
                  <button onClick={() => { setEditItem(item); setForm({ stock_qty: item.stock_qty, low_stock_threshold: item.low_stock_threshold }) }}
                    className="btn-ghost text-xs py-1 px-2">
                    <Edit size={13} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title={`Update Stock – ${editItem?.name}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Current Stock Quantity</label>
            <input className="input-field" type="number" min="0" value={form.stock_qty} onChange={e => setForm({ ...form, stock_qty: e.target.value })} />
          </div>
          <div>
            <label className="label">Low Stock Alert Threshold</label>
            <input className="input-field" type="number" min="1" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditItem(null)} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button onClick={handleUpdate} className="btn-gold flex-1 justify-center">Update</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
