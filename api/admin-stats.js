const { sbFetch } = require('./_shared')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Простая защита — секретный ключ
  const secret = req.query.key
  if (process.env.ADMIN_SECRET && secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const [users, chats, purchases, forecasts] = await Promise.all([
      sbFetch('/users?select=id,name,telegram_id,subscription_status,trial_ends_at,subscription_expires_at,messages_used_this_month,created_at&order=created_at.desc&limit=1000'),
      sbFetch('/chat_history?select=user_id,created_at&order=created_at.desc&limit=1000'),
      sbFetch('/one_time_purchases?select=user_id,product_type,status,amount_usd,purchased_at&order=purchased_at.desc&limit=100'),
      sbFetch('/forecasts_cache?select=user_id,period,forecast_date&limit=1000'),
    ])

    const now = Date.now()

    // Подсчёт по тарифам
    const planCounts = { free: 0, trial: 0, pro: 0, platinum: 0, expired: 0 }
    for (const u of users) {
      const trialActive = u.trial_ends_at && new Date(u.trial_ends_at).getTime() > now
      const subActive = u.subscription_expires_at && new Date(u.subscription_expires_at).getTime() > now
      if (trialActive) planCounts.trial++
      else if (subActive) planCounts[u.subscription_status] = (planCounts[u.subscription_status] || 0) + 1
      else planCounts.free++
    }

    // Новые пользователи за последние 7 и 30 дней
    const day7 = now - 7 * 86400000
    const day30 = now - 30 * 86400000
    const newLast7 = users.filter(u => new Date(u.created_at).getTime() > day7).length
    const newLast30 = users.filter(u => new Date(u.created_at).getTime() > day30).length

    // Активные в чате за 7 дней (уникальные user_id)
    const activeChatterIds = new Set(
      chats.filter(c => new Date(c.created_at).getTime() > day7).map(c => c.user_id)
    )

    // Выручка по покупкам
    const completedPurchases = purchases.filter(p => p.status === 'completed')
    const totalRevenue = completedPurchases.reduce((sum, p) => sum + (p.amount_usd || 0), 0)

    // Популярные продукты
    const productCounts = {}
    for (const p of completedPurchases) {
      productCounts[p.product_type] = (productCounts[p.product_type] || 0) + 1
    }

    // Топ пользователей по сообщениям
    const topUsers = [...users]
      .sort((a, b) => (b.messages_used_this_month || 0) - (a.messages_used_this_month || 0))
      .slice(0, 10)
      .map(u => ({
        name: u.name,
        telegram_id: u.telegram_id,
        messages: u.messages_used_this_month || 0,
        plan: u.subscription_status,
      }))

    res.json({
      // Общее
      total_users: users.length,
      new_last_7_days: newLast7,
      new_last_30_days: newLast30,

      // По тарифам
      plans: planCounts,

      // Активность
      chat_active_last_7_days: activeChatterIds.size,
      total_chat_messages: chats.length,
      forecasts_generated: forecasts.length,

      // Монетизация
      total_purchases: completedPurchases.length,
      total_revenue_usd: Math.round(totalRevenue * 100) / 100,
      products: productCounts,

      // Топ по сообщениям
      top_users_by_messages: topUsers,

      // Последние 5 пользователей
      recent_users: users.slice(0, 5).map(u => ({
        name: u.name,
        telegram_id: u.telegram_id,
        created_at: u.created_at,
        plan: u.subscription_status,
      })),
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
