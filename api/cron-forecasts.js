const { sbFetch, calcPlanets } = require('./_shared')

const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
const APP_URL = (process.env.WEBAPP_URL || 'https://astral-sudba.vercel.app').trim()

const MOON_TIPS = {
  'Овен':      'время действовать решительно',
  'Телец':     'хорошее время для практических дел',
  'Близнецы':  'общение и новые идеи принесут удачу',
  'Рак':       'прислушайтесь к своей интуиции',
  'Лев':       'день для творчества и самовыражения',
  'Дева':      'внимание к деталям окупится',
  'Весы':      'ищите баланс в отношениях',
  'Скорпион':  'время для глубокого анализа',
  'Стрелец':   'расширяйте горизонты',
  'Козерог':   'фокус на долгосрочных целях',
  'Водолей':   'нестандартные решения принесут успех',
  'Рыбы':      'доверяйте своим чувствам',
}

async function sendTgMessage(chatId, text) {
  if (!BOT_TOKEN) return
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔮 Открыть прогноз', web_app: { url: APP_URL } },
        ]],
      },
    }),
  })
}

module.exports = async (req, res) => {
  // Проверка что запрос от Vercel Cron
  const auth = req.headers.authorization
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Текущая Луна
    const transits = calcPlanets(new Date())
    const moonSign = transits.Moon?.sign || 'Овен'
    const moonTip = MOON_TIPS[moonSign] || 'день полон возможностей'

    // Все пользователи с telegram_id
    const users = await sbFetch('/users?select=telegram_id,name,trial_ends_at&limit=1000')
    if (!users?.length) return res.json({ ok: true, sent: 0 })

    const now = Date.now()
    const tomorrow = now + 24 * 60 * 60 * 1000
    let sent = 0

    for (const user of users) {
      if (!user.telegram_id) continue

      // Проверяем — заканчивается ли триал сегодня
      const trialEnds = user.trial_ends_at ? new Date(user.trial_ends_at).getTime() : 0
      if (trialEnds > now && trialEnds < tomorrow) {
        // Уведомление об окончании триала
        await sendTgMessage(
          user.telegram_id,
          `⏰ <b>${user.name || 'Привет'}, ваш пробный период заканчивается сегодня!</b>\n\n` +
          `За эти дни астролог узнал вас лучше. Не теряйте связь со звёздами 🌟\n\n` +
          `Откройте приложение, чтобы продолжить с PRO.`
        )
      } else {
        // Обычное утреннее уведомление
        const name = user.name ? user.name.split(' ')[0] : 'Привет'
        await sendTgMessage(
          user.telegram_id,
          `🌙 <b>Доброе утро, ${name}!</b>\n\n` +
          `Луна в <b>${moonSign}</b> — ${moonTip}.\n\n` +
          `Твой персональный прогноз на сегодня готов ✨`
        )
      }

      sent++
      // Небольшая пауза чтобы не превысить лимиты Telegram (30 сообщений/сек)
      if (sent % 25 === 0) await new Promise(r => setTimeout(r, 1000))
    }

    res.json({ ok: true, sent, moon: moonSign })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
