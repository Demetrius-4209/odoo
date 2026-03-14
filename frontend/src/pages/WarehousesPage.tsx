import { useEffect, useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Warehouse, Pencil } from 'lucide-react'

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', location: '' })

  const fetchAll = () => api.get('/warehouses/').then(r => setWarehouses(r.data))
  useEffect(() => { fetchAll() }, [])

  const openCreate = () => { setEditing(null); setForm({ name: '', location: '' }); setShowModal(true) }
  const openEdit = (w: any) => { setEditing(w); setForm({ name: w.name, location: w.location || '' }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/warehouses/${editing.id}`, form)
        toast.success('Warehouse updated!')
      } else {
        await api.post('/warehouses/', form)
        toast.success('Warehouse created!')
      }
      setShowModal(false)
      fetchAll()
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Error') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your storage locations</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Add Warehouse
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Warehouse size={40} className="mx-auto mb-3 opacity-30" />
            <p>No warehouses yet. Add one to get started.</p>
          </div>
        )}
        {warehouses.map(w => (
          <div key={w.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Warehouse size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{w.name}</p>
                <p className="text-sm text-gray-400">{w.location || 'No location set'}</p>
              </div>
            </div>
            <button onClick={() => openEdit(w)} className="text-gray-400 hover:text-gray-600">
              <Pencil size={15} />
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-5">{editing ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Main Warehouse"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Block A, Floor 2"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">
                  {editing ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
