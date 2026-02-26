import { useNavigate } from 'react-router-dom'
import './Home.css'

const mockUser = {
  name: 'Алексей',
  sign: 'Водолей ♒',
  birthdate: '5 февраля 1992',
  avatar: null,
}

const mockEnergy = {
  score: 8,
  moon: 'Луна в Овне 🔥',
  tip: 'Сегодня удачное время для действий!',
}

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="page home-page fade-in">

      {/* Header */}
      <div className="home-header">
        <h1 className="home-title">Главная</h1>
        <button className="notif-btn">🔔</button>
      </div>

      {/* Profile card */}
      <div className="card profile-card">
        <div className="profile-avatar">
          {mockUser.avatar
            ? <img src={mockUser.avatar} alt="avatar" />
            : <span className="avatar-placeholder">✨</span>
          }
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{mockUser.name}</h2>
          <p className="profile-sign gold">{mockUser.sign}</p>
          <p className="profile-date">{mockUser.birthdate}</p>
        </div>
      </div>

      {/* Menu buttons */}
      <div className="menu-list">
        <button className="menu-btn" onClick={() => navigate('/natal-chart')}>
          <span className="icon">🗺️</span>
          <span className="label">Моя Карта</span>
          <span className="arrow">›</span>
        </button>
        <button className="menu-btn" onClick={() => navigate('/forecasts')}>
          <span className="icon">🔮</span>
          <span className="label">Прогнозы</span>
          <span className="arrow">›</span>
        </button>
        <button className="menu-btn" onClick={() => navigate('/compatibility')}>
          <span className="icon">💜</span>
          <span className="label">Совместимость</span>
          <span className="arrow">›</span>
        </button>
        <button className="menu-btn premium-btn" onClick={() => navigate('/premium')}>
          <span className="icon">⭐</span>
          <span className="label gold">Премиум Доступ</span>
          <span className="arrow gold">›</span>
        </button>
      </div>

      {/* Energy widget */}
      <div className="card energy-card" onClick={() => navigate('/energy')}>
        <div className="energy-top">
          <span className="energy-label">🌙 Энергия дня:</span>
          <span className="energy-score gold">{mockEnergy.score}/10</span>
        </div>
        <p className="energy-moon">{mockEnergy.moon}</p>
        <p className="energy-tip">{mockEnergy.tip}</p>
      </div>

    </div>
  )
}
