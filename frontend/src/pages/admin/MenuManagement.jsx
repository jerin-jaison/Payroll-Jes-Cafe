import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, Filter, Coffee, ToggleLeft, ToggleRight, Image } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../../components/Modal'
import { menuAPI, categoryAPI } from '../../api/axios'

const pageAnim = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }

export default function MenuManagement() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showCatModal, setShowCatModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', category: '', price_inr: '', is_available: true, stock_qty: 100 })
  const [imageFile, setImageFile] = useState(null)
  const [catForm, setCatForm] = useState({ name: '' })
  const imageRef = useRef()

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [mRes, cRes] = await Promise.all([menuAPI.list({ category: filterCat, search }), categoryAPI.list()])
      setItems(mRes.data)
      setCategories(cRes.data)
    } catch { toast.error('Failed to load menu') }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [filterCat, search])

  const openAdd = () => { setEditing(null); setForm({ name: '', category: '', price_inr: '', is_available: true, stock_qty: 100 }); setImageFile(null); setShowModal(true) }
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name, category: item.category, price_inr: item.price_inr, is_available: item.is_available, stock_qty: item.stock_qty }); setImageFile(null); setShowModal(true) }

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.price_inr) return toast.error('Fill all required fields')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (imageFile) fd.append('image', imageFile)
    try {
      if (editing) await menuAPI.update(editing.id, fd)
      else await menuAPI.create(fd)
      toast.success(editing ? 'Item updated!' : 'Item added!')
      setShowModal(false)
      fetchAll()
    } catch { toast.error('Save failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    await menuAPI.delete(id)
    toast.success('Item deleted')
    fetchAll()
  }

  const toggleAvailable = async (item) => {
    const fd = new FormData()
    fd.append('is_available', !item.is_available)
    await menuAPI.update(item.id, fd)
    fetchAll()
  }

  const handleAddCat = async () => {
    if (!catForm.name) return
    await categoryAPI.create(catForm)
    toast.success('Category added!')
    setShowCatModal(false)
    fetchAll()
  }

  return (
    <motion.div {...pageAnim}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Menu Management</h1>
          <p className="page-subtitle">{items.length} items across {categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCatModal(true)} className="btn-outline">
            <Plus size={16} /> Category
          </button>
          <button onClick={openAdd} className="btn-gold">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="input-field pl-9" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <select className="select-field pl-9 pr-8 min-w-[160px]" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              className={`card relative group ${!item.is_available ? 'opacity-60' : ''}`}
            >
              {/* Image */}
              <div className="w-full h-32 rounded-xl mb-3 overflow-hidden bg-dark-border flex items-center justify-center">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Coffee size={32} className="text-white/20" />
                )}
              </div>
              {/* Low stock badge */}
              {item.is_low_stock && item.is_available && (
                <span className="absolute top-3 left-3 badge-yellow text-[10px] px-1.5 py-0.5">Low Stock</span>
              )}
              {/* Content */}
              <p className="font-semibold text-white text-sm truncate">{item.name}</p>
              <p className="text-xs text-white/40 mb-2">{item.category_name}</p>
              <p className="text-gold font-bold">₹{item.price_inr}</p>
              <p className="text-xs text-white/30 mt-1">Stock: {item.stock_qty}</p>
              {/* Actions */}
              <div className="flex items-center gap-1 mt-3">
                <button onClick={() => toggleAvailable(item)} className="flex-1 btn-ghost text-xs py-1 justify-center">
                  {item.is_available ? <ToggleRight size={15} className="text-green-400" /> : <ToggleLeft size={15} className="text-white/30" />}
                  {item.is_available ? 'Available' : 'Hidden'}
                </button>
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-gold transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center py-16 text-white/30">
              <Coffee size={48} className="mx-auto mb-3 opacity-30" />
              <p>No menu items found</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Menu Item' : 'Add Menu Item'}>
        <div className="space-y-4">
          <div>
            <label className="label">Item Name *</label>
            <input className="input-field" placeholder="e.g. Cappuccino" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="select-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Price (₹) *</label>
              <input className="input-field" type="number" min="0" step="0.50" placeholder="0.00" value={form.price_inr} onChange={e => setForm({ ...form, price_inr: e.target.value })} />
            </div>
            <div>
              <label className="label">Stock Qty</label>
              <input className="input-field" type="number" min="0" value={form.stock_qty} onChange={e => setForm({ ...form, stock_qty: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Image (optional)</label>
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files[0])} />
            <button onClick={() => imageRef.current.click()} className="btn-outline w-full justify-center">
              <Image size={15} /> {imageFile ? imageFile.name : 'Choose Image'}
            </button>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-12 h-6 rounded-full transition-colors ${form.is_available ? 'bg-gold' : 'bg-dark-border'} relative`}
              onClick={() => setForm({ ...form, is_available: !form.is_available })}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.is_available ? 'left-7' : 'left-1'}`} />
            </div>
            <span className="text-sm text-white/70">Available for order</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button onClick={handleSubmit} className="btn-gold flex-1 justify-center">
              {editing ? 'Update' : 'Add Item'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Add Category" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Category Name</label>
            <input className="input-field" placeholder="e.g. Coffee" value={catForm.name} onChange={e => setCatForm({ name: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCatModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button onClick={handleAddCat} className="btn-gold flex-1 justify-center">Add</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
