import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/',          icon: '🌙', label: 'Главная' },
  { path: '/forecast',  icon: '🔮', label: 'Прогноз' },
  { path: '/chat',      icon: '💬', label: 'Астролог' },
  { path: '/synastry',  icon: '💕', label: 'Пара' },
  { path: '/profile',   icon: '☿',  label: 'Профиль' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      {TABS.map(tab => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            className={`nav-item${active ? ' active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
