'use client'
import { Expense } from '@/types'
import { formatCLP } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

interface BalancesCardProps {
  expenses: Expense[]
}

type Debt = { from: string; to: string; amount: number }

function computeBalances(expenses: Expense[]): Debt[] {
  // Acumular deudas brutas: debts[from][to] = total
  const raw = new Map<string, Map<string, number>>()

  for (const e of expenses) {
    if (!e.split_members || e.split_members.length < 2) continue
    const payer = e.paid_by?.trim()
    if (!payer) continue

    const share = e.amount / e.split_members.length

    for (const member of e.split_members) {
      if (member.trim() === payer) continue
      const from = member.trim()
      if (!raw.has(from)) raw.set(from, new Map())
      raw.get(from)!.set(payer, (raw.get(from)!.get(payer) ?? 0) + share)
    }
  }

  // Nettear deudas entre pares (A→B y B→A)
  const settled = new Set<string>()
  const result: Debt[] = []

  for (const [from, toMap] of raw) {
    for (const [to, amount] of toMap) {
      const key = [from, to].sort().join('|')
      if (settled.has(key)) continue
      settled.add(key)

      const reverse = raw.get(to)?.get(from) ?? 0
      const net = amount - reverse

      if (net > 1) result.push({ from, to, amount: Math.round(net) })
      else if (net < -1) result.push({ from: to, to: from, amount: Math.round(-net) })
    }
  }

  return result.sort((a, b) => b.amount - a.amount)
}

export function BalancesCard({ expenses }: BalancesCardProps) {
  const shared = expenses.filter(e => e.split_members && e.split_members.length > 1)
  if (shared.length === 0) return null

  const debts = computeBalances(expenses)

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3">
        Balances compartidos
      </p>

      {debts.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">Todo está saldado</p>
      ) : (
        <div className="space-y-2">
          {debts.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-800 truncate max-w-[64px]">{d.from}</span>
              <ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
              <span className="font-semibold text-gray-800 truncate max-w-[64px]">{d.to}</span>
              <span className="ml-auto font-bold text-red-600 flex-shrink-0">{formatCLP(d.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
        {shared.length} gasto{shared.length > 1 ? 's' : ''} compartido{shared.length > 1 ? 's' : ''} este mes
      </div>
    </div>
  )
}
