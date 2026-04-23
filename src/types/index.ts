export type Member = 'César' | 'Nices' | 'Nicole' | 'Ximena' | 'Otro'

export type ExpenseStatus = 'pendiente' | 'pagado'

export type Expense = {
  id: string
  description: string
  amount: number
  paid_by: Member
  status: ExpenseStatus
  installment_current: number
  installment_total: number
  month: number
  year: number
  category?: string
  notes?: string
  created_at: string
  user_id: string
}

export type MonthlySummary = {
  member: Member
  total: number
  pendiente: number
  pagado: number
}

export type MonthlyView = {
  year: number
  month: number
  expenses: Expense[]
  summaries: MonthlySummary[]
  grandTotal: number
}
