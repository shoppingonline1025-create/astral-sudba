import { useNavigate, useLocation } from 'react-router-dom'
import './BottomNav.css'

const navItems = [
  { path: '/', icon: '🏠', label: 'Главная' },
  { path: '/natal-chart', icon: '⭕', label: 'Карта' },
  { path: '/forecasts', icon: '🔮', label: 'Прогноз' },
  { path: '/compatibility', icon: '💜', label: 'Совмест.' },
  { path: '/premium', icon: '⭐', label: 'Премиум' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
