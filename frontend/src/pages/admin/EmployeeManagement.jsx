import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Users, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../../components/Modal'
import { employeeAPI } from '../../api/axios'

const pageAnim = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }
const ROLES = ['Manager', 'Barista', 'Waiter', 'Receptionist']
const SHIFTS = ['Morning', 'Evening', 'Night']
const ROLE_COLORS = { Manager: 'text-gold badge-gold', Barista: 'text-blue-400 badge-blue', Waiter: 'text-green-400 badge-green', Receptionist: 'text-purple-400' }

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showHoursModal, setShowHoursModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', role: 'Barista', contact: '', salary: '', shift: 'Morning', joining_date: new Date().toISOString().split('T')[0], worked_hours: 0 })
  const [hoursEmp, setHoursEmp] = useState(null)
  const [newHours, setNewHours] = useState('')

  const fetch = async () => {
    setLoading(true)
    try { const { data } = await employeeAPI.list(); setEmployees(data) }
    catch { toast.error('Failed to load employees') }
    setLoading(false)
  }
  useEffect(() => { fetch() }, [])

  const openAdd = () => { setEditing(null); setForm({ name: '', role: 'Barista', contact: '', salary: '', shift: 'Morning', joining_date: new Date().toISOString().split('T')[0], worked_hours: 0 }); setShowModal(true) }
  const openEdit = (e) => { setEditing(e); setForm({ ...e }); setShowModal(true) }

  const handleSubmit = async () => {
    if (!form.name || !form.salary) return toast.error('Fill required fields')
    try {
      if (editing) await employeeAPI.update(editing.id, form)
      else await employeeAPI.create(form)
      toast.success(editing ? 'Employee updated!' : 'Employee added!')
      setShowModal(false); fetch()
    } catch { toast.error('Save failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete employee?')) return
    await employeeAPI.delete(id)
    toast.success('Employee removed'); fetch()
  }

  const handleUpdateHours = async () => {
    await employeeAPI.updateHours(hoursEmp.id, newHours)
    toast.success('Hours updated!'); setShowHoursModal(false); fetch()
  }

  const totalSalary = employees.reduce((s, e) => s + parseFloat(e.salary), 0)

  return (
    <motion.div {...pageAnim}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Employees</h1>
          <p className="page-subtitle">{employees.length} staff • Monthly payroll: ₹{totalSalary.toLocaleString('en-IN')}</p>
        </div>
        <button onClick={openAdd} className="btn-gold"><Plus size={16} /> Add Employee</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp, i) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="card group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{emp.name}</p>
                    <span className={`badge-gold text-xs`}>{emp.role}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-gold transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-white/40">Contact</span><span className="text-white/80">{emp.contact}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Salary</span><span className="text-gold font-semibold">₹{Number(emp.salary).toLocaleString()}/mo</span></div>
                <div className="flex justify-between"><span className="text-white/40">Shift</span><span className="text-white/70">{emp.shift}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Joined</span><span className="text-white/70">{emp.joining_date}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 flex items-center gap-1"><Clock size={12} /> Hours</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/80">{emp.worked_hours}h</span>
                    <button onClick={() => { setHoursEmp(emp); setNewHours(emp.worked_hours); setShowHoursModal(true) }}
                      className="text-xs btn-gold py-0.5 px-2 text-[10px]">Update</button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Employee Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Employee' : 'Add Employee'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input className="input-field" placeholder="Employee name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="select-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Shift</label>
              <select className="select-field" value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}>
                {SHIFTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Contact</label>
              <input className="input-field" placeholder="Phone number" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div>
              <label className="label">Monthly Salary (₹) *</label>
              <input className="input-field" type="number" min="0" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
            </div>
            <div>
              <label className="label">Joining Date</label>
              <input className="input-field" type="date" value={form.joining_date} onChange={e => setForm({ ...form, joining_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Worked Hours (this month)</label>
              <input className="input-field" type="number" min="0" value={form.worked_hours} onChange={e => setForm({ ...form, worked_hours: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button onClick={handleSubmit} className="btn-gold flex-1 justify-center">{editing ? 'Update' : 'Add'}</button>
          </div>
        </div>
      </Modal>

      {/* Update Hours Modal */}
      <Modal isOpen={showHoursModal} onClose={() => setShowHoursModal(false)} title={`Update Hours – ${hoursEmp?.name}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Worked Hours This Month</label>
            <input className="input-field" type="number" min="0" value={newHours} onChange={e => setNewHours(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowHoursModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button onClick={handleUpdateHours} className="btn-gold flex-1 justify-center">Save</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
