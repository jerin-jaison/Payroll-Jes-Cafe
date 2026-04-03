import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Grid3X3 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../../components/Modal'
import { tableAPI } from '../../api/axios'

const pageAnim = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }

const STATUS_COLORS = {
  available: { bg: 'bg-green-500/15 border-green-500/30', text: 'text-green-400', label: 'Available' },
  occupied: { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', label: 'Occupied' },
  reserved: { bg: 'bg-yellow-500/15 border-yellow-500/30', text: 'text-yellow-400', label: 'Reserved' },
}

export default function TableManagement() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ number: '', capacity: 4, location: '' })

  const fetchTables = async () => {
    setLoading(true)
    try { const { data } = await tableAPI.list(); setTables(data) }
    catch { toast.error('Failed to load tables') }
    setLoading(false)
  }

  useEffect(() => { fetchTables() }, [])

  const openAdd = () => { setEditing(null); setForm({ number: '', capacity: 4, location: '' }); setShowModal(true) }
  const openEdit = (t) => { setEditing(t); setForm({ number: t.number, capacity: t.capacity, location: t.location }); setShowModal(true) }

  const handleSubmit = async () => {
    if (!form.number) return toast.error('Table number required')
    try {
      if (editing) await tableAPI.update(editing.id, form)
      else await tableAPI.create(form)
      toast.success(editing ? 'Table updated!' : 'Table added!')
      setShowModal(false)
      fetchTables()
    } catch (e) { toast.error(e.response?.data?.number?.[0] || 'Save failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this table?')) return
    await tableAPI.delete(id)
    toast.success('Table deleted')
    fetchTables()
  }

  const handleStatusChange = async (table, status) => {
    await tableAPI.updateStatus(table.id, status)
    fetchTables()
  }

  const stats = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  }

  return (
    <motion.div {...pageAnim}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Table Management</h1>
          <p className="page-subtitle">{tables.length} tables total</p>
        </div>
        <button onClick={openAdd} className="btn-gold"><Plus size={16} /> Add Table</button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Object.entries(stats).map(([status, count]) => {
          const s = STATUS_COLORS[status]
          return (
            <div key={status} className={`card border ${s.bg} text-center py-3`}>
              <p className={`text-2xl font-bold ${s.text}`}>{count}</p>
              <p className="text-sm text-white/60 capitalize">{status}</p>
            </div>
          )
        })}
      </div>

      {/* Floor Map Grid */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Grid3X3 size={16} className="text-gold" /> Floor Map
        </h3>
        {loading ? (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {tables.map((table, i) => {
              const s = STATUS_COLORS[table.status]
              return (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.05 }}
                  className={`border rounded-xl p-3 text-center cursor-pointer select-none transition-all ${s.bg}`}
                >
                  <p className={`text-xl font-bold ${s.text}`}>T{table.number}</p>
                  <p className="text-xs text-white/40 mt-0.5">{table.capacity} seats</p>
                  <p className={`text-[10px] font-medium mt-1 ${s.text}`}>{s.label}</p>
                  <div className="flex gap-1 mt-2 justify-center">
                    <button onClick={() => openEdit(table)} className="text-white/30 hover:text-gold transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => handleDelete(table.id)} className="text-white/30 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
        {tables.length === 0 && !loading && (
          <div className="text-center py-12 text-white/30">No tables added yet</div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4">
        {Object.entries(STATUS_COLORS).map(([status, c]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status === 'available' ? 'bg-green-400' : status === 'occupied' ? 'bg-red-400' : 'bg-yellow-400'}`} />
            <span className="text-sm text-white/50 capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Table' : 'Add Table'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Table Number *</label>
            <input className="input-field" placeholder="e.g. 1, A1, T5" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} />
          </div>
          <div>
            <label className="label">Capacity (seats)</label>
            <input className="input-field" type="number" min="1" max="20" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <div>
            <label className="label">Location / Note</label>
            <input className="input-field" placeholder="e.g. Near window, Outdoor" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          {editing && (
            <div>
              <label className="label">Status</label>
              <select className="select-field" value={editing.status} onChange={e => handleStatusChange(editing, e.target.value)}>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button onClick={handleSubmit} className="btn-gold flex-1 justify-center">{editing ? 'Update' : 'Add'}</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
