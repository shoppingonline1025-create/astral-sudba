const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://astral-sudba-backend.onrender.com'

export async function fetchForecast(telegramId) {
  const res = await fetch(`${BACKEND_URL}/api/forecast/${telegramId}`)
  if (!res.ok) throw new Error('Ошибка загрузки прогноза')
  return res.json()
}

export async function fetchNatalChart(telegramId) {
  const res = await fetch(`${BACKEND_URL}/api/natal-chart/${telegramId}`)
  if (!res.ok) throw new Error('Ошибка загрузки карты')
  return res.json()
}
