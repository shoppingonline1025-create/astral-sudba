const { sbFetch } = require('./_shared')

module.exports = async (req, res) => {
  // Проверка что запрос от Vercel Cron
  const auth = req.headers.authorization
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Сбрасываем счётчик сообщений для всех пользователей
    await sbFetch('/users?messages_used_this_month=gt.0', {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: JSON.stringify({ messages_used_this_month: 0 }),
    })

    res.json({ ok: true, reset: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
