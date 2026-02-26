const Astronomy = require('astronomy-engine')

const ZODIAC_RU = ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы']
const PLANET_RU = {
  Sun:'Солнце ☀️', Moon:'Луна 🌙', Mercury:'Меркурий ☿',
  Venus:'Венера ♀️', Mars:'Марс ♂️', Jupiter:'Юпитер ♃', Saturn:'Сатурн ♄',
}
const ASPECT_RU = {
  conjunction:'Соединение ☌', sextile:'Секстиль ✶',
  square:'Квадрат □', trine:'Трин △', opposition:'Оппозиция ☍',
}
const ASPECT_ANGLES = { conjunction:0, sextile:60, square:90, trine:120, opposition:180 }

function getSign(lon) {
  const idx = Math.floor(((lon % 360) + 360) % 360 / 30) % 12
  const deg = ((lon % 30) + 30) % 30
  return { sign: ZODIAC_RU[idx], degree: Math.round(deg * 10) / 10 }
}

function calcPositions(date) {
  const planets = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']
  const result = {}
  for (const p of planets) {
    const lon = Astronomy.EclipticLongitude(p, date)
    const { sign, degree } = getSign(lon)
    result[p] = { lon: Math.round(lon * 100) / 100, sign, degree, name_ru: PLANET_RU[p] }
  }
  return result
}

function findAspects(natal, transits, orb = 6) {
  const aspects = []
  for (const [tk, t] of Object.entries(transits)) {
    for (const [nk, n] of Object.entries(natal)) {
      let diff = Math.abs(t.lon - n.lon)
      if (diff > 180) diff = 360 - diff
      for (const [asp, angle] of Object.entries(ASPECT_ANGLES)) {
        if (Math.abs(diff - angle) <= orb) {
          aspects.push({
            transit: PLANET_RU[tk], aspect: ASPECT_RU[asp],
            natal: PLANET_RU[nk], orb: Math.round(Math.abs(diff - angle) * 10) / 10,
          })
        }
      }
    }
  }
  return aspects.sort((a, b) => a.orb - b.orb).slice(0, 6)
}

async function geocode(city) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`, {
      headers: { 'User-Agent': 'AstralSudba/1.0' }
    })
    const data = await r.json()
    if (data.length) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {}
  return { lat: 55.7558, lon: 37.6173 }
}

const SB_URL = process.env.SUPABASE_URL || 'https://hkurtoonrpxnrspmuzgt.supabase.co'
const SB_KEY = process.env.SUPABASE_KEY || 'sb_publishable_G3X4bzQpmaQ-GRjMRvQhhw_ft3Feab9'

function sbHeaders() {
  return { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' }
}

async function sbGetUser(tgId) {
  const r = await fetch(`${SB_URL}/rest/v1/users?telegram_id=eq.${tgId}&select=*`, { headers: sbHeaders() })
  const d = await r.json()
  return d[0] || null
}

async function sbGetForecast(tgId, today) {
  const r = await fetch(`${SB_URL}/rest/v1/forecasts?telegram_id=eq.${tgId}&date=eq.${today}&select=*`, { headers: sbHeaders() })
  const d = await r.json()
  return d[0] || null
}

async function sbSaveForecast(tgId, today, content) {
  await fetch(`${SB_URL}/rest/v1/forecasts`, {
    method: 'POST',
    headers: { ...sbHeaders(), 'Prefer': 'return=minimal' },
    body: JSON.stringify({ telegram_id: tgId, date: today, content })
  })
}

async function generateForecast(user, natal, transits, aspects, today) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAOskxKqsmk718oCtgcXS1fW4yBCOy90Wo'
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(GEMINI_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const natalDesc = Object.values(natal).map(v => `  ${v.name_ru}: ${v.degree}° ${v.sign}`).join('\n')
  const aspDesc = aspects.length
    ? aspects.map(a => `  ${a.transit} ${a.aspect} натальный ${a.natal} (орб ${a.orb}°)`).join('\n')
    : '  Нет выраженных транзитов'

  const prompt = `Ты опытный астролог. Составь персональный прогноз на сегодня (${today}).

Имя: ${user.name}
Дата рождения: ${user.birthdate}, ${user.birthtime || '12:00'}, ${user.birthplace || ''}

Натальная карта:
${natalDesc}

Активные транзиты:
${aspDesc}

Луна сегодня: ${transits.Moon.sign}

Обращайся к ${user.name} лично. Пиши живо и конкретно.
Ответь ТОЛЬКО валидным JSON без markdown:
{"title":"заголовок (5-7 слов)","energy":<1-10>,"moon":"Луна в ${transits.Moon.sign}","summary":"общий прогноз (3-4 предложения)","career":"карьера (2-3 предложения)","love":"отношения (2 предложения)","health":"здоровье (1-2 предложения)","best_time":"лучшее время","advice":"совет дня (1 предложение)"}`

  try {
    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()
    if (text.includes('```')) {
      text = text.split('```')[1]
      if (text.startsWith('json')) text = text.slice(4)
    }
    return JSON.parse(text.trim())
  } catch {
    return {
      title: 'День новых возможностей', energy: 7,
      moon: `Луна в ${transits.Moon.sign}`,
      summary: `Сегодня благоприятный день для ${user.name}. Планеты поддерживают ваши начинания.`,
      career: 'Деловая активность на подъёме.',
      love: 'Открытость укрепит отношения.',
      health: 'Уделите время отдыху.',
      best_time: '12:00–16:00',
      advice: 'Доверяйте своей интуиции.'
    }
  }
}

module.exports = { calcPositions, findAspects, geocode, sbGetUser, sbGetForecast, sbSaveForecast, generateForecast }
