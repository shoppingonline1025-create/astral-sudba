import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addPartner, getCompatibility, getPartners, createPayment } from '../api'
import { getActivePlan } from '../utils'

const SYNASTRY_PRODUCTS = [
  { type: 'synastry_quick', title: '⚡ Быстрый разбор', desc: '~1500 слов · PDF в боте · 1–2 мин', stars: 290 },
  { type: 'synastry_full',  title: '📖 Полный анализ', desc: '15–20 стр · все сферы · PDF в боте', stars: 650 },
  { type: 'synastry_vip',   title: '👑 VIP-анализ', desc: 'PDF + чат с астрологом 24ч', stars: 1300 },
]

const emptyForm = { name: '', birth_date: '', birth_time: '', birth_place: '' }

export default function Synastry({ user }) {
  const navigate = useNavigate()
  const [view, setView] = useState('home') // home | add | result | add_child | child_confirm
  const [form, setForm] = useState(emptyForm)
  const [childForm, setChildForm] = useState(emptyForm)
  const [result, setResult] = useState(null)
  const [activePartner, setActivePartner] = useState(null)
  const [savedChild, setSavedChild] = useState(null)
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
      setPartners(prev => [partner, ...prev.filter(p => p.id !== partner.id)])
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

  async function handleSaveChild() {
    if (!childForm.birth_date || !childForm.name) return
    setLoading(true)
    try {
      // Сохраняем ребёнка как партнёра (используем ту же таблицу)
      const child = await addPartner(user.telegram_id, childForm)
      setSavedChild(child)
      setView('child_confirm')
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleBuyReport(productType, partnerId) {
    if (!user?.telegram_id) return
    setPayingProduct(productType)
    try {
      const data = await createPayment({
        telegram_id: user.telegram_id,
        product: productType,
        method: 'stars',
        partner_id: partnerId || null,
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

  // ── Форма добавления партнёра ──────────────────────────────
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

  // ── Форма добавления ребёнка ───────────────────────────────
  if (view === 'add_child') return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setView('home')}>‹</button>
        <h1>👶 Карта ребёнка</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className="card" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Введите данные ребёнка — астролог составит подробный разбор: характер, таланты, советы по воспитанию.
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { field: 'name', label: 'Имя ребёнка *', type: 'text', placeholder: 'Маша' },
          { field: 'birth_date', label: 'Дата рождения *', type: 'date' },
          { field: 'birth_time', label: 'Время рождения', type: 'time' },
          { field: 'birth_place', label: 'Город рождения', type: 'text', placeholder: 'Москва' },
        ].map(f => (
          <div key={f.field}>
            <div className="label">{f.label}</div>
            <input className="input" type={f.type} placeholder={f.placeholder || ''}
              value={childForm[f.field]} onChange={e => setChildForm({ ...childForm, [f.field]: e.target.value })} />
          </div>
        ))}
      </div>

      <button className="btn btn-primary" onClick={handleSaveChild}
        disabled={loading || !childForm.birth_date || !childForm.name}>
        {loading ? '⏳ Сохраняем...' : '👶 Далее → Заказать разбор'}
      </button>
    </div>
  )

  // ── Подтверждение покупки карты ребёнка ────────────────────
  if (view === 'child_confirm' && savedChild) return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setView('home')}>‹</button>
        <h1>👶 Карта ребёнка</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👶</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{savedChild.name}</div>
        <div style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>{savedChild.birth_date}</div>
      </div>

      <div className="card" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Астролог составит подробный PDF-отчёт: характер и личность, таланты, сложности, советы по воспитанию, отношения с родителями.
        <br /><br />
        Отчёт придёт в Telegram-бот в течение <b>1–2 минут</b> после оплаты.
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        border: '1px solid rgba(240,208,128,0.4)', cursor: 'pointer' }}
        onClick={() => handleBuyReport('child_chart', savedChild.id)}>
        <div>
          <div style={{ fontWeight: 700 }}>👶 Разбор карты ребёнка</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>PDF · ~2000 слов · в бот</div>
        </div>
        <span className="badge badge-gold">
          {payingProduct === 'child_chart' ? '⏳' : '500⭐'}
        </span>
      </div>
    </div>
  )

  // ── Результат совместимости ────────────────────────────────
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

      {/* Платные отчёты для пары */}
      <div style={{ fontWeight: 700, marginBottom: 8, paddingLeft: 2 }}>Углублённый анализ · PDF в бот</div>
      {SYNASTRY_PRODUCTS.map(item => (
        <div key={item.type} className="card"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => handleBuyReport(item.type, activePartner?.id)}>
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

  // ── Главный экран ──────────────────────────────────────────
  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>💕 Отношения</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Список партнёров */}
      <div style={{ fontWeight: 700, marginBottom: 6, paddingLeft: 2 }}>Совместимость пары</div>
      {loadingPartners ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Загружаем...</div>
      ) : partners.length > 0 ? (
        <>
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
          <button className="btn btn-outline" onClick={() => { setForm(emptyForm); setView('add') }}>➕ Добавить партнёра</button>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💕</div>
          <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Синастрия пары</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            Астрологический анализ совместимости по натальным картам двух людей
          </p>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setView('add') }}>
            ➕ Добавить партнёра
          </button>
        </div>
      )}

      {/* Карта ребёнка */}
      <div style={{ fontWeight: 700, marginBottom: 6, marginTop: 8, paddingLeft: 2 }}>Карта ребёнка</div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => { setChildForm(emptyForm); setView('add_child') }}>
        <div>
          <div style={{ fontWeight: 600 }}>👶 Разбор натальной карты</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Характер, таланты, советы родителям · PDF</div>
        </div>
        <span className="badge badge-gold">500⭐</span>
      </div>

      {/* Солярный прогноз */}
      <div style={{ fontWeight: 700, marginBottom: 6, marginTop: 8, paddingLeft: 2 }}>Другие PDF-отчёты</div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => handleBuyReport('solar_forecast', null)}>
        <div>
          <div style={{ fontWeight: 600 }}>☀️ Солярный прогноз на год</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>PDF · 12 месяцев по всем сферам</div>
        </div>
        <span className="badge badge-gold">
          {payingProduct === 'solar_forecast' ? '⏳' : '375⭐'}
        </span>
      </div>
    </div>
  )
}
