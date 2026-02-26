import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import NatalChart from './pages/NatalChart'
import Forecasts from './pages/Forecasts'
import Compatibility from './pages/Compatibility'
import Premium from './pages/Premium'
import EnergyDay from './pages/EnergyDay'

export default function App() {
  return (
    <BrowserRouter>
      <div className="stars-bg" />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/natal-chart" element={<NatalChart />} />
          <Route path="/forecasts" element={<Forecasts />} />
          <Route path="/compatibility" element={<Compatibility />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/energy" element={<EnergyDay />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
