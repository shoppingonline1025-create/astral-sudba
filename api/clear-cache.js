const { SB_URL, SB_KEY } = require('./_astro')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const telegramId = parseInt(req.query.id)
    if (!telegramId) return res.status(400).json({ error: 'id required' })

    const today = new Date().toISOString().split('T')[0]
    const sbUrl = process.env.SUPABASE_URL || 'https://hkurtoonrpxnrspmuzgt.supabase.co'
    const sbKey = process.env.SUPABASE_KEY || 'sb_publishable_G3X4bzQpmaQ-GRjMRvQhhw_ft3Feab9'
    const headers = { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' }

    await fetch(`${sbUrl}/rest/v1/forecasts?telegram_id=eq.${telegramId}&date=eq.${today}`, {
      method: 'DELETE',
      headers,
    })

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
