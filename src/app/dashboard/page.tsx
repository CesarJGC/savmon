'use client'
import { useEffect, useState, useCallback } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { Plus, ChevronLeft, ChevronRight, Upload, FileText, BarChart2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Expense, BankTab } from '@/types'
import {
  getExpensesByMonth,
  createExpense,
  updateExpense,
  deleteExpense,
  deleteExpensesBulk,
  toggleExpenseStatus,
  getDistinctPersons,
} from '@/lib/supabase'
import { computePersonSummaries, getMonthName, BANK_TABS } from '@/lib/utils'
import { ExpenseRow } from '@/components/expenses/ExpenseRow'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { SummaryCards } from '@/components/expenses/SummaryCards'
import { Modal } from '@/components/expenses/Modal'
import { ImportModal } from '@/components/expenses/ImportModal'
import { CartolaModal } from '@/components/expenses/CartolaModal'
import { Button } from '@/components/ui/Button'

export default function DashboardPage() {
  const { user } = useUser()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [activeBank, setActiveBank] = useState<BankTab>('todos')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [knownPersons, setKnownPersons] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [cartolaOpen, setCartolaOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [data, persons] = await Promise.all([
        getExpensesByMonth(user.id, year, month),
        getDistinctPersons(user.id),
      ])
      setExpenses(data)
      setKnownPersons(persons)
    } finally {
      setLoading(false)
    }
  }, [user, year, month])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  function prevMonth() {
    setSelectedIds(new Set())
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    setSelectedIds(new Set())
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  async function handleImportRows(rows: Omit<Expense, 'id' | 'created_at' | 'user_id'>[]) {
    if (!user) return
    await Promise.all(rows.map(row => createExpense({ ...row, user_id: user.id })))
    setImportOpen(false)
    setCartolaOpen(false)
    load()
  }

  async function handleCreate(data: Omit<Expense, 'id' | 'created_at' | 'user_id'>) {
    if (!user) return
    await createExpense({ ...data, user_id: user.id })
    setModalOpen(false)
    load()
  }

  async function handleEdit(data: Omit<Expense, 'id' | 'created_at' | 'user_id'>) {
    if (!editingExpense) return
    await updateExpense(editingExpense.id, data)
    setEditingExpense(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return
    await deleteExpense(id)
    load()
  }

  async function handleToggle(id: string, status: string) {
    await toggleExpenseStatus(id, status)
    load()
  }

  function handleSelect(id: string, checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function handleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(filtered.map(e => e.id)) : new Set())
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`¿Eliminar ${selectedIds.size} gasto${selectedIds.size > 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) return
    await deleteExpensesBulk(Array.from(selectedIds))
    setSelectedIds(new Set())
    load()
  }

  // Filtrar por banco activo
  const filtered = activeBank === 'todos'
    ? expenses
    : expenses.filter(e => e.bank === activeBank)

  const summaries = computePersonSummaries(filtered)
  const grandTotal = filtered.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <h1 className="text-xl font-bold text-gray-900">SavMon</h1>
            <div className="flex items-center gap-1 ml-4">
              <span className="px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg">
                Dashboard
              </span>
              <Link href="/stats" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <BarChart2 className="w-4 h-4" /> Métricas
              </Link>
            </div>
          </div>
          <UserButton />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Main */}
        <div className="flex-1 min-w-0">

          {/* Navegación mes */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-800 capitalize min-w-[180px] text-center">
                {getMonthName(month)} {year}
              </h2>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setCartolaOpen(true)}>
                <FileText className="w-4 h-4 mr-1.5" /> Cartola PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="w-4 h-4 mr-1.5" /> Importar Excel
              </Button>
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Agregar gasto
              </Button>
            </div>
          </div>

          {/* Tabs de banco */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {BANK_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveBank(tab.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeBank === tab.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.key !== 'todos' && (
                  <span className="ml-1.5 text-xs opacity-70">
                    {expenses.filter(e => e.bank === tab.key).length || ''}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Barra de acciones masivas */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 mb-3">
              <span className="text-sm font-medium text-indigo-700">
                {selectedIds.size} gasto{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-sm text-indigo-500 hover:text-indigo-700"
                >
                  Cancelar
                </button>
                <Button size="sm" variant="ghost" onClick={handleBulkDelete} className="text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                </Button>
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-gray-400">Cargando gastos...</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">No hay gastos para este mes</p>
                <Button className="mt-4" size="sm" onClick={() => setModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Agregar el primero
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 w-8">
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filtered.length }}
                        onChange={e => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                      />
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Descripción</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Monto</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Corresponde a</th>
                    <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Cuota</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Estado</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(expense => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      onEdit={e => setEditingExpense(e)}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggle}
                      selected={selectedIds.has(expense.id)}
                      onSelect={handleSelect}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <SummaryCards summaries={summaries} grandTotal={grandTotal} />
        </div>
      </div>

      {/* Modals */}
      <Modal open={modalOpen} title="Nuevo gasto" onClose={() => setModalOpen(false)}>
        <ExpenseForm
          defaultMonth={month}
          defaultYear={year}
          defaultBank={activeBank !== 'todos' ? activeBank : 'manual'}
          knownPersons={knownPersons}
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal open={!!editingExpense} title="Editar gasto" onClose={() => setEditingExpense(null)}>
        {editingExpense && (
          <ExpenseForm
            initialData={editingExpense}
            defaultMonth={month}
            defaultYear={year}
            knownPersons={knownPersons}
            onSubmit={handleEdit}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Modal>

      <Modal open={cartolaOpen} title="Subir cartola bancaria (PDF)" onClose={() => setCartolaOpen(false)}>
        <CartolaModal
          defaultMonth={month}
          defaultYear={year}
          onImport={handleImportRows}
          onClose={() => setCartolaOpen(false)}
        />
      </Modal>

      <Modal open={importOpen} title="Importar desde Excel / CSV" onClose={() => setImportOpen(false)}>
        <ImportModal
          defaultMonth={month}
          defaultYear={year}
          onImport={handleImportRows}
          onCancel={() => setImportOpen(false)}
        />
      </Modal>
    </div>
  )
}
