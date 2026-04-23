'use client'
import { useEffect, useState, useCallback } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { Plus, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { Expense } from '@/types'
import {
  getExpensesByMonth,
  createExpense,
  updateExpense,
  deleteExpense,
  toggleExpenseStatus,
} from '@/lib/supabase'
import { computeSummaries, getMonthName, MEMBERS } from '@/lib/utils'
import { ExpenseRow } from '@/components/expenses/ExpenseRow'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { SummaryCards } from '@/components/expenses/SummaryCards'
import { Modal } from '@/components/expenses/Modal'
import { ImportModal } from '@/components/expenses/ImportModal'
import { Button } from '@/components/ui/Button'

export default function DashboardPage() {
  const { user } = useUser()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [filterMember, setFilterMember] = useState<string>('Todos')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getExpensesByMonth(user.id, year, month)
      setExpenses(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user, year, month])

  useEffect(() => { load() }, [load])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  async function handleImportRows(rows: Omit<Expense, 'id' | 'created_at' | 'user_id'>[]) {
    if (!user) return
    await Promise.all(rows.map((row) => createExpense({ ...row, user_id: user.id })))
    setImportOpen(false)
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

  const filtered = filterMember === 'Todos'
    ? expenses
    : expenses.filter(e => e.paid_by === filterMember)

  const summaries = computeSummaries(expenses)
  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <h1 className="text-xl font-bold text-gray-900">SavMon</h1>
          </div>
          <UserButton />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
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
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                <Upload className="w-4 h-4 mr-1.5" /> Importar Excel
              </Button>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Agregar gasto
              </Button>
            </div>
          </div>

          {/* Filter by member */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['Todos', ...MEMBERS].map((m) => (
              <button
                key={m}
                onClick={() => setFilterMember(m)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterMember === m
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Expenses table */}
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
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Descripción</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Monto</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Quién</th>
                    <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Cuota</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">Estado</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((expense) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      onEdit={(e) => setEditingExpense(e)}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggle}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar summaries */}
        <div className="w-64 flex-shrink-0">
          <SummaryCards summaries={summaries} grandTotal={grandTotal} />
        </div>
      </div>

      {/* Create modal */}
      <Modal open={modalOpen} title="Nuevo gasto" onClose={() => setModalOpen(false)}>
        <ExpenseForm
          defaultMonth={month}
          defaultYear={year}
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      {/* Import modal */}
      <Modal open={importOpen} title="Importar desde Excel" onClose={() => setImportOpen(false)}>
        <ImportModal
          defaultMonth={month}
          defaultYear={year}
          onImport={handleImportRows}
          onClose={() => setImportOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editingExpense} title="Editar gasto" onClose={() => setEditingExpense(null)}>
        {editingExpense && (
          <ExpenseForm
            initialData={editingExpense}
            defaultMonth={month}
            defaultYear={year}
            onSubmit={handleEdit}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Modal>
    </div>
  )
}
