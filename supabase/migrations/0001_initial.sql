-- ─────────────────────────────────────────────────────────
-- Saldito — Migration 0001 — Initial schema
-- Multi-tenant día 1. RLS estricto. Trazabilidad total.
-- ─────────────────────────────────────────────────────────

-- HOUSEHOLDS
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_currency text default 'ARS',
  plan text default 'free' check (plan in ('free','premium','familia')),
  created_at timestamptz default now()
);

-- PROFILES
create table profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  auth_user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  telegram_username text unique,
  telegram_chat_id bigint,
  email text,
  color text default '#4F6EF7',
  emoji text default '👤',
  role text default 'member' check (role in ('owner','member','viewer','super_admin')),
  is_active boolean default true,
  created_at timestamptz default now()
);
create index idx_profiles_household on profiles(household_id);
create index idx_profiles_telegram on profiles(telegram_username);

-- ACCOUNTS
create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  type text check (type in ('cash','bank','wallet','crypto','credit_card','other')) default 'cash',
  currency text default 'ARS',
  balance_cached numeric(14,2) default 0,
  archived boolean default false,
  created_at timestamptz default now()
);
create index idx_accounts_household on accounts(household_id) where archived = false;

-- CATEGORIES
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  parent_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null,
  type text check (type in ('ingreso','egreso','ahorro','transferencia')) not null,
  icon text default '📦',
  color text,
  is_business boolean default false,
  archived boolean default false,
  pending_review boolean default false,
  created_at timestamptz default now(),
  unique(household_id, parent_id, slug)
);
create index idx_categories_household on categories(household_id) where archived = false;
create index idx_categories_pending on categories(household_id) where pending_review = true;

-- TRANSACTIONS
create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete set null not null,
  category_id uuid references categories(id) on delete set null,
  account_id uuid references accounts(id) on delete set null,
  occurred_at timestamptz not null default now(),
  amount numeric(14,2) not null check (amount > 0),
  currency text default 'ARS',
  type text check (type in ('ingreso','egreso','ahorro','transferencia')) not null,
  is_business boolean default false,
  concept text not null,
  notes text,
  payment_method text,
  tags text[] default '{}',
  transfer_to_account_id uuid references accounts(id) on delete set null,
  source text default 'web' check (source in ('telegram','web','import','api','recurring','ocr')),
  raw_input text,
  ai_model text,
  ai_confidence numeric(3,2) check (ai_confidence is null or (ai_confidence between 0 and 1)),
  ai_reasoning text,
  needs_review boolean default false,
  external_id text unique,
  attachment_url text,
  created_at timestamptz default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_at timestamptz default now(),
  updated_by uuid references profiles(id) on delete set null,
  deleted_at timestamptz
);
create index idx_tx_household_date on transactions(household_id, occurred_at desc) where deleted_at is null;
create index idx_tx_category on transactions(category_id) where deleted_at is null;
create index idx_tx_profile on transactions(profile_id) where deleted_at is null;
create index idx_tx_review on transactions(household_id) where needs_review = true and deleted_at is null;
create index idx_tx_business on transactions(household_id, is_business) where deleted_at is null;

-- GOALS
create table goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  emoji text default '🎯',
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) default 0,
  currency text default 'ARS',
  target_date date,
  monthly_contribution numeric(14,2),
  account_id uuid references accounts(id) on delete set null,
  archived boolean default false,
  created_at timestamptz default now()
);
create index idx_goals_household on goals(household_id) where archived = false;

-- GOAL_CONTRIBUTIONS
create table goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete cascade not null,
  transaction_id uuid references transactions(id) on delete set null,
  amount numeric(14,2) not null,
  occurred_at timestamptz default now()
);
create index idx_gc_goal on goal_contributions(goal_id);

-- RECURRING_TRANSACTIONS
create table recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  account_id uuid references accounts(id) on delete set null,
  name text not null,
  amount numeric(14,2) not null check (amount > 0),
  currency text default 'ARS',
  type text not null check (type in ('ingreso','egreso','ahorro','transferencia')),
  is_business boolean default false,
  frequency text check (frequency in ('daily','weekly','monthly','yearly')) default 'monthly',
  day_of_month int check (day_of_month between 1 and 31),
  next_due_date date,
  active boolean default true,
  auto_create boolean default false,
  created_at timestamptz default now()
);
create index idx_rec_due on recurring_transactions(household_id, next_due_date) where active = true;

-- BUDGETS
create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade,
  month date not null,
  amount numeric(14,2) not null check (amount > 0),
  currency text default 'ARS',
  created_at timestamptz default now(),
  unique(household_id, category_id, month)
);
create index idx_budgets_lookup on budgets(household_id, month);

