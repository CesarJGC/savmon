'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { formatCLP, getMonthName } from '@/lib/utils'

interface MonthlyData {
  label: string
  total: number
  pagado: number
  pendiente: number
}

interface MonthlyChartProps {
  data: MonthlyData[]
}

function formatK(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Gastos por mes</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatK} tick={{ fontSize: 11 }} width={55} />
          <Tooltip
            formatter={(value, name) => [
              formatCLP(value as number),
              name === 'pagado' ? 'Pagado' : name === 'pendiente' ? 'Pendiente' : 'Total',
            ]}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend formatter={(v) => v === 'pagado' ? 'Pagado' : 'Pendiente'} />
          <Bar dataKey="pagado" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
          <Bar dataKey="pendiente" stackId="a" fill="#fbbf24" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
