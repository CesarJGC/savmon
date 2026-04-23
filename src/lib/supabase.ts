import { createClient } from '@supabase/supabase-js'
import { Expense } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getExpensesByMonth(userId: string, year: number, month: number) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', month)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Expense[]
}

export async function createExpense(expense: Omit<Expense, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single()

  if (error) throw error
  return data as Expense
}

export async function updateExpense(id: string, updates: Partial<Expense>) {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Expense
}

export async function deleteExpense(id: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function toggleExpenseStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === 'pagado' ? 'pendiente' : 'pagado'
  return updateExpense(id, { status: newStatus as 'pendiente' | 'pagado' })
}
