import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Sun, Sunset, Moon } from 'lucide-react'
import { employeeAPI } from '../../api/axios'

const pageAnim = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }
const SHIFT_ICONS = { Morning: Sun, Evening: Sunset, Night: Moon }
const SHIFT_COLORS = { Morning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', Evening: 'text-orange-400 bg-orange-400/10 border-orange-400/20', Night: 'text-blue-400 bg-blue-400/10 border-blue-400/20' }

export default function ShiftManagement() {
  const [employees, setEmployees] = useState([])
  useEffect(() => { employeeAPI.list().then(({ data }) => setEmployees(data)).catch(() => {}) }, [])

  const grouped = employees.reduce((acc, e) => {
    if (!acc[e.shift]) acc[e.shift] = []
    acc[e.shift].push(e)
    return acc
  }, {})

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <motion.div {...pageAnim}>
      <div className="mb-6">
        <h1 className="page-header">Shift Management</h1>
        <p className="page-subtitle">{today}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Morning', 'Evening', 'Night'].map((shift) => {
          const Icon = SHIFT_ICONS[shift]
          const staff = grouped[shift] || []
          return (
            <motion.div
              key={shift}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className={`card border ${SHIFT_COLORS[shift]}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${SHIFT_COLORS[shift]}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-white">{shift} Shift</p>
                  <p className="text-xs text-white/40">{staff.length} employee{staff.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {staff.length > 0 ? (
                <div className="space-y-2">
                  {staff.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-3 p-2 rounded-xl bg-dark/50">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{emp.name}</p>
                        <p className="text-xs text-white/40">{emp.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-sm text-center py-6">No staff assigned</p>
              )}
            </motion.div>
          )
        })}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-16 text-white/30">
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p>No employees added yet. Add employees to assign shifts.</p>
        </div>
      )}
    </motion.div>
  )
}
