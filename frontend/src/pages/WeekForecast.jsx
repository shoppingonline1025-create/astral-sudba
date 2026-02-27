import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMultiForecast } from '../lib/api'
import './WeekForecast.css'

const MONTHS_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`
}

function EnergyBar({ energy }) {
  const color = energy >= 8 ? '#f5c518' : energy >= 6 ? '#a78bfa' : '#ec4899'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
        <div style={{ width: `${energy * 10}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
      <span style={{ color, fontWeight: 700, fontSize: 14, minWidth: 28 }}>{energy}/10</span>
    </div>
  )
}

export default function WeekForecast({ user }) {
  const [tab, setTab] = useState(3)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.telegram_id) return
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `multiForecast_${tab}_${today}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      setData(prev => ({ ...prev, [tab]: JSON.parse(cached) }))
      return
    }
    if (data[tab]) return
    setLoading(true)
    fetchMultiForecast(user.telegram_id, tab)
      .then(res => {
        setData(prev => ({ ...prev, [tab]: res.days }))
        localStorage.setItem(cacheKey, JSON.stringify(res.days))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tab, user])

  const days = data[tab] || []

  return (
    <div className="page week-page fade-in">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/forecasts')}>‹</button>
        <h1>Прогноз на {tab} дня</h1>
        <div style={{ width: 30 }} />
      </div>

      <div className="week-tabs">
        <button className={`week-tab ${tab === 3 ? 'active' : ''}`} onClick={() => setTab(3)}>3 дня</button>
        <button className={`week-tab ${tab === 10 ? 'active' : ''}`} onClick={() => setTab(10)}>10 дней</button>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔮</div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Рассчитываем звёздный путь...</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>Анализируем транзиты планет</p>
        </div>
      )}

      {!loading && days.length > 0 && (
        <div className="week-list">
          {days.map((d, i) => (
            <div
              key={i}
              className={`card week-card ${expanded === i ? 'week-card-open' : ''}`}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="week-card-header">
                <div className="week-date-col">
                  <span className="week-dayname">{d.day}</span>
                  <span className="week-datestr">{formatDate(d.date)}</span>
                </div>
                <div className="week-info-col">
                  <span className="week-moon-text">🌙 {d.moon}</span>
                  <EnergyBar energy={d.energy} />
                </div>
                <span className="week-chevron">{expanded === i ? '▲' : '▼'}</span>
              </div>

              <p className="week-highlight">✦ {d.highlight}</p>

              {expanded === i && (
                <div className="week-expanded fade-in">
                  <div className="week-divider" />
                  <p className="week-summary">{d.summary}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
