'use client'
import { useState } from 'react'
import { Expense, BankTab, ExpenseStatus } from '@/types'
import { CATEGORIES, BANK_TABS } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

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

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        description:         form.description,
        amount:              Math.round(Number(form.amount.replace(/\./g, '').replace(',', '.'))),
        paid_by:             form.paid_by.trim(),
        bank:                form.bank,
        status:              form.status,
        installment_current: Number(form.installment_current),
        installment_total:   Number(form.installment_total),
        month:               Number(form.month),
        year:                Number(form.year),
        category:            form.category || undefined,
        notes:               form.notes || undefined,
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
          <input
            required
            value={form.description}
            onChange={set('description')}
            placeholder="ej: Unimarc, Netflix, Copec..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto (CLP) *</label>
          <input
            required type="number" min="0"
            value={form.amount}
            onChange={set('amount')}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Banco */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Banco / Fuente</label>
          <select
            value={form.bank}
            onChange={set('bank')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {bankOptions.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
          </select>
        </div>

        {/* Corresponde a (paid_by libre con datalist) */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Corresponde a</label>
          <input
            list="persons-list"
            value={form.paid_by}
            onChange={set('paid_by')}
            placeholder="ej: César, Nicole, Mamá..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <datalist id="persons-list">
            {knownPersons.map(p => <option key={p} value={p} />)}
          </datalist>
          <p className="text-xs text-gray-400 mt-1">Puedes escribir cualquier nombre nuevo</p>
        </div>

        {/* Cuotas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cuota actual</label>
          <input
            type="number" min="1"
            value={form.installment_current}
            onChange={set('installment_current')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total cuotas</label>
          <input
            type="number" min="1"
            value={form.installment_total}
            onChange={set('installment_total')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={form.status}
            onChange={set('status')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            value={form.category}
            onChange={set('category')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Sin categoría</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Notas */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            placeholder="Información adicional..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
