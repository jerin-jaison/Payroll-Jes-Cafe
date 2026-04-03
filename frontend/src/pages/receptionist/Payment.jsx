import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Banknote, Smartphone, CheckCircle, Printer } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { orderAPI } from '../../api/axios'

export default function Payment() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [method, setMethod] = useState('cash')
  const [cashGiven, setCashGiven] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [txn, setTxn] = useState(null)

  useEffect(() => {
    orderAPI.get(orderId)
      .then(({ data }) => setOrder(data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false))
  }, [orderId])

  const balance = method === 'cash' && cashGiven ? parseFloat(cashGiven) - parseFloat(order?.total_amount || 0) : null

  const handlePay = async () => {
    setProcessing(true)
    try {
      const { data } = await orderAPI.pay(orderId, {
        payment_method: method,
        cash_given: method === 'cash' ? cashGiven : null
      })
      setTxn(data)
      setSuccess(true)
    } catch { toast.error('Payment failed') }
    setProcessing(false)
  }

  const downloadReceipt = async () => {
    try {
      const { data } = await orderAPI.receipt(orderId)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `receipt_${orderId}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download receipt') }
  }

  if (loading) return <div className="min-h-screen bg-dark flex items-center justify-center"><div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="text-center max-w-sm w-full"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white font-display mb-2">Payment Done!</h2>
          <p className="text-white/50 mb-6">Order #{orderId} — Table {order?.table_number}</p>

          {method === 'cash' && balance !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="card border-green-500/20 bg-green-500/5 mb-6"
            >
              <p className="text-white/50 text-sm mb-1">Change / Balance</p>
              <p className="text-5xl font-bold text-green-400 font-display">₹{Math.abs(balance).toFixed(0)}</p>
              {balance < 0 && <p className="text-red-400 text-xs mt-1">⚠ Insufficient amount</p>}
            </motion.div>
          )}

          <div className="card mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/50">Total</span>
              <span className="text-gold font-bold">₹{order?.total_amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Method</span>
              <span className="text-white font-medium">{method.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={downloadReceipt} className="btn-outline flex-1 justify-center"><Printer size={15} /> Receipt</button>
            <button onClick={() => navigate('/')} className="btn-gold flex-1 justify-center">New Order</button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
          <h1 className="text-xl font-bold text-white font-display">Payment — Table {order?.table_number}</h1>
        </div>

        {/* Order Summary */}
        <div className="card mb-4">
          <h3 className="font-semibold text-white mb-3 text-sm">Order #{orderId} Summary</h3>
          <div className="space-y-2 mb-3">
            {order?.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-white/70">{item.menu_item_name} × {item.quantity}</span>
                <span className="text-white">₹{item.subtotal}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dark-border pt-3 flex justify-between">
            <span className="font-bold text-white">Total</span>
            <span className="text-2xl font-bold text-gold">₹{order?.total_amount}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { id: 'cash', label: 'Cash', icon: Banknote },
            { id: 'gpay', label: 'GPay', icon: Smartphone },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setMethod(id)}
              className={`card border-2 flex flex-col items-center gap-2 py-4 transition-all ${method === id ? 'border-gold bg-gold/10' : 'border-dark-border hover:border-gold/30'}`}>
              <Icon size={24} className={method === id ? 'text-gold' : 'text-white/40'} />
              <span className={`font-semibold ${method === id ? 'text-gold' : 'text-white/60'}`}>{label}</span>
            </button>
          ))}
        </div>

        {/* Cash input */}
        <AnimatePresence>
          {method === 'cash' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="card">
                <label className="label">Cash Received from Customer</label>
                <input className="input-field text-2xl font-bold text-center" type="number" min="0" step="1"
                  placeholder={`min ₹${order?.total_amount}`}
                  value={cashGiven} onChange={e => setCashGiven(e.target.value)} />
                {balance !== null && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`mt-3 p-3 rounded-xl text-center ${balance >= 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}
                  >
                    <p className="text-sm text-white/50">Change</p>
                    <p className={`text-4xl font-bold font-display ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ₹{Math.abs(balance).toFixed(0)}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {method === 'gpay' && (
          <div className="card mb-4 text-center py-4">
            <Smartphone size={40} className="text-blue-400 mx-auto mb-2" />
            <p className="text-white/60 text-sm">Customer paid via GPay</p>
            <p className="text-gold text-xl font-bold mt-1">₹{order?.total_amount}</p>
          </div>
        )}

        <button onClick={handlePay} disabled={processing || (method === 'cash' && (!cashGiven || balance < 0))}
          className="btn-gold w-full justify-center py-4 text-lg disabled:opacity-50">
          {processing ? <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={20} />}
          {processing ? 'Processing...' : 'Confirm Payment'}
        </button>
      </div>
    </div>
  )
}
