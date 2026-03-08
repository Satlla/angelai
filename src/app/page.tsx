'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FEATURES = [
  { icon: '🧠', title: 'IA de última generación', desc: 'Claude AI analiza tu cuerpo con precisión científica y genera un plan único para ti.' },
  { icon: '📸', title: 'Análisis visual corporal', desc: 'Sube tus fotos y la IA detecta composición corporal, distribución de grasa y progreso real.' },
  { icon: '📊', title: 'Body Score personal', desc: 'Un número del 0 al 1000 que evoluciona contigo. Tu progreso, siempre visible.' },
  { icon: '🔄', title: 'Revisión cada 15 días', desc: 'Tu plan se actualiza automáticamente según tus resultados. Sin estancamientos.' },
  { icon: '📄', title: 'PDF profesional', desc: 'Recibe tu dieta completa en formato PDF diseñado por nutricionistas.' },
  { icon: '🏆', title: 'Logros y rankings', desc: 'Desbloquea badges y sube de Bronce a Leyenda. La transformación como un juego.' },
]

const RANKS = [
  { name: 'BRONCE', range: '0–200', color: '#CD7F32' },
  { name: 'PLATA', range: '200–400', color: '#C0C0C0' },
  { name: 'ORO', range: '400–600', color: '#FFD700' },
  { name: 'PLATINO', range: '600–800', color: '#E5E4E2' },
  { name: 'DIAMANTE', range: '800–950', color: '#00D9F5' },
  { name: 'LEYENDA', range: '950–1000', color: '#B44FFF' },
]

