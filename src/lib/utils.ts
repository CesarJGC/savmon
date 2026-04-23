import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Expense, Member, MonthlySummary } from '@/types'

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

export function computeSummaries(expenses: Expense[]): MonthlySummary[] {
  const members: Member[] = ['César', 'Nices', 'Nicole', 'Ximena', 'Otro']
  return members.map((member) => {
    const memberExpenses = expenses.filter((e) => e.paid_by === member)
    const total = memberExpenses.reduce((sum, e) => sum + e.amount, 0)
    const pagado = memberExpenses
      .filter((e) => e.status === 'pagado')
      .reduce((sum, e) => sum + e.amount, 0)
    const pendiente = total - pagado
    return { member, total, pendiente, pagado }
  }).filter((s) => s.total > 0)
}

export const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: getMonthName(i + 1),
}))

export const MEMBERS: Member[] = ['César', 'Nices', 'Nicole', 'Ximena', 'Otro']

export const CATEGORIES = [
  'Supermercado',
  'Combustible',
  'Restaurante',
  'Mascota',
  'Salud',
  'Ropa',
  'Tecnología',
  'Suscripción',
  'Servicios',
  'Auto',
  'Hogar',
  'Deuda',
  'Otro',
]
