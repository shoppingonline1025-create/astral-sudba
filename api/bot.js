const { sbFetch, getUser } = require('./_shared')

const PLAN_DURATION_DAYS = { pro: 30, platinum: 30, pro_annual: 365 }

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(200).end()

  try {
    const update = req.body

    // Успешный платёж Stars
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment
      const chatId = update.message.chat.id
      const payload = JSON.parse(payment.invoice_payload)
      const { purchase_id, product, user_id } = payload

      // Обновляем статус покупки
      await sbFetch(`/one_time_purchases?id=eq.${purchase_id}`, {
        method: 'PATCH',
        prefer: 'return=minimal',
        body: JSON.stringify({ status: 'completed' }),
      })

      // Если подписка — обновляем пользователя
      const durationDays = PLAN_DURATION_DAYS[product]
      if (durationDays) {
        const plan = product === 'pro_annual' ? 'pro' : product
        const expires = new Date(Date.now() + durationDays * 86400000).toISOString()
        await sbFetch(`/users?id=eq.${user_id}`, {
          method: 'PATCH',
          prefer: 'return=minimal',
          body: JSON.stringify({ subscription_status: plan, subscription_expires_at: expires }),
        })
        await sendMessage(chatId, `✅ Подписка <b>${plan.toUpperCase()}</b> активирована на ${durationDays} дней!\n\nОткройте приложение и обновите страницу.`)
      } else {
        await sendMessage(chatId, `✅ Покупка подтверждена! Ваш отчёт будет готов в течение нескольких минут.`)
      }
    }

    // Команда /start
    if (update.message?.text?.startsWith('/start')) {
      const chatId = update.message.chat.id
      const firstName = update.message.from?.first_name || 'друг'
      const token = process.env.TELEGRAM_BOT_TOKEN
      const appUrl = process.env.WEBAPP_URL || 'https://astral-sudba.vercel.app'

      const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'Привет, ' + firstName + '! Нажми кнопку чтобы открыть приложение:',
          reply_markup: {
            inline_keyboard: [[
              { text: 'Открыть АстроЛичность', url: appUrl },
            ]],
          },
        }),
      })
      const tgData = await tgRes.json()
      if (!tgData.ok) console.error('Telegram sendMessage error:', JSON.stringify(tgData))
    }

    // Pre-checkout query — автоодобрение
    if (update.pre_checkout_query) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pre_checkout_query_id: update.pre_checkout_query.id, ok: true }),
      })
    }

    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Bot webhook error:', e)
    res.status(200).json({ ok: true }) // всегда 200 для Telegram
  }
}
