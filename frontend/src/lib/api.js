export async function fetchForecast(telegramId) {
  const res = await fetch(`/api/forecast?id=${telegramId}`)
  if (!res.ok) throw new Error('Ошибка загрузки прогноза')
  return res.json()
}

export async function fetchNatalChart(telegramId) {
  const res = await fetch(`/api/natal?id=${telegramId}`)
  if (!res.ok) throw new Error('Ошибка загрузки карты')
  return res.json()
}

export async function fetchCompatibility(sign1, sign2) {
  const res = await fetch(`/api/compatibility?sign1=${encodeURIComponent(sign1)}&sign2=${encodeURIComponent(sign2)}`)
  if (!res.ok) throw new Error('Ошибка расчёта совместимости')
  return res.json()
}
