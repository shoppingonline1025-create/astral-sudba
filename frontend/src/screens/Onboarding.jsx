import { useState } from 'react'
import StarsBg from '../components/StarsBg'

const STEPS = [
  {
    title: 'Добро пожаловать',
    emoji: '✨',
    desc: 'Ваш личный AI-астролог. Прогнозы, натальная карта и разбор отношений — всё здесь.',
  },
  {
    title: 'Натальная карта',
    emoji: '🌙',
    desc: 'Мы рассчитаем вашу карту по дате, времени и месту рождения. Это основа всех прогнозов.',
  },
  {
    title: 'Живой астролог',
    emoji: '💬',
    desc: 'Задавайте вопросы об отношениях, карьере и здоровье. Астролог помнит вашу карту.',
  },
  {
    title: 'Ваши данные',
    emoji: '📝',
    desc: 'Введите данные рождения, чтобы начать.',
    isForm: true,
  },
]

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ birth_date: '', birth_time: '', birth_place: '' })
  const [loading, setLoading] = useState(false)

  const current = STEPS[step]

  async function handleNext() {
    if (step < STEPS.length - 1) { setStep(step + 1); return }
    // Последний шаг — отправка
    if (!form.birth_date || !form.birth_place) return
    setLoading(true)
    try { await onComplete(form) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 32, position: 'relative' }}>
      <StarsBg />

      {/* Прогресс */}
      <div style={{ display: 'flex', gap: 8, zIndex: 1 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 8, borderRadius: 4,
            background: i <= step ? 'var(--purple)' : 'var(--bg-input)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Контент */}
      <div style={{ zIndex: 1, textAlign: 'center', maxWidth: 360, width: '100%' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>{current.emoji}</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>{current.title}</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>{current.desc}</p>

        {current.isForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24, textAlign: 'left' }}>
            <div>
              <div className="label">Дата рождения *</div>
              <input className="input" type="date" value={form.birth_date}
                onChange={e => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <div>
              <div className="label">Время рождения (если знаете)</div>
              <input className="input" type="time" value={form.birth_time}
                onChange={e => setForm({ ...form, birth_time: e.target.value })} />
            </div>
            <div>
              <div className="label">Город рождения *</div>
              <input className="input" type="text" placeholder="Москва" value={form.birth_place}
                onChange={e => setForm({ ...form, birth_place: e.target.value })} />
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={handleNext}
          disabled={loading || (current.isForm && (!form.birth_date || !form.birth_place))}>
          {loading ? '⏳ Создаём карту...' : step < STEPS.length - 1 ? 'Далее →' : '🌟 Начать'}
        </button>

        {step > 0 && (
          <button className="btn btn-outline" style={{ marginTop: 10 }} onClick={() => setStep(step - 1)}>
            ← Назад
          </button>
        )}
      </div>

      <p style={{ zIndex: 1, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        Прогнозы носят развлекательный характер
      </p>
    </div>
  )
}
