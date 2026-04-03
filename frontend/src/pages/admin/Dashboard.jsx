import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { IndianRupee, ShoppingBag, Grid3X3, Coffee, TrendingUp, AlertTriangle } from 'lucide-react'
import StatCard from '../../components/StatCard'
import { RevenueLineChart, CategoryPieChart, TopItemsBarChart } from '../../components/Charts'
import { dashboardAPI } from '../../api/axios'

const pageAnim = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.stats()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`

  return (
    <motion.div {...pageAnim}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-header">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's what's happening at KASA BREW today.</p>
      </div>

      {/* Low stock alert */}
      {stats?.low_stock_count > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 flex items-center gap-3"
        >
          <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-400">
            <strong>{stats.low_stock_count} item(s)</strong> are running low on stock. Check Inventory.
          </p>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Today's Revenue" value={fmt(stats?.today_revenue)} subtitle="Sales today" icon={IndianRupee} color="gold" delay={0} />
        <StatCard title="Monthly Revenue" value={fmt(stats?.month_revenue)} subtitle="This month" icon={TrendingUp} color="green" delay={0.1} />
        <StatCard title="Today's Orders" value={stats?.today_orders ?? 0} subtitle="Orders placed" icon={ShoppingBag} color="blue" delay={0.2} />
        <StatCard title="Active Tables" value={`${stats?.active_tables ?? 0}/${stats?.total_tables ?? 0}`} subtitle="Occupied now" icon={Grid3X3} color="purple" delay={0.3} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card lg:col-span-2"
        >
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-gold" /> Revenue — Last 30 Days
          </h3>
          <RevenueLineChart data={stats?.daily_revenue ?? []} />
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Coffee size={16} className="text-gold" /> Sales by Category
          </h3>
          {stats?.category_sales?.length > 0 ? (
            <CategoryPieChart data={stats.category_sales} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-white/30 text-sm">No data yet</div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Items */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="card"
        >
          <h3 className="font-semibold text-white mb-4">🏆 Top 5 Best Sellers</h3>
          {stats?.top_items?.length > 0 ? (
            <TopItemsBarChart data={stats.top_items} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-white/30 text-sm">No data yet</div>
          )}
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="font-semibold text-white mb-4">Recent Transactions</h3>
          <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {stats?.recent_transactions?.length > 0 ? stats.recent_transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-dark-border/50 last:border-0">
                <div>
                  <p className="text-sm text-white font-medium">Table {t.table} — {t.employee}</p>
                  <p className="text-xs text-white/40">{t.timestamp}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gold">₹{t.amount}</p>
                  <span className={`text-xs ${t.payment_method === 'gpay' ? 'text-blue-400' : 'text-green-400'}`}>
                    {t.payment_method.toUpperCase()}
                  </span>
                </div>
              </div>
            )) : (
              <div className="h-[200px] flex items-center justify-center text-white/30 text-sm">No recent transactions</div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-7 w-40 rounded-xl" />
        <div className="skeleton h-4 w-60 rounded-lg" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="skeleton h-64 col-span-2 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  )
}
