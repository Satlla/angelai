'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// ─── Medal SVG icons ──────────────────────────────────────────────────────────
function MedalSvgInicio() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" stroke="#4CAF50" strokeWidth="1.5" opacity="0.3"/>
      <path d="M14 20V13M11 16l3-8 3 8" stroke="#4CAF50" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 20h8" stroke="#4CAF50" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="14" cy="10" r="2" fill="#4CAF50" opacity="0.6"/>
    </svg>
  )
}
function MedalSvgBronce() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="16" r="9" stroke="#CD7F32" strokeWidth="1.8"/>
      <circle cx="14" cy="16" r="6" stroke="#CD7F32" strokeWidth="1" opacity="0.4"/>
      <path d="M12 7V4M16 7V4" stroke="#CD7F32" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 4h8" stroke="#CD7F32" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11.5 16.5l1.5-3 1.5 3" stroke="#CD7F32" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 18h6" stroke="#CD7F32" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function MedalSvgPlata() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="16" r="9" stroke="#C0C0C0" strokeWidth="1.8"/>
      <circle cx="14" cy="16" r="6" stroke="#C0C0C0" strokeWidth="1" opacity="0.4"/>
      <path d="M12 7V4M16 7V4" stroke="#C0C0C0" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 4h8" stroke="#C0C0C0" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 14c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2H12v2h4" stroke="#C0C0C0" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function MedalSvgOro() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="16" r="9" stroke="#FFD700" strokeWidth="1.8"/>
      <circle cx="14" cy="16" r="6" stroke="#FFD700" strokeWidth="1" opacity="0.4"/>
      <path d="M12 7V4M16 7V4" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 4h8" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 13v6M11.5 13h5" stroke="#FFD700" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}
function MedalSvgPlatino() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 3l2.5 5 5.5.8-4 3.9.9 5.5L14 15.5l-4.9 2.7.9-5.5-4-3.9 5.5-.8z" stroke="#E5E4E2" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 6l1.5 3 3.3.5-2.4 2.3.6 3.3L14 13.5l-3 1.6.6-3.3L9.2 9.5l3.3-.5z" fill="#E5E4E2" opacity="0.2"/>
    </svg>
  )
}
function MedalSvgDiamante() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M9 5h10l4 6-9 12L5 11z" stroke="#00D9F5" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M5 11h18M9 5l2 6M19 5l-2 6M9 5l-4 6M19 5l4 6" stroke="#00D9F5" strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
      <path d="M14 11l-5 12M14 11l5 12" stroke="#00D9F5" strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
    </svg>
  )
}
function MedalSvgLeyenda() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M4 12c0-3 2-5 5-5h10c3 0 5 2 5 5 0 2-1 3.5-2.5 4.5L14 24l-7.5-7.5C5 15.5 4 14 4 12z" stroke="#FFB800" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 8h12" stroke="#FFB800" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="6.5" cy="7" r="1.5" fill="#FFB800"/>
      <circle cx="21.5" cy="7" r="1.5" fill="#FFB800"/>
      <circle cx="14" cy="5" r="1.5" fill="#FFB800"/>
      <path d="M14 15l-2-4 2-2 2 2z" fill="#FFB800" opacity="0.6"/>
    </svg>
  )
}

const MEDALS = [
  { svg: <MedalSvgInicio />, name: 'Inicio', color: '#4CAF50', desc: 'Primer check-in' },
  { svg: <MedalSvgBronce />, name: 'Bronce', color: '#CD7F32', desc: '7 días seguidos' },
  { svg: <MedalSvgPlata />, name: 'Plata', color: '#C0C0C0', desc: '15 días + progreso' },
  { svg: <MedalSvgOro />, name: 'Oro', color: '#FFD700', desc: '30 días + 40% obj.' },
  { svg: <MedalSvgPlatino />, name: 'Platino', color: '#E5E4E2', desc: '45 días + 70%' },
  { svg: <MedalSvgDiamante />, name: 'Diamante', color: '#00D9F5', desc: 'Objetivo completado' },
  { svg: <MedalSvgLeyenda />, name: 'Leyenda', color: '#FFB800', desc: 'Obj. + mantenimiento' },
]