export default function Landing() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [particles, setParticles] = useState<{ id: number; x: number; size: number; duration: number; delay: number; color: string }[]>([])
  const router = useRouter()

  useEffect(() => {
    const p = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 15,
      color: Math.random() > 0.5 ? 'rgba(180,79,255,0.4)' : 'rgba(0,217,245,0.4)',
    }))
    setParticles(p)
  }, [])

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
    <div style={{ minHeight: '100vh', background: '#07080F', position: 'relative', overflow: 'hidden' }}>

      {/* Fondo */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '600px',
          background: 'radial-gradient(ellipse, rgba(123,111,255,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%',
          width: '400px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(0,217,245,0.06) 0%, transparent 70%)',
        }} />
        {particles.map(p => (
          <div key={p.id} className="particle" style={{
            left: `${p.x}%`, width: `${p.size}px`, height: `${p.size}px`,
            background: p.color, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
          }} />
        ))}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#7B6FFF" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      {/* NAV */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(180,79,255,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="36" height="42" viewBox="0 0 36 42">
            <defs>
              <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B44FFF"/>
                <stop offset="100%" stopColor="#00D9F5"/>
              </linearGradient>
            </defs>
            <polygon points="18,2 34,11 34,31 18,40 2,31 2,11"
              fill="rgba(180,79,255,0.1)" stroke="url(#hexGrad)" strokeWidth="1.5"/>
            <line x1="11" y1="30" x2="15" y2="14" stroke="url(#hexGrad)" strokeWidth="3" strokeLinecap="round"/>
            <line x1="25" y1="30" x2="21" y2="14" stroke="url(#hexGrad)" strokeWidth="3" strokeLinecap="round"/>
            <line x1="12.5" y1="23" x2="23.5" y2="23" stroke="url(#hexGrad)" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div>
            <span style={{ fontSize: '22px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>ANGEL</span>
            <span style={{ fontSize: '22px', fontWeight: 900, background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
          </div>
        </div>
        <div style={{ fontSize: '11px', letterSpacing: '3px', color: 'rgba(160,160,176,0.5)', textTransform: 'uppercase' }}>
          AI-Powered Nutrition
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', zIndex: 5, maxWidth: '900px', margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(180,79,255,0.1)', border: '1px solid rgba(180,79,255,0.3)',
          borderRadius: '100px', padding: '6px 16px', marginBottom: '32px',
          fontSize: '12px', letterSpacing: '2px', color: '#B44FFF', textTransform: 'uppercase',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#B44FFF', display: 'inline-block', boxShadow: '0 0 8px #B44FFF' }} />
          Nutrición del futuro, disponible hoy
        </div>

        <h1 style={{ fontSize: 'clamp(38px, 7vw, 72px)', fontWeight: 900, lineHeight: 1.05, marginBottom: '24px', letterSpacing: '-2px' }}>
          Tu cuerpo merece{' '}
          <span style={{ background: 'linear-gradient(135deg, #B44FFF, #7B6FFF, #00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            inteligencia real
          </span>
        </h1>

        <p style={{ fontSize: '18px', color: 'rgba(160,160,176,0.8)', lineHeight: 1.7, marginBottom: '48px', maxWidth: '580px', margin: '0 auto 48px' }}>
          AngelAI analiza tu cuerpo con IA avanzada y genera un plan de nutrición y entrenamiento 100% personalizado. Cada 15 días, tu plan evoluciona contigo.
        </p>

        <form onSubmit={handleSubmit} style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-futuristic"
              style={{ paddingRight: '155px' }}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                padding: '10px 22px', fontSize: '14px', borderRadius: '8px', whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Accediendo...' : 'Empezar →'}
            </button>
          </div>
          {error && <p style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '8px' }}>{error}</p>}
          <p style={{ fontSize: '12px', color: 'rgba(160,160,176,0.35)', marginTop: '10px' }}>
            Acceso privado · Análisis inmediato · Cancela cuando quieras
          </p>
        </form>
      </section>

      {/* BODY SCORE PREVIEW */}
      <section style={{ position: 'relative', zIndex: 5, maxWidth: '860px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', letterSpacing: '3px', color: 'rgba(180,79,255,0.7)', marginBottom: '28px', textTransform: 'uppercase' }}>
            Tu Body Score personal
          </p>
          <div style={{ marginBottom: '36px' }}>
            <svg width="180" height="180" viewBox="0 0 180 180">
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#B44FFF"/>
                  <stop offset="100%" stopColor="#00D9F5"/>
                </linearGradient>
              </defs>
              <circle cx="90" cy="90" r="75" fill="none" stroke="rgba(180,79,255,0.1)" strokeWidth="12"/>
              <circle cx="90" cy="90" r="75" fill="none" stroke="url(#scoreGrad)" strokeWidth="12"
                strokeLinecap="round" strokeDasharray="471" strokeDashoffset="118"
                transform="rotate(-90 90 90)" style={{ filter: 'drop-shadow(0 0 8px rgba(180,79,255,0.5))' }}/>
              <text x="90" y="82" textAnchor="middle" fill="white" fontSize="36" fontWeight="900">742</text>
              <text x="90" y="105" textAnchor="middle" fill="rgba(0,217,245,0.8)" fontSize="13" fontWeight="600">PLATINO</text>
            </svg>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '480px', margin: '0 auto' }}>
            {RANKS.map(r => (
              <div key={r.name} style={{
                background: 'rgba(13,15,26,0.8)', border: `1px solid ${r.color}30`,
                borderRadius: '8px', padding: '10px 6px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: r.color, letterSpacing: '1px' }}>{r.name}</div>
                <div style={{ fontSize: '10px', color: 'rgba(160,160,176,0.4)', marginTop: '2px' }}>{r.range}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ position: 'relative', zIndex: 5, maxWidth: '1000px', margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '34px', fontWeight: 900, marginBottom: '48px', letterSpacing: '-1px' }}>
          Todo lo que{' '}
          <span style={{ background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            necesitas
          </span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="glass" style={{ padding: '28px', transition: 'transform 0.3s ease' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(160,160,176,0.65)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRIVACIDAD */}
      <section style={{ position: 'relative', zIndex: 5, maxWidth: '700px', margin: '0 auto', padding: '0 24px 60px', textAlign: 'center' }}>
        <div style={{ background: 'rgba(0,217,245,0.04)', border: '1px solid rgba(0,217,245,0.15)', borderRadius: '12px', padding: '24px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(160,160,176,0.65)', lineHeight: 1.9 }}>
            🔒 <strong style={{ color: 'rgba(0,217,245,0.9)' }}>Tu privacidad, primero.</strong>{' '}
            Las fotos se usan exclusivamente para el análisis de IA y se eliminan automáticamente a los 30 días.
            Solo almacenamos datos de peso y dieta para comparar tu progreso. Nunca compartimos tu información.
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ position: 'relative', zIndex: 5, textAlign: 'center', padding: '20px 24px 80px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '14px' }}>
          ¿Listo para tu{' '}
          <span style={{ background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            transformación
          </span>?
        </h2>
        <p style={{ color: 'rgba(160,160,176,0.5)', marginBottom: '28px' }}>Tu primer análisis es inmediato.</p>
        <button className="btn-primary" style={{ fontSize: '17px', padding: '15px 44px' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Comenzar ahora →
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{
        position: 'relative', zIndex: 5,
        borderTop: '1px solid rgba(180,79,255,0.08)',
        padding: '24px', textAlign: 'center',
        fontSize: '12px', color: 'rgba(160,160,176,0.25)', letterSpacing: '1px',
      }}>
        © 2025 AngelAI · AI-Powered Nutrition · Todos los derechos reservados
      </footer>
    </div>
  )
}
