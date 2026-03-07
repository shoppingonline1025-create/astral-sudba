const { sbFetch, getUser } = require('./_shared')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const telegramId = parseInt(req.query.id)

  // GET — получить пользователя
  if (req.method === 'GET') {
    if (!telegramId) return res.status(400).json({ error: 'id required' })
    const user = await getUser(telegramId)
    if (!user) return res.status(404).json({ error: 'not found' })
    return res.json(user)
  }

  // POST — создать пользователя (онбординг)
  if (req.method === 'POST') {
    const { telegram_id, name, birth_date, birth_time, birth_place } = req.body
    if (!telegram_id || !birth_date || !birth_place) {
      return res.status(400).json({ error: 'telegram_id, birth_date, birth_place required' })
    }

    // Триал 72 часа
    const trial_ends_at = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

    try {
      const rows = await sbFetch('/users', {
        method: 'POST',
        prefer: 'return=representation',
        body: JSON.stringify({
          telegram_id,
          name: name || 'Пользователь',
          birth_date,
          birth_time: birth_time || null,
          birth_place,
          subscription_status: 'free',
          trial_ends_at,
          messages_used_this_month: 0,
        }),
      })
      return res.json(rows[0])
    } catch (e) {
      // Возможно уже существует
      const existing = await getUser(telegram_id)
      if (existing) return res.json(existing)
      return res.status(500).json({ error: e.message })
    }
  }

  // DELETE — удалить аккаунт (152-ФЗ)
  if (req.method === 'DELETE') {
    if (!telegramId) return res.status(400).json({ error: 'id required' })
    await sbFetch(`/users?telegram_id=eq.${telegramId}`, { method: 'DELETE' })
    return res.json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
