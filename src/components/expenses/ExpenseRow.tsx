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
  onUpdate: (id: string, updates: Partial<Pick<Expense, 'paid_by' | 'category' | 'split_members'>>) => void
  knownPersons: string[]
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
}

export function ExpenseRow({ expense, onEdit, onDelete, onToggleStatus, onUpdate, knownPersons, selected, onSelect }: ExpenseRowProps) {
  const isPaid = expense.status === 'pagado'
  const [activeField, setActiveField] = useState<'paid_by' | 'category' | null>(null)
  const [newPerson, setNewPerson] = useState('')
  // Split state dentro del picker
  const [splitMode, setSplitMode] = useState(false)
  const [splitSel, setSplitSel] = useState<string[]>(expense.split_members ?? [])
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

  function openPicker() {
    setSplitMode(!!(expense.split_members && expense.split_members.length > 1))
    setSplitSel(expense.split_members ?? [])
    setNewPerson('')
    setActiveField(prev => (prev === 'paid_by' ? null : 'paid_by'))
  }

  function selectPaidBy(person: string) {
    onUpdate(expense.id, { paid_by: person, split_members: undefined })
    setNewPerson('')
    setActiveField(null)
  }

  function toggleSplitPerson(person: string) {
    setSplitSel(prev =>
      prev.includes(person) ? prev.filter(p => p !== person) : [...prev, person]
    )
  }

  function addNewAndToggle(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    setNewPerson('')
    if (!allPersons.includes(trimmed)) {
      // persona nueva: añadir al split selection si split activo, o asignar directo
      if (splitMode) setSplitSel(prev => prev.includes(trimmed) ? prev : [...prev, trimmed])
    } else {
      if (splitMode) toggleSplitPerson(trimmed)
      else selectPaidBy(trimmed)
    }
  }

  function saveSplit() {
    if (splitSel.length < 2) return
    // El pagador es el paid_by actual o el primero del split
    const payer = expense.paid_by || splitSel[0]
    onUpdate(expense.id, { paid_by: payer, split_members: splitSel })
    setActiveField(null)
  }

  function selectCategory(cat: string) {
    onUpdate(expense.id, { category: cat || undefined })
    setActiveField(null)
  }

  const allPersons = Array.from(new Set([...knownPersons, ...(expense.paid_by ? [expense.paid_by] : [])]))

  const toggle = (field: 'category') =>
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
                className={`text-xs transition-colors ${expense.category ? 'text-gray-600 hover:text-indigo-600' : 'text-gray-400 hover:text-indigo-500'}`}
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

      {/* Corresponde a — editable con chips + split */}
      <td className="py-3 px-4">
        <div className="relative inline-block" ref={paidByRef}>
          <button onClick={openPicker} className="text-left">
            {expense.paid_by
              ? <Badge color="indigo" className="cursor-pointer hover:opacity-80">{expense.paid_by}</Badge>
              : <span className="text-xs text-gray-400 hover:text-gray-600 transition-colors">— asignar</span>}
          </button>

          {activeField === 'paid_by' && (
            <div className="absolute left-0 top-7 z-30 bg-white shadow-xl rounded-xl border border-gray-200 p-3 w-56">

              {/* Toggle modo split */}
              <button
                onClick={() => {
                  const next = !splitMode
                  setSplitMode(next)
                  if (next) setSplitSel(expense.split_members?.length ? expense.split_members : (expense.paid_by ? [expense.paid_by] : []))
                  else setSplitSel([])
                }}
                className={`flex items-center gap-1.5 w-full text-xs font-medium px-2 py-1.5 rounded-lg mb-2 transition-colors ${
                  splitMode ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                {splitMode ? 'Dividir entre:' : 'Solo asignar · activar división →'}
              </button>

              {/* Chips */}
              {allPersons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allPersons.map(p => {
                    const isActive = splitMode ? splitSel.includes(p) : expense.paid_by === p
                    return (
                      <button
                        key={p}
                        onClick={() => splitMode ? toggleSplitPerson(p) : selectPaidBy(p)}
                        className={`px-2.5 py-1 text-xs rounded-full border font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-700'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Input nombre nuevo */}
              <form
                onSubmit={e => { e.preventDefault(); addNewAndToggle(newPerson) }}
                className="flex gap-1 mb-2"
              >
                <input
                  autoFocus={allPersons.length === 0}
                  value={newPerson}
                  onChange={e => setNewPerson(e.target.value)}
                  placeholder="Nuevo nombre..."
                  className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  disabled={!newPerson.trim()}
                  className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-lg disabled:opacity-40 hover:bg-indigo-700"
                >
                  +
                </button>
              </form>

              {/* Preview split + botón guardar */}
              {splitMode && (
                <>
                  {splitSel.length > 1 && (
                    <p className="text-xs text-indigo-600 mb-1.5">
                      {formatCLP(Math.round(expense.amount / splitSel.length))} c/u · {splitSel.length} personas
                    </p>
                  )}
                  <button
                    onClick={saveSplit}
                    disabled={splitSel.length < 2}
                    className="w-full py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                  >
                    {splitSel.length < 2 ? 'Selecciona al menos 2' : `Dividir entre ${splitSel.length}`}
                  </button>
                </>
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
