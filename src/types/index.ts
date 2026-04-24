export type BankTab = 'todos' | 'bancochile' | 'itau' | 'cmr_nicole' | 'cmr_papa' | 'depto' | 'manual'

export type ExpenseStatus = 'pendiente' | 'pagado'

export type Expense = {
  id: string
  description: string
  amount: number
  paid_by: string          // libre — cualquier nombre
  bank: BankTab            // a qué banco/fuente pertenece
  status: ExpenseStatus
  installment_current: number
  installment_total: number
  month: number
  year: number
  category?: string
  notes?: string
  split_members?: string[]   // si está definido, el gasto se divide entre estas personas
  created_at: string
  user_id: string
}

export type PersonSummary = {
  person: string
  total: number
  pendiente: number
  pagado: number
}
