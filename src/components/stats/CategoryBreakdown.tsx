'use client'
import { formatCLP } from '@/lib/utils'

interface CategoryData {
  category: string
  total: number
  count: number
}

interface CategoryBreakdownProps {
  data: CategoryData[]
}

const CAT_COLORS: Record<string, string> = {
  'Supermercado': '#10b981',
  'Restaurante / Comida': '#f59e0b',
  'Transporte': '#3b82f6',
  'Combustible': '#6366f1',
  'Salud / Farmacia': '#ef4444',
  'Mascotas': '#ec4899',
  'Hogar / Depto': '#8b5cf6',
  'Tecnología': '#64748b',
  'Entretenimiento': '#f97316',
  'Ropa / Calzado': '#14b8a6',
  'Servicios básicos': '#06b6d4',
  'Viajes': '#84cc16',
  'Gastos bancarios': '#94a3b8',
  'Seguros': '#a78bfa',
  'Educación': '#fbbf24',
  'Otro': '#cbd5e1',
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const sorted = [...data].sort((a, b) => b.total - a.total)
  const maxTotal = sorted[0]?.total ?? 1

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Por categoría</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((d) => {
            const color = CAT_COLORS[d.category] ?? '#cbd5e1'
            const pct = (d.total / maxTotal) * 100
            return (
              <div key={d.category}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium">{d.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{d.count} gastos</span>
                    <span className="font-semibold text-gray-800">{formatCLP(d.total)}</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
