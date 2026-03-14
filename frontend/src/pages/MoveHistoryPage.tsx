import { useEffect, useState } from 'react'
import api from '../utils/api'
import clsx from 'clsx'

const moveTypeColor: Record<string, string> = {
  receipt: 'text-green-600 bg-green-50',
  delivery: 'text-red-600 bg-red-50',
  internal: 'text-blue-600 bg-blue-50',
  adjustment: 'text-yellow-600 bg-yellow-50',
}

export default function MoveHistoryPage() {
  const [moves, setMoves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Re-use dashboard endpoint recent moves — or fetch from a dedicated history endpoint if you add one
    api.get('/dashboard/').then(res => {
      setMoves(res.data.recent_moves)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Move History</h1>
        <p className="text-sm text-gray-500 mt-0.5">Full stock ledger of all movements</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Type', 'Product', 'Qty Change', 'Reference', 'Date'].map(h => (
              <th key={h} className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>}
            {!loading && moves.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">No movements yet</td></tr>
            )}
            {moves.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <span className={clsx('text-xs font-medium px-2 py-1 rounded-md capitalize', moveTypeColor[m.move_type] || 'bg-gray-50 text-gray-600')}>
                    {m.move_type}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium text-gray-900">{m.product_name}</td>
                <td className="px-5 py-3">
                  <span className={clsx('font-semibold', m.quantity_change >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {m.quantity_change >= 0 ? '+' : ''}{m.quantity_change}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{m.reference}</td>
                <td className="px-5 py-3 text-gray-400 text-xs">{new Date(m.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
