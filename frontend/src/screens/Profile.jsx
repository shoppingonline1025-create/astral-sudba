import { useNavigate } from 'react-router-dom'
import { deleteUser } from '../api'
import { getActivePlan } from '../utils'

export default function Profile({ user, setUser }) {
  const navigate = useNavigate()
  const plan = getActivePlan(user)

  const planLabel = { free: 'Бесплатный', trial: 'Пробный период', pro: 'PRO', platinum: 'Платинум' }

  async function handleDelete() {
    if (!window.confirm('Удалить аккаунт? Все данные будут удалены навсегда.')) return
    try {
      await deleteUser(user.telegram_id)
      setUser(null)
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>☿ Профиль</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Данные */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>👤</div>
        <h2 style={{ fontWeight: 800, marginBottom: 4 }}>{user?.name}</h2>
        <span className={`badge ${plan === 'platinum' ? 'badge-gold' : plan === 'free' ? 'badge-free' : 'badge-purple'}`}>
          {planLabel[plan] || 'Бесплатный'}
        </span>
      </div>

      {/* Данные рождения */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 14 }}>Данные рождения</h3>
        {[
          { label: 'Дата', value: user?.birth_date },
          { label: 'Время', value: user?.birth_time || 'Не указано' },
          { label: 'Место', value: user?.birth_place },
        ].map(item => item.value && (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.label}</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Подписка */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 14 }}>Подписка</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{planLabel[plan]}</div>
            {user?.subscription_expires_at && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                до {new Date(user.subscription_expires_at).toLocaleDateString('ru')}
              </div>
            )}
          </div>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }}
            onClick={() => navigate('/shop')}>
            {plan === 'free' ? 'Улучшить' : 'Управление'}
          </button>
        </div>
      </div>

      {/* Действия */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <button className="btn btn-outline" onClick={() => navigate('/shop')}>
          🛍 Магазин
        </button>
        <button className="btn" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
          onClick={handleDelete}>
          🗑 Удалить аккаунт
        </button>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 8 }}>
        Прогнозы носят развлекательный характер · 152-ФЗ
      </p>
    </div>
  )
}
