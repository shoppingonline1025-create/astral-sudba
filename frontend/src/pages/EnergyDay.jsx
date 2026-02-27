import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchForecast } from '../lib/api'
import './EnergyDay.css'

export default function EnergyDay({ user }) {
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.telegram_id) return
    fetchForecast(user.telegram_id)
      .then(data => { setForecast(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  return (
    <div className="page energy-page fade-in">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>Энергия Дня ✨</h1>
        <div style={{ width: 30 }} />
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Загружаем энергию дня...</p>
        </div>
      )}

      {forecast && !loading && (
        <>
          <div className="card main-energy-card">
            <div className="moon-title">{forecast.moon}</div>
            <div className="energy-row">
              <span className="e-label">Энергия:</span>
              <span className="e-value gold">{forecast.energy}/10</span>
            </div>
            <div className="energy-row">
              <span className="e-label">Лучшее время:</span>
              <span className="e-value">{forecast.best_time}</span>
            </div>
            <div className="advice-block">
              <span className="advice-label">Совет дня:</span>
              <p className="advice-text">{forecast.advice}</p>
            </div>
          </div>

          <h2 className="section-title">📊 По сферам жизни</h2>
          <div className="detail-grid">
            <div className="card detail-energy-card">
              <div className="detail-top">
                <span className="detail-icon">💼</span>
                <span className="detail-topic">Работа</span>
              </div>
              <p className="detail-text">{forecast.career}</p>
            </div>
            <div className="card detail-energy-card">
              <div className="detail-top">
                <span className="detail-icon">💕</span>
                <span className="detail-topic">Любовь</span>
              </div>
              <p className="detail-text">{forecast.love}</p>
            </div>
            <div className="card detail-energy-card">
              <div className="detail-top">
                <span className="detail-icon">🧘</span>
                <span className="detail-topic">Здоровье</span>
              </div>
              <p className="detail-text">{forecast.health}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
