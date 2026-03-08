'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const RANKS = [
  { name: 'Bronce', range: '0–200', color: '#CD7F32' },
  { name: 'Plata', range: '200–400', color: '#C0C0C0' },
  { name: 'Oro', range: '400–600', color: '#FFD700' },
  { name: 'Platino', range: '600–800', color: '#E5E4E2' },
  { name: 'Diamante', range: '800–950', color: '#00D9F5' },
  { name: 'Leyenda', range: '950–1000', color: '#B44FFF' },
]

const STATS = [
  { value: '10.000+', label: 'usuarios activos' },
  { value: '98%', label: 'satisfacción' },
  { value: '15 días', label: 'para ver resultados' },
]

export default function Landing() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Email no autorizado')
        setLoading(false)
        return
      }

      router.push(data.hasProfile ? '/dashboard' : '/onboarding')
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', position: 'relative' }}>

      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(123,111,255,0.07) 0%, transparent 65%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '0',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(0,217,245,0.04) 0%, transparent 70%)',
        }} />
      </div>

      {/* NAV */}
      <nav style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '480px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
      }}>
        <Logo />
        <div style={{
          fontSize: '10px',
          letterSpacing: '2px',
          color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}>
          Beta
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        position: 'relative',
        zIndex: 5,
        maxWidth: '480px',
        margin: '0 auto',
        padding: '56px 24px 48px',
      }}>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          background: 'rgba(180,79,255,0.08)',
          border: '1px solid rgba(180,79,255,0.2)',
          borderRadius: '100px',
          padding: '5px 14px',
          marginBottom: '28px',
        }}>
          <span style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: '#B44FFF',
            display: 'inline-block',
            boxShadow: '0 0 6px #B44FFF',
          }} />
          <span style={{
            fontSize: '11px',
            letterSpacing: '1.5px',
            color: 'rgba(180,79,255,0.9)',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            Nutrición personalizada
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 9vw, 52px)',
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: '-2px',
          marginBottom: '20px',
        }}>
          Tu cuerpo.<br />
          <span className="gradient-text">Tu plan.</span>
        </h1>

        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.65,
          marginBottom: '40px',
          maxWidth: '360px',
        }}>
          Análisis corporal con IA. Dieta y entrenamiento que evolucionan contigo cada 15 días.
        </p>

        {/* Email form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '12px' }}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              style={{ fontSize: '16px', padding: '16px 18px' }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '15px' }}
          >
            {loading ? 'Accediendo...' : 'Comenzar'}
          </button>
          {error && (
            <p style={{
              color: '#FF6B6B',
              fontSize: '13px',
              marginTop: '10px',
              textAlign: 'center',
            }}>
              {error}
            </p>
          )}
        </form>

        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.18)',
          textAlign: 'center',
          letterSpacing: '0.2px',
        }}>
          Acceso privado · Sin tarjeta · Cancela cuando quieras
        </p>
      </section>

      {/* STATS */}
      <section style={{
        position: 'relative',
        zIndex: 5,
        maxWidth: '480px',
        margin: '0 auto',
        padding: '0 24px 56px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              background: '#0C0D16',
              padding: '20px 16px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '22px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                marginBottom: '4px',
                color: 'white',
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.28)',
                letterSpacing: '0.2px',
                lineHeight: 1.4,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RANKS ROW */}
      <section style={{
        position: 'relative',
        zIndex: 5,
        maxWidth: '480px',
        margin: '0 auto',
        padding: '0 24px 64px',
      }}>
        <p style={{
          fontSize: '11px',
          letterSpacing: '2px',
          color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: '16px',
        }}>
          Sistema de rangos
        </p>
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none' as const,
        }}>
          {RANKS.map(r => (
            <div key={r.name} style={{
              flexShrink: 0,
              background: '#0C0D16',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              padding: '10px 14px',
              textAlign: 'center',
              minWidth: '80px',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: r.color,
                margin: '0 auto 8px',
                boxShadow: `0 0 8px ${r.color}60`,
              }} />
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: r.color,
                letterSpacing: '0.5px',
                marginBottom: '2px',
              }}>
                {r.name}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.2)',
              }}>
                {r.range}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        position: 'relative',
        zIndex: 5,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '24px',
        textAlign: 'center',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.15)',
        letterSpacing: '0.3px',
      }}>
        © 2025 AngelAI · Todos los derechos reservados
      </footer>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg width="30" height="35" viewBox="0 0 36 42" fill="none">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B44FFF" />
            <stop offset="100%" stopColor="#00D9F5" />
          </linearGradient>
        </defs>
        <polygon
          points="18,2 34,11 34,31 18,40 2,31 2,11"
          fill="rgba(180,79,255,0.08)"
          stroke="url(#logoGrad)"
          strokeWidth="1.5"
        />
        <line x1="11" y1="30" x2="15" y2="14" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="25" y1="30" x2="21" y2="14" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12.5" y1="23" x2="23.5" y2="23" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div>
        <span style={{ fontSize: '18px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>ANGEL</span>
        <span style={{ fontSize: '18px', fontWeight: 800, background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
      </div>
    </div>
  )
}
