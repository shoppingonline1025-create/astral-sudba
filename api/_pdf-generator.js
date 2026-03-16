const PDFDocument = require('pdfkit')
const fs = require('fs')
const Anthropic = require('@anthropic-ai/sdk')

const HAIKU = 'claude-haiku-4-5-20251001'
const SONNET = 'claude-sonnet-4-6'

async function claudeReport(prompt, model = HAIKU) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model,
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.content[0].text.trim()
}

const FONT_REGULAR_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf'
const FONT_BOLD_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans_Condensed-Bold.ttf'
const FONT_REGULAR_PATH = '/tmp/NotoSans-Regular.ttf'
const FONT_BOLD_PATH = '/tmp/NotoSans-Bold.ttf'

// Простые рабочие шрифты с Cyrillic поддержкой
const FONT_URL_REGULAR = 'https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip'

async function fetchFont(url, path) {
  if (fs.existsSync(path)) return
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`)
  const buf = await res.arrayBuffer()
  fs.writeFileSync(path, Buffer.from(buf))
}

async function ensureFonts() {
  const NOTO_REGULAR = 'https://github.com/notofonts/latin-greek-cyrillic/raw/main/fonts/NotoSans/unhinted/ttf/NotoSans-Regular.ttf'
  const NOTO_BOLD = 'https://github.com/notofonts/latin-greek-cyrillic/raw/main/fonts/NotoSans/unhinted/ttf/NotoSans-Bold.ttf'
  await Promise.all([
    fetchFont(NOTO_REGULAR, FONT_REGULAR_PATH),
    fetchFont(NOTO_BOLD, FONT_BOLD_PATH),
  ])
}

// Создаёт PDF из массива секций и возвращает Buffer
async function buildPDF(title, subtitle, sections) {
  await ensureFonts()

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 55, size: 'A4' })
    const chunks = []

    doc.registerFont('Regular', FONT_REGULAR_PATH)
    doc.registerFont('Bold', FONT_BOLD_PATH)

    doc.on('data', c => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // ── Шапка ──────────────────────────────────────────────
    doc.font('Bold').fontSize(22).fillColor('#9333ea').text('АстроЛичность', { align: 'center' })
    doc.moveDown(0.3)
    doc.font('Bold').fontSize(16).fillColor('#1a1a2e').text(title, { align: 'center' })
    if (subtitle) {
      doc.moveDown(0.2)
      doc.font('Regular').fontSize(11).fillColor('#555555').text(subtitle, { align: 'center' })
    }
    doc.moveDown(0.4)
    doc.font('Regular').fontSize(9).fillColor('#aaaaaa')
      .text(new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }), { align: 'center' })
    doc.moveDown(0.8)

    // Горизонтальная линия
    doc.moveTo(55, doc.y).lineTo(540, doc.y).strokeColor('#9333ea').lineWidth(1).stroke()
    doc.moveDown(1)

    // ── Секции ─────────────────────────────────────────────
    sections.forEach(section => {
      if (doc.y > 750) doc.addPage()

      if (section.heading) {
        doc.font('Bold').fontSize(13).fillColor('#7c3aed').text(section.heading)
        doc.moveDown(0.3)
      }
      doc.font('Regular').fontSize(11).fillColor('#1a1a2e')
        .text(section.text, { lineGap: 3, paragraphGap: 4 })
      doc.moveDown(1)
    })

    // ── Подвал ─────────────────────────────────────────────
    doc.font('Regular').fontSize(8).fillColor('#aaaaaa')
      .text('АстроЛичность — персональный AI-астролог. Прогнозы носят развлекательный характер.', { align: 'center' })

    doc.end()
  })
}

// Парсит ответ Claude (ожидаем секции вида "### Заголовок\nТекст")
function parseClaudeResponse(text) {
  const sections = []
  const parts = text.split(/\n#{2,3}\s+/)
  parts.forEach((part, i) => {
    const lines = part.trim().split('\n')
    if (i === 0) {
      if (lines.join('').trim()) sections.push({ text: lines.join('\n').trim() })
    } else {
      const heading = lines[0].trim()
      const body = lines.slice(1).join('\n').trim()
      if (body) sections.push({ heading, text: body })
    }
  })
  return sections
}

// ── Промпты для каждого продукта ───────────────────────────

function buildSynastryQuickPrompt(user, partner) {
  return `Ты опытный астролог. Сделай подробный анализ совместимости пары (~1500 слов).

ПОЛЬЗОВАТЕЛЬ: ${user.name}, дата рождения: ${user.birth_date}, время: ${user.birth_time || 'неизвестно'}, место: ${user.birth_place}
ПАРТНЁР: ${partner.name}, дата рождения: ${partner.birth_date}, время: ${partner.birth_time || 'неизвестно'}, место: ${partner.birth_place || 'неизвестно'}

Структура ответа (используй ### для заголовков):
### Общая совместимость
### Эмоциональная связь
### Любовь и притяжение
### Общение и понимание
### Сложности и вызовы
### Совет астролога

Пиши живо, тепло, с конкретными астрологическими наблюдениями. Не используй markdown кроме заголовков ###.`
}

function buildSynastryFullPrompt(user, partner) {
  return `Ты опытный астролог. Сделай полный развёрнутый анализ совместимости пары (~4000 слов).

ПОЛЬЗОВАТЕЛЬ: ${user.name}, дата рождения: ${user.birth_date}, время: ${user.birth_time || 'неизвестно'}, место: ${user.birth_place}
ПАРТНЁР: ${partner.name}, дата рождения: ${partner.birth_date}, время: ${partner.birth_time || 'неизвестно'}, место: ${partner.birth_place || 'неизвестно'}

Структура ответа (используй ### для заголовков):
### Астрологический портрет пары
### Эмоциональная совместимость
### Любовь и физическое притяжение
### Общение и интеллектуальная связь
### Ценности и жизненные цели
### Финансы и быт
### Сложности и вызовы
### Кармическая связь
### Прогноз отношений на год
### Главный совет астролога

Пиши подробно, профессионально, с теплотой. Не используй markdown кроме заголовков ###.`
}

function buildSolarForecastPrompt(user) {
  const year = new Date().getFullYear()
  return `Ты опытный астролог. Составь солярный прогноз на ${year} год (~3000 слов).

ПОЛЬЗОВАТЕЛЬ: ${user.name}, дата рождения: ${user.birth_date}, время: ${user.birth_time || 'неизвестно'}, место: ${user.birth_place}

Структура ответа (используй ### для заголовков):
### Главная тема ${year} года
### Январь–Март: начало года
### Апрель–Июнь: весенний период
### Июль–Сентябрь: летний период
### Октябрь–Декабрь: завершение года
### Любовь и отношения в ${year}
### Карьера и финансы в ${year}
### Здоровье и энергия
### Главный совет на год

Пиши конкретно, тепло, с астрологическими обоснованиями. Не используй markdown кроме заголовков ###.`
}

function buildChildChartPrompt(user, child) {
  return `Ты опытный астролог. Составь подробный разбор натальной карты ребёнка (~2000 слов).

РЕБЁНОК: ${child.name}, дата рождения: ${child.birth_date}, время: ${child.birth_time || 'неизвестно'}, место: ${child.birth_place || 'неизвестно'}
РОДИТЕЛЬ: ${user.name}

Структура ответа (используй ### для заголовков):
### Характер и личность ребёнка
### Таланты и сильные стороны
### Сложности и зоны роста
### Как учится и развивается
### Что важно в воспитании
### Отношения с родителями и близкими
### Совет для родителя

Пиши тепло, с любовью к ребёнку, давай конкретные рекомендации. Не используй markdown кроме заголовков ###.`
}

// ── Главная функция генерации ───────────────────────────────

async function generatePDFReport({ product, user, partner }) {
  let prompt, title, subtitle

  switch (product) {
    case 'synastry_quick':
    case 'synastry_full':
    case 'synastry_vip':
      if (!partner) throw new Error('partner required for synastry')
      prompt = product === 'synastry_quick'
        ? buildSynastryQuickPrompt(user, partner)
        : buildSynastryFullPrompt(user, partner)
      title = product === 'synastry_quick' ? 'Разбор совместимости' : 'Полный анализ пары'
      subtitle = `${user.name} и ${partner.name}`
      break

    case 'solar_forecast':
      prompt = buildSolarForecastPrompt(user)
      title = `Солярный прогноз на ${new Date().getFullYear()} год`
      subtitle = user.name
      break

    case 'child_chart':
      if (!partner) throw new Error('child data required for child_chart')
      prompt = buildChildChartPrompt(user, partner)
      title = 'Разбор карты ребёнка'
      subtitle = partner.name
      break

    default:
      throw new Error(`Unknown product: ${product}`)
  }

  const model = (product === 'synastry_full' || product === 'synastry_vip') ? SONNET : HAIKU
  const rawText = await claudeReport(prompt, model)
  const sections = parseClaudeResponse(rawText)
  return await buildPDF(title, subtitle, sections)
}

module.exports = { generatePDFReport }
