import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMultiForecast } from '../lib/api'
import './WeekForecast.css'

const MONTHS_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`
}

export default function WeekForecast({ user }) {
  const [tab, setTab] = useState(3)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.telegram_id) return
    if (data[tab]) return
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `multiForecast_v3_${tab}_${today}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed?.forecast) { setData(prev => ({ ...prev, [tab]: parsed })); return }
      } catch {}
    }
    setLoading(true)
    setError(null)
    fetchMultiForecast(user.telegram_id, tab)
      .then(res => {
        setData(prev => ({ ...prev, [tab]: res }))
        if (res?.forecast) localStorage.setItem(cacheKey, JSON.stringify(res))
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [tab, user])

  const current = data[tab]
  const forecast = current?.forecast
  const moonDays = current?.moon_days || []

  const energyColor = forecast?.energy >= 8 ? '#f5c518' : forecast?.energy >= 6 ? '#a78bfa' : '#ec4899'

  return (
    <div className="page week-page fade-in">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/forecasts')}>‹</button>
        <h1>Прогноз на {tab} {tab === 3 ? 'дня' : 'дней'}</h1>
        <div style={{ width: 30 }} />
      </div>

      <div className="week-tabs">
        <button className={`week-tab ${tab === 3 ? 'active' : ''}`} onClick={() => setTab(3)}>3 дня</button>
        <button className={`week-tab ${tab === 10 ? 'active' : ''}`} onClick={() => setTab(10)}>10 дней</button>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔮</div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Составляем прогноз...</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>Анализируем транзиты планет</p>
        </div>
      )}

      {error && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ color: '#ec4899', fontSize: 13 }}>{error}</p>
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setData({})}>Повторить</button>
        </div>
      )}

      {forecast && !loading && (
        <>
          {/* Главная карточка */}
          <div className="card week-main-card">
            <div className="week-energy-row">
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>Энергия периода</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: energyColor }}>{forecast.energy}/10</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, margin: '10px 0 16px' }}>
              <div style={{ width: `${forecast.energy * 10}%`, height: '100%', background: energyColor, borderRadius: 3 }} />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)' }}>{forecast.summary}</p>
          </div>

          {/* Темы периода */}
          <div className="card" style={{ gap: 10, display: 'flex', flexDirection: 'column' }}>
            <div className="week-detail-row">
              <span className="week-detail-icon">✦</span>
              <div>
                <div className="week-detail-label">Темы периода</div>
                <div className="week-detail-text">{forecast.themes}</div>
              </div>
            </div>
            <div className="week-detail-row">
              <span className="week-detail-icon">⏰</span>
              <div>
                <div className="week-detail-label">Лучшее время</div>
                <div className="week-detail-text">{forecast.best_time}</div>
              </div>
            </div>
            <div className="week-detail-row">
              <span className="week-detail-icon">💡</span>
              <div>
                <div className="week-detail-label">Совет</div>
                <div className="week-detail-text">{forecast.advice}</div>
              </div>
            </div>
          </div>

          {/* Луна по дням */}
          {moonDays.length > 0 && (
            <div className="card">
              <div className="week-detail-label" style={{ marginBottom: 10 }}>🌙 Луна по дням</div>
              <div className="week-moon-grid">
                {moonDays.map((d, i) => (
                  <div key={i} className="week-moon-item">
                    <span className="week-moon-day">{d.day.slice(0, 2)}</span>
                    <span className="week-moon-date">{formatDate(d.date)}</span>
                    <span className="week-moon-sign">{d.moon}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
