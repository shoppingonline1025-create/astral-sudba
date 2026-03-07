import { useState, useEffect } from 'react'
import { getUser, createUser } from '../api'

export function useUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needOnboarding, setNeedOnboarding] = useState(false)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    const telegramId = tg?.initDataUnsafe?.user?.id || 1 // fallback для dev

    tg?.ready()
    tg?.expand()
    tg?.setHeaderColor('#07060f')
    tg?.setBackgroundColor('#07060f')

    getUser(telegramId)
      .then(data => {
        if (data?.id) { setUser(data); setLoading(false) }
        else { setNeedOnboarding(true); setLoading(false) }
      })
      .catch(() => { setNeedOnboarding(true); setLoading(false) })
  }, [])

  async function completeOnboarding(formData) {
    const tg = window.Telegram?.WebApp
    const telegramId = tg?.initDataUnsafe?.user?.id || 1
    const name = tg?.initDataUnsafe?.user?.first_name || formData.name || 'Пользователь'
    const newUser = await createUser({ telegram_id: telegramId, name, ...formData })
    setUser(newUser)
    setNeedOnboarding(false)
  }

  return { user, setUser, loading, needOnboarding, completeOnboarding }
}
