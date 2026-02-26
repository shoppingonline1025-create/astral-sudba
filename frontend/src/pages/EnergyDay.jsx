import { useNavigate } from 'react-router-dom'
import './EnergyDay.css'

const mockEnergy = {
  moon: 'Луна в Стрельце ♐',
  energy: 9,
  bestTime: '11:00 – 15:00',
  advice: 'Смело идите к своим целям!',
  details: [
    { icon: '💼', topic: 'Работа', text: 'Отличный день для активных действий и переговоров.', score: 9 },
    { icon: '💕', topic: 'Любовь', text: 'Открытость и искренность привлекут нужных людей.', score: 8 },
    { icon: '🧘', topic: 'Здоровье', text: 'Умеренная физическая активность придаст сил.', score: 7 },
    { icon: '💰', topic: 'Финансы', text: 'Благоприятно для долгосрочных вложений.', score: 8 },
  ],
  lunar: {
    day: 14,
    phase: 'Полнолуние 🌕',
    tip: 'Время завершать дела и подводить итоги.',
  },
}

function ScoreBar({ score }) {
  return (
    <div className="score-bar-wrap">
      <div className="score-bar">
        <div className="score-fill" style={{ width: `${score * 10}%` }} />
      </div>
      <span className="score-num gold">{score}</span>
    </div>
  )
}

export default function EnergyDay() {
  const navigate = useNavigate()

  return (
    <div className="page energy-page fade-in">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>Энергия Дня ✨</h1>
        <div style={{ width: 30 }} />
      </div>

      {/* Main energy card */}
      <div className="card main-energy-card">
        <div className="moon-title">{mockEnergy.moon}</div>
        <div className="energy-row">
          <span className="e-label">Энергия:</span>
          <span className="e-value gold">{mockEnergy.energy}/10</span>
        </div>
        <div className="energy-row">
          <span className="e-label">Лучшее время:</span>
          <span className="e-value">{mockEnergy.bestTime}</span>
        </div>
        <div className="advice-block">
          <span className="advice-label">Совет дня:</span>
          <p className="advice-text">{mockEnergy.advice}</p>
        </div>
      </div>

      {/* Detail cards */}
      <h2 className="section-title">📊 По сферам жизни</h2>
      <div className="detail-grid">
        {mockEnergy.details.map((d, i) => (
          <div key={i} className="card detail-energy-card">
            <div className="detail-top">
              <span className="detail-icon">{d.icon}</span>
              <span className="detail-topic">{d.topic}</span>
            </div>
            <ScoreBar score={d.score} />
            <p className="detail-text">{d.text}</p>
          </div>
        ))}
      </div>

      {/* Lunar day */}
      <div className="card lunar-card">
        <div className="lunar-top">
          <span className="lunar-label">🌕 Лунный день</span>
          <span className="lunar-day gold">{mockEnergy.lunar.day}</span>
        </div>
        <p className="lunar-phase">{mockEnergy.lunar.phase}</p>
        <p className="lunar-tip">{mockEnergy.lunar.tip}</p>
      </div>
    </div>
  )
}
