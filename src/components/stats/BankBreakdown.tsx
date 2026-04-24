'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCLP } from '@/lib/utils'
import { BANK_TABS } from '@/lib/utils'

interface BankData {
  bank: string
  total: number
}

const COLORS = ['#6366f1', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#64748b']

interface BankBreakdownProps {
  data: BankData[]
}

export function BankBreakdown({ data }: BankBreakdownProps) {
  const total = data.reduce((s, d) => s + d.total, 0)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Por banco</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data} dataKey="total" nameKey="bank" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCLP(v as number)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {data.map((d, i) => {
              const label = BANK_TABS.find(b => b.key === d.bank)?.label ?? d.bank
              const pct = total ? ((d.total / total) * 100).toFixed(0) : 0
              return (
                <div key={d.bank} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-700">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{pct}%</span>
                    <span className="font-semibold text-gray-800">{formatCLP(d.total)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
