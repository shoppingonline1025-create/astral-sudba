import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPayment } from '../api'
import { getActivePlan } from '../utils'

const PLANS = [
  {
    key: 'free', name: 'Бесплатно', price: null,
    features: ['Натальная карта', 'Прогноз на сегодня', '5 сообщений/мес', '1 партнёр для синастрии'],
  },
  {
    key: 'pro', name: 'PRO', price: '$5/мес', priceRub: '490₽',
    badge: '★ Популярный',
    features: ['30 сообщений/мес', 'Прогноз 3 и 7 дней', 'Полная карта с расшифровкой', 'До 5 партнёров', 'Утренние уведомления'],
  },
  {
    key: 'platinum', name: 'Платинум', price: '$9/мес', priceRub: '890₽',
    badge: '✦ Максимум',
    features: ['80 сообщений/мес', 'Прогноз на 30 дней', 'Транзиты и прогрессии', 'Соляр (годовой прогноз)', 'До 10 партнёров', 'Экспорт PDF', 'Приоритет Sonnet'],
  },
]

const ONE_TIME = [
  { type: 'synastry_quick', icon: '⚡', title: 'Быстрый разбор совместимости', desc: '~1500 слов в приложении · 30 сек', price: '$4', priceRub: '360₽' },
  { type: 'synastry_full',  icon: '📖', title: 'Полный PDF-анализ пары', desc: '15–20 страниц · все сферы жизни', price: '$9', priceRub: '810₽' },
  { type: 'synastry_vip',   icon: '👑', title: 'VIP-анализ пары', desc: 'PDF + безлимитный чат 24ч', price: '$18', priceRub: '1620₽' },
  { type: 'solar_forecast', icon: '☀️', title: 'Солярный прогноз на год', desc: 'PDF · 12 месяцев по всем сферам', price: '$5', priceRub: '450₽' },
  { type: 'child_chart',    icon: '👶', title: 'Разбор карты ребёнка', desc: 'PDF · таланты и особенности', price: '$7', priceRub: '630₽' },
]

export default function Shop({ user }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('subs')
  const [payMethod, setPayMethod] = useState('stars')
  const [loading, setLoading] = useState(null)
  const plan = getActivePlan(user)

  async function handleBuy(type, productType) {
    if (!user?.telegram_id) return
    setLoading(type)
    try {
      const res = await createPayment({ telegram_id: user.telegram_id, product: type, product_type: productType, method: payMethod })
      if (res.payment_url) window.open(res.payment_url)
      else if (res.invoice_link) window.Telegram?.WebApp?.openInvoice(res.invoice_link)
    } catch (e) { alert(e.message) }
    finally { setLoading(null) }
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>🛍 Магазин</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Метод оплаты */}
      <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 12, padding: 4, gap: 4 }}>
        {[
          { key: 'stars', label: '⭐ Telegram Stars' },
          { key: 'crypto', label: '🔐 USDT/Крипта' },
        ].map(m => (
          <button key={m.key} onClick={() => setPayMethod(m.key)} style={{
            flex: 1, padding: '9px 4px', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: payMethod === m.key ? 'linear-gradient(135deg, var(--purple), #1d4ed8)' : 'transparent',
            color: payMethod === m.key ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}>{m.label}</button>
        ))}
      </div>

      {/* Вкладки */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[{ key: 'subs', label: 'Подписки' }, { key: 'onetime', label: 'Разовые' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14,
            background: tab === t.key ? 'var(--purple)' : 'var(--bg-card)',
            color: tab === t.key ? '#fff' : 'var(--text-secondary)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Подписки */}
      {tab === 'subs' && PLANS.map(p => {
        const isCurrent = plan === p.key
        return (
          <div key={p.key} className="card" style={{
            border: p.key === 'pro' ? '1px solid var(--purple)' : p.key === 'platinum' ? '1px solid var(--gold)' : '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: 18 }}>{p.name}</span>
                {p.badge && <span className={`badge ${p.key === 'platinum' ? 'badge-gold' : 'badge-purple'}`} style={{ marginLeft: 8 }}>{p.badge}</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                {p.price && <div style={{ fontWeight: 700, color: p.key === 'platinum' ? 'var(--gold)' : 'var(--purple-light)' }}>{payMethod === 'stars' ? p.priceRub : p.price}</div>}
              </div>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
              {p.features.map(f => (
                <li key={f} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 6 }}>
                  <span style={{ color: '#4ade80' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            {isCurrent ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✓ Текущий план</div>
            ) : p.price ? (
              <button className={`btn ${p.key === 'platinum' ? 'btn-gold' : 'btn-primary'}`}
                onClick={() => handleBuy(p.key, 'subscription')}
                disabled={loading === p.key}>
                {loading === p.key ? '⏳...' : `Подключить ${payMethod === 'stars' ? p.priceRub : p.price}`}
              </button>
            ) : null}
          </div>
        )
      })}

      {/* Разовые */}
      {tab === 'onetime' && ONE_TIME.map(item => (
        <div key={item.type} className="card">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 32 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{item.desc}</div>
              <button className="btn btn-primary" style={{ padding: '10px' }}
                onClick={() => handleBuy(item.type, 'one_time')}
                disabled={loading === item.type}>
                {loading === item.type ? '⏳...' : `Купить за ${payMethod === 'stars' ? item.priceRub : item.price}`}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
