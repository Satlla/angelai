'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/admin')
      } else {
        setError('Contraseña incorrecta')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#07080F', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: '360px',
        background: '#0C0D16', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px', padding: '36px 28px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #B44FFF, #7B6FFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '22px', fontWeight: 800, color: 'white',
          }}>A</div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>Admin</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoFocus
            style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${error ? 'rgba(255,107,107,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '12px', color: 'white', padding: '14px 16px', fontSize: '15px',
              fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
            }}
          />
          {error && <p style={{ fontSize: '13px', color: '#FF6B6B', textAlign: 'center' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              background: '#B44FFF', border: 'none', borderRadius: '12px', color: 'white',
              fontWeight: 700, fontSize: '15px', fontFamily: 'inherit', padding: '14px',
              cursor: loading || !password ? 'not-allowed' : 'pointer', opacity: loading || !password ? 0.5 : 1,
            }}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
