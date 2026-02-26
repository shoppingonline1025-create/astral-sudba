import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCompatibility } from '../lib/api'
import './Compatibility.css'

const zodiacSigns = ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы']

const ZODIAC_DATES = [
  [3,21],[4,20],[5,21],[6,21],[7,23],[8,23],
  [9,23],[10,23],[11,22],[12,22],[1,20],[2,19]
]

function getZodiacSign(birthdate) {
  if (!birthdate) return ''
  const [, m, d] = birthdate.split('-').map(Number)
  for (let i = 0; i < 12; i++) {
    const [sm, sd] = ZODIAC_DATES[i]
    const [nm, nd] = ZODIAC_DATES[(i + 1) % 12]
    if ((m === sm && d >= sd) || (m === nm && d < nd)) return zodiacSigns[i]
  }
  return zodiacSigns[11]
}

function ScoreCircle({ score }) {
  const color = score >= 80 ? '#f5c518' : score >= 65 ? '#a78bfa' : '#ec4899'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        border: `4px solid ${color}`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.05)'
      }}>
        <span style={{ fontSize: 28, fontWeight: 700, color }}>{score}%</span>
      </div>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>совместимость</span>
    </div>
  )
}

export default function Compatibility({ user }) {
  const [sign1, setSign1] = useState('')
  const [sign2, setSign2] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.birthdate) setSign1(getZodiacSign(user.birthdate))
  }, [user])

  async function calculate() {
    if (!sign1 || !sign2) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await fetchCompatibility(sign1, sign2)
      setResult(data)
    } catch {
      setError('Не удалось рассчитать. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page compat-page fade-in">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>Совместимость</h1>
        <div style={{ width: 30 }} />
      </div>

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

        <button
          className="btn-primary"
          onClick={calculate}
          disabled={!sign1 || !sign2 || loading}
          style={{ marginTop: 12, opacity: (!sign1 || !sign2 || loading) ? 0.6 : 1 }}
        >
          {loading ? 'Анализируем...' : 'Рассчитать'}
        </button>
      </div>

      {loading && (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔮</div>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Звёзды изучают вашу пару...</p>
        </div>
      )}

      {error && (
        <div className="card fade-in" style={{ textAlign: 'center', color: '#ec4899' }}>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="card result-card fade-in">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <ScoreCircle score={result.score} />
          </div>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
            {result.elements}
          </p>

          <p style={{ lineHeight: 1.6, marginBottom: 16, color: 'rgba(255,255,255,0.85)' }}>
            {result.summary}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="compat-detail-row">
              <span className="compat-detail-icon">💪</span>
              <div>
                <div className="compat-detail-label">Сильные стороны</div>
                <div className="compat-detail-text">{result.strengths}</div>
              </div>
            </div>
            <div className="compat-detail-row">
              <span className="compat-detail-icon">⚡</span>
              <div>
                <div className="compat-detail-label">Трудности</div>
                <div className="compat-detail-text">{result.challenges}</div>
              </div>
            </div>
            <div className="compat-detail-row">
              <span className="compat-detail-icon">💡</span>
              <div>
                <div className="compat-detail-label">Совет</div>
                <div className="compat-detail-text">{result.advice}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
