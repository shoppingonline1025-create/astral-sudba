module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const key = process.env.GEMINI_API_KEY
  if (!key) return res.json({ error: 'No API key' })

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
    const data = await r.json()
    const flash = (data.models || [])
      .filter(m => m.name.includes('flash') && (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name)
    res.json({ flash_models: flash })
  } catch (e) {
    res.json({ error: e.message })
  }
}
