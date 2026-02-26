import { useNavigate } from 'react-router-dom'
import './Premium.css'

const plans = [
  {
    id: 'pro',
    icon: '⭐',
    name: 'PRO Подписка',
    price: '499 ₽',
    period: 'в месяц',
    features: [
      'Расширенные прогнозы на 7 и 30 дней',
      'Полный анализ совместимости',
      'Детальная натальная карта',
      'Ежедневные персональные советы',
    ],
    color: 'purple',
    popular: true,
  },
  {
    id: 'platinum',
    icon: '💎',
    name: 'Платиновая',
    price: '999 ₽',
    period: 'в месяц',
    features: [
      'Всё из PRO',
      'ИИ-анализ вашей карты',
      'Синастрия с партнёром',
      'Прогноз на год вперёд',
      'Личный астрологический отчёт',
    ],
    color: 'gold',
    popular: false,
  },
]

export default function Premium() {
  const navigate = useNavigate()

  function handleSubscribe(planId) {
    // TODO: Telegram Stars payment
    alert(`Оплата через Telegram Stars — скоро! (${planId})`)
  }

  return (
    <div className="page premium-page fade-in">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <h1>✨ Премиум</h1>
        <div style={{ width: 30 }} />
      </div>

      <p className="premium-subtitle">Откройте полный потенциал вашей натальной карты</p>

      {plans.map(plan => (
        <div key={plan.id} className={`card plan-card plan-${plan.color} ${plan.popular ? 'popular' : ''}`}>
          {plan.popular && <div className="popular-badge">Популярное</div>}

          <div className="plan-header">
            <span className="plan-icon">{plan.icon}</span>
            <div>
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-pricing">
                <span className={`plan-price ${plan.color}`}>{plan.price}</span>
                <span className="plan-period"> {plan.period}</span>
              </div>
            </div>
          </div>

          <div className="plan-features">
            {plan.features.map((f, i) => (
              <div key={i} className="plan-feature">
                <span className={`feature-check ${plan.color}`}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>

          <button
            className={plan.color === 'gold' ? 'btn-gold' : 'btn-primary'}
            onClick={() => handleSubscribe(plan.id)}
          >
            Подключить {plan.name}
          </button>
        </div>
      ))}

      <div className="card free-card">
        <h3 className="free-title">Бесплатно доступно:</h3>
        <div className="free-features">
          <div className="free-feature">✓ Базовая натальная карта</div>
          <div className="free-feature">✓ Прогноз на сегодня</div>
          <div className="free-feature">✓ Энергия дня</div>
          <div className="free-feature">✓ Базовая совместимость</div>
        </div>
      </div>
    </div>
  )
}
