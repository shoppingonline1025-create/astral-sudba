const { calcPositions, geocode, sbGetUser } = require('./_astro')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const telegramId = parseInt(req.query.id)
    if (!telegramId) return res.status(400).json({ error: 'id required' })

    const user = await sbGetUser(telegramId)
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' })

    let lat = user.birth_lat || 0
    let lon = user.birth_lon || 0
    if ((!lat || lat === 55.7558) && user.birthplace) {
      const coords = await geocode(user.birthplace)
      lat = coords.lat; lon = coords.lon
    }

    const [y, m, d] = user.birthdate.split('-').map(Number)
    const [h, min] = (user.birthtime || '12:00:00').split(':').map(Number)
    const birthDate = new Date(Date.UTC(y, m - 1, d, h, min))

    const positions = calcPositions(birthDate)

    res.json({
      name: user.name,
      birthdate: user.birthdate,
      birthplace: user.birthplace,
      planets: Object.values(positions).map(v => ({ name: v.name_ru, sign: v.sign, degree: v.degree }))
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
