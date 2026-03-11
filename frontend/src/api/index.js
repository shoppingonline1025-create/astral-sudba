const BASE = import.meta.env.VITE_API_URL || ''

async function req(path, options = {}) {
  const res = await fetch(BASE + path, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса')
  return data
}

// Пользователь
export const getUser = (tgId) => req(`/api/user?id=${tgId}`)
export const createUser = (body) => req('/api/user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const deleteUser = (tgId) => req(`/api/user?id=${tgId}`, { method: 'DELETE' })

// Натальная карта
export const getNatal = (tgId) => req(`/api/natal?id=${tgId}`)

// Прогнозы
export const getForecast = (tgId, period = 'day') => req(`/api/forecast?id=${tgId}&period=${period}`)
export const clearForecastCache = (tgId) => req(`/api/forecast?id=${tgId}`, { method: 'DELETE' })

// Синастрия
export const getCompatibility = (tgId, partnerId) => req(`/api/synastry?id=${tgId}&partner=${partnerId}`)
export const addPartner = (tgId, body) => req(`/api/synastry?id=${tgId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

// Чат с астрологом
export const sendMessage = (tgId, message) => req('/api/astrologer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tgId, message }) })
export const getChatHistory = (tgId) => req(`/api/astrologer?id=${tgId}`)

// Доступ
export const checkAccess = (tgId, feature) => req(`/api/access?id=${tgId}&feature=${feature}`)

// Оплата
export const createPayment = (body) => req('/api/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
