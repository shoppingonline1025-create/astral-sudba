// Supabase
const SB_URL = process.env.SUPABASE_URL || 'https://hkurtoonrpxnrspmuzgt.supabase.co'
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || 'sb_publishable_G3X4bzQpmaQ-GRjMRvQhhw_ft3Feab9'

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

// AI — Groq сейчас, легко переключить на Claude позже
// Чтобы переключить на Claude: заменить GROQ_MODEL на claude-haiku-4-5 и использовать Anthropic API
const GROQ_MODEL_FAST = 'llama-3.3-70b-versatile'   // для прогнозов и синастрии
const GROQ_MODEL_CHAT = 'llama-3.3-70b-versatile'   // для чата

async function groqRequest(messages, model) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: 1500 }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content.trim()
}

async function callClaude(prompt, model = GROQ_MODEL_FAST) {
  const text = await groqRequest([{ role: 'user', content: prompt }], GROQ_MODEL_FAST)
  const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
  if (!match) throw new Error('No JSON in response: ' + text.substring(0, 100))
  return JSON.parse(match[0])
}

async function callClaudeText(messages, model = GROQ_MODEL_CHAT) {
  return groqRequest(messages, GROQ_MODEL_CHAT)
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