-- AGENT_MEMORY
create table agent_memory (
  id bigserial primary key,
  household_id uuid references households(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade,
  channel text default 'telegram',
  role text check (role in ('user','assistant','system','tool')) not null,
  content text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
create index idx_memory_lookup on agent_memory(household_id, profile_id, created_at desc);

-- AI_CONFIG
create table ai_config (
  id bigserial primary key,
  household_id uuid references households(id) on delete cascade,
  key text not null,
  value text not null,
  version int not null default 1,
  active boolean default true,
  notes text,
  created_at timestamptz default now(),
  created_by uuid references profiles(id) on delete set null
);
create unique index ai_config_active on ai_config(coalesce(household_id::text, 'global'), key) where active = true;

-- AUDIT_LOG
create table audit_log (
  id bigserial primary key,
  household_id uuid references households(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  table_name text not null,
  row_id uuid not null,
  action text check (action in ('insert','update','delete','restore')) not null,
  diff jsonb,
  created_at timestamptz default now()
);
create index idx_audit on audit_log(household_id, created_at desc);

-- INVITATIONS (fase 5, ya creada para evitar migration futura)
create table invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  invited_by uuid references profiles(id) on delete set null,
  email text not null,
  role text check (role in ('member','viewer')) default 'member',
  token text unique not null,
  expires_at timestamptz default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz default now()
);
create index idx_invitations_token on invitations(token) where accepted_at is null;

-- SUBSCRIPTIONS (fase 5)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade unique not null,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text check (plan in ('free','premium','familia')) default 'free',
  status text check (status in ('active','trialing','canceled','past_due','incomplete')) default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- Helper para RLS
-- ─────────────────────────────────────────────────────────

create or replace function current_household_id() returns uuid
language sql stable security definer as $$
  select household_id from profiles where auth_user_id = auth.uid() limit 1
$$;

-- ─────────────────────────────────────────────────────────
-- RLS — habilitar en todas las tablas
-- ─────────────────────────────────────────────────────────

alter table households enable row level security;
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table goals enable row level security;
alter table goal_contributions enable row level security;
alter table recurring_transactions enable row level security;
alter table budgets enable row level security;
alter table agent_memory enable row level security;
alter table ai_config enable row level security;
alter table audit_log enable row level security;
alter table invitations enable row level security;
alter table subscriptions enable row level security;

-- Políticas — los miembros del household ven y gestionan todo lo de su household

create policy "household members access" on households for all
  using (id = current_household_id())
  with check (id = current_household_id());

create policy "household members access" on profiles for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());

create policy "household members access" on accounts for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());

create policy "household members access" on categories for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());

create policy "household members access" on transactions for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());

create policy "household members access" on goals for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());

create policy "household members access" on goal_contributions for all
  using (
    exists (select 1 from goals g where g.id = goal_contributions.goal_id and g.household_id = current_household_id())
  )
  with check (
    exists (select 1 from goals g where g.id = goal_contributions.goal_id and g.household_id = current_household_id())
  );

create policy "household members access" on recurring_transactions for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());

create policy "household members access" on budgets for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());

create policy "household members access" on agent_memory for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());

create policy "household members access" on ai_config for all
  using (household_id is null or household_id = current_household_id())
  with check (household_id is null or household_id = current_household_id());

create policy "household members read audit" on audit_log for select
  using (household_id = current_household_id());

create policy "household members access" on invitations for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());

create policy "household members access" on subscriptions for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());

-- ─────────────────────────────────────────────────────────
-- Realtime publication
-- ─────────────────────────────────────────────────────────

alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table goals;
alter publication supabase_realtime add table goal_contributions;
alter publication supabase_realtime add table accounts;
alter publication supabase_realtime add table categories;

-- ─────────────────────────────────────────────────────────
-- Triggers — updated_at
-- ─────────────────────────────────────────────────────────

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_tx_updated before update on transactions for each row execute function set_updated_at();
create trigger trg_sub_updated before update on subscriptions for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────
-- Trigger — recalcular balance_cached de account
-- ─────────────────────────────────────────────────────────

create or replace function recalc_account_balance() returns trigger language plpgsql as $$
declare
  acc_id uuid;
begin
  acc_id := coalesce(new.account_id, old.account_id);
  if acc_id is not null then
    update accounts set balance_cached = (
      select coalesce(sum(case
        when type = 'ingreso' then amount
        when type = 'egreso' then -amount
        when type = 'transferencia' and account_id = acc_id then -amount
        when type = 'transferencia' and transfer_to_account_id = acc_id then amount
        else 0
      end), 0)
      from transactions
      where (account_id = acc_id or transfer_to_account_id = acc_id)
        and deleted_at is null
    ) where id = acc_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_recalc_balance after insert or update or delete on transactions
  for each row execute function recalc_account_balance();

-- ─────────────────────────────────────────────────────────
-- Trigger — current_amount de goals
-- ─────────────────────────────────────────────────────────

create or replace function recalc_goal_amount() returns trigger language plpgsql as $$
declare
  gid uuid;
begin
  gid := coalesce(new.goal_id, old.goal_id);
  update goals set current_amount = (
    select coalesce(sum(amount), 0) from goal_contributions where goal_id = gid
  ) where id = gid;
  return coalesce(new, old);
end;
$$;

create trigger trg_recalc_goal after insert or update or delete on goal_contributions
  for each row execute function recalc_goal_amount();
