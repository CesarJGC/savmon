import { cn, formatCLP } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  sub?: string
  trend?: number        // % cambio vs mes anterior (positivo = subió)
  isCurrency?: boolean
  color?: 'default' | 'indigo' | 'green' | 'yellow' | 'red'
}

const colors = {
  default: 'bg-white',
  indigo:  'bg-indigo-600 text-white',
  green:   'bg-green-50',
  yellow:  'bg-yellow-50',
  red:     'bg-red-50',
}

export function StatCard({ title, value, sub, trend, isCurrency = false, color = 'default' }: StatCardProps) {
  const isInverted = color === 'indigo'
  const display = isCurrency ? formatCLP(Number(value)) : value

  return (
    <div className={cn('rounded-2xl p-5 shadow-sm border border-gray-100', colors[color])}>
      <p className={cn('text-sm font-medium', isInverted ? 'text-indigo-200' : 'text-gray-600')}>{title}</p>
      <p className={cn('text-2xl font-bold mt-1', isInverted ? 'text-white' : 'text-gray-900')}>{display}</p>
      <div className="flex items-center gap-2 mt-1">
        {trend !== undefined && (
          <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded-full',
            trend > 0 ? 'bg-red-100 text-red-700' : trend < 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          )}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '='} {Math.abs(trend).toFixed(0)}%
          </span>
        )}
        {sub && <p className={cn('text-xs', isInverted ? 'text-indigo-200' : 'text-gray-500')}>{sub}</p>}
      </div>
    </div>
  )
}
