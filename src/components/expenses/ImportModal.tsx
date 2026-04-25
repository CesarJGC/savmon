'use client'
import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Expense, ExpenseStatus } from '@/types'
import { formatCLP } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Upload, AlertCircle, CheckCircle2, X } from 'lucide-react'

interface ImportRow {
  description: string
  amount: number
  paid_by: string
  bank: 'manual'
  status: ExpenseStatus
  installment_current: number
  installment_total: number
  month: number
  year: number
  category?: string
  valid: boolean
  error?: string
}

interface ImportModalProps {
  defaultMonth: number
  defaultYear: number
  onImport: (rows: Omit<Expense, 'id' | 'created_at' | 'user_id'>[]) => Promise<void>
  onCancel: () => void
}

function parseInstallment(value: string): { current: number; total: number } {
  if (!value) return { current: 1, total: 1 }
  const str = String(value).trim()
  if (str.includes('/')) {
    const [c, t] = str.split('/')
    return { current: Number(c) || 1, total: Number(t) || 1 }
  }
  if (str === '1' || str === 'Contado' || str === '') return { current: 1, total: 1 }
  return { current: 1, total: Number(str) || 1 }
}

function parseAmount(value: string | number): number {
  if (typeof value === 'number') return Math.abs(Math.round(value))
  const clean = String(value).replace(/[$\s.]/g, '').replace(',', '.')
  return Math.abs(Math.round(Number(clean))) || 0
}

export function ImportModal({ defaultMonth, defaultYear, onImport, onCancel }: ImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  function parseFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws, { defval: '' })

        const parsed: ImportRow[] = raw.map((r) => {
          const description = String(r['Descripción'] ?? r['descripcion'] ?? r['description'] ?? r['Item'] ?? r['item'] ?? '').trim()
          const amount = parseAmount(r['Monto'] ?? r['monto'] ?? r['amount'] ?? r['$'] ?? 0)
          const paid_by = String(r['Quién Paga'] ?? r['Quien paga'] ?? r['paid_by'] ?? r['Quién'] ?? '').trim()
          const status = String(r['Estado'] ?? r['status'] ?? '').toLowerCase() === 'pagado' ? 'pagado' : 'pendiente'
          const instStr = String(r['Cuota'] ?? r['cuota'] ?? r['installment'] ?? '1')
          const { current, total } = parseInstallment(instStr)
          const month = Number(r['Mes'] ?? r['month'] ?? defaultMonth) || defaultMonth
          const year = Number(r['Año'] ?? r['year'] ?? defaultYear) || defaultYear
          const category = String(r['Categoría'] ?? r['categoria'] ?? r['category'] ?? '').trim() || undefined

          const valid = !!description && amount > 0
          return {
            description,
            amount,
            paid_by,
            bank: 'manual' as const,
            status: status as ExpenseStatus,
            installment_current: current,
            installment_total: total,
            month,
            year,
            category,
            valid,
            error: !description ? 'Sin descripción' : amount === 0 ? 'Monto inválido' : undefined,
          }
        }).filter((r) => r.description || r.amount > 0)

        setRows(parsed)
        setSelected(new Set(parsed.map((_, i) => i).filter((i) => parsed[i].valid)))
        setStep('preview')
      } catch {
        alert('Error leyendo el archivo. Asegúrate de que sea .xlsx o .csv')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  function toggleRow(i: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function toggleAll() {
    const validIndexes = rows.map((_, i) => i).filter((i) => rows[i].valid)
    if (selected.size === validIndexes.length) setSelected(new Set())
    else setSelected(new Set(validIndexes))
  }

  async function handleImport() {
    setLoading(true)
    const toImport = rows
      .filter((_, i) => selected.has(i))
      .map(({ valid, error, ...rest }) => rest)
    try {
      await onImport(toImport)
      setStep('done')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <p className="text-lg font-semibold text-gray-800">¡Importación exitosa!</p>
        <p className="text-sm text-gray-500">{selected.size} gastos importados</p>
        <Button onClick={onCancel}>Cerrar</Button>
      </div>
    )
  }

  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Click para subir tu Excel</p>
          <p className="text-xs text-gray-400 mt-1">Formatos: .xlsx, .xls, .csv</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Columnas reconocidas</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
            <span>• <b>Descripción</b> / Item</span>
            <span>• <b>Monto</b> / $</span>
            <span>• <b>Quién Paga</b></span>
            <span>• <b>Estado</b> (pagado/pendiente)</span>
            <span>• <b>Cuota</b> (ej: 2/3)</span>
            <span>• <b>Categoría</b></span>
            <span>• <b>Mes</b> / <b>Año</b></span>
          </div>
        </div>
      </div>
    )
  }

  const validCount = rows.filter((r) => r.valid).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">{rows.length}</span> filas detectadas ·{' '}
          <span className="text-green-600 font-semibold">{validCount}</span> válidas
        </p>
        <button onClick={toggleAll} className="text-xs text-indigo-600 hover:underline">
          {selected.size === validCount ? 'Deseleccionar todo' : 'Seleccionar todo'}
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto border border-gray-100 rounded-xl">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="py-2 px-3 text-left font-semibold text-gray-500"></th>
              <th className="py-2 px-3 text-left font-semibold text-gray-500">Descripción</th>
              <th className="py-2 px-3 text-right font-semibold text-gray-500">Monto</th>
              <th className="py-2 px-3 text-left font-semibold text-gray-500">Quién</th>
              <th className="py-2 px-3 text-left font-semibold text-gray-500">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50' : selected.has(i) ? '' : 'opacity-40'}`}>
                <td className="py-2 px-3">
                  {row.valid
                    ? <input type="checkbox" checked={selected.has(i)} onChange={() => toggleRow(i)} className="rounded" />
                    : <span title={row.error}><AlertCircle className="w-3.5 h-3.5 text-red-400" /></span>}
                </td>
                <td className="py-2 px-3 font-medium text-gray-800 max-w-[160px] truncate">{row.description || '—'}</td>
                <td className="py-2 px-3 text-right text-gray-700">{row.amount ? formatCLP(row.amount) : '—'}</td>
                <td className="py-2 px-3">
                  <Badge color="gray">{row.paid_by}</Badge>
                </td>
                <td className="py-2 px-3">
                  <Badge color={row.status === 'pagado' ? 'green' : 'yellow'}>{row.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-2">
        <button onClick={() => { setRows([]); setSelected(new Set()); setStep('upload') }} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <X className="w-4 h-4" /> Cambiar archivo
        </button>
        <Button onClick={handleImport} loading={loading} disabled={selected.size === 0}>
          Importar {selected.size > 0 ? `${selected.size} gastos` : ''}
        </Button>
      </div>
    </div>
  )
}
