const { getUser, sbFetch } = require('./_shared')

// Цены в Stars (1 Star ≈ $0.02 для пользователя, Telegram берёт 30% комиссию)
// Наценка +43% относительно USDT-цены чтобы получить ту же выручку
const PRICES_STARS = {
  pro:             375,  // $5 USDT → $7.15 с наценкой → ~375 Stars
  platinum:        650,  // $9 USDT → $12.86 → ~650 Stars
  pro_annual:     3500,  // $48 USDT → $68.6 → ~3500 Stars
  synastry_quick:  290,  // $4 USDT → $5.72 → ~290 Stars
  synastry_full:   650,  // $9 USDT → $12.86 → ~650 Stars
  synastry_vip:   1300,  // $18 USDT → $25.72 → ~1300 Stars
  solar_forecast:  375,  // $5 USDT → $7.15 → ~375 Stars
  child_chart:     500,  // $7 USDT → $10 → ~500 Stars
}

const PRICES_USDT = {
  pro: 5, platinum: 9, pro_annual: 48,
  synastry_quick: 4, synastry_full: 9, synastry_vip: 18,
  solar_forecast: 5, child_chart: 7,
}

const PLAN_DURATION_DAYS = { pro: 30, platinum: 30, pro_annual: 365 }

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { telegram_id, product, product_type, method, partner_id } = req.body
    if (!telegram_id || !product) return res.status(400).json({ error: 'telegram_id, product required' })

    const user = await getUser(telegram_id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Запись о покупке
    const purchase = await sbFetch('/one_time_purchases', {
      method: 'POST',
      prefer: 'return=representation',
      body: JSON.stringify({
        user_id: user.id,
        product_type: product,
        partner_id: partner_id || null,
        payment_method: method || 'stars',
        amount_usd: PRICES_USDT[product] || 0,
        status: 'pending',
      }),
    })
    const purchaseId = purchase?.[0]?.id

    if (method === 'crypto') {
      // Cryptomus
      const CRYPTOMUS_KEY = process.env.CRYPTOMUS_API_KEY
      const CRYPTOMUS_MERCHANT = process.env.CRYPTOMUS_MERCHANT_ID
      if (!CRYPTOMUS_KEY || !CRYPTOMUS_MERCHANT) {
        return res.status(500).json({ error: 'Cryptomus не настроен' })
      }
      const cryptoRes = await fetch('https://api.cryptomus.com/v1/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'merchant': CRYPTOMUS_MERCHANT,
          'sign': require('crypto').createHash('md5').update(
            Buffer.from(JSON.stringify({ amount: String(PRICES_USDT[product]), currency: 'USDT', order_id: String(purchaseId) })).toString('base64') + CRYPTOMUS_KEY
          ).digest('hex'),
        },
        body: JSON.stringify({
          amount: String(PRICES_USDT[product]),
          currency: 'USDT',
          order_id: String(purchaseId),
          url_callback: `${process.env.VERCEL_URL || ''}/api/payment-webhook`,
        }),
      })
      const cryptoData = await cryptoRes.json()
      return res.json({ payment_url: cryptoData.result?.url })
    }

    // Telegram Stars invoice
    const starsAmount = PRICES_STARS[product]
    if (!starsAmount) return res.status(400).json({ error: 'Unknown product' })

    const productNames = {
      pro: 'PRO подписка на 30 дней',
      platinum: 'Платинум подписка на 30 дней',
      pro_annual: 'PRO подписка на год',
      synastry_quick: 'Быстрый разбор совместимости',
      synastry_full: 'Полный PDF-анализ пары',
      synastry_vip: 'VIP-анализ пары',
      solar_forecast: 'Солярный прогноз на год',
      child_chart: 'Разбор карты ребёнка',
    }

    const invoiceRes = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: productNames[product] || product,
        description: 'АстроЛичность — персональный AI-астролог',
        payload: JSON.stringify({ purchase_id: purchaseId, product, user_id: user.id, partner_id: partner_id || null }),
        currency: 'XTR',
        prices: [{ label: productNames[product], amount: starsAmount }],
      }),
    })
    const invoiceData = await invoiceRes.json()
    return res.json({ invoice_link: invoiceData.result })

  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
