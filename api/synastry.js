const { getUser, calcPlanets, signFromLong, callClaude, sbFetch } = require('./_shared')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const telegramId = parseInt(req.query.id)
    if (!telegramId) return res.status(400).json({ error: 'id required' })

    const user = await getUser(telegramId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // POST — добавить партнёра и рассчитать синастрию
    if (req.method === 'POST') {
      const { name, birth_date, birth_time, birth_place } = req.body
      if (!name || !birth_date) return res.status(400).json({ error: 'name, birth_date required' })

      // Натальная карта пользователя
      const natalRows = await sbFetch(`/natal_charts?user_id=eq.${user.id}&limit=1`)
      const natal = natalRows?.[0]

      // Карта партнёра
      const [y, m, d] = birth_date.split('-').map(Number)
      const [h, min] = (birth_time || '12:00').split(':').map(Number)
      const partnerDate = new Date(Date.UTC(y, m - 1, d, h, min))
      const partnerPlanets = calcPlanets(partnerDate)
      const partnerSun = partnerPlanets.Sun?.sign || 'Овен'
      const partnerMoon = partnerPlanets.Moon?.sign || 'Овен'

      // Расчёт базовой совместимости
      const userSun = natal?.sun_sign || 'Овен'
      const userMoon = natal?.moon_sign || 'Овен'

      const prompt = `Ты опытный астролог-синастролог. Рассчитай совместимость пары.

${user.name}: Солнце в ${userSun}, Луна в ${userMoon}
${name}: Солнце в ${partnerSun}, Луна в ${partnerMoon}

Дай честную оценку, укажи сильные стороны и возможные трудности.
Пиши тепло, на русском.

Ответь ТОЛЬКО валидным JSON:
{"score":75,"summary":"2-3 предложения общая оценка","strengths":"сильные стороны пары","challenges":"возможные трудности","tip":"главный совет"}`

      const result = await callClaude(prompt, 'claude-haiku-4-5-20251001')

      // Сохраняем партнёра
      const partnerRows = await sbFetch('/partners', {
        method: 'POST',
        prefer: 'return=representation',
        body: JSON.stringify({
          user_id: user.id,
          name,
          birth_date,
          birth_time: birth_time || null,
          birth_place: birth_place || null,
          synastry_json: result,
        }),
      })

      return res.json(partnerRows?.[0] || { id: null, ...result })
    }

    // GET — получить синастрию партнёра
    if (req.method === 'GET') {
      const partnerId = req.query.partner
      if (!partnerId) {
        // Список партнёров
        const rows = await sbFetch(`/partners?user_id=eq.${user.id}&order=created_at.desc`)
        return res.json(rows || [])
      }
      const rows = await sbFetch(`/partners?id=eq.${partnerId}&user_id=eq.${user.id}&limit=1`)
      const partner = rows?.[0]
      if (!partner) return res.status(404).json({ error: 'Partner not found' })
      return res.json(partner.synastry_json || {})
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
