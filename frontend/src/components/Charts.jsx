import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const GOLD = '#FFD700'
const GOLD_LIGHT = '#FFE566'
const COLORS = ['#FFD700', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#10B981', '#F97316']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-dark-card border border-gold/30 rounded-xl p-3 shadow-xl">
        {label && <p className="text-white/70 text-xs mb-1">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.dataKey?.includes('revenue') ? `₹${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function RevenueLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="date" tick={{ fill: '#ffffff60', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#ffffff60', fontSize: 11 }} tickLine={false} axisLine={false}
          tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2.5}
          dot={false} activeDot={{ r: 5, fill: GOLD }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CategoryPieChart({ data }) {
  const RADIAN = Math.PI / 180
  const label = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null
    const r = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={85} dataKey="value"
          labelLine={false} label={label}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(v) => <span style={{ color: '#ffffff80', fontSize: 12 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function TopItemsBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="name" tick={{ fill: '#ffffff60', fontSize: 10 }} tickLine={false} axisLine={false}
          angle={-25} textAnchor="end" />
        <YAxis tick={{ fill: '#ffffff60', fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="quantity" name="Qty Sold" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ProfitBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#ffffff60', fontSize: 11 }} tickLine={false} axisLine={false}
          tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#ffffff80', fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.type === 'profit' ? '#10B981' : entry.type === 'revenue' ? GOLD : '#EF4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
