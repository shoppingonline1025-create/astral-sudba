const { getUser, calcPlanets, moonDay, callClaude, sbFetch } = require('./_shared')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const telegramId = parseInt(req.query.id)
    const period = req.query.period || 'day'
    if (!telegramId) return res.status(400).json({ error: 'id required' })

    const user = await getUser(telegramId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // DELETE — очистить кэш
    if (req.method === 'DELETE') {
      const today = new Date().toISOString().split('T')[0]
      await sbFetch(`/forecasts_cache?user_id=eq.${user.id}&forecast_date=eq.${today}&period=eq.${period}`, { method: 'DELETE' })
      return res.json({ ok: true })
    }

    // Проверяем кэш
    const today = new Date().toISOString().split('T')[0]
    const cached = await sbFetch(`/forecasts_cache?user_id=eq.${user.id}&forecast_date=eq.${today}&period=eq.${period}&limit=1`)
    if (cached?.[0]?.content) return res.json(cached[0].content)

    // Текущие транзиты
    const now = new Date()
    const transits = calcPlanets(now)
    const mDay = moonDay(now)

    // Натальная карта из БД
    const natalRows = await sbFetch(`/natal_charts?user_id=eq.${user.id}&limit=1`)
    const natal = natalRows?.[0]
    const sunSign = natal?.sun_sign || 'Овен'
    const moonSign = natal?.moon_sign || 'Овен'

    let prompt, systemContent

    if (period === 'day') {
      prompt = `Ты опытный астролог. Составь персональный прогноз на сегодня для ${user.name}.

Натальная карта:
- Солнце: ${sunSign}
- Луна: ${moonSign}
- Асцендент: ${natal?.ascendant || 'неизвестен'}

Текущие транзиты:
- Луна в ${transits.Moon?.sign} (${mDay}-й лунный день)
- Солнце в ${transits.Sun?.sign}
- Меркурий в ${transits.Mercury?.sign}
- Венера в ${transits.Venus?.sign}
- Марс в ${transits.Mars?.sign}

Пиши на русском, в будущем времени, обращаясь к ${user.name} лично (на "вы" или "ты").
Будь конкретным и теплым. НЕ используй прошедшее время.

Ответь ТОЛЬКО валидным JSON без markdown:
{"energy":7,"moon":"Луна в Близнецах, 15-й лунный день","title":"Заголовок прогноза","summary":"2-3 предложения общий прогноз","best_time":"14:00–17:00","career":"1 предложение","love":"1 предложение","health":"1 предложение","advice":"короткий совет дня","good_for":"3-4 слова через запятую","avoid":"3-4 слова через запятую"}`

    } else if (period === 'week') {
      prompt = `Ты опытный астролог. Составь прогноз на 7 дней для ${user.name} (${sunSign}, Луна в ${moonSign}).

Текущие транзиты: Луна ${transits.Moon?.sign}, Солнце ${transits.Sun?.sign}, Марс ${transits.Mars?.sign}, Юпитер ${transits.Jupiter?.sign}.

Пиши в будущем времени, от лица астролога, обращаясь лично к ${user.name}.

Ответь ТОЛЬКО валидным JSON:
{"energy":7,"title":"Заголовок","summary":"3-4 предложения на неделю","themes":"ключевые темы","best_days":"2-3 лучших дня недели","advice":"совет на неделю"}`

    } else {
      prompt = `Ты опытный астролог. Составь прогноз на месяц для ${user.name} (${sunSign}, Луна в ${moonSign}).

Текущие транзиты: Юпитер ${transits.Jupiter?.sign}, Сатурн ${transits.Saturn?.sign}, Марс ${transits.Mars?.sign}.

Пиши в будущем времени, от лица астролога.

Ответь ТОЛЬКО валидным JSON:
{"energy":7,"title":"Заголовок","summary":"4-5 предложений на месяц","career":"2 предложения","love":"2 предложения","health":"1 предложение","best_period":"лучший период месяца","advice":"главный совет месяца"}`
    }

    // Модель: haiku для дня, sonnet для недели/месяца
    const model = period === 'day' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6'
    const content = await callClaude(prompt, model)

    // Сохраняем в кэш
    await sbFetch('/forecasts_cache', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify({ user_id: user.id, forecast_date: today, period, content }),
    })

    res.json(content)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
