import { useEffect, useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

const statusColor: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', done: 'bg-green-100 text-green-700', canceled: 'bg-red-100 text-red-600',
}

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ warehouse_id: '', reason: '', lines: [{ product_id: '', recorded_qty: 0, actual_qty: 0 }] })

  const fetchAll = () => {
    Promise.all([api.get('/adjustments/'), api.get('/products/'), api.get('/warehouses/')]).then(([a, p, w]) => {
      setAdjustments(a.data); setProducts(p.data); setWarehouses(w.data)
    })
  }
  useEffect(() => { fetchAll() }, [])

  const addLine = () => setForm({ ...form, lines: [...form.lines, { product_id: '', recorded_qty: 0, actual_qty: 0 }] })
  const updateLine = (i: number, field: string, value: any) => {
    const lines = [...form.lines]; (lines[i] as any)[field] = value; setForm({ ...form, lines })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/adjustments/', form)
      toast.success('Adjustment created!')
      setShowModal(false)
      setForm({ warehouse_id: '', reason: '', lines: [{ product_id: '', recorded_qty: 0, actual_qty: 0 }] })
      fetchAll()
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const validate = async (id: string) => {
    try { await api.post(`/adjustments/${id}/validate`); toast.success('Stock adjusted!'); fetchAll() }
    catch (err: any) { toast.error(err.response?.data?.detail || 'Error') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fix mismatches between recorded and physical stock</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> New Adjustment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Reference', 'Warehouse', 'Reason', 'Status', 'Date', 'Actions'].map(h => (
              <th key={h} className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {adjustments.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No adjustments yet</td></tr>}
            {adjustments.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-xs text-gray-700">{a.reference}</td>
                <td className="px-5 py-3 text-gray-700">{warehouses.find(w => w.id === a.warehouse_id)?.name || '—'}</td>
                <td className="px-5 py-3 text-gray-500">{a.reason || '—'}</td>
                <td className="px-5 py-3">
                  <span className={clsx('text-xs font-medium px-2 py-1 rounded-md capitalize', statusColor[a.status] || 'bg-gray-100 text-gray-600')}>{a.status}</span>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  {a.status === 'draft' && (
                    <button onClick={() => validate(a.id)} className="flex items-center gap-1 text-green-600 hover:text-green-700 text-xs font-medium">
                      <CheckCircle size={14} /> Apply
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-5">New Stock Adjustment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                  <select required value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                    placeholder="e.g. Physical count"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Products</label>
                  <button type="button" onClick={addLine} className="text-blue-600 text-xs font-medium">+ Add line</button>
                </div>
                {form.lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                    <select value={line.product_id} onChange={e => updateLine(i, 'product_id', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" placeholder="Recorded Qty" value={line.recorded_qty}
                      onChange={e => updateLine(i, 'recorded_qty', +e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" placeholder="Actual Qty" value={line.actual_qty}
                      onChange={e => updateLine(i, 'actual_qty', +e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Create Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
