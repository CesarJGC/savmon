'use client'
import { useState, useEffect } from 'react'
import { Expense, BankTab, ExpenseStatus } from '@/types'
import { CATEGORIES, BANK_TABS, formatCLP } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Users } from 'lucide-react'

type FormData = {
  description: string
  amount: string
  paid_by: string
  bank: BankTab
  status: ExpenseStatus
  installment_current: string
  installment_total: string
  month: string
  year: string
  category: string
  notes: string
}

interface ExpenseFormProps {
  initialData?: Partial<Expense>
  defaultMonth: number
  defaultYear: number
  defaultBank?: BankTab
  knownPersons?: string[]
  onSubmit: (data: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => Promise<void>
  onCancel: () => void
}

export function ExpenseForm({
  initialData, defaultMonth, defaultYear, defaultBank = 'manual', knownPersons = [], onSubmit, onCancel,
}: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormData>({
    description:          initialData?.description ?? '',
    amount:               initialData?.amount?.toString() ?? '',
    paid_by:              initialData?.paid_by ?? '',
    bank:                 initialData?.bank ?? defaultBank,
    status:               initialData?.status ?? 'pendiente',
    installment_current:  initialData?.installment_current?.toString() ?? '1',
    installment_total:    initialData?.installment_total?.toString() ?? '1',
    month:                (initialData?.month ?? defaultMonth).toString(),
    year:                 (initialData?.year ?? defaultYear).toString(),
    category:             initialData?.category ?? '',
    notes:                initialData?.notes ?? '',
  })

  const [splitEnabled, setSplitEnabled] = useState(
    !!(initialData?.split_members && initialData.split_members.length > 1)
  )
  const [splitMembers, setSplitMembers] = useState<string[]>(
    initialData?.split_members ?? []
  )

  // Cuando se activa el split, pre-incluir al pagador si ya está definido
  useEffect(() => {
    if (splitEnabled && form.paid_by && !splitMembers.includes(form.paid_by)) {
      setSplitMembers(prev => [...prev, form.paid_by])
    }
  }, [splitEnabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  function toggleMember(person: string) {
    setSplitMembers(prev =>
      prev.includes(person) ? prev.filter(p => p !== person) : [...prev, person]
    )
  }

  const amount = Math.round(Number(form.amount.replace(/\./g, '').replace(',', '.')) || 0)
  const sharePerPerson = splitEnabled && splitMembers.length > 0
    ? Math.round(amount / splitMembers.length)
    : 0

  // Personas disponibles para split: knownPersons + paid_by si es nuevo
  const splitOptions = Array.from(new Set([
    ...knownPersons,
    ...(form.paid_by.trim() ? [form.paid_by.trim()] : []),
  ])).filter(Boolean)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        description:         form.description,
        amount,
        paid_by:             form.paid_by.trim(),
        bank:                form.bank,
        status:              form.status,
        installment_current: Number(form.installment_current),
        installment_total:   Number(form.installment_total),
        month:               Number(form.month),
        year:                Number(form.year),
        category:            form.category || undefined,
        notes:               form.notes || undefined,
        split_members:       splitEnabled && splitMembers.length > 1 ? splitMembers : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  const bankOptions = BANK_TABS.filter(b => b.key !== 'todos')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">

        {/* Descripción */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-800 mb-1">Descripción *</label>
          <input
            required
            value={form.description}
            onChange={set('description')}
            placeholder="ej: Unimarc, Netflix, Copec..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Monto (CLP) *</label>
          <input
            required type="number" min="0"
            value={form.amount}
            onChange={set('amount')}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Banco */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Banco / Fuente</label>
          <select
            value={form.bank}
            onChange={set('bank')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {bankOptions.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
          </select>
        </div>

        {/* Corresponde a */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-800 mb-1">Corresponde a</label>
          <input
            list="persons-list"
            value={form.paid_by}
            onChange={set('paid_by')}
            placeholder="ej: César, Nicole, Mamá..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <datalist id="persons-list">
            {knownPersons.map(p => <option key={p} value={p} />)}
          </datalist>
          <p className="text-xs text-gray-400 mt-1">Puedes escribir cualquier nombre nuevo</p>
        </div>

        {/* Dividir gasto */}
        <div className="col-span-2">
          <button
            type="button"
            onClick={() => {
              const next = !splitEnabled
              setSplitEnabled(next)
              if (!next) setSplitMembers([])
              else if (form.paid_by.trim()) setSplitMembers([form.paid_by.trim()])
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors w-full ${
              splitEnabled
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            {splitEnabled ? 'Dividir gasto activado' : 'Dividir gasto entre varias personas'}
          </button>

          {splitEnabled && (
            <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 space-y-2">
              <p className="text-xs font-medium text-indigo-700 mb-2">Selecciona quiénes participan:</p>
              {splitOptions.length === 0 ? (
                <p className="text-xs text-gray-400">Primero escribe un nombre en "Corresponde a"</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {splitOptions.map(person => (
                    <label
                      key={person}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border transition-colors ${
                        splitMembers.includes(person)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={splitMembers.includes(person)}
                        onChange={() => toggleMember(person)}
                      />
                      {person}
                    </label>
                  ))}
                </div>
              )}

              {splitMembers.length > 1 && amount > 0 && (
                <div className="mt-2 pt-2 border-t border-indigo-200">
                  <p className="text-xs text-indigo-600">
                    <span className="font-bold">{formatCLP(sharePerPerson)}</span> por persona ({splitMembers.length} personas)
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {splitMembers.filter(m => m !== form.paid_by.trim()).map(m => (
                      <p key={m} className="text-xs text-indigo-500">
                        → {m} le debe {formatCLP(sharePerPerson)} a {form.paid_by || '(pagador)'}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {splitMembers.length === 1 && (
                <p className="text-xs text-amber-600 mt-1">Selecciona al menos 2 personas para dividir</p>
              )}
            </div>
          )}
        </div>

        {/* Cuotas */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Cuota actual</label>
          <input
            type="number" min="1"
            value={form.installment_current}
            onChange={set('installment_current')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Total cuotas</label>
          <input
            type="number" min="1"
            value={form.installment_total}
            onChange={set('installment_total')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Estado</label>
          <select
            value={form.status}
            onChange={set('status')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Categoría</label>
          <select
            value={form.category}
            onChange={set('category')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Sin categoría</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Notas */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-800 mb-1">Notas</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            placeholder="Información adicional..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {initialData?.id ? 'Guardar cambios' : 'Agregar gasto'}
        </Button>
      </div>
    </form>
  )
}
