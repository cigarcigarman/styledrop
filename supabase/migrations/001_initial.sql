-- StyleDrop 초기 스키마

-- 작가
create table artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  twitter_handle text,
  avatar_url text,
  bio text,
  replicate_model_version text not null,
  trigger_word text not null,
  banned_keywords text[] default '{}',
  daily_limit integer default 500,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- 작가 샘플 이미지
create table artist_samples (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references artists(id) on delete cascade,
  image_url text not null,
  sort_order integer default 0
);

-- 유저 프로필
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 크레딧 잔액
create table credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  amount integer not null default 0,
  updated_at timestamptz default now()
);

-- 결제 내역
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  payment_key text unique,
  order_id text unique,
  amount integer not null,
  credits_granted integer not null,
  status text default 'pending',
  created_at timestamptz default now()
);

-- 생성 기록
create table generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  artist_id uuid references artists(id),
  prompt text not null,
  result_url text,
  replicate_prediction_id text,
  is_filtered boolean default false,
  status text default 'pending',
  credits_used integer default 1,
  created_at timestamptz default now()
);

-- 작가 정산
create table artist_payouts (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references artists(id),
  generation_count integer not null,
  amount integer not null,
  period_start date,
  period_end date,
  status text default 'pending',
  created_at timestamptz default now()
);

-- RLS 활성화
alter table artists enable row level security;
alter table artist_samples enable row level security;
alter table profiles enable row level security;
alter table credits enable row level security;
alter table payments enable row level security;
alter table generations enable row level security;

-- RLS 정책
create policy "artists_public_read" on artists
  for select using (is_active = true);

create policy "samples_public_read" on artist_samples
  for select using (true);

create policy "profiles_own" on profiles
  for all using (auth.uid() = id);

create policy "credits_own" on credits
  for all using (auth.uid() = user_id);

create policy "payments_own_read" on payments
  for select using (auth.uid() = user_id);

create policy "generations_own" on generations
  for all using (auth.uid() = user_id);

-- 인덱스
create index idx_generations_user_id on generations(user_id);
create index idx_generations_artist_id on generations(artist_id);
create index idx_generations_created_at on generations(created_at desc);
create index idx_generations_status on generations(status);
create index idx_artists_is_active on artists(is_active, sort_order);

-- 유저 가입 트리거: profiles + credits 자동 생성
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, nickname, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into credits (user_id, amount) values (new.id, 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 크레딧 차감 함수 (동시성 안전)
create or replace function deduct_credit(p_user_id uuid)
returns boolean as $$
declare
  v_current integer;
begin
  select amount into v_current
  from credits
  where user_id = p_user_id
  for update;

  if v_current < 1 then
    return false;
  end if;

  update credits
  set amount = amount - 1,
      updated_at = now()
  where user_id = p_user_id;

  return true;
end;
$$ language plpgsql;

-- 테스트용 더미 작가 데이터
insert into artists (
  name, twitter_handle, bio,
  replicate_model_version, trigger_word,
  is_active, sort_order
) values
(
  '모치모치',
  'mochimochi_art',
  '파스텔 감성 캐릭터 일러스트',
  'placeholder_version_hash_1',
  'mochimochi_style',
  true, 1
),
(
  '린린',
  'linlin_draws',
  '깔끔한 선화 감성 일러스트',
  'placeholder_version_hash_2',
  'linlin_style',
  true, 2
);
