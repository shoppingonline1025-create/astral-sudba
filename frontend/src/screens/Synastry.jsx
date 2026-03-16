import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addPartner, getCompatibility, getPartners, createPayment } from '../api'
import { getActivePlan } from '../utils'

const SYNASTRY_PRODUCTS = [
  { type: 'synastry_quick', title: '⚡ Быстрый разбор', desc: '~1500 слов · PDF в боте · 1–2 мин', stars: 290 },
  { type: 'synastry_full',  title: '📖 Полный анализ', desc: '15–20 стр · все сферы · PDF в боте', stars: 650 },
  { type: 'synastry_vip',   title: '👑 VIP-анализ', desc: 'PDF + чат с астрологом 24ч', stars: 1300 },
]

export default function Synastry({ user }) {
  const navigate = useNavigate()
  const [view, setView] = useState('home') // home | add | result
  const [form, setForm] = useState({ name: '', birth_date: '', birth_time: '', birth_place: '' })
  const [result, setResult] = useState(null)
  const [activePartner, setActivePartner] = useState(null)
  const [loading, setLoading] = useState(false)
  const [payingProduct, setPayingProduct] = useState(null)
  const [partners, setPartners] = useState([])
  const [loadingPartners, setLoadingPartners] = useState(true)
  const plan = getActivePlan(user)

  useEffect(() => {
    if (!user?.telegram_id) return
    getPartners(user.telegram_id)
      .then(data => setPartners(data || []))
      .catch(() => {})
      .finally(() => setLoadingPartners(false))
  }, [user])

  async function handleCheck() {
    if (!form.birth_date || !form.name) return
    setLoading(true)
    try {
      const partner = await addPartner(user.telegram_id, form)
      setPartners(prev => [partner, ...prev])
      setActivePartner(partner)
      setResult(partner.synastry_json || partner)
      setView('result')
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectPartner(partner) {
    setLoading(true)
    try {
      const compat = await getCompatibility(user.telegram_id, partner.id)
      setActivePartner(partner)
      setResult(compat)
      setView('result')
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleBuyReport(productType) {
    if (!user?.telegram_id) return
    setPayingProduct(productType)
    try {
      const data = await createPayment({
        telegram_id: user.telegram_id,
        product: productType,
        method: 'stars',
        partner_id: activePartner?.id || null,
      })
      if (data.invoice_link) {
        window.Telegram?.WebApp?.openInvoice(data.invoice_link, status => {
          if (status === 'paid') {
            alert('✅ Оплата прошла! Отчёт придёт в бот в течение 1–2 минут.')
          }
        })
      } else {
        alert('Ошибка создания инвойса')
      }
    } catch (e) {
      alert(e.message)
    } finally {
      setPayingProduct(null)
    }
  }

  if (view === 'add') return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setView('home')}>‹</button>
        <h1>Добавить партнёра</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { field: 'name', label: 'Имя партнёра *', type: 'text', placeholder: 'Александр' },
          { field: 'birth_date', label: 'Дата рождения *', type: 'date' },
          { field: 'birth_time', label: 'Время рождения', type: 'time' },
          { field: 'birth_place', label: 'Город рождения', type: 'text', placeholder: 'Москва' },
        ].map(f => (
          <div key={f.field}>
            <div className="label">{f.label}</div>
            <input className="input" type={f.type} placeholder={f.placeholder || ''}
              value={form[f.field]} onChange={e => setForm({ ...form, [f.field]: e.target.value })} />
          </div>
        ))}
      </div>

      <button className="btn btn-primary" onClick={handleCheck}
        disabled={loading || !form.birth_date || !form.name}>
        {loading ? '⏳ Анализируем...' : '🔮 Рассчитать совместимость'}
      </button>
    </div>
  )

  if (view === 'result' && result) return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setView('home')}>‹</button>
        <h1>Совместимость</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{result.score >= 70 ? '💕' : result.score >= 50 ? '🤝' : '⚡'}</div>
        <div style={{ fontSize: 48, fontWeight: 900, color: result.score >= 70 ? 'var(--gold)' : 'var(--text)' }}>{result.score}%</div>
        <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>Совместимость с {activePartner?.name}</div>
      </div>

      {result.summary && (
        <div className="card">
          <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>{result.summary}</p>
        </div>
      )}

      {result.strengths && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#4ade80' }}>✅ Сильные стороны</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.strengths}</p>
        </div>
      )}

      {result.challenges && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#f87171' }}>⚠️ Вызовы</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.challenges}</p>
        </div>
      )}

      {/* Платные отчёты */}
      <div style={{ fontWeight: 700, marginBottom: 8, paddingLeft: 2 }}>Углублённый анализ · PDF в бот</div>
      {SYNASTRY_PRODUCTS.map(item => (
        <div key={item.type} className="card"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => handleBuyReport(item.type)}>
          <div>
            <div style={{ fontWeight: 600 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
          </div>
          <span className="badge badge-gold">
            {payingProduct === item.type ? '⏳' : `${item.stars}⭐`}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>💕 Совместимость</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Список партнёров */}
      {loadingPartners ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Загружаем...</div>
      ) : partners.length > 0 ? (
        <>
          <div style={{ fontWeight: 700, marginBottom: 4, paddingLeft: 2 }}>Ваши партнёры</div>
          {partners.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => handleSelectPartner(p)}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.birth_date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {p.synastry_json?.score && (
                  <span style={{ fontWeight: 800, color: p.synastry_json.score >= 70 ? 'var(--gold)' : 'var(--text)' }}>
                    {p.synastry_json.score}%
                  </span>
                )}
                <span style={{ color: 'var(--text-muted)' }}>›</span>
              </div>
            </div>
          ))}
          <button className="btn btn-outline" onClick={() => setView('add')}>➕ Добавить партнёра</button>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💕</div>
          <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Синастрия пары</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            Астрологический анализ совместимости по натальным картам двух людей
          </p>
          <button className="btn btn-primary" onClick={() => setView('add')}>
            ➕ Добавить партнёра
          </button>
        </div>
      )}

      {/* Разовые покупки на главном экране (solar, child) */}
      <div style={{ fontWeight: 700, marginBottom: 4, marginTop: 8, paddingLeft: 2 }}>Другие PDF-отчёты</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { title: '☀️ Солярный прогноз на год', desc: 'PDF · 12 месяцев по всем сферам', type: 'solar_forecast', stars: 375 },
          { title: '👶 Разбор карты ребёнка', desc: 'PDF · таланты и особенности', type: 'child_chart', stars: 500 },
        ].map(item => (
          <div key={item.type} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => handleBuyReport(item.type)}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
            </div>
            <span className="badge badge-gold">
              {payingProduct === item.type ? '⏳' : `${item.stars}⭐`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
