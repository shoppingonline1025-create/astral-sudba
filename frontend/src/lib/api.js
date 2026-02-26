// API работает на том же Vercel домене — просто /api/...
export async function fetchForecast(telegramId) {
  const res = await fetch(`/api/forecast/${telegramId}`)
  if (!res.ok) throw new Error('Ошибка загрузки прогноза')
  return res.json()
}

export async function fetchNatalChart(telegramId) {
  const res = await fetch(`/api/natal/${telegramId}`)
  if (!res.ok) throw new Error('Ошибка загрузки карты')
  return res.json()
}
