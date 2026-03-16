const { sbFetch, getUser } = require('./_shared')
const { generatePDFReport } = require('./_pdf-generator')

const PLAN_DURATION_DAYS = { pro: 30, platinum: 30, pro_annual: 365 }
const ONE_TIME_PRODUCTS = ['synastry_quick', 'synastry_full', 'synastry_vip', 'solar_forecast', 'child_chart']

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

async function sendDocument(chatId, pdfBuffer, filename, caption) {
  const FormData = (await import('node:formdata')).FormData || globalThis.FormData
  const form = new FormData()
  form.append('chat_id', String(chatId))
  form.append('caption', caption || '')
  form.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), filename)

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`, {
    method: 'POST',
    body: form,
  })
}

async function generateAndSendPDF(chatId, product, userId, partnerId) {
  try {
    // Загружаем данные пользователя
    const users = await sbFetch(`/users?id=eq.${userId}&select=name,birth_date,birth_time,birth_place`)
    const user = users?.[0]
    if (!user) throw new Error('User not found')

    // Загружаем данные партнёра/ребёнка если нужен
    let partner = null
    if (partnerId) {
      const partners = await sbFetch(`/partners?id=eq.${partnerId}&select=name,birth_date,birth_time,birth_place`)
      partner = partners?.[0] || null
    }

    const pdfBuffer = await generatePDFReport({ product, user, partner })

    const FILENAMES = {
      synastry_quick: 'sovmestimost.pdf',
      synastry_full:  'analiz-pary.pdf',
      synastry_vip:   'vip-analiz-pary.pdf',
      solar_forecast: 'solyarnyy-prognoz.pdf',
      child_chart:    'karta-rebenka.pdf',
    }
    const CAPTIONS = {
      synastry_quick: '💕 Ваш разбор совместимости готов!',
      synastry_full:  '📖 Полный анализ пары готов!',
      synastry_vip:   '👑 VIP-анализ пары готов!',
      solar_forecast: '☀️ Солярный прогноз на год готов!',
      child_chart:    '👶 Разбор карты ребёнка готов!',
    }

    await sendDocument(chatId, pdfBuffer, FILENAMES[product] || 'report.pdf', CAPTIONS[product] || 'Ваш отчёт готов!')

    // Обновляем статус покупки
    await sbFetch(`/one_time_purchases?user_id=eq.${userId}&product_type=eq.${product}&status=eq.completed`, {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: JSON.stringify({ result_url: 'sent_via_telegram' }),
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    await sendMessage(chatId, '⚠️ Произошла ошибка при генерации отчёта. Напишите нам — разберёмся!')
  }
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
      const { purchase_id, product, user_id, partner_id } = payload

      // Обновляем статус покупки
      await sbFetch(`/one_time_purchases?id=eq.${purchase_id}`, {
        method: 'PATCH',
        prefer: 'return=minimal',
        body: JSON.stringify({ status: 'completed' }),
      })

      // Подписка — обновляем пользователя
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

      // Разовый продукт — генерируем PDF
      } else if (ONE_TIME_PRODUCTS.includes(product)) {
        await sendMessage(chatId, `⏳ Оплата получена! Составляю отчёт — это займёт 1–2 минуты...`)
        generateAndSendPDF(chatId, product, user_id, partner_id || null)
          .catch(e => console.error('PDF send error:', e))
      }
    }

    // Команда /start
    if (update.message?.text?.startsWith('/start')) {
      const chatId = update.message.chat.id
      const firstName = update.message.from?.first_name || 'друг'
      const token = process.env.TELEGRAM_BOT_TOKEN
      const appUrl = (process.env.WEBAPP_URL || 'https://astral-sudba.vercel.app').trim()

      const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          parse_mode: 'HTML',
          text:
            `✨ <b>Привет, ${firstName}!</b>\n\n` +
            `Я — <b>АстроЛичность</b>, твой персональный AI-астролог.\n\n` +
            `🔮 <b>Что я умею:</b>\n` +
            `• Натальная карта по дате и месту рождения\n` +
            `• Персональный прогноз на день, неделю и месяц\n` +
            `• Чат с астрологом — помню твою карту\n` +
            `• Совместимость с партнёром по звёздам\n\n` +
            `🎁 <b>Первые 3 дня — бесплатно</b>, полный PRO-доступ.\n\n` +
            `Нажми кнопку <b>Open</b> ниже ↓`,
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
