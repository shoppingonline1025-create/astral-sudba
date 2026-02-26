import { useState } from 'react'
import './Onboarding.css'

const STEPS = ['name', 'birthdate', 'birthtime', 'birthplace']

export default function Onboarding({ telegramUser, onComplete }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: telegramUser?.first_name || '',
    birthdate: '',
    birthtime: '12:00',
    birthplace: '',
  })
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else submit()
  }

  function isValid() {
    const s = STEPS[step]
    if (s === 'name') return form.name.trim().length > 0
    if (s === 'birthdate') return form.birthdate.length > 0
    if (s === 'birthtime') return true
    if (s === 'birthplace') return form.birthplace.trim().length > 0
    return true
  }

  async function submit() {
    setLoading(true)
    await onComplete(form)
    setLoading(false)
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="onboarding fade-in">
      <div className="stars-bg" />

      <div className="ob-content">
        {/* Logo */}
        <div className="ob-logo">✨</div>
        <h1 className="ob-title">Астральная Судьба</h1>

        {/* Progress bar */}
        <div className="ob-progress">
          <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="ob-step-hint">{step + 1} из {STEPS.length}</p>

        {/* Steps */}
        {step === 0 && (
          <div className="ob-step fade-in">
            <h2 className="ob-question">Как вас зовут?</h2>
            <p className="ob-desc">Это имя будет отображаться в вашем профиле</p>
            <input
              className="input ob-input"
              type="text"
              placeholder="Ваше имя"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              autoFocus
            />
          </div>
        )}

        {step === 1 && (
          <div className="ob-step fade-in">
            <h2 className="ob-question">Дата рождения</h2>
            <p className="ob-desc">Нужна для расчёта натальной карты</p>
            <input
              className="input ob-input"
              type="date"
              value={form.birthdate}
              onChange={e => update('birthdate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        )}

        {step === 2 && (
          <div className="ob-step fade-in">
            <h2 className="ob-question">Время рождения</h2>
            <p className="ob-desc">Влияет на точность карты. Если не знаете — оставьте 12:00</p>
            <input
              className="input ob-input"
              type="time"
              value={form.birthtime}
              onChange={e => update('birthtime', e.target.value)}
            />
            <button
              className="ob-skip"
              onClick={() => { update('birthtime', '12:00'); next() }}
            >
              Не знаю точное время
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="ob-step fade-in">
            <h2 className="ob-question">Город рождения</h2>
            <p className="ob-desc">Влияет на положение домов в карте</p>
            <input
              className="input ob-input"
              type="text"
              placeholder="Например: Москва"
              value={form.birthplace}
              onChange={e => update('birthplace', e.target.value)}
            />
          </div>
        )}

        <button
          className="btn-primary ob-btn"
          onClick={next}
          disabled={!isValid() || loading}
        >
          {loading ? 'Загружаем карту...' : step === STEPS.length - 1 ? '✨ Построить мою карту' : 'Далее →'}
        </button>
      </div>
    </div>
  )
}
