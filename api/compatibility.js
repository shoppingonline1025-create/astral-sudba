const { generateCompatibility } = require('./_astro')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { sign1, sign2 } = req.query
    if (!sign1 || !sign2) return res.status(400).json({ error: 'sign1 and sign2 required' })

    const result = await generateCompatibility(sign1, sign2)
    res.json(result)
  } catch (e) {
    console.error('COMPAT ERROR:', e)
    res.status(500).json({ error: e.message || String(e) })
  }
}
