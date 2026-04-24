'use client'
import { useState, useRef } from 'react'
import { ParsedTransaction } from '@/lib/cartola-parser'
import { Expense, BankTab } from '@/types'
import { formatCLP, BANK_TABS, MONTHS } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FileText, CheckCircle2, AlertCircle, X } from 'lucide-react'

const BANK_OPTIONS = BANK_TABS.filter(b => b.key !== 'todos' && b.key !== 'manual')

interface CartolaModalProps {
  defaultMonth: number
  defaultYear: number
  onImport: (rows: Omit<Expense, 'id' | 'created_at' | 'user_id'>[]) => Promise<void>
  onClose: () => void
}

export function CartolaModal({ defaultMonth, defaultYear, onImport, onClose }: CartolaModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const now = new Date()

  // Configuración manual — seleccionable antes de subir el PDF
  const [banco, setBanco] = useState<BankTab>('bancochile')
  const [mesCartola, setMesCartola] = useState(defaultMonth)
  const [anioCartola, setAnioCartola] = useState(defaultYear)

  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [txs, setTxs] = useState<ParsedTransaction[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      // Pasamos el banco seleccionado para que el parser use la lógica correcta
      fd.append('banco', banco)
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error procesando PDF')
      setTxs(json.transacciones)
      setSelected(new Set(json.transacciones.map((_: unknown, i: number) => i)))
      setStep('preview')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setUploading(false)
    }
  }

  function toggleRow(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === txs.length) setSelected(new Set())
    else setSelected(new Set(txs.map((_, i) => i)))
  }

  async function handleImport() {
    setImporting(true)
    const rows = txs
      .filter((_, i) => selected.has(i))
      .map((tx) => ({
        description: tx.descripcion,
        amount: tx.monto,
        paid_by: tx.persona ?? '',
        bank: banco,
        status: 'pendiente' as const,
        installment_current: tx.cuota_actual,
        installment_total: tx.total_cuotas,
        month: mesCartola,
        year: anioCartola,
        category: tx.categoria,
      }))
    try {
      await onImport(rows)
      setStep('done')
    } finally {
      setImporting(false)
    }
  }

  const bancoLabel = BANK_OPTIONS.find(b => b.key === banco)?.label ?? banco

  if (step === 'done') {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <p className="text-lg font-semibold text-gray-800">¡Cartola importada!</p>
        <p className="text-sm text-gray-500">
          {selected.size} transacciones → {bancoLabel} {MONTHS.find(m => m.value === mesCartola)?.label} {anioCartola}
        </p>
        <Button onClick={onClose}>Cerrar</Button>
      </div>
    )
  }

  if (step === 'upload') {
    const currentYear = now.getFullYear()
    const years = [currentYear - 1, currentYear, currentYear + 1]

    return (
      <div className="space-y-5">
        {/* Selector banco + mes/año */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Banco *</label>
            <div className="grid grid-cols-2 gap-2">
              {BANK_OPTIONS.map(b => (
                <button
                  key={b.key}
                  onClick={() => setBanco(b.key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    banco === b.key
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes de la cartola *</label>
            <select
              value={mesCartola}
              onChange={e => setMesCartola(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año *</label>
            <select
              value={anioCartola}
              onChange={e => setAnioCartola(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Upload */}
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            uploading ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
          }`}
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-indigo-600 font-medium">Procesando PDF...</p>
            </>
          ) : (
            <>
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Click para subir la cartola PDF</p>
              <p className="text-xs text-gray-400 mt-1">El nombre del archivo no importa</p>
            </>
          )}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    )
  }

  // Preview
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge color="indigo">{bancoLabel}</Badge>
          <Badge color="gray">{MONTHS.find(m => m.value === mesCartola)?.label} {anioCartola}</Badge>
          <span className="text-sm text-gray-600">
            <span className="font-semibold">{txs.length}</span> transacciones
          </span>
        </div>
        <button onClick={toggleAll} className="text-xs text-indigo-600 hover:underline">
          {selected.size === txs.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto border border-gray-100 rounded-xl">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="py-2 px-3 w-8"></th>
              <th className="py-2 px-3 text-left font-semibold text-gray-500">Fecha</th>
              <th className="py-2 px-3 text-left font-semibold text-gray-500">Descripción</th>
              <th className="py-2 px-3 text-right font-semibold text-gray-500">Monto</th>
              <th className="py-2 px-3 text-left font-semibold text-gray-500">Categoría</th>
              <th className="py-2 px-3 text-center font-semibold text-gray-500">Cuota</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx, i) => (
              <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${!selected.has(i) ? 'opacity-40' : ''}`}>
                <td className="py-2 px-3">
                  <input type="checkbox" checked={selected.has(i)} onChange={() => toggleRow(i)} className="rounded" />
                </td>
                <td className="py-2 px-3 text-gray-500 whitespace-nowrap">{tx.fecha.slice(5).replace('-', '/')}</td>
                <td className="py-2 px-3 font-medium text-gray-800 max-w-[160px] truncate">{tx.descripcion}</td>
                <td className="py-2 px-3 text-right font-semibold text-gray-800">{formatCLP(tx.monto)}</td>
                <td className="py-2 px-3 text-gray-500 max-w-[100px] truncate">{tx.categoria}</td>
                <td className="py-2 px-3 text-center text-gray-500">
                  {tx.total_cuotas > 1 ? `${tx.cuota_actual}/${tx.total_cuotas}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => { setStep('upload'); setTxs([]); setError('') }}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          <X className="w-4 h-4" /> Cambiar PDF
        </button>
        <Button onClick={handleImport} loading={importing} disabled={selected.size === 0}>
          Importar {selected.size > 0 ? `${selected.size} gastos` : ''}
        </Button>
      </div>
    </div>
  )
}
