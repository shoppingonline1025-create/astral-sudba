import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendMessage, getChatHistory } from '../api'
import { getActivePlan } from '../utils'

const LIMITS = { free: 5, trial: 30, pro: 30, platinum: 80 }

export default function Chat({ user }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const bottomRef = useRef(null)
  const plan = getActivePlan(user)
  const limit = LIMITS[plan] || 5

  useEffect(() => {
    if (!user?.telegram_id) return
    getChatHistory(user.telegram_id)
      .then(data => setMessages(data || []))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await sendMessage(user.telegram_id, text)
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Произошла ошибка. Попробуйте ещё раз.' }])
    } finally {
      setLoading(false)
    }
  }

  const used = user?.messages_used_this_month || 0
  const atLimit = used >= limit

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 480, margin: '0 auto' }}>
      {/* Шапка */}
      <div className="screen-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <button className="back-btn" onClick={() => navigate('/')}>‹</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 700 }}>🔮 Астролог</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {used}/{limit} сообщений · {plan === 'free' ? 'бесплатно' : plan}
          </div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Сообщения */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fetching && <div className="loading-screen"><div className="spinner">⏳</div></div>}

        {!fetching && messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40, color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔮</div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Ваш личный астролог</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Задайте вопрос об отношениях, карьере или предстоящих событиях</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
          }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? 'var(--purple)' : 'var(--bg-card)',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              fontSize: 14,
              lineHeight: 1.55,
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>✨</span> Думаю...
            </div>
          </div>
        )}

        {/* Лимит исчерпан */}
        {atLimit && (
          <div className="card" style={{ textAlign: 'center', border: '1px solid rgba(147,51,234,0.4)' }}>
            <p style={{ marginBottom: 10 }}>Использованы все {limit} сообщений этого месяца</p>
            <button className="btn btn-primary" onClick={() => navigate('/shop')}>Открыть PRO →</button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Ввод */}
      {!atLimit && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, background: 'var(--bg)' }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Спросите астролога..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={loading}
          />
          <button className="btn btn-primary" style={{ width: 48, padding: 0 }}
            onClick={handleSend} disabled={loading || !input.trim()}>
            ↑
          </button>
        </div>
      )}
    </div>
  )
}