const HOW = [
  { n: '01', title: 'Te registras', desc: 'Peso, talla, edad, objetivo y nivel de actividad. 2 minutos.' },
  { n: '02', title: 'Fotos opcionales', desc: 'La IA analiza grasa, tono muscular y postura con precisión clínica.' },
  { n: '03', title: 'Recibes tu plan', desc: 'Dieta con gramos exactos, entrenamiento y puntuación corporal.' },
  { n: '04', title: '30 segundos/noche', desc: 'Cuestionario diario. La IA construye tu perfil de disciplina real.' },
  { n: '05', title: 'Revisión quincenal', desc: 'La IA cruza datos. Si algo no cuadra, lo detecta y ajusta.' },
]

const FEATURES = [
  { svg: <SvgScience />, title: 'Dieta científica, no genérica', desc: 'TDEE con Mifflin-St Jeor. Macros al gramo: 2.4g proteína/kg en pérdida, déficit del 25%. Sin inventar números.' },
  { svg: <SvgCamera />, title: 'Análisis visual con IA', desc: 'Foto frontal + lateral. La IA detecta distribución de grasa, retención de agua y tono muscular.' },
  { svg: <SvgChecklist />, title: 'Disciplina medida cada día', desc: 'Cuestionario de 30 segundos cada noche. Slider de cumplimiento, gym, sueño, agua, estrés.' },
  { svg: <SvgRefresh />, title: 'Revisión quincenal inteligente', desc: 'Si dices que cumpliste pero no bajaste, lo detecta. Sin piedad, con datos.' },
  { svg: <SvgEdit />, title: 'Personaliza tu dieta', desc: 'No te gustan los frutos secos — escríbelo. La IA readjusta manteniendo los mismos macros.' },
  { svg: <SvgDumbbell />, title: 'Entrenamiento a tu medida', desc: 'Adaptado a tu equipamiento, días disponibles y ejercicios favoritos.' },
]

