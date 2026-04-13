# 운영 SQL — StyleDrop

## Supabase Dashboard → SQL Editor에서 실행

---

## 일간 확인 쿼리

### 오늘의 핵심 지표
```sql
select
  (select count(*) from profiles where created_at::date = current_date) as new_users_today,
  (select count(*) from generations where created_at::date = current_date) as generations_today,
  (select count(*) from generations where created_at::date = current_date and status = 'failed') as failed_today,
  (select coalesce(sum(price_usd), 0) / 100.0 from credit_packages cp
   join credit_transactions ct on ct.description like '%구매%'
   where ct.created_at::date = current_date and ct.type = 'purchase') as revenue_today_usd;
```

### 오늘 실패한 생성 목록
```sql
select
  g.id,
  g.user_id,
  p.email,
  g.prompt,
  g.error_message,
  g.created_at
from generations g
join profiles p on p.id = g.user_id
where g.status = 'failed'
  and g.created_at::date = current_date
order by g.created_at desc;
```

---

## 주간 확인 쿼리

### 주간 DAU (일별 활성 유저)
```sql
select
  date_trunc('day', created_at)::date as date,
  count(distinct user_id) as active_users,
  count(*) as total_generations,
  count(*) filter (where status = 'succeeded') as successful,
  count(*) filter (where status = 'failed') as failed
from generations
where created_at >= current_date - interval '7 days'
group by 1
order by 1 desc;
```

### 유저별 사용량 TOP 20
```sql
select
  p.email,
  p.credits as current_credits,
  p.total_generated,
  count(g.id) as generations_this_week,
  min(g.created_at) as first_generation,
  max(g.created_at) as last_generation
from profiles p
left join generations g on g.user_id = p.id
  and g.created_at >= current_date - interval '7 days'
group by p.id, p.email, p.credits, p.total_generated
having count(g.id) > 0
order by generations_this_week desc
limit 20;
```

### 주간 수익
```sql
select
  date_trunc('day', ct.created_at)::date as date,
  count(*) as purchases,
  sum(ct.amount) as credits_sold,
  -- 패키지 매출 추정 (credit_packages 단가 기준)
  sum(case
    when ct.amount = 20 then 4.00
    when ct.amount = 60 then 9.00
    when ct.amount = 150 then 19.00
    else 0
  end) as revenue_usd
from credit_transactions ct
where ct.type = 'purchase'
  and ct.created_at >= current_date - interval '7 days'
group by 1
order by 1 desc;
```

### 코호트 전환율 (가입 후 유료 전환)
```sql
select
  date_trunc('week', p.created_at)::date as signup_week,
  count(distinct p.id) as total_signups,
  count(distinct ct.user_id) as paid_users,
  round(100.0 * count(distinct ct.user_id) / count(distinct p.id), 1) as conversion_rate
from profiles p
left join credit_transactions ct on ct.user_id = p.id and ct.type = 'purchase'
where p.created_at >= current_date - interval '8 weeks'
group by 1
order by 1 desc;
```

---

## 월간 확인 쿼리

### MRR (이번 달 수익)
```sql
select
  count(*) as total_purchases,
  sum(case when amount = 20 then 4.00 when amount = 60 then 9.00 when amount = 150 then 19.00 else 0 end) as mrr_usd
from credit_transactions
where type = 'purchase'
  and date_trunc('month', created_at) = date_trunc('month', current_date);
```

### D30 리텐션
```sql
with cohort as (
  select id, created_at::date as signup_date
  from profiles
  where created_at >= current_date - interval '60 days'
    and created_at < current_date - interval '30 days'
)
select
  count(distinct c.id) as cohort_size,
  count(distinct g.user_id) as returned_d30,
  round(100.0 * count(distinct g.user_id) / count(distinct c.id), 1) as d30_retention
from cohort c
left join generations g on g.user_id = c.id
  and g.created_at::date between c.signup_date + 29 and c.signup_date + 31;
```

### 스타일 프리셋별 인기도
```sql
select
  coalesce(style_preset, '(없음)') as style,
  count(*) as usage_count,
  round(100.0 * count(*) / sum(count(*)) over(), 1) as percentage
from generations
where created_at >= current_date - interval '30 days'
group by 1
order by 2 desc;
```

---

## 운영 액션 쿼리

### 수동 크레딧 지급 (CS 대응)
```sql
-- 특정 유저에게 크레딧 지급
select add_credits(
  'USER_UUID_HERE',  -- 유저 ID
  10,                -- 지급 크레딧 수
  'bonus',           -- 타입
  'CS 대응: 생성 실패 보상'  -- 사유
);
```

### 생성 stuck 확인 (processing 상태로 30분 이상)
```sql
select
  g.id,
  g.user_id,
  p.email,
  g.replicate_prediction_id,
  g.created_at,
  now() - g.created_at as elapsed
from generations g
join profiles p on p.id = g.user_id
where g.status = 'processing'
  and g.created_at < now() - interval '30 minutes'
order by g.created_at;
```

### Stuck 생성 강제 실패 처리 + 크레딧 환불
```sql
-- 주의: 실제로 Replicate에서 완료됐는지 먼저 확인 후 실행
update generations
set status = 'failed', error_message = 'Timeout: 자동 실패 처리'
where id = 'GENERATION_UUID_HERE'
  and status = 'processing';

-- 환불
select add_credits(
  'USER_UUID_HERE',
  1,
  'refund',
  '생성 타임아웃 환불'
);
```

### 유저 검색
```sql
select id, email, credits, total_generated, created_at
from profiles
where email ilike '%검색어%'
order by created_at desc;
```
