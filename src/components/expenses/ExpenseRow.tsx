'use client'
import { Expense } from '@/types'
import { formatCLP, formatInstallment } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react'

interface ExpenseRowProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, status: string) => void
}

const memberColors: Record<string, 'indigo' | 'blue' | 'green' | 'yellow' | 'gray'> = {
  César: 'indigo',
  Nices: 'blue',
  Nicole: 'green',
  Ximena: 'yellow',
  Otro: 'gray',
}

export function ExpenseRow({ expense, onEdit, onDelete, onToggleStatus }: ExpenseRowProps) {
  const isPaid = expense.status === 'pagado'

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isPaid ? 'opacity-60' : ''}`}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStatus(expense.id, expense.status)}
            className="text-gray-400 hover:text-indigo-600 transition-colors"
            title={isPaid ? 'Marcar pendiente' : 'Marcar pagado'}
          >
            {isPaid
              ? <CheckCircle2 className="w-5 h-5 text-green-500" />
              : <Circle className="w-5 h-5" />}
          </button>
          <div>
            <p className={`text-sm font-medium ${isPaid ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {expense.description}
            </p>
            {expense.category && (
              <p className="text-xs text-gray-400">{expense.category}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm font-semibold text-gray-800">
        {formatCLP(expense.amount)}
      </td>
      <td className="py-3 px-4">
        <Badge color={memberColors[expense.paid_by] ?? 'gray'}>{expense.paid_by}</Badge>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 text-center">
        {formatInstallment(expense.installment_current, expense.installment_total)}
      </td>
      <td className="py-3 px-4">
        <Badge color={isPaid ? 'green' : 'yellow'}>
          {isPaid ? 'Pagado' : 'Pendiente'}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => onEdit(expense)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(expense.id)}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
