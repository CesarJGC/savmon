'use client'
import { useState, useRef, useEffect } from 'react'
import { Expense } from '@/types'
import { formatCLP, formatInstallment, CATEGORIES } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Pencil, Trash2, CheckCircle2, Circle, Users } from 'lucide-react'

interface ExpenseRowProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, status: string) => void
  onUpdate: (id: string, updates: Partial<Pick<Expense, 'paid_by' | 'category'>>) => void
  knownPersons: string[]
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
}

export function ExpenseRow({ expense, onEdit, onDelete, onToggleStatus, onUpdate, knownPersons, selected, onSelect }: ExpenseRowProps) {
  const isPaid = expense.status === 'pagado'
  const [activeField, setActiveField] = useState<'paid_by' | 'category' | null>(null)
  const paidByRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeField) return
    function onDown(e: MouseEvent) {
      const ref = activeField === 'paid_by' ? paidByRef : categoryRef
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setActiveField(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [activeField])

  function selectPaidBy(person: string) {
    onUpdate(expense.id, { paid_by: person })
    setActiveField(null)
  }

  function selectCategory(cat: string) {
    onUpdate(expense.id, { category: cat || undefined })
    setActiveField(null)
  }

  const toggle = (field: 'paid_by' | 'category') =>
    setActiveField(prev => (prev === field ? null : field))

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isPaid ? 'opacity-60' : ''} ${selected ? 'bg-indigo-50 hover:bg-indigo-50' : ''}`}>

      {/* Checkbox */}
      <td className="py-3 px-4 w-8">
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onSelect(expense.id, e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
        />
      </td>

      {/* Descripción + categoría editable */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStatus(expense.id, expense.status)}
            className="text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0"
            title={isPaid ? 'Marcar pendiente' : 'Marcar pagado'}
          >
            {isPaid ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
          </button>
          <div>
            <p className={`text-sm font-medium ${isPaid ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {expense.description}
            </p>

            {/* Categoría inline */}
            <div className="relative inline-block" ref={categoryRef}>
              <button
                onClick={() => toggle('category')}
                className={`text-xs transition-colors ${expense.category ? 'text-gray-500 hover:text-indigo-600' : 'text-gray-300 hover:text-indigo-500'}`}
              >
                {expense.category || 'Sin categoría'}
              </button>
              {activeField === 'category' && (
                <div className="absolute left-0 top-5 z-30 bg-white shadow-xl rounded-xl border border-gray-200 py-1.5 w-48 max-h-52 overflow-y-auto">
                  <button
                    onClick={() => selectCategory('')}
                    className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${!expense.category ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}
                  >
                    Sin categoría
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => selectCategory(cat)}
                      className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 hover:text-indigo-700 ${expense.category === cat ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-gray-700'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {expense.split_members && expense.split_members.length > 1 && (
              <p className="text-xs text-indigo-400 flex items-center gap-0.5 mt-0.5">
                <Users className="w-3 h-3" /> ÷{expense.split_members.length} personas
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Monto */}
      <td className="py-3 px-4 text-sm font-semibold text-gray-800">
        {formatCLP(expense.amount)}
      </td>

      {/* Corresponde a — editable con chips */}
      <td className="py-3 px-4">
        <div className="relative inline-block" ref={paidByRef}>
          <button onClick={() => toggle('paid_by')} className="text-left">
            {expense.paid_by
              ? <Badge color="indigo" className="cursor-pointer hover:opacity-80">{expense.paid_by}</Badge>
              : <span className="text-xs text-gray-300 hover:text-gray-500 transition-colors">— asignar</span>}
          </button>
          {activeField === 'paid_by' && (
            <div className="absolute left-0 top-7 z-30 bg-white shadow-xl rounded-xl border border-gray-200 p-2.5 min-w-[150px]">
              {knownPersons.length === 0 ? (
                <p className="text-xs text-gray-400 px-1">No hay personas guardadas</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {knownPersons.map(p => (
                    <button
                      key={p}
                      onClick={() => selectPaidBy(p)}
                      className={`px-2.5 py-1 text-xs rounded-full border font-medium transition-colors ${
                        expense.paid_by === p
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </td>

      {/* Cuota */}
      <td className="py-3 px-4 text-sm text-gray-600 text-center">
        {formatInstallment(expense.installment_current, expense.installment_total)}
      </td>

      {/* Estado */}
      <td className="py-3 px-4">
        <button onClick={() => onToggleStatus(expense.id, expense.status)}>
          <Badge color={isPaid ? 'green' : 'yellow'} className="cursor-pointer hover:opacity-80">
            {isPaid ? 'Pagado' : 'Pendiente'}
          </Badge>
        </button>
      </td>

      {/* Acciones */}
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
