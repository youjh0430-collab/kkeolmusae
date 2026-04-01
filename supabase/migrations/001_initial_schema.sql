-- simulations 테이블
create table if not exists simulations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  item_name         text not null,
  item_price        integer not null,
  period_start      date not null,
  period_end        date not null,
  stock_ticker      text not null,
  stock_name        text not null,
  buy_price         numeric not null,
  current_price     numeric not null,
  return_rate       numeric not null,
  investment_amount numeric not null,
  profit_amount     numeric not null,
  share_image_url   text,
  created_at        timestamptz not null default now()
);

-- popular_items 테이블
create table if not exists popular_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price       integer not null,
  emoji       text not null,
  category    text not null,
  usage_count integer not null default 0
);

-- popular_stocks 테이블
create table if not exists popular_stocks (
  id               uuid primary key default gen_random_uuid(),
  ticker           text not null unique,
  name_ko          text not null,
  market           text not null check (market in ('KR', 'US')),
  simulation_count integer not null default 0,
  avg_return_rate  numeric not null default 0
);

-- popular_items 초기 데이터
insert into popular_items (name, price, emoji, category) values
  ('아이스 아메리카노', 4500,  '☕', '카페'),
  ('스타벅스 라떼',    6500,  '🥛', '카페'),
  ('편의점 도시락',    5000,  '🍱', '식사'),
  ('점심 외식',       12000, '🍜', '식사'),
  ('치킨',           21000, '🍗', '외식'),
  ('배달 피자',       25000, '🍕', '외식'),
  ('넷플릭스 구독',   17000, '📺', '구독'),
  ('담배 한 갑',       4500, '🚬', '기타'),
  ('편의점 맥주 2캔',  4000, '🍺', '주류'),
  ('로또 1장',        1000, '🎰', '기타');

-- popular_stocks 초기 데이터
insert into popular_stocks (ticker, name_ko, market) values
  ('005930.KS', '삼성전자',        'KR'),
  ('000660.KS', 'SK하이닉스',      'KR'),
  ('035420.KS', 'NAVER',           'KR'),
  ('051910.KS', 'LG화학',          'KR'),
  ('AAPL',      '애플',            'US'),
  ('NVDA',      '엔비디아',         'US'),
  ('TSLA',      '테슬라',          'US'),
  ('MSFT',      '마이크로소프트',   'US'),
  ('AMZN',      '아마존',          'US'),
  ('META',      '메타',            'US');

-- RLS 활성화
alter table simulations    enable row level security;
alter table popular_items  enable row level security;
alter table popular_stocks enable row level security;

-- simulations: 자신의 행 읽기, 누구나 삽입 (비로그인 포함)
create policy "simulations_select_own" on simulations
  for select using (auth.uid() = user_id or user_id is null);

create policy "simulations_insert" on simulations
  for insert with check (true);

-- popular_items, popular_stocks: 누구나 읽기
create policy "popular_items_select"  on popular_items  for select using (true);
create policy "popular_stocks_select" on popular_stocks for select using (true);
