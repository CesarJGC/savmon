import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Expense, PersonSummary, BankTab } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function getMonthName(month: number): string {
  return new Date(2024, month - 1).toLocaleString('es-CL', { month: 'long' })
}

export function formatInstallment(current: number, total: number): string {
  if (total === 1) return 'Contado'
  return `${current}/${total}`
}

export function computePersonSummaries(expenses: Expense[]): PersonSummary[] {
  const map = new Map<string, PersonSummary>()
  for (const e of expenses) {
    const person = e.paid_by || 'Sin asignar'
    if (!map.has(person)) {
      map.set(person, { person, total: 0, pendiente: 0, pagado: 0 })
    }
    const s = map.get(person)!
    s.total += e.amount
    if (e.status === 'pagado') s.pagado += e.amount
    else s.pendiente += e.amount
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

export const BANK_TABS: { key: BankTab; label: string }[] = [
  { key: 'todos',      label: 'Todos' },
  { key: 'bancochile', label: 'BancoChile' },
  { key: 'itau',       label: 'Itaú' },
  { key: 'cmr_nicole', label: 'CMR Nicole' },
  { key: 'cmr_papa',   label: 'CMR Papá' },
  { key: 'depto',      label: 'Depto' },
  { key: 'manual',     label: 'Manual' },
]

export const CATEGORIES = [
  'Supermercado',
  'Combustible',
  'Restaurante / Comida',
  'Mascotas',
  'Salud / Farmacia',
  'Ropa / Calzado',
  'Tecnología',
  'Entretenimiento',
  'Servicios básicos',
  'Transporte',
  'Auto',
  'Hogar / Depto',
  'Viajes',
  'Gastos bancarios',
  'Seguros',
  'Otro',
]

export const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: getMonthName(i + 1),
}))
