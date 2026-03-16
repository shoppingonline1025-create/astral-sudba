import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useUser } from './hooks/useUser'
import BottomNav from './components/BottomNav'
import './styles/global.css'

import Onboarding  from './screens/Onboarding'
import Home        from './screens/Home'
import NatalChart  from './screens/NatalChart'
import Chat        from './screens/Chat'
import Forecast    from './screens/Forecast'
import Synastry    from './screens/Synastry'
import Energy      from './screens/Energy'
import Shop        from './screens/Shop'
import Profile     from './screens/Profile'
import Privacy     from './screens/Privacy'

// Экраны без нижней навигации
const NO_NAV = ['/energy', '/natal', '/chat']

function AppInner() {
  const { user, setUser, loading, needOnboarding, completeOnboarding } = useUser()
  const location = useLocation()
  const showNav = user && !NO_NAV.includes(location.pathname)

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner">✨</div>
      <p>Загрузка...</p>
    </div>
  )

  if (needOnboarding) return <Onboarding onComplete={completeOnboarding} />

  return (
    <>
      <Routes>
        <Route path="/"          element={<Home       user={user} />} />
        <Route path="/natal"     element={<NatalChart user={user} />} />
        <Route path="/chat"      element={<Chat       user={user} />} />
        <Route path="/forecast"  element={<Forecast   user={user} />} />
        <Route path="/synastry"  element={<Synastry   user={user} />} />
        <Route path="/energy"    element={<Energy     user={user} />} />
        <Route path="/shop"      element={<Shop       user={user} setUser={setUser} />} />
        <Route path="/profile"   element={<Profile    user={user} setUser={setUser} />} />
        <Route path="/privacy"   element={<Privacy />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
