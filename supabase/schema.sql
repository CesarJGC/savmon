-- SavMon Database Schema

create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  description text not null,
  amount numeric(12, 0) not null,
  paid_by text not null check (paid_by in ('César', 'Nices', 'Nicole', 'Ximena', 'Otro')),
  status text not null default 'pendiente' check (status in ('pendiente', 'pagado')),
  installment_current integer not null default 1,
  installment_total integer not null default 1,
  month integer not null check (month between 1 and 12),
  year integer not null,
  category text,
  notes text,
  created_at timestamptz default now()
);

-- Index for fast monthly queries
create index if not exists expenses_user_month on expenses (user_id, year, month);

-- Row Level Security
alter table expenses enable row level security;

create policy "Users can manage their own expenses"
  on expenses
  for all
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);
