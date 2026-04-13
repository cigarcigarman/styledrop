# DB 스키마 — StyleDrop

## Supabase에서 실행 순서
1. `extensions` → 2. `tables` → 3. `rls_policies` → 4. `functions` → 5. `triggers`

---

## 1. Extensions

```sql
create extension if not exists "uuid-ossp";
```

---

## 2. Tables

### profiles (유저 프로필)
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  credits integer not null default 5,
  total_generated integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### generations (이미지 생성 이력)
```sql
create table generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  prompt text not null,
  negative_prompt text,
  style_preset text,                    -- 'casual', 'formal', 'streetwear', 'vintage' 등
  model_id text not null default 'black-forest-labs/flux-schnell',
  replicate_prediction_id text unique,
  status text not null default 'pending',  -- pending | processing | succeeded | failed
  image_url text,                       -- Supabase Storage URL
  replicate_url text,                   -- Replicate 원본 URL (임시)
  width integer not null default 1024,
  height integer not null default 1024,
  credits_used integer not null default 1,
  error_message text,
  metadata jsonb,                       -- 추가 파라미터 저장
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_generations_user_id on generations(user_id);
create index idx_generations_status on generations(status);
create index idx_generations_created_at on generations(created_at desc);
```

### credit_transactions (크레딧 거래 내역)
```sql
create table credit_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,                   -- 'purchase' | 'usage' | 'bonus' | 'refund'
  amount integer not null,             -- 양수: 충전, 음수: 사용
  balance_after integer not null,
  description text,
  stripe_payment_intent_id text,
  generation_id uuid references generations(id),
  created_at timestamptz not null default now()
);

create index idx_credit_transactions_user_id on credit_transactions(user_id);
```

### credit_packages (판매 패키지)
```sql
create table credit_packages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,                   -- 'Starter', 'Basic', 'Pro'
  credits integer not null,
  price_usd integer not null,           -- cents 단위 (400 = $4.00)
  stripe_price_id text unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 초기 데이터
insert into credit_packages (name, credits, price_usd, sort_order) values
  ('Starter', 20, 400, 1),
  ('Basic', 60, 900, 2),
  ('Pro', 150, 1900, 3);
```

---

## 3. RLS Policies

```sql
-- profiles
alter table profiles enable row level security;

create policy "users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "users can update own profile"
  on profiles for update using (auth.uid() = id);

-- generations
alter table generations enable row level security;

create policy "users can view own generations"
  on generations for select using (auth.uid() = user_id);

create policy "users can insert own generations"
  on generations for insert with check (auth.uid() = user_id);

-- credit_transactions (읽기만)
alter table credit_transactions enable row level security;

create policy "users can view own transactions"
  on credit_transactions for select using (auth.uid() = user_id);

-- credit_packages (전체 공개)
alter table credit_packages enable row level security;

create policy "anyone can view active packages"
  on credit_packages for select using (is_active = true);
```

---

## 4. Functions

### 크레딧 차감 (트랜잭션)
```sql
create or replace function deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_generation_id uuid,
  p_description text default '이미지 생성'
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_current_credits integer;
  v_new_balance integer;
begin
  -- 크레딧 잔액 확인 (행 잠금)
  select credits into v_current_credits
  from profiles
  where id = p_user_id
  for update;

  if v_current_credits < p_amount then
    return false;
  end if;

  v_new_balance := v_current_credits - p_amount;

  -- 크레딧 차감
  update profiles
  set credits = v_new_balance,
      updated_at = now()
  where id = p_user_id;

  -- 거래 내역 기록
  insert into credit_transactions (user_id, type, amount, balance_after, description, generation_id)
  values (p_user_id, 'usage', -p_amount, v_new_balance, p_description, p_generation_id);

  return true;
end;
$$;
```

### 크레딧 충전
```sql
create or replace function add_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text,
  p_stripe_payment_intent_id text default null
)
returns integer
language plpgsql
security definer
as $$
declare
  v_new_balance integer;
begin
  update profiles
  set credits = credits + p_amount,
      updated_at = now()
  where id = p_user_id
  returning credits into v_new_balance;

  insert into credit_transactions (user_id, type, amount, balance_after, description, stripe_payment_intent_id)
  values (p_user_id, p_type, p_amount, v_new_balance, p_description, p_stripe_payment_intent_id);

  return v_new_balance;
end;
$$;
```

---

## 5. Triggers

### 신규 유저 프로필 자동 생성
```sql
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

### updated_at 자동 갱신
```sql
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at();
```
