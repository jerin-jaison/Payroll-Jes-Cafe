import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'gold', trend, delay = 0 }) {
  const colors = {
    gold: {
      bg: 'from-gold/10 to-gold/5',
      border: 'border-gold/20 hover:border-gold/40',
      icon: 'bg-gold/20 text-gold',
      text: 'text-gold',
      glow: 'hover:shadow-[0_0_25px_rgba(255,215,0,0.12)]',
    },
    green: {
      bg: 'from-green-500/10 to-green-500/5',
      border: 'border-green-500/20 hover:border-green-500/40',
      icon: 'bg-green-500/20 text-green-400',
      text: 'text-green-400',
      glow: 'hover:shadow-[0_0_25px_rgba(34,197,94,0.12)]',
    },
    blue: {
      bg: 'from-blue-500/10 to-blue-500/5',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      icon: 'bg-blue-500/20 text-blue-400',
      text: 'text-blue-400',
      glow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.12)]',
    },
    purple: {
      bg: 'from-purple-500/10 to-purple-500/5',
      border: 'border-purple-500/20 hover:border-purple-500/40',
      icon: 'bg-purple-500/20 text-purple-400',
      text: 'text-purple-400',
      glow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.12)]',
    },
  }
  const c = colors[color] || colors.gold

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300 ${c.bg} ${c.border} ${c.glow}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon size={22} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            trend >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className={`text-3xl font-bold font-display mb-1 ${c.text}`}>{value}</p>
        <p className="text-sm font-medium text-white/80">{title}</p>
        {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  )
}
