const { calcPositions, findAspects, sbGetUser, generateMultiForecast, DAYS_RU } = require('./_astro')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const telegramId = parseInt(req.query.id)
    const days = req.query.days
    if (!telegramId) return res.status(400).json({ error: 'id required' })

    const user = await sbGetUser(telegramId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const [y, m, d] = user.birthdate.split('-').map(Number)
    const [h, min] = (user.birthtime || '12:00:00').split(':').map(Number)
    const natalDate = new Date(Date.UTC(y, m - 1, d, h, min))
    const natal = calcPositions(natalDate)

    const daysCount = Math.min(parseInt(days) || 3, 10)
    const today = new Date()
    const daysData = []

    for (let i = 1; i <= daysCount; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const transits = calcPositions(date)
      const aspects = findAspects(natal, transits)
      daysData.push({
        dateStr: date.toISOString().split('T')[0],
        dayName: DAYS_RU[date.getDay()],
        moon: transits.Moon.sign,
        aspects,
      })
    }

    const forecast = await generateMultiForecast(user, natal, daysData)
    const moonDays = daysData.map(d => ({ date: d.dateStr, day: d.dayName, moon: d.moon }))
    res.json({ forecast, moon_days: moonDays })
  } catch (e) {
    console.error('MULTI FORECAST ERROR:', e)
    res.status(500).json({ error: e.message || String(e) })
  }
}
