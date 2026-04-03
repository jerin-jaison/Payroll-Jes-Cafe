import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, TrendingUp, TrendingDown, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ProfitBarChart } from '../../components/Charts'
import { profitAPI, expenseAPI, reportAPI } from '../../api/axios'

const pageAnim = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }
const EXP_CATS = ['rent', 'electricity', 'raw_materials', 'miscellaneous', 'marketing', 'maintenance']

export default function ProfitCalculator() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showExpForm, setShowExpForm] = useState(false)
  const [expForm, setExpForm] = useState({ category: 'rent', amount: '', description: '' })
  const [genLoading, setGenLoading] = useState(false)

  const fetchProfit = async () => {
    setLoading(true)
    try { const { data: d } = await profitAPI.get({ month, year }); setData(d) }
    catch { toast.error('Failed to fetch profit data') }
    setLoading(false)
  }

  useEffect(() => { fetchProfit() }, [month, year])

  const handleAddExpense = async () => {
    if (!expForm.amount) return toast.error('Amount required')
    await expenseAPI.create({ ...expForm, month, year })
    toast.success('Expense added!')
    setShowExpForm(false); setExpForm({ category: 'rent', amount: '', description: '' })
    fetchProfit()
  }

  const handleDeleteExpense = async (id) => {
    await expenseAPI.delete(id)
    toast.success('Expense removed'); fetchProfit()
  }

  const handleDownloadReport = async () => {
    setGenLoading(true)
    try {
      const response = await reportAPI.generate({ month, year })
      const url = URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a'); a.href = url
      a.download = `kasa_brew_report_${month}_${year}.pdf`; a.click()
      URL.revokeObjectURL(url); toast.success('Report downloaded!')
    } catch { toast.error('Report generation failed') }
    setGenLoading(false)
  }

  const chartData = data ? [
    { name: 'Revenue', amount: data.total_revenue, type: 'revenue' },
    { name: 'Salaries', amount: data.total_salaries, type: 'expense' },
    { name: 'Expenses', amount: data.total_expenses, type: 'expense' },
    { name: 'Net Profit', amount: Math.abs(data.net_profit), type: data.net_profit >= 0 ? 'profit' : 'expense' },
  ] : []

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  const isProfit = data?.net_profit >= 0

  return (
    <motion.div {...pageAnim}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Profit Calculator</h1>
          <p className="page-subtitle">Monthly financial overview</p>
        </div>
        <div className="flex gap-3">
          <select className="select-field" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>
            ))}
          </select>
          <select className="select-field" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={handleDownloadReport} disabled={genLoading} className="btn-outline">
            <Download size={16} /> {genLoading ? 'Generating...' : 'PDF Report'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card border-gold/20 text-center">
              <p className="text-xs text-white/50 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gold">{fmt(data.total_revenue)}</p>
            </div>
            <div className="card border-red-500/20 text-center">
              <p className="text-xs text-white/50 mb-1">Salaries</p>
              <p className="text-2xl font-bold text-red-400">-{fmt(data.total_salaries)}</p>
            </div>
            <div className="card border-orange-500/20 text-center">
              <p className="text-xs text-white/50 mb-1">Expenses</p>
              <p className="text-2xl font-bold text-orange-400">-{fmt(data.total_expenses)}</p>
            </div>
            <motion.div
              animate={{ boxShadow: isProfit ? ['0 0 0 rgba(34,197,94,0)', '0 0 20px rgba(34,197,94,0.3)', '0 0 0 rgba(34,197,94,0)'] : [] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`card text-center border ${isProfit ? 'border-green-500/30' : 'border-red-500/30'}`}
            >
              <p className="text-xs text-white/50 mb-1">Net Profit</p>
              <div className={`flex items-center justify-center gap-1 text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {fmt(Math.abs(data.net_profit))}
              </div>
              <p className={`text-xs mt-1 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>{isProfit ? 'Profit' : 'Loss'}</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart */}
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Breakdown Chart</h3>
              <ProfitBarChart data={chartData} />
            </div>

            {/* Expense List */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Manual Expenses</h3>
                <button onClick={() => setShowExpForm(!showExpForm)} className="btn-gold text-xs py-1.5 px-3">
                  <Plus size={13} /> Add
                </button>
              </div>
              {showExpForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-3 rounded-xl bg-dark border border-dark-border space-y-3">
                  <select className="select-field" value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
                    {EXP_CATS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                  <input className="input-field" type="number" placeholder="Amount (₹)" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} />
                  <input className="input-field" placeholder="Description (optional)" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowExpForm(false)} className="btn-ghost flex-1 justify-center text-sm">Cancel</button>
                    <button onClick={handleAddExpense} className="btn-gold flex-1 justify-center text-sm">Add Expense</button>
                  </div>
                </motion.div>
              )}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {data.expenses?.length > 0 ? data.expenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-dark-border/50">
                    <div>
                      <p className="text-sm text-white capitalize">{e.category.replace('_', ' ')}</p>
                      {e.description && <p className="text-xs text-white/40">{e.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-red-400 font-semibold text-sm">-₹{e.amount}</p>
                      <button onClick={() => handleDeleteExpense(e.id)} className="text-white/30 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-white/30 text-sm py-8">No expenses this month</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
