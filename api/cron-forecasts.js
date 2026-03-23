const { sbFetch, calcPlanets } = require('./_shared')

const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
const APP_URL = (process.env.WEBAPP_URL || 'https://astral-sudba.vercel.app').trim()

const MOON_TIPS = {
  'Овен':      'энергия зашкаливает — направь её в дело',
  'Телец':     'хочется стабильности и уюта — это нормально',
  'Близнецы':  'мысли скачут, идей много — запиши лучшие',
  'Рак':       'эмоции обострены, интуиция не подведёт',
  'Лев':       'хочется внимания и признания — и это заслужено',
  'Дева':      'замечаешь детали которые другие пропускают',
  'Весы':      'трудно решиться — взвесь ещё раз и действуй',
  'Скорпион':  'настроение серьёзное, зато видишь суть вещей',
  'Стрелец':   'тянет к новому и неизведанному',
  'Козерог':   'день для дел, а не разговоров',
  'Водолей':   'стандартные решения не работают — ищи нестандартные',
  'Рыбы':      'границы размыты, зато творчество в потоке',
}

// 15 шаблонов утреннего уведомления — ротация по дню года
const MORNING_TEMPLATES = [
  (name, moon, tip) =>
    `🌙 <b>Доброе утро, ${name}!</b>\n\nЛуна в <b>${moon}</b> — ${tip}.\n\nТвой персональный прогноз на сегодня готов ✨`,
  (name, moon, tip) =>
    `✨ <b>${name}, звёзды уже проснулись!</b>\n\nСегодня ${tip} — Луна в <b>${moon}</b> задаёт тон дню.\n\nПрогноз ждёт тебя 🔮`,
  (name, moon, tip) =>
    `🔮 <b>Привет, ${name}!</b>\n\nАстролог составил твой прогноз на сегодня.\n\nЛуна в <b>${moon}</b>: ${tip} 🌟`,
  (name, moon, tip) =>
    `🌅 <b>${name}, новый день — новые возможности.</b>\n\n${tip}. Луна сегодня в <b>${moon}</b>.\n\nПосмотри что тебя ждёт 👇`,
  (name, moon, tip) =>
    `💫 <b>Доброе утро, ${name}!</b>\n\nЛуна вошла в <b>${moon}</b> — это значит: ${tip}.\n\nТвой прогноз на сегодня готов ✨`,
  (name, moon, tip) =>
    `🌸 <b>${name}, с добрым утром!</b>\n\nСегодняшний день под знаком <b>Луны в ${moon}</b>.\n\n${tip.charAt(0).toUpperCase() + tip.slice(1)} — открой прогноз и узнай подробности 🔮`,
  (name, moon, tip) =>
    `⭐ <b>Привет, ${name}!</b>\n\nЯ изучил сегодняшние транзиты специально для тебя.\n\nЛуна в <b>${moon}</b> — ${tip}. Прогноз готов 👇`,
  (name, moon, tip) =>
    `🌙 <b>${name}!</b>\n\nНовый день — новый прогноз.\n\nЛуна в <b>${moon}</b> сегодня советует: ${tip} ✨`,
  (name, moon, tip) =>
    `🔯 <b>Доброе утро, ${name}!</b>\n\nАстрологическая картина дня сложилась.\n\nЛуна в <b>${moon}</b> — ${tip}. Смотри прогноз 👇`,
  (name, moon, tip) =>
    `🌟 <b>${name}, звёзды говорят о тебе!</b>\n\nСегодня Луна в <b>${moon}</b>.\n\n${tip.charAt(0).toUpperCase() + tip.slice(1)} — твой персональный прогноз уже готов ✨`,
  (name, moon, tip) =>
    `✨ <b>С добрым утром, ${name}!</b>\n\nТвой астролог не спал — прогноз на сегодня составлен.\n\nЛуна в <b>${moon}</b>: ${tip} 🌙`,
  (name, moon, tip) =>
    `🌙 <b>${name}, доброе утро!</b>\n\nЛуна сегодня в <b>${moon}</b> — ${tip}.\n\nОткрой прогноз чтобы знать как провести этот день 🔮`,
  (name, moon, tip) =>
    `💜 <b>Привет, ${name}!</b>\n\nКосмос сегодня на твоей стороне.\n\nЛуна в <b>${moon}</b> — ${tip}. Прогноз готов ⭐`,
  (name, moon, tip) =>
    `🌠 <b>Доброе утро, ${name}!</b>\n\nКаждый день уникален — и сегодня тоже.\n\nЛуна в <b>${moon}</b>: ${tip}. Посмотри что ждёт впереди ✨`,
  (name, moon, tip) =>
    `🔮 <b>${name}, утренний прогноз готов!</b>\n\nЛуна в <b>${moon}</b> сегодня подсказывает: ${tip}.\n\nОткрывай и начинай день осознанно 🌟`,
]

function getDayTemplate() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now - start) / 86400000)
  return MORNING_TEMPLATES[dayOfYear % MORNING_TEMPLATES.length]
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
    const users = await sbFetch('/users?select=telegram_id,name,trial_ends_at,subscription_expires_at&limit=1000')
    if (!users?.length) return res.json({ ok: true, sent: 0 })

    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    let sent = 0

    for (const user of users) {
      if (!user.telegram_id) continue

      const trialEnds = user.trial_ends_at ? new Date(user.trial_ends_at).getTime() : 0
      const subExpires = user.subscription_expires_at ? new Date(user.subscription_expires_at).getTime() : 0

      const trialActive = trialEnds > now
      const subActive = subExpires > now
      // Триал истёк в последние 24 часа (день 4 утром)
      const trialJustExpired = trialEnds > 0 && trialEnds < now && trialEnds > now - oneDayMs

      if (trialJustExpired && !subActive) {
        // Уведомление об окончании триала — уговариваем купить PRO
        const name = user.name ? user.name.split(' ')[0] : 'друг'
        await sendTgMessage(
          user.telegram_id,
          `🌙 <b>${name}, ваш пробный период завершён.</b>\n\n` +
          `За эти 3 дня астролог изучил вашу карту и запомнил вас.\n\n` +
          `Чтобы продолжить — выберите тариф PRO или Платинум.\n` +
          `Первый месяц всего <b>$5</b> ✨`
        )
        sent++
      } else if (trialActive || subActive) {
        // Утреннее уведомление только для активных пользователей (триал или подписка)
        const name = user.name ? user.name.split(' ')[0] : 'Привет'
        const template = getDayTemplate()
        await sendTgMessage(user.telegram_id, template(name, moonSign, moonTip))
        sent++
      }

      // Пауза чтобы не превысить лимиты Telegram (30 сообщений/сек)
      if (sent % 25 === 0) await new Promise(r => setTimeout(r, 1000))
    }

    res.json({ ok: true, sent, moon: moonSign })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
