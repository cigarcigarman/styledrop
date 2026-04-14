# 운영 가이드 — StyleDrop

## 1. 일간 모니터링

### 매일 확인할 쿼리 (Supabase SQL Editor)

```sql
-- 오늘 생성 건수 + 성공률
select
  count(*) as total,
  count(*) filter (where status = 'done') as success,
  count(*) filter (where status = 'failed') as failed,
  count(*) filter (where status = 'filtered') as filtered,
  round(
    count(*) filter (where status = 'done') * 100.0 / count(*),
    1
  ) as success_rate
from generations
where created_at >= current_date;

-- 오늘 결제 건수 + 금액
select
  count(*) as count,
  sum(amount) as total_amount,
  sum(credits_granted) as total_credits
from payments
where created_at >= current_date
  and status = 'done';

-- 재사용률 (7일 내 2회 이상 결제한 유저 비율)
select
  count(distinct user_id) as repeat_users,
  (select count(distinct user_id) from payments
   where created_at >= now() - interval '7 days'
   and status = 'done') as total_users,
  round(
    count(distinct user_id) * 100.0 /
    nullif((select count(distinct user_id) from payments
            where created_at >= now() - interval '7 days'
            and status = 'done'), 0),
    1
  ) as repeat_rate
from payments
where status = 'done'
  and created_at >= now() - interval '7 days'
group by user_id
having count(*) >= 2;

-- 작가별 오늘 생성 건수
select
  a.name,
  a.twitter_handle,
  count(g.id) as today_count
from artists a
left join generations g
  on g.artist_id = a.id
  and g.created_at >= current_date
  and g.status = 'done'
group by a.id, a.name, a.twitter_handle
order by today_count desc;
```

---

## 2. 주간 정산

### 매주 월요일 실행

```sql
-- 지난 주 작가별 정산액 계산
select
  a.name,
  a.twitter_handle,
  count(g.id) as generation_count,
  count(g.id) * 634 as payout_amount  -- 건당 634원
from artists a
join generations g on g.artist_id = a.id
where g.status = 'done'
  and g.created_at >= date_trunc('week', now()) - interval '1 week'
  and g.created_at < date_trunc('week', now())
group by a.id, a.name, a.twitter_handle
having count(g.id) > 0
order by payout_amount desc;

-- 정산 레코드 insert
insert into artist_payouts (artist_id, generation_count, amount, period_start, period_end)
select
  a.id,
  count(g.id),
  count(g.id) * 634,
  date_trunc('week', now())::date - 7,
  date_trunc('week', now())::date - 1
from artists a
join generations g on g.artist_id = a.id
where g.status = 'done'
  and g.created_at >= date_trunc('week', now()) - interval '1 week'
  and g.created_at < date_trunc('week', now())
group by a.id
having count(g.id) > 0;
```

### 정산 방법
```
1. 위 쿼리로 작가별 정산액 확인
2. 카카오페이 또는 계좌이체로 지급
3. artist_payouts.status = 'paid' 업데이트
4. 작가에게 정산 내역 DM (트위터)
```

---

## 3. 장애 대응

### Replicate API 느릴 때
```
증상: 생성 시간 60초 이상
대응:
1. Replicate 상태 페이지 확인 (status.replicate.com)
2. 서비스 공지 (작가 트위터 DM)
3. 일시적이면 대기, 지속되면 Cold Start 문제
   → 모델 warmup 요청 (Replicate 콘솔에서 수동 prediction)
```

### 결제 안 될 때
```
증상: 토스 결제 창 안 뜨거나 실패
대응:
1. 토스 대시보드 확인
2. 환경변수 키 확인 (test/live 혼용 주의)
3. 토스 고객센터 문의: 1544-7772
```

### NSFW 필터 오작동 (정상 이미지 차단)
```
증상: 평범한 프롬프트인데 filtered 반환
대응:
1. generations 테이블에서 해당 generation_id 조회
2. prompt 확인 후 오탐 판단
3. 오탐이면 크레딧 수동 환불
   update credits set amount = amount + 1
   where user_id = 'xxx';
4. 반복 오탐 패턴이면 FORCED_NEGATIVE 수정
```

