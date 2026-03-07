import { useMemo } from 'react'
import { generateStars } from '../utils'

export default function StarsBg() {
  const stars = useMemo(() => generateStars(50), [])
  return (
    <div className="stars-bg">
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.left}%`,
          top: `${s.top}%`,
          width: s.size,
          height: s.size,
          '--d': `${s.duration}s`,
        }} />
      ))}
    </div>
  )
}
