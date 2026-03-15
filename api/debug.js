module.exports = async (req, res) => {
  res.json({
    has_bot_token: !!process.env.TELEGRAM_BOT_TOKEN,
    has_anthropic: !!process.env.ANTHROPIC_API_KEY,
    has_webapp_url: !!process.env.WEBAPP_URL,
    webapp_url: process.env.WEBAPP_URL || 'NOT SET',
    token_prefix: process.env.TELEGRAM_BOT_TOKEN?.substring(0, 10) || 'NOT SET',
  })
}