### Supabase Storage 업로드 실패
```
증상: 생성은 됐는데 이미지 URL 없음
대응:
1. Supabase Storage 용량 확인 (무료: 1GB)
2. 버킷 정책 확인
3. 이미지 자동 삭제 정책 고려
   → 30일 이상 된 이미지 주기적 삭제
```

---

## 4. 작가 관리

### 새 작가 추가
```sql
-- 1. 작가 데이터 insert
insert into artists (
  name,
  twitter_handle,
  avatar_url,
  bio,
  replicate_model_version,
  trigger_word,
  is_active,
  sort_order
) values (
  '모치모치',
  'mochimochi_art',
  'https://...avatar.jpg',
  '파스텔 감성 캐릭터 일러스트',
  'flux-dev-lora:abc123hash',  -- Replicate 학습 후 받은 버전 해시
  'mochimochi_style',
  false,  -- 샘플 이미지 추가 후 true로 변경
  1
);

-- 2. 샘플 이미지 insert (6장 이상)
insert into artist_samples (artist_id, image_url, sort_order)
values
  ('artist-uuid', 'https://...sample1.webp', 1),
  ('artist-uuid', 'https://...sample2.webp', 2);

-- 3. 확인 후 활성화
update artists set is_active = true where id = 'artist-uuid';
```

### 작가 비활성화 (요청 시)
```sql
update artists
set is_active = false
where twitter_handle = 'mochimochi_art';

-- 기존 크레딧 보유자에게 환불 처리 여부 결정
-- (현재 정책: 환불 없음, 다른 작가 사용 가능)
```

### 작가 금지 키워드 추가
```sql
update artists
set banned_keywords = array_append(banned_keywords, '금지단어')
where id = 'artist-uuid';
```

---

## 5. 유저 CS 대응

### 크레딧 수동 지급 (결제 후 미지급 신고)
```sql
-- 결제 확인 후 진행
update credits
set amount = amount + 1,  -- 혹은 5
    updated_at = now()
where user_id = 'user-uuid';

-- 결제 상태 확인
select * from payments
where user_id = 'user-uuid'
order by created_at desc
limit 5;
```

### 생성 실패 크레딧 환불
```sql
-- 특정 생성 건 크레딧 환불
update credits
set amount = amount + 1,
    updated_at = now()
where user_id = (
  select user_id from generations
  where id = 'generation-uuid'
);

update generations
set status = 'refunded'
where id = 'generation-uuid';
```

---

## 6. 비용 모니터링

### 월간 비용 추적

```
Replicate:
- 대시보드: replicate.com/account/billing
- 목표: 생성 건당 $0.04 이하 유지
- 경보: 월 $100 초과 시 이메일 알림 설정

Supabase:
- 무료 티어: DB 500MB, Storage 1GB, 50,000 MAU
- 초과 시: Pro 플랜 $25/월

Vercel:
- 무료 티어: 충분 (개인 프로젝트 기준)
- Bandwidth 100GB/월 초과 시 과금

토스페이먼츠:
- 수수료: 결제금액의 3.5%
- 별도 청구 없음 (결제 시 자동 차감)
```

### 손익 계산 시트 (월간)
```
매출    = 결제 건수 × 평균 결제금액
지출    = Replicate 비용 + Supabase (초과분) + Vercel (초과분)
수수료  = 매출 × 3.5% (토스)
작가    = 생성 건수 × 634원
순이익  = 매출 - 지출 - 수수료 - 작가 정산
```

---

## 7. PMF 판단 대시보드 쿼리

### 매주 실행해서 추적

```sql
-- 주간 핵심 지표
select
  -- 총 생성
  count(*) filter (where g.status = 'done') as weekly_generations,

  -- 재사용률 (7일 내 2번 이상 결제)
  (
    select count(distinct user_id)
    from payments
    where status = 'done'
      and created_at >= now() - interval '7 days'
    group by user_id
    having count(*) >= 2
  ) as repeat_payers,

  -- 전환율 (방문 → 결제) - 별도 analytics 도구 필요
  -- GA4 또는 Supabase Analytics 사용

  -- 작가당 평균 일일 생성
  count(*) filter (where g.status = 'done') /
    (select count(*) from artists where is_active = true) /
    7.0 as avg_daily_per_artist

from generations g
where g.created_at >= now() - interval '7 days';
```
