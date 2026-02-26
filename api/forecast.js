const { calcPositions, findAspects, geocode, sbGetUser, sbGetForecast, sbSaveForecast, generateForecast } = require('./_astro')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const telegramId = parseInt(req.query.id)
    if (!telegramId) return res.status(400).json({ error: 'id required' })

    const today = new Date().toISOString().split('T')[0]

    // Кэш
    const cached = await sbGetForecast(telegramId, today)
    if (cached) return res.json(cached.content)

    // Пользователь
    const user = await sbGetUser(telegramId)
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' })

    // Координаты
    let lat = user.birth_lat || 0
    let lon = user.birth_lon || 0
    if ((!lat || lat === 55.7558) && user.birthplace) {
      const coords = await geocode(user.birthplace)
      lat = coords.lat; lon = coords.lon
    }

    // Дата рождения
    const [y, m, d] = user.birthdate.split('-').map(Number)
    const [h, min] = (user.birthtime || '12:00:00').split(':').map(Number)
    const birthDate = new Date(Date.UTC(y, m - 1, d, h, min))
    const todayDate = new Date()

    // Расчёты
    const natal = calcPositions(birthDate)
    const transits = calcPositions(todayDate)
    const aspects = findAspects(natal, transits)

    // Gemini
    const forecast = await generateForecast(user, natal, transits, aspects, today)
    await sbSaveForecast(telegramId, today, forecast)

    res.json(forecast)
  } catch (e) {
    console.error('FORECAST ERROR:', e)
    res.status(500).json({ error: e.message || String(e) })
  }
}
