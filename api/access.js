const { getUser, getActivePlan, sbFetch } = require('./_shared')

const LIMITS = {
  free:     { messages: 5,  partners: 1,  forecastDays: 1  },
  trial:    { messages: 30, partners: 5,  forecastDays: 7  },
  pro:      { messages: 30, partners: 5,  forecastDays: 7  },
  platinum: { messages: 80, partners: 10, forecastDays: 30 },
}

const FEATURES = {
  transits_basic:  ['pro', 'platinum', 'trial'],
  transits_full:   ['platinum'],
  progressions:    ['platinum'],
  solar_included:  ['platinum'],
  notifications:   ['pro', 'platinum', 'trial'],
  pdf_export:      ['platinum'],
  sonnet_priority: ['platinum'],
  forecast_week:   ['pro', 'platinum', 'trial'],
  forecast_month:  ['platinum'],
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const telegramId = parseInt(req.query.id)
    const feature = req.query.feature
    if (!telegramId || !feature) return res.status(400).json({ error: 'id, feature required' })

    const user = await getUser(telegramId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const plan = await getActivePlan(user)
    const limits = LIMITS[plan] || LIMITS.free
    let allowed = false

    if (FEATURES[feature]) {
      allowed = FEATURES[feature].includes(plan)
    } else if (feature === 'chat_message') {
      allowed = (user.messages_used_this_month || 0) < limits.messages
    } else if (feature.startsWith('purchase_')) {
      const productType = feature.replace('purchase_', '')
      const rows = await sbFetch(`/one_time_purchases?user_id=eq.${user.id}&product_type=eq.${productType}&status=eq.completed&limit=1`)
      allowed = rows?.length > 0
    }

    res.json({ allowed, plan, limits })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
