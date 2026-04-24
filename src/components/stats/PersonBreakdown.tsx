'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { formatCLP } from '@/lib/utils'

interface PersonData {
  person: string
  total: number
  pagado: number
  pendiente: number
}

const COLORS = ['#6366f1', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#64748b']

interface PersonBreakdownProps {
  data: PersonData[]
}

function formatK(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export function PersonBreakdown({ data }: PersonBreakdownProps) {
  const sorted = [...data].sort((a, b) => b.total - a.total)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Por persona</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(160, sorted.length * 40)}>
            <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tickFormatter={formatK} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="person" tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(v) => formatCLP(v as number)} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {sorted.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="space-y-2 mt-4">
            {sorted.map((d, i) => (
              <div key={d.person} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-gray-700 w-20 truncate">{d.person || '—'}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${d.total ? (d.pagado / d.total) * 100 : 0}%`, background: COLORS[i % COLORS.length], opacity: 0.7 }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-800 w-24 text-right">{formatCLP(d.total)}</span>
                <span className="text-xs text-yellow-600 w-20 text-right">{formatCLP(d.pendiente)} pend.</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
