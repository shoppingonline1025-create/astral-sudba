// Supabase
const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SB_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || '',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase: ${res.status} ${err}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function getUser(telegramId) {
  const rows = await sbFetch(`/users?telegram_id=eq.${telegramId}&limit=1`)
  return rows?.[0] || null
}

async function getActivePlan(user) {
  if (!user) return 'free'
  const now = Date.now()
  if (user.trial_ends_at && new Date(user.trial_ends_at).getTime() > now) return 'trial'
  if (user.subscription_expires_at && new Date(user.subscription_expires_at).getTime() > now) {
    return user.subscription_status || 'free'
  }
  return 'free'
}

// Claude API
async function callClaude(prompt, model = 'claude-haiku-4-5-20251001') {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const text = data.content[0].text.trim()
  const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
  if (!match) throw new Error('No JSON in response: ' + text.substring(0, 100))
  return JSON.parse(match[0])
}

async function callClaudeText(messages, model = 'claude-haiku-4-5-20251001') {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: 1024, messages }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content[0].text.trim()
}

// Астрорасчёты (astronomy-engine)
const Astronomy = require('astronomy-engine')

const SIGNS = ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы']
const MOON_DAYS_RU = ['Нов','','','','','','','','','','','','','','','','','','','','','','','','','','','','','']

function getLongitude(body, date) {
  const ec = Astronomy.EclipticLongitude(body, date)
  return ((ec % 360) + 360) % 360
}

function signFromLong(lon) {
  return SIGNS[Math.floor(lon / 30)]
}

function moonDay(date) {
  const newMoon = Astronomy.SearchMoonPhase(0, new Date(date.getTime() - 30 * 86400000), 35)
  const diffDays = (date - newMoon.date) / 86400000
  return Math.floor(diffDays) + 1
}

function calcPlanets(date) {
  const planets = {}
  const bodies = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto']
  for (const b of bodies) {
    try {
      const lon = getLongitude(b, date)
      planets[b] = { sign: signFromLong(lon), degree: lon % 30, longitude: lon }
    } catch {}
  }
  return planets
}

module.exports = { sbFetch, getUser, getActivePlan, callClaude, callClaudeText, calcPlanets, signFromLong, moonDay, SIGNS }
