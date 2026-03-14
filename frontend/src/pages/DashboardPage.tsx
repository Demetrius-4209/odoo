import { useEffect, useState } from 'react'
import api from '../utils/api'
import { Package, TrendingDown, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react'
import clsx from 'clsx'

interface KPIs {
  total_products: number
  low_stock_items: number
  out_of_stock_items: number
  pending_receipts: number
  pending_deliveries: number
  pending_transfers: number
}

interface Move {
  id: string
  product_name: string
  move_type: string
  quantity_change: number
  reference: string
  created_at: string
}

const KPICard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
    <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
)

const moveTypeColor: Record<string, string> = {
  receipt: 'text-green-600 bg-green-50',
  delivery: 'text-red-600 bg-red-50',
  internal: 'text-blue-600 bg-blue-50',
  adjustment: 'text-yellow-600 bg-yellow-50',
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [moves, setMoves] = useState<Move[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/').then(res => {
      setKpis(res.data.kpis)
      setMoves(res.data.recent_moves)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time inventory overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Total Products" value={kpis?.total_products} icon={Package} color="bg-blue-500" />
        <KPICard label="Low Stock Items" value={kpis?.low_stock_items} icon={TrendingDown} color="bg-orange-500" />
        <KPICard label="Out of Stock" value={kpis?.out_of_stock_items} icon={AlertTriangle} color="bg-red-500" />
        <KPICard label="Pending Receipts" value={kpis?.pending_receipts} icon={ArrowDownToLine} color="bg-green-500" />
        <KPICard label="Pending Deliveries" value={kpis?.pending_deliveries} icon={ArrowUpFromLine} color="bg-purple-500" />
        <KPICard label="Pending Transfers" value={kpis?.pending_transfers} icon={ArrowLeftRight} color="bg-teal-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Stock Movements</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {moves.length === 0 && (
            <p className="text-center text-gray-400 py-10">No movements yet</p>
          )}
          {moves.map(m => (
            <div key={m.id} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <span className={clsx('text-xs font-medium px-2 py-1 rounded-md capitalize', moveTypeColor[m.move_type] || 'text-gray-600 bg-gray-50')}>
                  {m.move_type}
                </span>
                <span className="text-sm text-gray-700 font-medium">{m.product_name}</span>
                <span className="text-xs text-gray-400">{m.reference}</span>
              </div>
              <span className={clsx('text-sm font-semibold', m.quantity_change >= 0 ? 'text-green-600' : 'text-red-600')}>
                {m.quantity_change >= 0 ? '+' : ''}{m.quantity_change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
