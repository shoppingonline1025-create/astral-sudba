import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addPartner, getCompatibility } from '../api'
import { getActivePlan } from '../utils'

export default function Synastry({ user }) {
  const navigate = useNavigate()
  const [view, setView] = useState('home') // home | add | result
  const [form, setForm] = useState({ name: '', birth_date: '', birth_time: '', birth_place: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const plan = getActivePlan(user)

  async function handleCheck() {
    if (!form.birth_date || !form.name) return
    setLoading(true)
    try {
      const partner = await addPartner(user.telegram_id, form)
      const compat = await getCompatibility(user.telegram_id, partner.id)
      setResult(compat)
      setView('result')
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
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
        <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>Совместимость</div>
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

      {/* Промо полного анализа */}
      <div className="card" style={{ textAlign: 'center', border: '1px solid rgba(240,208,128,0.3)', cursor: 'pointer' }}
        onClick={() => navigate('/shop')}>
        <p style={{ fontWeight: 700, marginBottom: 6 }}>📖 Полный PDF-анализ пары</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>15–20 страниц · карма отношений · прогноз на год</p>
        <div style={{ color: 'var(--gold)', fontWeight: 600 }}>$9 · Заказать →</div>
      </div>
    </div>
  )

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>💕 Совместимость</h1>
        <div style={{ width: 36 }} />
      </div>

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

      {/* Разовые покупки */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { title: '⚡ Быстрый разбор', desc: '~1500 слов · 30 сек', price: '$4', type: 'synastry_quick' },
          { title: '📖 Полный PDF-анализ', desc: '15–20 стр · все сферы', price: '$9', type: 'synastry_full' },
          { title: '👑 VIP-анализ', desc: 'PDF + чат 24ч', price: '$18', type: 'synastry_vip' },
        ].map(item => (
          <div key={item.type} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/shop')}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
            </div>
            <span className="badge badge-gold">{item.price}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
