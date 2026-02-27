const { calcPositions, findAspects, geocode, sbGetUser, generateMultiForecast, DAYS_RU } = require('./_astro')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { id, days } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })

    const user = await sbGetUser(id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const natalDate = new Date(`${user.birthdate}T${user.birthtime || '12:00'}:00`)
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
    res.json({ days: forecast })
  } catch (e) {
    console.error('MULTI FORECAST ERROR:', e)
    res.status(500).json({ error: e.message || String(e) })
  }
}
