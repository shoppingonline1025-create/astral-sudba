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
    let lon
    if (p === 'Sun') {
      lon = Astronomy.SunPosition(date).elon
    } else {
      lon = Astronomy.EclipticLongitude(p, date)
    }
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

async function callGemini(prompt) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const text = data.candidates[0].content.parts[0].text.trim()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON: ' + text.substring(0, 100))
  return JSON.parse(match[0])
}

async function generateForecast(user, natal, transits, aspects, today) {

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
    return await callGemini(prompt)
  } catch (e) {
    console.error('FORECAST GEMINI ERROR:', e.message)
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

const ELEMENTS = {
  'Овен':'Огонь','Лев':'Огонь','Стрелец':'Огонь',
  'Телец':'Земля','Дева':'Земля','Козерог':'Земля',
  'Близнецы':'Воздух','Весы':'Воздух','Водолей':'Воздух',
  'Рак':'Вода','Скорпион':'Вода','Рыбы':'Вода',
}

const ELEMENT_COMPAT = {
  'Воздух-Воздух':90,'Огонь-Огонь':88,'Вода-Вода':88,
  'Земля-Земля':85,'Огонь-Воздух':85,'Земля-Вода':80,
  'Воздух-Вода':70,'Огонь-Земля':58,'Огонь-Вода':55,
  'Воздух-Земля':62,
}

function getCompatScore(sign1, sign2) {
  const e1 = ELEMENTS[sign1], e2 = ELEMENTS[sign2]
  const key = [e1, e2].sort().join('-')
  const base = ELEMENT_COMPAT[key] || 70

  const idx1 = ZODIAC_RU.indexOf(sign1), idx2 = ZODIAC_RU.indexOf(sign2)
  const diff = Math.min(Math.abs(idx1 - idx2), 12 - Math.abs(idx1 - idx2))
  const bonus = { 0:0, 1:-5, 2:8, 3:-8, 4:12, 5:-3, 6:3 }[diff] || 0

  return Math.min(99, Math.max(40, base + bonus))
}

async function generateCompatibility(sign1, sign2) {
  const score = getCompatScore(sign1, sign2)
  const e1 = ELEMENTS[sign1], e2 = ELEMENTS[sign2]

  const prompt = `Ты опытный астролог. Опиши совместимость ${sign1} (${e1}) и ${sign2} (${e2}). Индекс совместимости: ${score}%.
Ответь ТОЛЬКО валидным JSON без markdown:
{"summary":"общее описание пары (2-3 предложения)","strengths":"главная сильная сторона этого союза (1 предложение)","challenges":"главная трудность (1 предложение)","advice":"совет для этой пары (1 предложение)"}`

  try {
    const ai = await callGemini(prompt)
    return { score, elements: `${e1} + ${e2}`, ...ai }
  } catch (e) {
    console.error('COMPAT GEMINI ERROR:', e.message)
    return {
      score, elements: `${e1} + ${e2}`,
      summary: `Союз ${sign1} и ${sign2} полон потенциала. Каждая пара уникальна, и звёзды лишь указывают путь.`,
      strengths: 'Взаимное притяжение и интерес друг к другу.',
      challenges: 'Необходимость находить компромиссы.',
      advice: 'Уважайте различия друг друга — в них ваша сила.'
    }
  }
}

module.exports = { calcPositions, findAspects, geocode, sbGetUser, sbGetForecast, sbSaveForecast, generateForecast, generateCompatibility }
