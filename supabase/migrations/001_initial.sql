-- =============================================
-- Миграция 001: Начальная схема АстроЛичность
-- Выполнить в Supabase → SQL Editor
-- =============================================

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
  id                        BIGSERIAL PRIMARY KEY,
  telegram_id               BIGINT UNIQUE NOT NULL,
  name                      TEXT NOT NULL,
  subscription_status       TEXT NOT NULL DEFAULT 'trial'
                              CHECK (subscription_status IN ('free','trial','pro','platinum')),
  subscription_expires_at   TIMESTAMPTZ,
  trial_ends_at             TIMESTAMPTZ,
  messages_used_this_month  INT NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Натальные карты
CREATE TABLE IF NOT EXISTS natal_charts (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  birth_date   DATE NOT NULL,
  birth_time   TIME,
  birth_place  TEXT,
  birth_lat    DOUBLE PRECISION,
  birth_lng    DOUBLE PRECISION,
  timezone     TEXT,
  sun_sign     TEXT,
  moon_sign    TEXT,
  ascendant    TEXT,
  planets_json JSONB,
  houses_json  JSONB,
  aspects_json JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- История чата
CREATE TABLE IF NOT EXISTS chat_history (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Партнёры для синастрии
CREATE TABLE IF NOT EXISTS partners (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  birth_date   DATE NOT NULL,
  birth_time   TIME,
  birth_place  TEXT,
  birth_lat    DOUBLE PRECISION,
  birth_lng    DOUBLE PRECISION,
  synastry_json JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Кэш прогнозов
CREATE TABLE IF NOT EXISTS forecasts_cache (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  period        TEXT NOT NULL CHECK (period IN ('day', 'week', 'month')),
  content       JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, forecast_date, period)
);

-- Разовые покупки
CREATE TABLE IF NOT EXISTS one_time_purchases (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_type   TEXT NOT NULL,
  partner_id     BIGINT REFERENCES partners(id),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stars', 'cryptomus')),
  amount_usd     NUMERIC(10,2),
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'completed', 'failed')),
  result_url     TEXT,
  purchased_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ
);

-- =============================================
-- Индексы для производительности
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_telegram_id       ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_natal_charts_user_id    ON natal_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id    ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);
CREATE INDEX IF NOT EXISTS idx_partners_user_id        ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_user_date     ON forecasts_cache(user_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id       ON one_time_purchases(user_id);
