// Знаки зодиака
export const SIGNS = ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы']

export function getZodiacSign(day, month) {
  const dates = [21,20,21,21,22,22,23,24,24,24,23,22]
  return SIGNS[day < dates[month - 1] ? (month + 10) % 12 : (month - 1)]
}

// Форматирование даты
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// localStorage с TTL
export function lsGet(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { value, expires } = JSON.parse(raw)
    if (expires && Date.now() > expires) { localStorage.removeItem(key); return null }
    return value
  } catch { return null }
}

export function lsSet(key, value, ttlMs = 0) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, expires: ttlMs ? Date.now() + ttlMs : null }))
  } catch {}
}

export function lsClear(prefix) {
  Object.keys(localStorage).forEach(k => { if (k.startsWith(prefix)) localStorage.removeItem(k) })
}

// Энергия → цвет
export function energyColor(val) {
  if (val >= 8) return '#4ade80'
  if (val >= 5) return '#f0d080'
  return '#f87171'
}

// Планировщик: активный тариф
export function getActivePlan(user) {
  if (!user) return 'free'
  const now = Date.now()
  if (user.trial_ends_at && new Date(user.trial_ends_at).getTime() > now) return 'trial'
  if (user.subscription_expires_at && new Date(user.subscription_expires_at).getTime() > now) {
    return user.subscription_status || 'free'
  }
  return 'free'
}

// Заглушка для звёздного фона
export function generateStars(count = 60) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 3 + 2,
  }))
}
