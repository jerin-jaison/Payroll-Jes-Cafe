import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, ShoppingCart, Plus, Minus, Trash2, Coffee, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { menuAPI, categoryAPI, employeeAPI, orderAPI, tableAPI } from '../../api/axios'

export default function OrderTaking() {
  const { tableId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const existingOrderId = searchParams.get('order')

  const [table, setTable] = useState(null)
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedCat, setSelectedCat] = useState('')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [selectedEmp, setSelectedEmp] = useState('')
  const [notes, setNotes] = useState('')
  const [discountPercentage, setDiscountPercentage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      tableAPI.list().then(({ data }) => {
        const t = data.find(t => t.id === parseInt(tableId))
        setTable(t)
      }),
      categoryAPI.list().then(({ data }) => setCategories(data)),
      menuAPI.list({ available: 'true' }).then(({ data }) => setMenuItems(data)),
      employeeAPI.list().then(({ data }) => setEmployees(data)),
    ]).finally(() => setLoading(false))
  }, [tableId])

  const filtered = menuItems.filter(item =>
    (selectedCat ? item.category === parseInt(selectedCat) : true) &&
    (search ? item.name.toLowerCase().includes(search.toLowerCase()) : true)
  )

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
      return updated.filter(c => c.qty > 0)
    })
  }

  const total = cart.reduce((s, c) => s + parseFloat(c.price_inr) * c.qty, 0)

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return toast.error('Add items to order first')
    if (discountPercentage) {
      const dp = parseFloat(discountPercentage);
      if (dp < 0 || dp > 100) {
        return toast.error('Discount must be between 0 and 100');
      }
    }
    setSubmitting(true)
    try {
      const { data: order } = await orderAPI.create({
        table_id: parseInt(tableId),
        employee_id: selectedEmp || null,
        notes,
        discount_percentage: discountPercentage ? parseFloat(discountPercentage) : null,
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.qty }))
      })
      toast.success('Order placed successfully!')
      navigate(`/payment/${order.id}`)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to place order')
    }
    setSubmitting(false)
  }

  if (loading) return <div className="min-h-screen bg-dark flex items-center justify-center"><div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-dark/80 backdrop-blur-lg border-b border-dark-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-2">
            <span className="badge-gold font-display text-base">T{table?.number}</span>
            <span className="text-white/60 text-sm">New Order</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select className="select-field text-sm py-1.5 px-3 min-w-[160px]" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}>
              <option value="">Select Staff</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Menu Panel */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Search */}
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input className="input-field input-with-icon" placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Category Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button onClick={() => setSelectedCat('')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCat === '' ? 'bg-gold text-dark' : 'bg-dark-card text-white/60 hover:text-white border border-dark-border'}`}>All</button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCat(String(c.id))}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCat === String(c.id) ? 'bg-gold text-dark' : 'bg-dark-card text-white/60 hover:text-white border border-dark-border'}`}>
                {c.name}
              </button>
            ))}
          </div>
          {/* Items Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((item, i) => {
              const inCart = cart.find(c => c.id === item.id)
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -2 }}
                  className={`card cursor-pointer transition-all ${inCart ? 'border-gold/40 bg-gold/5' : ''}`}
                  onClick={() => addToCart(item)}
                >
                  <div className="w-full h-24 rounded-xl mb-2 bg-dark-border flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Coffee size={24} className="text-white/20" />
                    )}
                  </div>
                  <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                  <p className="text-gold font-bold text-sm mt-1">₹{item.price_inr}</p>
                  {inCart && (
                    <div className="mt-2 flex items-center justify-between bg-gold/10 rounded-lg px-2 py-1">
                      <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1) }} className="text-white/60 hover:text-white"><Minus size={14} /></button>
                      <span className="text-gold font-bold text-sm">{inCart.qty}</span>
                      <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1) }} className="text-white/60 hover:text-white"><Plus size={14} /></button>
                    </div>
                  )}
                  {item.stock_qty <= 5 && item.stock_qty > 0 && <p className="text-xs text-yellow-400 mt-1">Only {item.stock_qty} left</p>}
                </motion.div>
              )
            })}
            {filtered.length === 0 && <div className="col-span-full text-center py-12 text-white/30">No items found</div>}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="w-72 xl:w-80 border-l border-dark-border flex flex-col bg-dark-card">
          <div className="p-4 border-b border-dark-border">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <ShoppingCart size={16} className="text-gold" /> Cart ({cart.reduce((s, c) => s + c.qty, 0)})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence>
              {cart.map(item => (
                <motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-dark border border-dark-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs text-gold">₹{(parseFloat(item.price_inr) * item.qty).toFixed(0)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-dark-border flex items-center justify-center text-white/60 hover:text-white"><Minus size={11} /></button>
                    <span className="text-sm font-bold text-white w-5 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-dark-border flex items-center justify-center text-white/60 hover:text-white"><Plus size={11} /></button>
                    <button onClick={() => setCart(c => c.filter(x => x.id !== item.id))} className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 ml-1"><Trash2 size={11} /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {cart.length === 0 && (
              <div className="text-center py-12 text-white/30">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Cart is empty</p>
              </div>
            )}
          </div>
          {/* Notes */}
          <div className="p-3 border-t border-dark-border">
            <input className="input-field text-sm py-2 mb-3" placeholder="Order notes (optional)..." value={notes} onChange={e => setNotes(e.target.value)} />
            <input 
              type="number" 
              min="0" 
              max="100" 
              className="input-field text-sm py-2 mb-3" 
              placeholder="Discount % (optional)" 
              value={discountPercentage} 
              onChange={e => {
                const val = e.target.value;
                if (val === '') {
                  setDiscountPercentage('');
                } else {
                  const num = parseFloat(val);
                  if (num > 100) setDiscountPercentage('100');
                  else if (num < 0) setDiscountPercentage('0');
                  else setDiscountPercentage(val);
                }
              }} 
            />
            {/* Total */}
            {discountPercentage && parseFloat(discountPercentage) > 0 ? (
              <>
                <div className="flex justify-between mb-1">
                  <span className="text-white/40 text-sm">Subtotal</span>
                  <span className="text-white/60 text-sm">₹{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-white/40 text-sm">Discount ({discountPercentage}%)</span>
                  <span className="text-gold/80 text-sm">-₹{((total * parseFloat(discountPercentage)) / 100).toFixed(0)}</span>
                </div>
              </>
            ) : null}
            <div className="flex justify-between mb-3">
              <span className="text-white/60">Total</span>
              <span className="text-2xl font-bold text-gold">₹{discountPercentage && parseFloat(discountPercentage) > 0 ? (total - (total * parseFloat(discountPercentage) / 100)).toFixed(0) : total.toFixed(0)}</span>
            </div>
            <button onClick={handlePlaceOrder} disabled={submitting || cart.length === 0}
              className="btn-gold w-full justify-center py-3 text-base disabled:opacity-50">
              {submitting ? <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" /> : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
