import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import NatalChart from './pages/NatalChart'
import Forecasts from './pages/Forecasts'
import Compatibility from './pages/Compatibility'
import Premium from './pages/Premium'
import EnergyDay from './pages/EnergyDay'
import WeekForecast from './pages/WeekForecast'
import Onboarding from './pages/Onboarding'
import { getUser, createUser } from './lib/supabase'

export default function App() {
  const [user, setUser] = useState(null)       // данные из БД
  const [tgUser, setTgUser] = useState(null)   // данные из Telegram
  const [loading, setLoading] = useState(true)
  const [needOnboarding, setNeedOnboarding] = useState(false)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      tg.setHeaderColor('#0d0020')
      tg.setBackgroundColor('#0d0020')
    }

    const tgUserData = tg?.initDataUnsafe?.user || {
      id: 0,
      first_name: 'Пользователь',
      username: 'user',
    }
    setTgUser(tgUserData)
    loadUser(tgUserData)
  }, [])

  async function loadUser(tgUserData) {
    const dbUser = await getUser(tgUserData.id)
    if (!dbUser || !dbUser.birthdate) {
      setNeedOnboarding(true)
    } else {
      setUser(dbUser)
    }
    setLoading(false)
  }

  async function handleOnboardingComplete(form) {
    const newUser = await createUser({
      telegram_id: tgUser.id,
      name: form.name,
      username: tgUser.username || '',
      avatar_url: tgUser.photo_url || '',
      birthdate: form.birthdate,
      birthtime: form.birthtime,
      birthplace: form.birthplace,
    })
    setUser(newUser)
    setNeedOnboarding(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 16 }}>
        <div className="stars-bg" />
        <span style={{ fontSize: 48, position: 'relative', zIndex: 1 }}>✨</span>
        <p style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.7)', fontFamily: 'Nunito' }}>Загружаем вашу карту...</p>
      </div>
    )
  }

  if (needOnboarding) {
    return <Onboarding telegramUser={tgUser} onComplete={handleOnboardingComplete} />
  }

  return (
    <BrowserRouter>
      <div className="stars-bg" />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/natal-chart" element={<NatalChart user={user} />} />
          <Route path="/forecasts" element={<Forecasts user={user} />} />
          <Route path="/compatibility" element={<Compatibility user={user} />} />
          <Route path="/premium" element={<Premium user={user} />} />
          <Route path="/energy" element={<EnergyDay user={user} />} />
          <Route path="/week-forecast" element={<WeekForecast user={user} />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
