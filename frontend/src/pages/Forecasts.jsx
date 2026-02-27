import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchForecast, clearCache } from '../lib/api'
import './Forecasts.css'

export default function Forecasts({ user }) {
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.telegram_id) return
    setLoading(true)
    fetchForecast(user.telegram_id)
      .then(data => { setForecast(data); setLoading(false) })
      .catch(() => { setError('Не удалось загрузить прогноз'); setLoading(false) })
  }, [user])

  async function handleRefresh() {
    if (!user?.telegram_id || refreshing) return
    setRefreshing(true)
    // Очищаем localStorage (кэш многодневных прогнозов)
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('multiForecast_')) localStorage.removeItem(k)
    })
    // Очищаем кэш дневного прогноза в Supabase
    try { await clearCache(user.telegram_id) } catch {}
    // Перезагружаем прогноз
    setForecast(null)
    setError(null)
    setLoading(true)
    fetchForecast(user.telegram_id)
      .then(data => { setForecast(data); setLoading(false) })
      .catch(() => { setError('Не удалось загрузить прогноз'); setLoading(false) })
      .finally(() => setRefreshing(false))
  }

  return (
    <div className="page forecasts-page fade-in">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>Прогнозы</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', opacity: refreshing ? 0.4 : 1, transition: 'opacity 0.2s' }}
          title="Обновить прогноз"
        >🔄</button>
      </div>

      {loading && (
        <div className="forecast-loading">
          <div className="loading-spinner">✨</div>
          <p>Составляем ваш личный прогноз...</p>
          <p className="loading-sub">Анализируем положение планет</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button className="btn-primary" style={{ marginTop: 12 }}
            onClick={() => window.location.reload()}>Повторить</button>
        </div>
      )}

      {/* Кнопки прогноза на несколько дней */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-primary" style={{ flex: 1, fontSize: 14 }} onClick={() => navigate('/week-forecast')}>
          📅 На 3 дня
        </button>
        <button className="btn-primary" style={{ flex: 1, fontSize: 14, background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }} onClick={() => navigate('/week-forecast')}>
          🗓️ На 10 дней
        </button>
      </div>

      {forecast && !loading && (
        <>
          {/* Главная карточка */}
          <div className="forecast-card card fade-in">
            <div className="forecast-header">
              <h2 className="section-title">✨ {forecast.title}</h2>
              <div className="energy-badge gold">{forecast.energy}/10</div>
            </div>

            <p className="forecast-moon">{forecast.moon}</p>
            <p className="forecast-text">{forecast.summary}</p>

            <div className="activity-block">
              <span className="activity-label">⏰ Лучшее время:</span>
              <span className="activity-time gold">{forecast.best_time}</span>
            </div>
          </div>

          {/* Сферы жизни */}
          <div className="detail-cards">
            <div className="card detail-card">
              <h3 className="detail-title">💼 Карьера</h3>
              <p className="detail-text">{forecast.career}</p>
            </div>
            <div className="card detail-card">
              <h3 className="detail-title">💕 Отношения</h3>
              <p className="detail-text">{forecast.love}</p>
            </div>
            <div className="card detail-card">
              <h3 className="detail-title">🧘 Здоровье</h3>
              <p className="detail-text">{forecast.health}</p>
            </div>
          </div>

          {/* Совет дня */}
          <div className="card advice-card">
            <span className="advice-icon">🔮</span>
            <p className="advice-text">«{forecast.advice}»</p>
          </div>
        </>
      )}
    </div>
  )
}
