'use client'
import { useEffect, useState, useCallback } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
import { Expense, BankTab } from '@/types'
import { getExpensesForLastMonths } from '@/lib/supabase'
import { getMonthName, formatCLP, BANK_TABS } from '@/lib/utils'
import { StatCard } from '@/components/stats/StatCard'
import { MonthlyChart } from '@/components/stats/MonthlyChart'
import { BankBreakdown } from '@/components/stats/BankBreakdown'
import { PersonBreakdown } from '@/components/stats/PersonBreakdown'
import { CategoryBreakdown } from '@/components/stats/CategoryBreakdown'

const PERIODS = [3, 6, 12]

export default function StatsPage() {
  const { user } = useUser()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(6)
  const [bankFilter, setBankFilter] = useState<BankTab | 'todos'>('todos')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getExpensesForLastMonths(user.id, period)
      setExpenses(data)
    } finally {
      setLoading(false)
    }
  }, [user, period])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // Filtrar por banco
  const filtered = bankFilter === 'todos' ? expenses : expenses.filter(e => e.bank === bankFilter)

  // ── KPIs principales ──────────────────────────────────────────────────────
  const now = new Date()
  const thisMonth = filtered.filter(e => e.year === now.getFullYear() && e.month === now.getMonth() + 1)
  const lastMonth = filtered.filter(e => {
    const lm = now.getMonth() === 0
      ? { y: now.getFullYear() - 1, m: 12 }
      : { y: now.getFullYear(), m: now.getMonth() }
    return e.year === lm.y && e.month === lm.m
  })

  const totalThisMonth = thisMonth.reduce((s, e) => s + e.amount, 0)
  const totalLastMonth = lastMonth.reduce((s, e) => s + e.amount, 0)
  const trend = totalLastMonth ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0

  const totalPendiente = filtered.reduce((s, e) => s + (e.status === 'pendiente' ? e.amount : 0), 0)
  const totalPagado = filtered.reduce((s, e) => s + (e.status === 'pagado' ? e.amount : 0), 0)
  const totalGeneral = filtered.reduce((s, e) => s + e.amount, 0)
  const avgPerMonth = period > 0 ? totalGeneral / period : 0

  // ── Datos para gráfico mensual ────────────────────────────────────────────
  const monthlyMap = new Map<string, { label: string; total: number; pagado: number; pendiente: number }>()
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    const label = `${getMonthName(d.getMonth() + 1).slice(0, 3)} ${String(d.getFullYear()).slice(2)}`
    monthlyMap.set(key, { label, total: 0, pagado: 0, pendiente: 0 })
  }
  for (const e of filtered) {
    const key = `${e.year}-${e.month}`
    const entry = monthlyMap.get(key)
    if (entry) {
      entry.total += e.amount
      if (e.status === 'pagado') entry.pagado += e.amount
      else entry.pendiente += e.amount
    }
  }
  const monthlyData = Array.from(monthlyMap.values())

  // ── Datos por banco ───────────────────────────────────────────────────────
  const bankMap = new Map<string, number>()
  for (const e of filtered) {
    bankMap.set(e.bank, (bankMap.get(e.bank) ?? 0) + e.amount)
  }
  const bankData = Array.from(bankMap.entries())
    .map(([bank, total]) => ({ bank, total }))
    .sort((a, b) => b.total - a.total)

  // ── Datos por persona ─────────────────────────────────────────────────────
  const personMap = new Map<string, { total: number; pagado: number; pendiente: number }>()
  for (const e of filtered) {
    const p = e.paid_by || 'Sin asignar'
    const cur = personMap.get(p) ?? { total: 0, pagado: 0, pendiente: 0 }
    cur.total += e.amount
    if (e.status === 'pagado') cur.pagado += e.amount
    else cur.pendiente += e.amount
    personMap.set(p, cur)
  }
  const personData = Array.from(personMap.entries()).map(([person, v]) => ({ person, ...v }))

  // ── Datos por categoría ───────────────────────────────────────────────────
  const catMap = new Map<string, { total: number; count: number }>()
  for (const e of filtered) {
    const cat = e.category || 'Sin categoría'
    const cur = catMap.get(cat) ?? { total: 0, count: 0 }
    cur.total += e.amount
    cur.count += 1
    catMap.set(cat, cur)
  }
  const categoryData = Array.from(catMap.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)

  // ── Top gastos del período ────────────────────────────────────────────────
  const topExpenses = [...filtered].sort((a, b) => b.amount - a.amount).slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <h1 className="text-lg font-bold text-gray-900">SavMon</h1>
            <div className="flex items-center gap-1 ml-2">
              <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <span className="px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg">
                Métricas
              </span>
            </div>
          </div>
          <UserButton />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  period === p ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p} meses
              </button>
            ))}
          </div>

          <div className="flex gap-1 flex-wrap">
            {[{ key: 'todos', label: 'Todos los bancos' }, ...BANK_TABS.filter(b => b.key !== 'todos')].map(b => (
              <button
                key={b.key}
                onClick={() => setBankFilter(b.key as BankTab | 'todos')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                  bankFilter === b.key
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-gray-400">Cargando métricas...</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                title={`Total ${getMonthName(now.getMonth() + 1)}`}
                value={totalThisMonth}
                isCurrency
                trend={trend}
                sub="vs mes anterior"
                color="indigo"
              />
              <StatCard
                title={`Promedio mensual (${period}m)`}
                value={avgPerMonth}
                isCurrency
                sub={`${filtered.length} gastos totales`}
              />
              <StatCard
                title="Pendiente de pago"
                value={totalPendiente}
                isCurrency
                color="yellow"
                sub={`${filtered.filter(e => e.status === 'pendiente').length} gastos`}
              />
              <StatCard
                title="Total pagado"
                value={totalPagado}
                isCurrency
                color="green"
                sub={`${filtered.filter(e => e.status === 'pagado').length} gastos`}
              />
            </div>

            {/* Gráfico mensual */}
            <MonthlyChart data={monthlyData} />

            {/* Segunda fila: banco + persona */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <BankBreakdown data={bankData} />
              <PersonBreakdown data={personData} />
            </div>

            {/* Categorías + top gastos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <CategoryBreakdown data={categoryData} />

              {/* Top gastos */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 5 gastos del período</h3>
                {topExpenses.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
                ) : (
                  <div className="space-y-3">
                    {topExpenses.map((e, i) => (
                      <div key={e.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{e.description}</p>
                          <p className="text-xs text-gray-400">
                            {e.paid_by || '—'} · {getMonthName(e.month)} {e.year}
                            {e.installment_total > 1 ? ` · ${e.installment_current}/${e.installment_total}` : ''}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gray-900 flex-shrink-0">{formatCLP(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tabla resumen por persona x banco */}
            {personData.length > 0 && bankData.length > 1 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Resumen persona × banco</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-3 text-gray-500 font-semibold">Persona</th>
                        {bankData.map(b => (
                          <th key={b.bank} className="text-right py-2 px-3 text-gray-500 font-semibold">
                            {BANK_TABS.find(bt => bt.key === b.bank)?.label ?? b.bank}
                          </th>
                        ))}
                        <th className="text-right py-2 px-3 text-gray-700 font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personData.sort((a, b) => b.total - a.total).map(p => {
                        const byBank = bankData.map(b => {
                          const total = filtered
                            .filter(e => (e.paid_by || 'Sin asignar') === p.person && e.bank === b.bank)
                            .reduce((s, e) => s + e.amount, 0)
                          return total
                        })
                        return (
                          <tr key={p.person} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 px-3 font-medium text-gray-800">{p.person}</td>
                            {byBank.map((amount, i) => (
                              <td key={i} className="py-2 px-3 text-right text-gray-600">
                                {amount > 0 ? formatCLP(amount) : <span className="text-gray-200">—</span>}
                              </td>
                            ))}
                            <td className="py-2 px-3 text-right font-bold text-gray-900">{formatCLP(p.total)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200">
                        <td className="py-2 px-3 font-bold text-gray-700">Total</td>
                        {bankData.map(b => (
                          <td key={b.bank} className="py-2 px-3 text-right font-bold text-gray-700">{formatCLP(b.total)}</td>
                        ))}
                        <td className="py-2 px-3 text-right font-bold text-indigo-600">{formatCLP(totalGeneral)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
