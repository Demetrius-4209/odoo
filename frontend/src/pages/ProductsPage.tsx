import { useEffect, useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Search, Package, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

interface Product {
  id: string; name: string; sku: string; category: string | null
  unit_of_measure: string; total_stock: number; reorder_level: number; is_low_stock: boolean
}
interface Category { id: string; name: string }
interface Warehouse { id: string; name: string }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '', sku: '', category_id: '', unit_of_measure: 'pcs',
    reorder_level: 0, initial_stock: 0, warehouse_id: ''
  })

  const fetchAll = () => {
    setLoading(true)
    Promise.all([
      api.get('/products/', { params: { search: search || undefined } }),
      api.get('/products/categories/all'),
      api.get('/warehouses/')
    ]).then(([p, c, w]) => {
      setProducts(p.data); setCategories(c.data); setWarehouses(w.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [search])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/products/', form)
      toast.success('Product created!')
      setShowModal(false)
      setForm({ name: '', sku: '', category_id: '', unit_of_measure: 'pcs', reorder_level: 0, initial_stock: 0, warehouse_id: '' })
      fetchAll()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error creating product')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} products</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or SKU..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Product', 'SKU', 'Category', 'UoM', 'Stock', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>}
            {!loading && products.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                No products found
              </td></tr>
            )}
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-5 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                <td className="px-5 py-3 text-gray-500">{p.category || '—'}</td>
                <td className="px-5 py-3 text-gray-500">{p.unit_of_measure}</td>
                <td className="px-5 py-3 font-semibold text-gray-900">{p.total_stock}</td>
                <td className="px-5 py-3">
                  {p.total_stock === 0
                    ? <span className="flex items-center gap-1 text-red-600 text-xs font-medium"><AlertTriangle size={12} />Out of Stock</span>
                    : p.is_low_stock
                    ? <span className="text-orange-500 text-xs font-medium">Low Stock</span>
                    : <span className="text-green-600 text-xs font-medium">In Stock</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-5">Add Product</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { label: 'Product Name', field: 'name', type: 'text', required: true },
                { label: 'SKU / Code', field: 'sku', type: 'text', required: true },
              ].map(({ label, field, type, required }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} required={required}
                    value={(form as any)[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                  <input value={form.unit_of_measure} onChange={e => setForm({ ...form, unit_of_measure: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input type="number" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: +e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                  <input type="number" value={form.initial_stock} onChange={e => setForm({ ...form, initial_stock: +e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                  <select value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">None</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
