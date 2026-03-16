import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteUser, getPartners, addPartner, getPurchases } from '../api'
import { getActivePlan } from '../utils'

const emptyForm = { name: '', birth_date: '', birth_time: '', birth_place: '' }

const PRODUCT_LABELS = {
  synastry_quick: '⚡ Быстрый разбор совместимости',
  synastry_full:  '📖 Полный анализ пары',
  synastry_vip:   '👑 VIP-анализ пары',
  solar_forecast: '☀️ Солярный прогноз на год',
  child_chart:    '👶 Разбор карты ребёнка',
}

export default function Profile({ user, setUser }) {
  const navigate = useNavigate()
  const plan = getActivePlan(user)
  const planLabel = { free: 'Бесплатный', trial: 'Пробный период', pro: 'PRO', platinum: 'Платинум' }

  const [partners, setPartners] = useState([])
  const [purchases, setPurchases] = useState([])
  const [view, setView] = useState('main') // main | add_partner | add_child
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.telegram_id) return
    getPartners(user.telegram_id).then(d => setPartners(d || [])).catch(() => {})
    getPurchases(user.telegram_id).then(d => setPurchases(d || [])).catch(() => {})
  }, [user])

  async function handleAddPartner() {
    if (!form.name || !form.birth_date) return
    setLoading(true)
    try {
      const p = await addPartner(user.telegram_id, form)
      setPartners(prev => [p, ...prev])
      setForm(emptyForm)
      setView('main')
    } catch (e) { alert(e.message) }
    finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!window.confirm('Удалить аккаунт? Все данные будут удалены навсегда.')) return
    try {
      await deleteUser(user.telegram_id)
      setUser(null)
    } catch (e) { alert(e.message) }
  }

  // ── Форма добавления партнёра / ребёнка ───────────────────
  if (view === 'add_partner' || view === 'add_child') {
    const isChild = view === 'add_child'
    return (
      <div className="screen fade-in">
        <div className="screen-header">
          <button className="back-btn" onClick={() => { setForm(emptyForm); setView('main') }}>‹</button>
          <h1>{isChild ? '👶 Добавить ребёнка' : '💕 Добавить партнёра'}</h1>
          <div style={{ width: 36 }} />
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { field: 'name',        label: isChild ? 'Имя ребёнка *'   : 'Имя партнёра *', type: 'text', placeholder: isChild ? 'Маша' : 'Александр' },
            { field: 'birth_date',  label: 'Дата рождения *', type: 'date' },
            { field: 'birth_time',  label: 'Время рождения',  type: 'time' },
            { field: 'birth_place', label: 'Город рождения',  type: 'text', placeholder: 'Москва' },
          ].map(f => (
            <div key={f.field}>
              <div className="label">{f.label}</div>
              <input className="input" type={f.type} placeholder={f.placeholder || ''}
                value={form[f.field]} onChange={e => setForm({ ...form, [f.field]: e.target.value })} />
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={handleAddPartner}
          disabled={loading || !form.name || !form.birth_date}>
          {loading ? '⏳ Сохраняем...' : isChild ? '👶 Сохранить ребёнка' : '💕 Сохранить партнёра'}
        </button>
      </div>
    )
  }

  // ── Главный экран профиля ──────────────────────────────────
  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>☿ Профиль</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Аватар и имя */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>👤</div>
        <h2 style={{ fontWeight: 800, marginBottom: 6 }}>{user?.name}</h2>
        <span className={`badge ${plan === 'platinum' ? 'badge-gold' : plan === 'free' ? 'badge-free' : 'badge-purple'}`}>
          {planLabel[plan] || 'Бесплатный'}
        </span>
        {user?.subscription_expires_at && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            до {new Date(user.subscription_expires_at).toLocaleDateString('ru')}
          </div>
        )}
      </div>

      {/* Данные рождения */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Данные рождения</h3>
        {[
          { label: 'Дата', value: user?.birth_date },
          { label: 'Время', value: user?.birth_time || 'Не указано' },
          { label: 'Место', value: user?.birth_place },
        ].map(item => item.value && (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.label}</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Партнёры */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontWeight: 700 }}>💕 Партнёры</h3>
          <button onClick={() => { setForm(emptyForm); setView('add_partner') }}
            style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)', borderRadius: 16, padding: '4px 12px', fontSize: 12, color: 'var(--purple-light)', cursor: 'pointer' }}>
            + Добавить
          </button>
        </div>
        {partners.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет добавленных партнёров</div>
        ) : partners.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.birth_date}</div>
            </div>
            {p.synastry_json?.score && (
              <span style={{ fontWeight: 800, color: p.synastry_json.score >= 70 ? 'var(--gold)' : 'var(--text)' }}>
                {p.synastry_json.score}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Дети */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontWeight: 700 }}>👶 Дети</h3>
          <button onClick={() => { setForm(emptyForm); setView('add_child') }}
            style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)', borderRadius: 16, padding: '4px 12px', fontSize: 12, color: 'var(--purple-light)', cursor: 'pointer' }}>
            + Добавить
          </button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Добавьте данные ребёнка чтобы заказать разбор натальной карты
        </div>
      </div>

      {/* История покупок */}
      {purchases.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🧾 Покупки</h3>
          {purchases.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{PRODUCT_LABELS[p.product_type] || p.product_type}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(p.purchased_at).toLocaleDateString('ru')}
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>${p.amount_usd}</span>
            </div>
          ))}
        </div>
      )}

      {/* Подписка */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600 }}>Тариф: {planLabel[plan]}</div>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }}
            onClick={() => navigate('/shop')}>
            {plan === 'free' ? 'Улучшить' : 'Магазин'}
          </button>
        </div>
      </div>

      {/* Удалить аккаунт */}
      <button className="btn" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', marginTop: 4 }}
        onClick={handleDelete}>
        🗑 Удалить аккаунт
      </button>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 8 }}>
        Прогнозы носят развлекательный характер · 152-ФЗ
      </p>
    </div>
  )
}
