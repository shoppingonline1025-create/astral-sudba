import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getForecast } from '../api'
import { getActivePlan, energyColor, lsGet, lsSet, todayStr } from '../utils'
import StarsBg from '../components/StarsBg'

export default function Home({ user }) {
  const navigate = useNavigate()
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const plan = getActivePlan(user)

  useEffect(() => {
    if (!user?.telegram_id) return
    const key = `forecast_day_${todayStr()}`
    const cached = lsGet(key)
    if (cached) { setForecast(cached); setLoading(false); return }

    getForecast(user.telegram_id, 'day')
      .then(d => { setForecast(d); lsSet(key, d, 6 * 60 * 60 * 1000); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const firstName = user?.name?.split(' ')[0] || 'Привет'

  return (
    <div className="screen fade-in">
      <StarsBg />

      {/* Приветствие */}
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          {new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Добро пожаловать, {firstName} ✨</h1>
        {plan !== 'free' && <span className="badge badge-gold" style={{ marginTop: 6 }}>
          {plan === 'trial' ? 'Пробный период' : plan === 'platinum' ? '✦ Платинум' : '★ PRO'}
        </span>}
      </div>

      {/* Энергия дня */}
      <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/energy')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>⚡ Энергия дня</span>
          {forecast && <span style={{ fontWeight: 800, color: energyColor(forecast.energy) }}>{forecast.energy}/10</span>}
        </div>
        {loading ? (
          <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-input)' }} />
        ) : forecast ? (
          <>
            <div className="energy-bar">
              <div className="energy-fill" style={{ width: `${(forecast.energy / 10) * 100}%` }} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.5 }}>
              {forecast.moon} · {forecast.summary?.substring(0, 80)}...
            </p>
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нажмите чтобы загрузить</p>
        )}
      </div>

      {/* Быстрые действия */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { icon: '🌙', title: 'Натальная карта', path: '/natal', desc: 'Ваши планеты и дома' },
          { icon: '🔮', title: 'Прогноз', path: '/forecast', desc: 'День, неделя, месяц' },
          { icon: '💬', title: 'Астролог', path: '/chat', desc: 'Задать вопрос' },
          { icon: '💕', title: 'Совместимость', path: '/synastry', desc: 'Анализ пары' },
        ].map(item => (
          <div key={item.path} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(item.path)}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Промо (если free — триал истёк) */}
      {plan === 'free' && (
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.15), rgba(29,78,216,0.15))', border: '1px solid rgba(147,51,234,0.4)', cursor: 'pointer' }}
          onClick={() => navigate('/shop')}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>⭐ Улучшите до PRO</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>30 сообщений, прогноз на 7 дней, до 5 партнёров</div>
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--purple-light)', fontWeight: 600 }}>Улучшить до PRO →</div>
        </div>
      )}
    </div>
  )
}
