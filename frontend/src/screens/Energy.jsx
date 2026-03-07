import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getForecast } from '../api'
import { energyColor, lsGet, lsSet, todayStr } from '../utils'

export default function Energy({ user }) {
  const navigate = useNavigate()
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.telegram_id) return
    const key = `forecast_day_${todayStr()}`
    const cached = lsGet(key)
    if (cached) { setForecast(cached); setLoading(false); return }
    getForecast(user.telegram_id, 'day')
      .then(d => { setForecast(d); lsSet(key, d, 6 * 60 * 60 * 1000) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>⚡ Энергия дня</h1>
        <div style={{ width: 36 }} />
      </div>

      {loading && <div className="loading-screen"><div className="spinner">⚡</div><p>Загружаем...</p></div>}

      {forecast && !loading && (
        <>
          {/* Главный показатель */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, fontWeight: 900, color: energyColor(forecast.energy), lineHeight: 1 }}>
              {forecast.energy}
            </div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>из 10</div>
            <div className="energy-bar">
              <div className="energy-fill" style={{ width: `${(forecast.energy / 10) * 100}%` }} />
            </div>
            {forecast.moon && (
              <p style={{ marginTop: 12, color: 'var(--purple-light)', fontWeight: 600 }}>🌙 {forecast.moon}</p>
            )}
          </div>

          {/* Краткое описание */}
          {forecast.summary && (
            <div className="card">
              <p style={{ lineHeight: 1.65, color: 'var(--text-secondary)' }}>{forecast.summary}</p>
            </div>
          )}

          {/* Лучшее время */}
          {forecast.best_time && (
            <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 28 }}>⏰</span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Лучшее время</div>
                <div style={{ fontWeight: 700, color: 'var(--gold)' }}>{forecast.best_time}</div>
              </div>
            </div>
          )}

          {/* Сферы */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { key: 'career', icon: '💼', label: 'Карьера' },
              { key: 'love',   icon: '💕', label: 'Любовь' },
              { key: 'health', icon: '🧘', label: 'Здоровье' },
            ].map(item => forecast[item.key] && (
              <div key={item.key} className="card" style={{ padding: 12 }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                <p style={{ fontSize: 12, lineHeight: 1.5 }}>{forecast[item.key]}</p>
              </div>
            ))}
          </div>

          {/* Совет */}
          {forecast.advice && (
            <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(240,208,128,0.3)' }}>
              <p style={{ fontStyle: 'italic', color: 'var(--gold)', lineHeight: 1.6 }}>«{forecast.advice}»</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
