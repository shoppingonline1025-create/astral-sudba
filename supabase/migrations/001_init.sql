-- АстроЛичность — начальная схема БД
-- Запустить в Supabase SQL Editor

-- 1. Пользователи
create table if not exists users (
  id                       bigserial primary key,
  telegram_id              bigint unique not null,
  name                     text not null,
  birth_date               date not null,
  birth_time               time,
  birth_place              text not null,
  subscription_status      text default 'free',   -- 'free' | 'pro' | 'platinum'
  subscription_expires_at  timestamptz,
  trial_ends_at            timestamptz,
  messages_used_this_month integer default 0,
  created_at               timestamptz default now()
);

-- 2. Натальные карты
create table if not exists natal_charts (
  id           bigserial primary key,
  user_id      bigint references users(id) on delete cascade,
  birth_date   date,
  birth_time   time,
  birth_place  text,
  sun_sign     text,
  moon_sign    text,
  ascendant    text,
  planets_json jsonb,
  houses_json  jsonb,
  aspects_json jsonb,
  created_at   timestamptz default now()
);

-- 3. История чата
create table if not exists chat_history (
  id         bigserial primary key,
  user_id    bigint references users(id) on delete cascade,
  role       text not null,  -- 'user' | 'assistant'
  content    text not null,
  created_at timestamptz default now()
);

-- 4. Партнёры (синастрия)
create table if not exists partners (
  id           bigserial primary key,
  user_id      bigint references users(id) on delete cascade,
  name         text not null,
  birth_date   date not null,
  birth_time   time,
  birth_place  text,
  synastry_json jsonb,
  created_at   timestamptz default now()
);

-- 5. Кэш прогнозов
create table if not exists forecasts_cache (
  id            bigserial primary key,
  user_id       bigint references users(id) on delete cascade,
  forecast_date date not null,
  period        text not null,  -- 'day' | 'week' | 'month'
  content       jsonb,
  created_at    timestamptz default now(),
  unique(user_id, forecast_date, period)
);

-- 6. Разовые покупки
create table if not exists one_time_purchases (
  id             bigserial primary key,
  user_id        bigint references users(id) on delete cascade,
  product_type   text not null,
  partner_id     bigint references partners(id) on delete set null,
  payment_method text,       -- 'stars' | 'cryptomus'
  amount_usd     numeric,
  status         text default 'pending',  -- 'pending' | 'completed' | 'failed'
  result_url     text,
  purchased_at   timestamptz default now(),
  expires_at     timestamptz
);

-- Индексы
create index if not exists idx_users_telegram on users(telegram_id);
create index if not exists idx_natal_user on natal_charts(user_id);
create index if not exists idx_chat_user on chat_history(user_id, created_at);
create index if not exists idx_forecast_user_date on forecasts_cache(user_id, forecast_date, period);
create index if not exists idx_purchases_user on one_time_purchases(user_id, status);

-- RLS (Row Level Security) — отключаем для service_key
alter table users               enable row level security;
alter table natal_charts        enable row level security;
alter table chat_history        enable row level security;
alter table partners            enable row level security;
alter table forecasts_cache     enable row level security;
alter table one_time_purchases  enable row level security;

-- Политики для service_role (бэкенд)
create policy "service_role_all" on users              for all using (true);
create policy "service_role_all" on natal_charts       for all using (true);
create policy "service_role_all" on chat_history       for all using (true);
create policy "service_role_all" on partners           for all using (true);
create policy "service_role_all" on forecasts_cache    for all using (true);
create policy "service_role_all" on one_time_purchases for all using (true);
