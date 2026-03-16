import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getForecast } from '../api'
import { getActivePlan, energyColor, lsGet, lsSet, todayStr } from '../utils'
import StarsBg from '../components/StarsBg'

export default function Home({ user }) {
  const navigate = useNavigate()
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const plan = getActivePlan(user)

  useEffect(() => {
    if (!user?.telegram_id) return
    const key = `forecast_day_${todayStr()}`
    const cached = lsGet(key)
    if (cached) { setForecast(cached); setLoading(false); return }

    getForecast(user.telegram_id, 'day')
      .then(d => { setForecast(d); lsSet(key, d, 6 * 60 * 60 * 1000); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const firstName = user?.name?.split(' ')[0] || 'Привет'
  const dateStr = new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="screen fade-in">
      <StarsBg />

      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{dateStr}</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {firstName} ✨
            {plan !== 'free' && (
              <span className="badge badge-gold" style={{ marginLeft: 8, fontSize: 10, verticalAlign: 'middle' }}>
                {plan === 'trial' ? 'Пробный' : plan === 'platinum' ? '✦ Платинум' : '★ PRO'}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => navigate('/profile')}
          style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)', borderRadius: 20, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', padding: '4px 12px' }}>
          Профиль
        </button>
      </div>

      {/* Энергия + Луна */}
      <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Энергия дня</div>
          <div className="energy-bar" style={{ marginBottom: 6 }}>
            <div className="energy-fill" style={{ width: loading ? '0%' : `${((forecast?.energy || 0) / 10) * 100}%` }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {loading ? '...' : forecast?.moon || ''}
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 52 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: energyColor(forecast?.energy || 5), lineHeight: 1 }}>
            {loading ? '–' : forecast?.energy || '–'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>из 10</div>
        </div>
      </div>

      {/* Прогноз дня */}
      {loading ? (
        <div className="card" style={{ minHeight: 100 }}>
          <div style={{ height: 14, borderRadius: 4, background: 'var(--bg-input)', marginBottom: 8, width: '60%' }} />
          <div style={{ height: 12, borderRadius: 4, background: 'var(--bg-input)', marginBottom: 6 }} />
          <div style={{ height: 12, borderRadius: 4, background: 'var(--bg-input)', width: '80%' }} />
        </div>
      ) : forecast ? (
        <div className="card">
          {forecast.title && (
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{forecast.title}</div>
          )}
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 12 }}>
            {forecast.summary}
          </p>

          {/* Сферы */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {forecast.career && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>💼</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{forecast.career}</span>
              </div>
            )}
            {forecast.love && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>💕</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{forecast.love}</span>
              </div>
            )}
            {forecast.health && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>🌿</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{forecast.health}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Не удалось загрузить прогноз
        </div>
      )}

      {/* Хорошо / Избегать */}
      {forecast?.good_for && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, marginBottom: 6 }}>✅ Хорошо для</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{forecast.good_for}</div>
          </div>
          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#f87171', fontWeight: 700, marginBottom: 6 }}>⚠️ Избегать</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{forecast.avoid}</div>
          </div>
        </div>
      )}

      {/* Совет дня */}
      {forecast?.advice && (
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.12), rgba(29,78,216,0.12))', border: '1px solid rgba(147,51,234,0.25)' }}>
          <div style={{ fontSize: 11, color: 'var(--purple-light)', fontWeight: 700, marginBottom: 6 }}>🔮 Совет астролога</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{forecast.advice}</div>
        </div>
      )}

      {/* Спросить астролога */}
      <button className="btn btn-primary" onClick={() => navigate('/chat')} style={{ marginTop: 4 }}>
        💬 Спросить астролога
      </button>

      {/* Промо PRO для free */}
      {plan === 'free' && (
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.15), rgba(29,78,216,0.15))', border: '1px solid rgba(147,51,234,0.4)', cursor: 'pointer', textAlign: 'center' }}
          onClick={() => navigate('/shop')}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>⭐ Прогноз на 7 дней, 30 сообщений</div>
          <div style={{ fontSize: 13, color: 'var(--purple-light)', fontWeight: 600, marginTop: 6 }}>Улучшить до PRO →</div>
        </div>
      )}
    </div>
  )
}
