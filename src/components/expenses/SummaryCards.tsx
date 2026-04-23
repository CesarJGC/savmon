import { MonthlySummary } from '@/types'
import { formatCLP } from '@/lib/utils'

interface SummaryCardsProps {
  summaries: MonthlySummary[]
  grandTotal: number
}

export function SummaryCards({ summaries, grandTotal }: SummaryCardsProps) {
  return (
    <div className="space-y-3">
      <div className="bg-indigo-600 text-white rounded-2xl p-4">
        <p className="text-indigo-200 text-sm">Total del mes</p>
        <p className="text-3xl font-bold mt-1">{formatCLP(grandTotal)}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {summaries.map((s) => (
          <div key={s.member} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-800">{s.member}</span>
              <span className="text-sm font-bold text-gray-900">{formatCLP(s.total)}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-yellow-600">Pendiente</span>
                <span className="font-medium text-yellow-700">{formatCLP(s.pendiente)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Pagado</span>
                <span className="font-medium text-green-700">{formatCLP(s.pagado)}</span>
              </div>
            </div>
            {s.total > 0 && (
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(s.pagado / s.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
