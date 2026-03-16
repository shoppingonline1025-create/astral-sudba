import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getForecast } from '../api'
import { getActivePlan, energyColor, lsGet, lsSet, todayStr } from '../utils'

const PERIODS = [
  { key: 'day',   label: '📅 Сегодня', plan: 'free' },
  { key: 'week',  label: '🗓 7 дней',  plan: 'pro' },
  { key: 'month', label: '🌙 Месяц',   plan: 'platinum' },
]

export default function Forecast({ user }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('day')
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const plan = getActivePlan(user)

  const planOrder = ['free', 'trial', 'pro', 'platinum']
  function hasAccess(required) {
    if (required === 'free') return true
    if (required === 'pro') return ['trial', 'pro', 'platinum'].includes(plan)
    if (required === 'platinum') return plan === 'platinum'
    return false
  }

  useEffect(() => {
    if (!user?.telegram_id) return
    const period = PERIODS.find(p => p.key === tab)
    if (!hasAccess(period.plan)) return

    const key = `forecast_${tab}_${todayStr()}`
    const cached = lsGet(key)
    if (cached) { setForecast(cached); return }

    setLoading(true)
    setForecast(null)
    getForecast(user.telegram_id, tab)
      .then(d => { setForecast(d); lsSet(key, d, 6 * 60 * 60 * 1000) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tab, user])

  const currentPeriod = PERIODS.find(p => p.key === tab)
  const locked = !hasAccess(currentPeriod.plan)

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>Прогнозы</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Таб-переключатель */}
      <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 12, padding: 4, gap: 4 }}>
        {PERIODS.map(p => (
          <button key={p.key}
            onClick={() => setTab(p.key)}
            style={{
              flex: 1, padding: '9px 4px', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === p.key ? 'linear-gradient(135deg, var(--purple), #1d4ed8)' : 'transparent',
              color: tab === p.key ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s',
              position: 'relative',
            }}>
            {p.label}
            {!hasAccess(p.plan) && <span style={{ marginLeft: 2 }}>🔒</span>}
          </button>
        ))}
      </div>

      {/* Заблокировано — размытый превью */}
      {locked && (
        <div style={{ position: 'relative' }}>
          {/* Размытый контент */}
          <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{ fontWeight: 800, fontSize: 17 }}>
                  {tab === 'week' ? '✨ Неделя высокой энергии' : '🌙 Месяц трансформаций'}
                </h2>
                <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--gold)' }}>8/10</span>
              </div>
              <div className="energy-bar" style={{ marginBottom: 10 }}>
                <div className="energy-fill" style={{ width: '80%' }} />
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14 }}>
                Планеты складываются в благоприятную конфигурацию. Венера усиливает притяжение в отношениях, Меркурий ускоряет мысли и переговоры. Это время для важных решений и новых начинаний — звёзды поддерживают ваши усилия.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { icon: '💼', label: 'Карьера', text: 'Благоприятный период для карьерного роста и переговоров' },
                { icon: '💕', label: 'Любовь', text: 'Венера усиливает притяжение, возможны яркие встречи' },
                { icon: '🧘', label: 'Здоровье', text: 'Высокий уровень энергии, хорошо для спорта' },
              ].map(item => (
                <div key={item.label} className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                  <p style={{ fontSize: 12, lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 24 }}>🔮</span>
              <p style={{ fontStyle: 'italic', color: 'var(--gold)', marginTop: 8, lineHeight: 1.6 }}>
                «Доверяйте интуиции — она сейчас острее обычного. Лучшие дни: вторник и пятница.»
              </p>
            </div>
          </div>

          {/* Оверлей */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'rgba(7,6,15,0.55)', borderRadius: 16 }}>
            <div style={{ fontSize: 36 }}>🔒</div>
            <p style={{ fontWeight: 700, textAlign: 'center', fontSize: 16 }}>
              {tab === 'week' ? 'Прогноз на 7 дней — PRO' : 'Прогноз на месяц — Платинум'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 220 }}>
              {tab === 'week' ? 'От $5/мес · 30 сообщений · прогноз на неделю' : 'От $9/мес · 80 сообщений · прогноз на 30 дней'}
            </p>
            <button className="btn btn-primary" style={{ maxWidth: 200 }} onClick={() => navigate('/shop')}>
              Разблокировать →
            </button>
          </div>
        </div>
      )}

      {/* Загрузка */}
      {loading && !locked && (
        <div className="loading-screen">
          <div className="spinner">🔮</div>
          <p>Составляем прогноз...</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Анализируем положение планет</p>
        </div>
      )}

      {/* Прогноз */}
      {forecast && !loading && !locked && (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontWeight: 800, fontSize: 18 }}>{forecast.title || '✨ Прогноз'}</h2>
              {forecast.energy && (
                <span style={{ fontWeight: 800, fontSize: 20, color: energyColor(forecast.energy) }}>
                  {forecast.energy}/10
                </span>
              )}
            </div>
            {forecast.energy && (
              <div className="energy-bar" style={{ marginBottom: 12 }}>
                <div className="energy-fill" style={{ width: `${(forecast.energy / 10) * 100}%` }} />
              </div>
            )}
            {forecast.moon && <p style={{ fontSize: 13, color: 'var(--purple-light)', marginBottom: 8 }}>🌙 {forecast.moon}</p>}
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{forecast.summary}</p>
          </div>

          {forecast.best_time && (
            <div className="card">
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>⏰ Лучшее время</span>
              <p style={{ fontWeight: 600, marginTop: 4, color: 'var(--gold)' }}>{forecast.best_time}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { key: 'career', icon: '💼', label: 'Карьера' },
              { key: 'love',   icon: '💕', label: 'Любовь' },
              { key: 'health', icon: '🧘', label: 'Здоровье' },
            ].map(item => forecast[item.key] && (
              <div key={item.key} className="card" style={{ padding: 12 }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                <p style={{ fontSize: 12, lineHeight: 1.5 }}>{forecast[item.key]}</p>
              </div>
            ))}
          </div>

          {forecast.advice && (
            <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(240,208,128,0.3)' }}>
              <span style={{ fontSize: 24 }}>🔮</span>
              <p style={{ fontStyle: 'italic', color: 'var(--gold)', marginTop: 8, lineHeight: 1.6 }}>«{forecast.advice}»</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
