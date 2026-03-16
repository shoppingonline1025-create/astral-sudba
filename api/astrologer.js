const { getUser, getActivePlan, callClaudeText, sbFetch, calcPlanets } = require('./_shared')

const LIMITS = { free: 5, trial: 30, pro: 30, platinum: 80 }

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const telegramId = parseInt(req.query.id || req.body?.id)
    if (!telegramId) return res.status(400).json({ error: 'id required' })

    const user = await getUser(telegramId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // GET — история чата
    if (req.method === 'GET') {
      const rows = await sbFetch(`/chat_history?user_id=eq.${user.id}&order=created_at.asc&limit=50`)
      return res.json(rows || [])
    }

    // POST — отправить сообщение
    const { message } = req.body
    if (!message) return res.status(400).json({ error: 'message required' })

    // Проверяем лимит
    const plan = await getActivePlan(user)
    const limit = LIMITS[plan] || 5
    if ((user.messages_used_this_month || 0) >= limit) {
      return res.status(403).json({ error: `Лимит ${limit} сообщений исчерпан. Обновите тариф.` })
    }

    // Загружаем историю (последние 20)
    const historyRows = await sbFetch(`/chat_history?user_id=eq.${user.id}&order=created_at.desc&limit=20`)
    const history = (historyRows || []).reverse()

    // Натальная карта
    const natalRows = await sbFetch(`/natal_charts?user_id=eq.${user.id}&limit=1`)
    const natal = natalRows?.[0]

    // Текущие транзиты
    const transits = calcPlanets(new Date())

    // Системный промпт
    const systemPrompt = `Ты — персональный AI-астролог по имени Аура. Ты помнишь натальную карту пользователя и отвечаешь как живой астролог: тепло, конкретно, с практическими советами.

Пользователь: ${user.name}
${natal ? `Натальная карта:
- Солнце в ${natal.sun_sign}
- Луна в ${natal.moon_sign}
- Асцендент ${natal.ascendant}` : ''}

Текущее небо: Луна в ${transits.Moon?.sign}, Солнце в ${transits.Sun?.sign}, Марс в ${transits.Mars?.sign}, Юпитер в ${transits.Jupiter?.sign}.

Правила:
- Отвечай только на русском языке
- Обращайся к пользователю по имени или "вы"/"ты"
- Давай конкретные советы, не банальности
- Если вопрос не об астрологии, мягко направляй в нужное русло
- Не придумывай точные даты событий
- Прогнозы носят развлекательный характер`

    // Модель: sonnet для platinum и trial (лучший опыт → конверсия), haiku для остальных
    const model = ['platinum', 'trial'].includes(plan) ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001'

    // Формируем messages: история + новое сообщение
    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ]

    // system prompt передаётся отдельным параметром (правило Anthropic API)
    const reply = await callClaudeText(messages, model, systemPrompt)

    // Сохраняем в историю
    await sbFetch('/chat_history', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify([
        { user_id: user.id, role: 'user', content: message },
        { user_id: user.id, role: 'assistant', content: reply },
      ]),
    })

    // Увеличиваем счётчик
    await sbFetch(`/users?id=eq.${user.id}`, {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: JSON.stringify({ messages_used_this_month: (user.messages_used_this_month || 0) + 1 }),
    })

    res.json({ reply })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
