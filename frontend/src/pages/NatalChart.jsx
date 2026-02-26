import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './NatalChart.css'

const mockChart = {
  planets: [
    { name: 'Солнце', sign: 'Водолей', icon: '☀️' },
    { name: 'Луна', sign: 'Телец', icon: '🌙' },
    { name: 'Асцендент', sign: 'Лев', icon: '⬆️' },
    { name: 'Меркурий', sign: 'Рыбы', icon: '☿' },
    { name: 'Венера', sign: 'Козерог', icon: '♀️' },
    { name: 'Марс', sign: 'Скорпион', icon: '♂️' },
    { name: 'Юпитер', sign: 'Стрелец', icon: '♃' },
    { name: 'Сатурн', sign: 'Водолей', icon: '♄' },
  ],
  houses: [
    { num: 'I', sign: 'Лев', topic: 'Личность, внешность' },
    { num: 'II', sign: 'Дева', topic: 'Деньги, ценности' },
    { num: 'III', sign: 'Весы', topic: 'Общение, братья' },
    { num: 'IV', sign: 'Скорпион', topic: 'Дом, семья' },
    { num: 'V', sign: 'Стрелец', topic: 'Творчество, дети' },
    { num: 'VI', sign: 'Козерог', topic: 'Здоровье, работа' },
  ],
  aspects: [
    { planet1: '☀️ Солнце', aspect: 'Трин ▲', planet2: '♃ Юпитер', type: 'good' },
    { planet1: '🌙 Луна', aspect: 'Секстиль ✶', planet2: '♀️ Венера', type: 'good' },
    { planet1: '☿ Меркурий', aspect: 'Квадрат □', planet2: '♂️ Марс', type: 'hard' },
    { planet1: '♀️ Венера', aspect: 'Соединение ☌', planet2: '♄ Сатурн', type: 'neutral' },
  ],
}

const ZODIAC_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']

export default function NatalChart() {
  const [activeTab, setActiveTab] = useState('main')
  const navigate = useNavigate()

  return (
    <div className="page natal-page fade-in">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>Натальная Карта</h1>
        <div style={{ width: 30 }} />
      </div>

      {/* Zodiac circle */}
      <div className="zodiac-circle-wrap">
        <div className="zodiac-circle">
          {ZODIAC_SYMBOLS.map((sym, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180)
            const r = 115
            const x = 140 + r * Math.cos(angle)
            const y = 140 + r * Math.sin(angle)
            return (
              <span key={i} className="zodiac-sym" style={{ left: x, top: y }}>
                {sym}
              </span>
            )
          })}
          {/* Inner rings */}
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
          {/* Center */}
          <div className="chart-center">
            <span>✨</span>
          </div>
          {/* Aspect lines */}
          <svg className="aspect-svg" viewBox="0 0 280 280">
            <line x1="140" y1="25" x2="255" y2="210" stroke="rgba(240,165,0,0.3)" strokeWidth="1" />
            <line x1="140" y1="25" x2="25" y2="210" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />
            <line x1="255" y1="210" x2="25" y2="210" stroke="rgba(240,165,0,0.2)" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'main' ? 'active' : ''}`} onClick={() => setActiveTab('main')}>Основное</button>
        <button className={`tab ${activeTab === 'houses' ? 'active' : ''}`} onClick={() => setActiveTab('houses')}>Дома</button>
        <button className={`tab ${activeTab === 'aspects' ? 'active' : ''}`} onClick={() => setActiveTab('aspects')}>Аспекты</button>
      </div>

      {/* Content */}
      {activeTab === 'main' && (
        <div className="planets-list fade-in">
          {mockChart.planets.map((p, i) => (
            <div key={i} className="planet-row card">
              <span className="planet-icon">{p.icon}</span>
              <div className="planet-info">
                <span className="planet-name">{p.name}</span>
                <span className="planet-sign gold">в {p.sign}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'houses' && (
        <div className="houses-list fade-in">
          {mockChart.houses.map((h, i) => (
            <div key={i} className="house-row card">
              <span className="house-num gold">{h.num}</span>
              <div className="house-info">
                <span className="house-sign">{h.sign}</span>
                <span className="house-topic">{h.topic}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'aspects' && (
        <div className="aspects-list fade-in">
          {mockChart.aspects.map((a, i) => (
            <div key={i} className={`aspect-row card aspect-${a.type}`}>
              <span className="asp-planet">{a.planet1}</span>
              <span className={`asp-type ${a.type}`}>{a.aspect}</span>
              <span className="asp-planet">{a.planet2}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
