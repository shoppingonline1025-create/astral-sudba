import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Compatibility.css'

const zodiacSigns = ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы']

export default function Compatibility() {
  const [sign1, setSign1] = useState('')
  const [sign2, setSign2] = useState('')
  const [result, setResult] = useState(null)
  const [isPro] = useState(false)
  const navigate = useNavigate()

  function calculate() {
    if (!sign1 || !sign2) return
    // Mock calculation
    const score = Math.floor(Math.random() * 31) + 60
    const level = score >= 85 ? 'Отличная пара! ✨' : score >= 70 ? 'Хорошая совместимость 💜' : 'Нужна работа над отношениями 🔮'
    setResult({ score, level })
  }

  return (
    <div className="page compat-page fade-in">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>Совместимость</h1>
        <div style={{ width: 30 }} />
      </div>

      {!isPro ? (
        <div className="pro-banner card fade-in">
          <div className="pro-icon">⭐</div>
          <h2 className="pro-title">PRO Подписка</h2>
          <p className="pro-price"><span className="gold">499 ₽</span> в месяц</p>
          <div className="pro-features">
            <div className="pro-feature">💜 Расширенные прогнозы</div>
            <div className="pro-feature">💜 Совместимость партнёра</div>
            <div className="pro-feature">💜 Детальный анализ</div>
          </div>
          <button className="btn-gold" onClick={() => navigate('/premium')}>
            Перейти на Премиум
          </button>
        </div>
      ) : null}

      {/* Calculator (free preview) */}
      <div className="card compat-card">
        <h3 className="section-title">🔮 Рассчитать совместимость</h3>

        <div className="select-wrap">
          <label className="select-label">Ваш знак зодиака</label>
          <select className="input" value={sign1} onChange={e => setSign1(e.target.value)}>
            <option value="">Выберите знак</option>
            {zodiacSigns.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="select-wrap">
          <label className="select-label">Знак партнёра</label>
          <select className="input" value={sign2} onChange={e => setSign2(e.target.value)}>
            <option value="">Выберите знак</option>
            {zodiacSigns.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button className="btn-primary" onClick={calculate} style={{ marginTop: 12 }}>
          Рассчитать
        </button>
      </div>

      {result && (
        <div className="card result-card fade-in">
          <div className="result-score gold">{result.score}%</div>
          <p className="result-level">{result.level}</p>
          {!isPro && (
            <div className="result-blur">
              <p className="blur-text">🔒 Подробный анализ доступен в PRO</p>
              <button className="btn-primary" onClick={() => navigate('/premium')} style={{ marginTop: 12 }}>
                Открыть полный анализ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
