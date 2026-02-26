import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Forecasts.css'

const forecasts = {
  '1day': {
    title: 'Прогноз на Сегодня',
    text: 'Эмоциональный день. Вы будете полны энергии — отличное время для новых начинаний.',
    moments: ['❤️ Удача в делах', '💜 Гармония в отношениях'],
    activity: '12:00 – 16:00',
    energy: 8,
  },
  '3days': {
    title: 'Прогноз на 3 дня',
    text: 'Период активных изменений. Благоприятно для принятия важных решений и встреч.',
    moments: ['⭐ Карьерный рост', '💰 Финансовая удача', '🌙 Интуиция усилена'],
    activity: '10:00 – 14:00',
    energy: 9,
  },
  'week': {
    title: 'Прогноз на Неделю',
    text: 'Неделя возможностей. Планеты благоволят творческим проектам и новым знакомствам.',
    moments: ['🎨 Творческий подъём', '🤝 Удачные знакомства', '🏃 Высокая активность'],
    activity: '09:00 – 13:00',
    energy: 7,
  },
}

export default function Forecasts() {
  const [period, setPeriod] = useState('1day')
  const navigate = useNavigate()
  const data = forecasts[period]

  return (
    <div className="page forecasts-page fade-in">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>Прогнозы</h1>
        <div style={{ width: 30 }} />
      </div>

      <div className="tabs">
        <button className={`tab ${period === '1day' ? 'active' : ''}`} onClick={() => setPeriod('1day')}>На 1 день</button>
        <button className={`tab ${period === '3days' ? 'active' : ''}`} onClick={() => setPeriod('3days')}>На 3 дня</button>
        <button className={`tab ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>На неделю</button>
      </div>

      <div className="forecast-card card fade-in" key={period}>
        <div className="forecast-header">
          <h2 className="section-title">✨ {data.title}</h2>
          <div className="energy-badge gold">{data.energy}/10</div>
        </div>

        <p className="forecast-text">{data.text}</p>

        <div className="moments-block">
          <p className="moments-title">Ключевые моменты:</p>
          <ul className="moments-list">
            {data.moments.map((m, i) => (
              <li key={i} className="moment-item">{m}</li>
            ))}
          </ul>
        </div>

        <div className="activity-block">
          <span className="activity-label">⏰ Время активности:</span>
          <span className="activity-time gold">{data.activity}</span>
        </div>
      </div>

      {/* Detailed sections */}
      <div className="detail-cards">
        <div className="card detail-card">
          <h3 className="detail-title">💼 Карьера</h3>
          <p className="detail-text">Марс в благоприятном аспекте усиливает вашу деловую активность. Хорошее время для переговоров.</p>
        </div>
        <div className="card detail-card">
          <h3 className="detail-title">💕 Любовь</h3>
          <p className="detail-text">Венера благоволит романтическим встречам. Партнёр оценит вашу открытость и искренность.</p>
        </div>
        <div className="card detail-card">
          <h3 className="detail-title">💰 Финансы</h3>
          <p className="detail-text">Избегайте крупных трат в первой половине дня. После полудня ситуация улучшится.</p>
        </div>
      </div>
    </div>
  )
}
