import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNatal } from '../api'
import { lsGet, lsSet } from '../utils'

const PLANET_ICONS = { Sun: '☀️', Moon: '🌙', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', Ascendant: '↑' }

export default function NatalChart({ user }) {
  const navigate = useNavigate()
  const [natal, setNatal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.telegram_id) return
    const cached = lsGet(`natal_${user.telegram_id}`)
    if (cached) { setNatal(cached); setLoading(false); return }
    getNatal(user.telegram_id)
      .then(d => { setNatal(d); lsSet(`natal_${user.telegram_id}`, d, 24 * 60 * 60 * 1000) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>Натальная карта</h1>
        <div style={{ width: 36 }} />
      </div>

      {loading && (
        <div className="loading-screen">
          <div className="spinner">🌙</div>
          <p>Рассчитываем карту...</p>
        </div>
      )}

      {natal && !loading && (
        <>
          {/* Главные параметры */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {[
                { label: 'Солнце', value: natal.sun_sign, icon: '☀️' },
                { label: 'Луна', value: natal.moon_sign, icon: '🌙' },
                { label: 'Асцендент', value: natal.ascendant, icon: '↑' },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SVG колесо */}
          {natal.planets_json && <NatalWheel planets={natal.planets_json} />}

          {/* Планеты */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14 }}>Положение планет</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {natal.planets_json && Object.entries(natal.planets_json).map(([planet, data]) => (
                <div key={planet} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, width: 28 }}>{PLANET_ICONS[planet] || '●'}</span>
                  <span style={{ fontWeight: 600, width: 90 }}>{planet}</span>
                  <span style={{ color: 'var(--purple-light)' }}>{data.sign || data}</span>
                  {data.degree && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{Math.round(data.degree)}°</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function NatalWheel({ planets }) {
  const cx = 150, cy = 150, r = 110, inner = 70
  const planetEntries = Object.entries(planets).slice(0, 10)

  function toXY(deg, radius) {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  return (
    <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
      <svg width={300} height={300} viewBox="0 0 300 300">
        {/* Внешний круг */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(147,51,234,0.3)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={inner} fill="none" stroke="rgba(147,51,234,0.15)" strokeWidth="1" />
        {/* Деления (12 знаков) */}
        {Array.from({ length: 12 }, (_, i) => {
          const p1 = toXY(i * 30, inner)
          const p2 = toXY(i * 30, r)
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(147,51,234,0.2)" strokeWidth="1" />
        })}
        {/* Планеты */}
        {planetEntries.map(([planet, data]) => {
          const deg = typeof data === 'object' ? (data.longitude || 0) : 0
          const pos = toXY(deg, (r + inner) / 2)
          return (
            <g key={planet}>
              <circle cx={pos.x} cy={pos.y} r={10} fill="rgba(147,51,234,0.25)" />
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="9" fill="#f0eeff">
                {PLANET_ICONS[planet]?.replace(/\uFE0F/g, '') || planet[0]}
              </text>
            </g>
          )
        })}
        {/* Центр */}
        <circle cx={cx} cy={cy} r={4} fill="var(--gold)" />
      </svg>
    </div>
  )
}
