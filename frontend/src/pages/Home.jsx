import { useNavigate } from 'react-router-dom'
import './Home.css'

function getSunSign(birthdate) {
  if (!birthdate) return 'Неизвестно'
  const d = new Date(birthdate)
  const m = d.getMonth() + 1
  const day = d.getDate()
  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'Овен ♈'
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'Телец ♉'
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return 'Близнецы ♊'
  if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return 'Рак ♋'
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'Лев ♌'
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'Дева ♍'
  if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'Весы ♎'
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'Скорпион ♏'
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return 'Стрелец ♐'
  if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return 'Козерог ♑'
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'Водолей ♒'
  return 'Рыбы ♓'
}

function formatBirthdate(birthdate) {
  if (!birthdate) return ''
  const d = new Date(birthdate)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

const mockEnergy = {
  score: 8,
  moon: 'Луна в Овне 🔥',
  tip: 'Сегодня удачное время для действий!',
}

export default function Home({ user }) {
  const navigate = useNavigate()
  const sign = getSunSign(user?.birthdate)

  return (
    <div className="page home-page fade-in">

      <div className="home-header">
        <h1 className="home-title">Главная</h1>
        <button className="notif-btn">🔔</button>
      </div>

      {/* Profile card */}
      <div className="card profile-card">
        <div className="profile-avatar">
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="avatar" />
            : <span className="avatar-placeholder">✨</span>
          }
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{user?.name || 'Пользователь'}</h2>
          <p className="profile-sign gold">{sign}</p>
          <p className="profile-date">{formatBirthdate(user?.birthdate)}</p>
          {user?.birthplace && <p className="profile-city">📍 {user.birthplace}</p>}
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
