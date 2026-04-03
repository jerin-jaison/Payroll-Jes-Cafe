import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Download, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { transactionAPI, tableAPI } from '../../api/axios'

const pageAnim = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }

export default function Transactions() {
  const [txns, setTxns] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [filters, setFilters] = useState({ date_from: '', date_to: '', payment: '', table: '' })

  const fetchTxns = async (p = page, f = filters) => {
    setLoading(true)
    try {
      const params = { page: p, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) }
      const { data } = await transactionAPI.list(params)
      setTxns(data.results); setTotal(data.total); setPages(data.pages)
    } catch { toast.error('Failed to load transactions') }
    setLoading(false)
  }

  useEffect(() => {
    tableAPI.list().then(({ data }) => setTables(data)).catch(() => {})
    fetchTxns()
  }, [])

  const handleFilter = (newF) => {
    setFilters(newF); setPage(1); fetchTxns(1, newF)
  }

  const handleExport = async (format) => {
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      const response = format === 'csv' ? await transactionAPI.exportCSV(params) : await transactionAPI.exportPDF(params)
      const mime = format === 'csv' ? 'text/csv' : 'application/pdf'
      const url = URL.createObjectURL(new Blob([response.data], { type: mime }))
      const a = document.createElement('a'); a.href = url
      a.download = `transactions.${format}`; a.click(); URL.revokeObjectURL(url)
      toast.success(`${format.toUpperCase()} downloaded!`)
    } catch { toast.error('Export failed') }
  }

  const totalAmount = txns.reduce((s, t) => s + parseFloat(t.amount), 0)

  return (
    <motion.div {...pageAnim}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Transactions</h1>
          <p className="page-subtitle">{total} total transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} className="btn-outline text-sm"><Download size={15}/> CSV</button>
          <button onClick={() => handleExport('pdf')} className="btn-gold text-sm"><Download size={15}/> PDF</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label">From Date</label>
            <input type="date" className="input-field" value={filters.date_from} onChange={e => handleFilter({ ...filters, date_from: e.target.value })} />
          </div>
          <div>
            <label className="label">To Date</label>
            <input type="date" className="input-field" value={filters.date_to} onChange={e => handleFilter({ ...filters, date_to: e.target.value })} />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="select-field" value={filters.payment} onChange={e => handleFilter({ ...filters, payment: e.target.value })}>
              <option value="">All</option>
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
            </select>
          </div>
          <div>
            <label className="label">Table</label>
            <select className="select-field" value={filters.table} onChange={e => handleFilter({ ...filters, table: e.target.value })}>
              <option value="">All Tables</option>
              {tables.map(t => <option key={t.id} value={t.number}>Table {t.number}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Total of filtered */}
      {txns.length > 0 && (
        <div className="flex justify-end mb-3">
          <span className="badge-gold">Page Total: ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th><th>Table</th><th>Employee</th><th>Amount</th><th>Method</th><th>Cash Given</th><th>Balance</th><th>Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div className="skeleton h-4 rounded" /></td>)}</tr>
              ))
            ) : txns.length > 0 ? txns.map((t) => (
              <tr key={t.id}>
                <td className="text-white/40 text-xs">#{t.id}</td>
                <td><span className="badge-gold">T{t.table_number}</span></td>
                <td className="text-white/70">{t.employee_name || '-'}</td>
                <td className="text-gold font-semibold">₹{Number(t.amount).toLocaleString()}</td>
                <td>
                  <span className={t.payment_method === 'gpay' ? 'badge-blue' : 'badge-green'}>
                    {t.payment_method.toUpperCase()}
                  </span>
                </td>
                <td className="text-white/60">{t.cash_given ? `₹${t.cash_given}` : '-'}</td>
                <td className={t.balance ? 'text-green-400' : 'text-white/40'}>{t.balance ? `₹${t.balance}` : '-'}</td>
                <td className="text-white/40 text-xs">{new Date(t.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
              </tr>
            )) : (
              <tr><td colSpan="8" className="text-center py-12 text-white/30">No transactions found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-white/40">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => { const p = page - 1; setPage(p); fetchTxns(p) }} className="btn-ghost disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <button disabled={page === pages} onClick={() => { const p = page + 1; setPage(p); fetchTxns(p) }} className="btn-ghost disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