function Landing() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token')

  // Restore saved email on mount
  useEffect(() => {
    const saved = localStorage.getItem('angelai_last_email')
    if (saved) setEmail(saved)
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
        body: JSON.stringify({ email, ...(inviteToken ? { inviteToken } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Email no autorizado'); setLoading(false); return }
      localStorage.setItem('angelai_last_email', email)
      router.push(data.hasProfile ? '/dashboard' : '/onboarding')
    } catch {
      setError('Error de conexión.')
      setLoading(false)
    }
  }

  return (
    <div className="landing-root">

      {/* NAV */}
      <nav className="landing-nav">
        <Logo />

        {/* Desktop links */}
        <div className="nav-desktop">
          <a href="/medallas" className="nav-link">Medallas</a>
          <a href="/legal/privacidad" className="nav-link">Legal</a>
          <button
            onClick={() => document.querySelector('.hero-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="nav-btn"
          >
            Acceder
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <line x1="4" y1="4" x2="18" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="18" y1="4" x2="4" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <line x1="3" y1="6" x2="19" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="11" x2="19" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="16" x2="19" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <a href="/medallas" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Medallas</a>
          <a href="/legal/privacidad" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Privacidad</a>
          <a href="/legal/cookies" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Cookies</a>
          <a href="/legal/terminos" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Términos</a>
          <form onSubmit={e => { setMenuOpen(false); handleSubmit(e) }} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" style={{ fontSize: '16px', padding: '14px 16px' }} required />
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '14px', fontSize: '15px', fontWeight: 800 }}>
              {loading ? 'Accediendo...' : 'Acceder →'}
            </button>
          </form>
          {error && <p style={{ color: '#FF6B6B', fontSize: '13px' }}>{error}</p>}
        </div>
      )}

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-glow" />
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span>Nutrición con IA · Acceso privado</span>
          </div>
          <h1 className="hero-h1">
            Nobody can<br />
            <span className="gradient-text">stop you.</span>
          </h1>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.55)', fontWeight: 400, letterSpacing: '-0.3px', margin: '0 0 8px' }}>
            Encuentra tu grandeza.
          </p>
          <div className="hero-bottom">
            <p className="hero-desc">
              Calculamos tu metabolismo con precisión científica, analizamos tu cuerpo con IA y te damos un plan con{' '}
              <strong style={{ color: 'rgba(255,255,255,0.85)' }}>gramos exactos</strong> de cada alimento. Cada 15 días revisamos tu evolución. Cada noche, 30 segundos para que la IA mida tu disciplina real.
            </p>
            <div className="hero-form-wrap">
              {inviteToken && (
                <div style={{
                  background: 'rgba(180,79,255,0.08)', border: '1px solid rgba(180,79,255,0.25)',
                  borderRadius: '14px', padding: '14px 18px', marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <span style={{ fontSize: '20px' }}>✉️</span>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(180,79,255,0.9)', marginBottom: '2px' }}>Has sido invitado</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Introduce tu email para activar tu acceso exclusivo.</p>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="hero-form">
                <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field" style={{ fontSize: '16px', padding: '15px 18px' }} required />
                <button type="submit" disabled={loading} className="btn-primary"
                  style={{ padding: '16px', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px', textTransform: 'uppercase' }}>
                  {loading ? 'Accediendo...' : 'Empezar ahora →'}
                </button>
                {error && <p style={{ color: '#FF6B6B', fontSize: '13px', margin: 0 }}>{error}</p>}
              </form>
              <p className="hero-caption">ACCESO PRIVADO · SIN TARJETA</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="stats-bar">
        {[
          { n: 'Mifflin-St Jeor', label: 'Fórmula TDEE' },
          { n: '±5%', label: 'Tolerancia macros' },
          { n: '15 días', label: 'Revisión adaptativa' },
          { n: '30s', label: 'Cuestionario diario' },
        ].map((s, i) => (
          <div key={s.label} className="stat-item" style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div className="stat-value">{s.n}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section className="section-pad">
        <div className="section-inner">
          <div className="section-head">
            <h2 className="section-h2">Lo que hace<br /><span className="gradient-text">AngelAI</span></h2>
            <p className="section-sub">No es una app de dietas genéricas. Es un sistema que entiende tu cuerpo, tu disciplina y tu progreso real.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.svg}</div>
                <div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCIENCE */}
      <section className="science-section">
        <div className="section-inner">
          <div className="science-grid">
            <div>
              <p className="eyebrow">Base científica</p>
              <h2 className="science-h2">Mifflin-St Jeor.<br />No estimaciones.</h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>
                Calculamos tu TDEE con la fórmula más validada clínicamente. Antes de que la IA genere un solo alimento, ya tiene los números exactos. No puede inventarse macros aunque quiera.
              </p>
            </div>
            <div className="macros-list">
              {[
                { goal: 'PÉRDIDA DE PESO', cal: '−25% TDEE', prot: '2.4g/kg', color: '#FF6B6B' },
                { goal: 'DEFINICIÓN', cal: '−18% TDEE', prot: '2.2g/kg', color: '#B44FFF' },
                { goal: 'MANTENIMIENTO', cal: '100% TDEE', prot: '1.8g/kg', color: '#00D9F5' },
                { goal: 'VOLUMEN', cal: '+12% TDEE', prot: '2.0g/kg', color: '#FFB800' },
              ].map(g => (
                <div key={g.goal} className="macro-row">
                  <div style={{ width: '4px', height: '36px', borderRadius: '2px', background: g.color, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', color: g.color, marginBottom: '4px' }}>{g.goal}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{g.cal} · {g.prot} proteína</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-pad">
        <div className="section-inner">
          <h2 className="section-h2" style={{ marginBottom: '48px' }}>Cómo funciona</h2>
          <div className="how-grid">
            {HOW.map(s => (
              <div key={s.n} className="how-item">
                <div className="how-num">{s.n}</div>
                <h3 className="how-title">{s.title}</h3>
                <p className="how-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEDALS */}
      <section className="section-pad" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="section-inner">
          <div className="medals-head">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <SvgTrophy />
                <h2 className="section-h2" style={{ margin: 0 }}>La disciplina<br />tiene nombre.</h2>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', maxWidth: '400px', lineHeight: 1.7, margin: 0 }}>
                Quien tiene más camino por recorrer, recibe más mérito. El sistema ajusta los requisitos según tu punto de partida.
              </p>
            </div>
            <a href="/medallas" className="medals-link">Ver todas →</a>
          </div>
          <div className="medals-row">
            {MEDALS.map(m => (
              <div key={m.name} className="medal-card" style={{ border: `1px solid ${m.color}25` }}>
                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>{m.svg}</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: m.color, marginBottom: '5px' }}>{m.name.toUpperCase()}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.4 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section">
        <div className="cta-inner">
          <div>
            <h2 className="cta-h2">La constancia<br />es el resultado.</h2>
            <p style={{ fontSize: '15px', color: 'rgba(0,0,0,0.45)', lineHeight: 1.7, maxWidth: '380px', margin: 0 }}>
              Acceso privado. Sin suscripción automática. Sin plantillas genéricas.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="cta-form">
            <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)}
              style={{ background: '#f5f5f5', border: '2px solid #e0e0e0', borderRadius: '10px', color: '#07080F', padding: '15px 18px', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} required />
            <button type="submit" disabled={loading}
              style={{ background: '#07080F', color: 'white', border: 'none', borderRadius: '10px', padding: '16px', fontSize: '15px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' as const, width: '100%' }}>
              {loading ? 'Accediendo...' : 'Empezar ahora →'}
            </button>
            {error && <p style={{ color: '#FF3B30', fontSize: '13px', margin: 0 }}>{error}</p>}
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <Logo />
        <div className="footer-links">
          <a href="/medallas" className="footer-link">Medallas</a>
          <a href="/legal/privacidad" className="footer-link">Privacidad</a>
          <a href="/legal/cookies" className="footer-link">Cookies</a>
          <a href="/legal/terminos" className="footer-link">Términos</a>
        </div>
        <p className="footer-copy">© 2025 AngelAI S.L. · Calle de Serrano 45, 28001 Madrid</p>
      </footer>

      <style>{`
        .landing-root { min-height:100vh; background:#07080F; color:white; font-family:'Inter',-apple-system,sans-serif; overflow-x:hidden; }

        /* NAV */
        .landing-nav { padding:18px 24px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.04); position:sticky; top:0; z-index:100; background:rgba(7,8,15,0.95); backdrop-filter:blur(20px); }
        .nav-desktop { display:flex; align-items:center; gap:20px; }
        .nav-link { font-size:13px; color:rgba(255,255,255,0.35); text-decoration:none; font-weight:500; }
        .nav-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:8px; color:white; padding:9px 14px; font-size:13px; outline:none; width:190px; font-family:inherit; }
        .nav-btn { background:white; color:#07080F; border:none; border-radius:8px; padding:9px 18px; font-size:13px; font-weight:700; cursor:pointer; white-space:nowrap; font-family:inherit; }
        .hamburger { display:none; background:none; border:none; cursor:pointer; padding:4px; }

        /* MOBILE MENU */
        .mobile-menu { position:fixed; top:57px; left:0; right:0; bottom:0; background:#07080F; z-index:99; padding:24px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; }
        .mobile-menu-link { font-size:20px; font-weight:700; color:rgba(255,255,255,0.7); text-decoration:none; padding:14px 0; border-bottom:1px solid rgba(255,255,255,0.06); letter-spacing:-0.5px; }

        /* HERO */
        .hero-section { padding:56px 24px 48px; position:relative; overflow:hidden; }
        .hero-glow { position:absolute; top:-100px; left:50%; transform:translateX(-50%); width:800px; height:600px; background:radial-gradient(ellipse at center,rgba(180,79,255,0.12) 0%,transparent 65%); pointer-events:none; z-index:0; }
        .hero-inner { max-width:960px; margin:0 auto; position:relative; z-index:2; }
        .hero-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(180,79,255,0.08); border:1px solid rgba(180,79,255,0.2); border-radius:100px; padding:6px 14px; margin-bottom:32px; }
        .hero-badge span:last-child { font-size:11px; letter-spacing:1.5px; color:rgba(180,79,255,0.9); text-transform:uppercase; font-weight:700; }
        .badge-dot { width:6px; height:6px; border-radius:50%; background:#B44FFF; display:inline-block; box-shadow:0 0 8px #B44FFF; animation:pulse 2s infinite; flex-shrink:0; }
        .hero-h1 { font-size:clamp(44px,10vw,88px); font-weight:900; line-height:0.95; letter-spacing:-3px; margin-bottom:40px; text-transform:uppercase; }
        .hero-bottom { display:flex; gap:48px; align-items:flex-start; flex-wrap:wrap; }
        .hero-desc { font-size:16px; color:rgba(255,255,255,0.4); line-height:1.75; max-width:420px; margin:0; flex:1; min-width:260px; }
        .hero-form-wrap { flex:1; min-width:280px; max-width:380px; }
        .hero-form { display:flex; flex-direction:column; gap:10px; }
        .hero-caption { font-size:11px; color:rgba(255,255,255,0.15); margin-top:10px; letter-spacing:0.5px; }

        /* STATS */
        .stats-bar { border-top:1px solid rgba(255,255,255,0.06); border-bottom:1px solid rgba(255,255,255,0.06); display:flex; overflow-x:auto; }
        .stat-item { flex:1; min-width:110px; text-align:center; padding:24px 12px; }
        .stat-value { font-size:clamp(13px,2vw,18px); font-weight:900; color:white; margin-bottom:4px; letter-spacing:-0.5px; }
        .stat-label { font-size:10px; color:rgba(255,255,255,0.25); letter-spacing:0.5px; text-transform:uppercase; font-weight:600; }

        /* SECTIONS */
        .section-pad { padding:64px 24px; }
        .section-inner { max-width:960px; margin:0 auto; }
        .section-head { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; margin-bottom:40px; flex-wrap:wrap; }
        .section-h2 { font-size:clamp(28px,5vw,44px); font-weight:900; letter-spacing:-2px; text-transform:uppercase; line-height:1; margin:0; }
        .section-sub { font-size:14px; color:rgba(255,255,255,0.3); max-width:280px; line-height:1.7; margin:0; }

        /* FEATURES */
        .features-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:2px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.04); border-radius:20px; overflow:hidden; }
        .feature-card { background:#0C0D16; padding:28px 22px; display:flex; gap:16px; align-items:flex-start; }
        .feature-icon { flex-shrink:0; width:44px; height:44px; background:rgba(180,79,255,0.08); border:1px solid rgba(180,79,255,0.2); border-radius:12px; display:flex; align-items:center; justify-content:center; }
        .feature-title { font-size:14px; font-weight:800; margin-bottom:6px; letter-spacing:-0.2px; line-height:1.3; }
        .feature-desc { font-size:12px; color:rgba(255,255,255,0.35); line-height:1.75; margin:0; }

        /* SCIENCE */
        .science-section { background:rgba(180,79,255,0.04); border-top:1px solid rgba(180,79,255,0.1); border-bottom:1px solid rgba(180,79,255,0.1); padding:64px 24px; }
        .science-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; max-width:960px; margin:0 auto; }
        .eyebrow { font-size:11px; letter-spacing:2px; color:rgba(180,79,255,0.7); text-transform:uppercase; font-weight:700; margin-bottom:16px; }
        .science-h2 { font-size:clamp(22px,3.5vw,36px); font-weight:900; letter-spacing:-1.5px; text-transform:uppercase; line-height:1.1; margin-bottom:20px; }
        .macros-list { display:flex; flex-direction:column; gap:10px; }
        .macro-row { display:flex; align-items:center; gap:14px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:14px 16px; }

        /* HOW */
        .how-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; }
        .how-item { text-align:center; }
        .how-num { width:38px; height:38px; border-radius:50%; background:#0C0D16; border:1px solid rgba(180,79,255,0.3); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:11px; font-weight:900; color:#B44FFF; }
        .how-title { font-size:13px; font-weight:800; margin-bottom:6px; }
        .how-desc { font-size:11px; color:rgba(255,255,255,0.3); line-height:1.65; margin:0; }

        /* MEDALS */
        .medals-head { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin-bottom:28px; flex-wrap:wrap; }
        .medals-link { font-size:13px; color:#B44FFF; text-decoration:none; font-weight:700; border:1px solid rgba(180,79,255,0.3); padding:10px 18px; border-radius:8px; white-space:nowrap; flex-shrink:0; }
        .medals-row { display:flex; gap:10px; overflow-x:auto; padding-bottom:8px; }
        .medal-card { flex-shrink:0; background:#0C0D16; border-radius:14px; padding:18px 14px; text-align:center; min-width:100px; }

        /* CTA */
        .cta-section { background:white; padding:64px 24px; }
        .cta-inner { max-width:960px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:48px; flex-wrap:wrap; }
        .cta-h2 { font-size:clamp(32px,6vw,64px); font-weight:900; letter-spacing:-2.5px; color:#07080F; line-height:0.95; text-transform:uppercase; margin:0 0 16px; }
        .cta-form { display:flex; flex-direction:column; gap:10px; min-width:280px; flex:1; max-width:360px; }

        /* FOOTER */
        .landing-footer { background:#07080F; border-top:1px solid rgba(255,255,255,0.05); padding:28px 24px; display:flex; flex-wrap:wrap; gap:16px; align-items:center; justify-content:space-between; }
        .footer-links { display:flex; gap:20px; flex-wrap:wrap; }
        .footer-link { font-size:12px; color:rgba(255,255,255,0.2); text-decoration:none; }
        .footer-copy { font-size:11px; color:rgba(255,255,255,0.1); margin:0; }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* ─── MOBILE ─── */
        @media (max-width:768px) {
          .nav-desktop { display:none; }
          .hamburger { display:flex; }

          .hero-section { padding:36px 20px 32px; }
          .hero-h1 { font-size:clamp(40px,12vw,60px); letter-spacing:-2px; margin-bottom:24px; }
          .hero-bottom { flex-direction:column; gap:24px; }
          .hero-desc { font-size:15px; max-width:100%; min-width:0; }
          .hero-form-wrap { max-width:100%; width:100%; min-width:0; }

          .stats-bar { flex-wrap:wrap; }
          .stat-item { flex:1 0 48%; border-right:none !important; border-bottom:1px solid rgba(255,255,255,0.06); padding:18px 12px; }
          .stat-item:nth-child(odd) { border-right:1px solid rgba(255,255,255,0.06) !important; }

          .section-pad { padding:48px 20px; }
          .section-head { flex-direction:column; gap:12px; }
          .section-sub { max-width:100%; }
          .section-h2 { font-size:30px; letter-spacing:-1.5px; }

          .features-grid { grid-template-columns:1fr; }
          .feature-card { padding:22px 18px; }

          .science-section { padding:48px 20px; }
          .science-grid { grid-template-columns:1fr; gap:28px; }
          .science-h2 { font-size:26px; }

          .how-grid { grid-template-columns:1fr 1fr; gap:20px; }

          .medals-head { flex-direction:column; }
          .medal-card { min-width:88px; padding:14px 10px; }

          .cta-section { padding:48px 20px; }
          .cta-inner { flex-direction:column; gap:28px; }
          .cta-h2 { font-size:36px; letter-spacing:-1.5px; }
          .cta-form { max-width:100%; width:100%; }

          .footer-links { gap:14px; }
          .landing-footer { flex-direction:column; align-items:flex-start; gap:12px; }
        }
      `}</style>
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#07080F' }} />}>
      <Landing />
    </Suspense>
  )
}

// ─── Feature SVGs ─────────────────────────────────────────────────────────────
function SvgScience() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="5" r="1.5" fill="#B44FFF" opacity="0.9"/>
      <circle cx="15" cy="5" r="1.5" fill="#B44FFF" opacity="0.9"/>
      <circle cx="6" cy="10" r="1.5" fill="#C87AFF"/>
      <circle cx="18" cy="10" r="1.5" fill="#C87AFF"/>
      <circle cx="9" cy="15" r="1.5" fill="#B44FFF" opacity="0.9"/>
      <circle cx="15" cy="15" r="1.5" fill="#B44FFF" opacity="0.9"/>
      <line x1="9" y1="5" x2="15" y2="5" stroke="#B44FFF" strokeWidth="1.2" opacity="0.5"/>
      <line x1="9" y1="5" x2="6" y2="10" stroke="#B44FFF" strokeWidth="1.2" opacity="0.5"/>
      <line x1="15" y1="5" x2="18" y2="10" stroke="#B44FFF" strokeWidth="1.2" opacity="0.5"/>
      <line x1="6" y1="10" x2="9" y2="15" stroke="#B44FFF" strokeWidth="1.2" opacity="0.5"/>
      <line x1="18" y1="10" x2="15" y2="15" stroke="#B44FFF" strokeWidth="1.2" opacity="0.5"/>
      <line x1="9" y1="15" x2="15" y2="15" stroke="#B44FFF" strokeWidth="1.2" opacity="0.5"/>
      <path d="M12 15v4M10 19h4" stroke="#B44FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  )
}
function SvgCamera() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="13" rx="2.5" stroke="#B44FFF" strokeWidth="1.5"/>
      <circle cx="12" cy="13.5" r="3.5" stroke="#B44FFF" strokeWidth="1.5"/>
      <circle cx="12" cy="13.5" r="1.3" fill="#B44FFF" opacity="0.7"/>
      <path d="M9 7l1.5-3h3L15 7" stroke="#B44FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="17" y="10" width="2.5" height="1.5" rx="0.5" fill="#B44FFF" opacity="0.5"/>
    </svg>
  )
}
function SvgChecklist() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="#B44FFF" strokeWidth="1.5"/>
      <path d="M8 8.5h8" stroke="#B44FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
      <path d="M8 12h8" stroke="#B44FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.65"/>
      <path d="M8 15.5h5" stroke="#B44FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
      <path d="M5.5 12l0.8 0.8 1.5-1.5" stroke="#B44FFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function SvgRefresh() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 12a8 8 0 0 1 14.93-4" stroke="#B44FFF" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M20 12a8 8 0 0 1-14.93 4" stroke="#B44FFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.55"/>
      <path d="M19 5l0.5 3.5-3.5-0.5" stroke="#B44FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 19l-0.5-3.5 3.5 0.5" stroke="#B44FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"/>
    </svg>
  )
}
function SvgEdit() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 20h16" stroke="#B44FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M6 16l10-10 2 2-10 10H6v-2z" stroke="#B44FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 8l2 2" stroke="#B44FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
    </svg>
  )
}
function SvgDumbbell() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="10.5" width="3.5" height="3" rx="1" fill="#B44FFF"/>
      <rect x="1" y="9" width="2.5" height="6" rx="1" fill="#B44FFF" opacity="0.7"/>
      <rect x="18.5" y="10.5" width="3.5" height="3" rx="1" fill="#B44FFF"/>
      <rect x="20.5" y="9" width="2.5" height="6" rx="1" fill="#B44FFF" opacity="0.7"/>
      <line x1="5.5" y1="12" x2="18.5" y2="12" stroke="#B44FFF" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}
function SvgTrophy() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M10 6h16v12a8 8 0 0 1-16 0V6z" stroke="#FFD700" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M10 10H5a3 3 0 0 0 3 3h2" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M26 10h5a3 3 0 0 1-3 3h-2" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 18v6M13 30h10" stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="18" cy="12" r="3" fill="#FFD700" opacity="0.3"/>
      <path d="M16.5 12l1 2 1-2" stroke="#FFD700" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
    </svg>
  )
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg width="28" height="33" viewBox="0 0 36 42" fill="none">
        <defs>
          <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B44FFF" /><stop offset="100%" stopColor="#00D9F5" />
          </linearGradient>
        </defs>
        <polygon points="18,2 34,11 34,31 18,40 2,31 2,11" fill="rgba(180,79,255,0.08)" stroke="url(#lg)" strokeWidth="1.5"/>
        <line x1="11" y1="30" x2="15" y2="14" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="25" y1="30" x2="21" y2="14" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="12.5" y1="23" x2="23.5" y2="23" stroke="url(#lg)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <div>
        <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>ANGEL</span>
        <span style={{ fontSize: '18px', fontWeight: 900, background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
      </div>
    </div>
  )
}
