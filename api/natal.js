const { getUser, calcPlanets, signFromLong, sbFetch } = require('./_shared')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const telegramId = parseInt(req.query.id)
    if (!telegramId) return res.status(400).json({ error: 'id required' })

    const user = await getUser(telegramId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Проверяем кэш в Supabase
    const cached = await sbFetch(`/natal_charts?user_id=eq.${user.id}&limit=1`)
    if (cached?.[0]) return res.json(cached[0])

    // Рассчитываем натальную карту
    const [y, m, d] = user.birth_date.split('-').map(Number)
    const [h, min] = (user.birth_time || '12:00').split(':').map(Number)
    const birthDate = new Date(Date.UTC(y, m - 1, d, h, min))

    const planets = calcPlanets(birthDate)
    const sun_sign = planets.Sun?.sign || 'Овен'
    const moon_sign = planets.Moon?.sign || 'Овен'
    // Асцендент без точного места рождения = примерный (через время)
    const ascLon = (birthDate.getUTCHours() / 24 * 360 + planets.Sun?.longitude || 0) % 360
    const ascendant = signFromLong(ascLon)

    const chart = {
      user_id: user.id,
      birth_date: user.birth_date,
      birth_time: user.birth_time,
      birth_place: user.birth_place,
      sun_sign,
      moon_sign,
      ascendant,
      planets_json: planets,
    }

    // Сохраняем в Supabase
    const rows = await sbFetch('/natal_charts', {
      method: 'POST',
      prefer: 'return=representation',
      body: JSON.stringify(chart),
    })

    res.json(rows?.[0] || chart)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
