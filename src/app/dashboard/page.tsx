'use client'
import { useEffect, useState, useCallback } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { Plus, ChevronLeft, ChevronRight, Upload, FileText, BarChart2, Trash2, Pencil } from 'lucide-react'
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
import { computePersonSummaries, getMonthName, BANK_TABS, formatCLP, formatInstallment } from '@/lib/utils'
import { ExpenseRow } from '@/components/expenses/ExpenseRow'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { SummaryCards } from '@/components/expenses/SummaryCards'
import { Modal } from '@/components/expenses/Modal'
import { ImportModal } from '@/components/expenses/ImportModal'
import { CartolaModal } from '@/components/expenses/CartolaModal'
import { BalancesCard } from '@/components/expenses/BalancesCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

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
    await updateExpense(editingExpense.id, data, user?.id)
    setEditingExpense(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return
    await deleteExpense(id, user?.id)
    load()
  }

  async function handleToggle(id: string, status: string) {
    await toggleExpenseStatus(id, status)
    load()
  }

  async function handleUpdate(id: string, updates: Partial<Pick<Expense, 'paid_by' | 'category' | 'split_members'>>) {
    await updateExpense(id, updates, user?.id)
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
    await deleteExpensesBulk(Array.from(selectedIds), user?.id)
    setSelectedIds(new Set())
    load()
  }

  const filtered = activeBank === 'todos' ? expenses : expenses.filter(e => e.bank === activeBank)
  const summaries = computePersonSummaries(filtered)
  const grandTotal = filtered.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <h1 className="text-lg font-bold text-gray-900">SavMon</h1>
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <span className="px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg">
                Dashboard
              </span>
              <Link href="/stats" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <BarChart2 className="w-4 h-4" /> Métricas
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* En móvil solo icono Métricas */}
            <Link href="/stats" className="sm:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <BarChart2 className="w-5 h-5" />
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">

          {/* Main */}
          <div className="flex-1 min-w-0">

            {/* Navegación mes + botones */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-700">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base sm:text-xl font-bold text-gray-900 capitalize min-w-[130px] sm:min-w-[180px] text-center">
                  {getMonthName(month)} {year}
                </h2>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-700">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Botones: texto en desktop, solo icono en móvil */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCartolaOpen(true)}
                  className="p-2 sm:hidden border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  title="Cartola PDF"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setImportOpen(true)}
                  className="p-2 sm:hidden border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  title="Importar Excel"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <Button variant="secondary" size="sm" onClick={() => setCartolaOpen(true)} className="hidden sm:inline-flex">
                  <FileText className="w-4 h-4 mr-1.5" /> Cartola PDF
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)} className="hidden sm:inline-flex">
                  <Upload className="w-4 h-4 mr-1.5" /> Importar Excel
                </Button>
                <Button size="sm" onClick={() => setModalOpen(true)}>
                  <Plus className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Agregar gasto</span>
                </Button>
              </div>
            </div>

            {/* Tabs de banco */}
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {BANK_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveBank(tab.key); setSelectedIds(new Set()) }}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    activeBank === tab.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  {tab.key !== 'todos' && (
                    <span className="ml-1 text-xs opacity-70">
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
                  {selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedIds(new Set())} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                    Cancelar
                  </button>
                  <Button size="sm" variant="ghost" onClick={handleBulkDelete} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                  </Button>
                </div>
              </div>
            )}

            {/* Contenido */}
            {loading ? (
              <div className="bg-white rounded-2xl py-16 text-center text-gray-500 shadow-sm border border-gray-100">
                Cargando gastos...
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl py-16 text-center shadow-sm border border-gray-100">
                <p className="text-gray-600 text-sm">No hay gastos para este mes</p>
                <Button className="mt-4" size="sm" onClick={() => setModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Agregar el primero
                </Button>
              </div>
            ) : (
              <>
                {/* Tabla — solo desktop (md+) */}
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide py-3 px-4">Descripción</th>
                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide py-3 px-4">Monto</th>
                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide py-3 px-4">Corresponde a</th>
                        <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wide py-3 px-4">Cuota</th>
                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide py-3 px-4">Estado</th>
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
                          onUpdate={handleUpdate}
                          knownPersons={knownPersons}
                          selected={selectedIds.has(expense.id)}
                          onSelect={handleSelect}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards — solo móvil */}
                <div className="md:hidden space-y-2">
                  {filtered.map(expense => {
                    const isPaid = expense.status === 'pagado'
                    const isSel = selectedIds.has(expense.id)
                    return (
                      <div
                        key={expense.id}
                        className={`bg-white rounded-xl border px-4 py-3 shadow-sm transition-colors ${isSel ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={e => handleSelect(expense.id, e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-semibold truncate ${isPaid ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {expense.description}
                              </p>
                              <span className="text-sm font-bold text-gray-900 flex-shrink-0">{formatCLP(expense.amount)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {expense.category && (
                                <span className="text-xs text-gray-600">{expense.category}</span>
                              )}
                              {expense.paid_by && (
                                <Badge color="indigo">{expense.paid_by}</Badge>
                              )}
                              <button onClick={() => handleToggle(expense.id, expense.status)}>
                                <Badge color={isPaid ? 'green' : 'yellow'}>
                                  {isPaid ? 'Pagado' : 'Pendiente'}
                                </Badge>
                              </button>
                              {expense.installment_total > 1 && (
                                <span className="text-xs text-gray-600">{formatInstallment(expense.installment_current, expense.installment_total)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => setEditingExpense(expense)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-64 lg:flex-shrink-0 space-y-4">
            <SummaryCards summaries={summaries} grandTotal={grandTotal} />
            <BalancesCard expenses={filtered} />
          </div>
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
