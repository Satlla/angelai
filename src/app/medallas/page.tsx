import { MEDALS } from '@/lib/medals'

export const metadata = { title: 'Medallas — AngelAI', description: 'Descubre qué medallas puedes conseguir en AngelAI y qué representa cada una.' }

const MEDAL_CONFIG = {
  INICIO: {
    gradient: 'linear-gradient(135deg, #1a3a1a 0%, #0a1a0a 100%)',
    glow: '#4CAF50',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="16" stroke="#4CAF50" strokeWidth="1.5" opacity="0.3"/>
        <circle cx="18" cy="18" r="11" stroke="#4CAF50" strokeWidth="1" opacity="0.15"/>
        <path d="M18 26V16M14 21l4-11 4 11" stroke="#4CAF50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 26h10" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="18" cy="13" r="2.5" fill="#4CAF50" opacity="0.5"/>
      </svg>
    ),
    tier: 1,
  },
  BRONCE: {
    gradient: 'linear-gradient(135deg, #2a1a0a 0%, #1a0d00 100%)',
    glow: '#CD7F32',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="21" r="12" stroke="#CD7F32" strokeWidth="2"/>
        <circle cx="18" cy="21" r="8" stroke="#CD7F32" strokeWidth="1" opacity="0.4"/>
        <path d="M15 10V6M21 10V6" stroke="#CD7F32" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 6h12" stroke="#CD7F32" strokeWidth="2" strokeLinecap="round"/>
        <path d="M15.5 21.5l1.8-4.5 1.8 4.5" stroke="#CD7F32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.5 23h7" stroke="#CD7F32" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M14 21.5h8" stroke="#CD7F32" strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
      </svg>
    ),
    tier: 2,
  },
  PLATA: {
    gradient: 'linear-gradient(135deg, #1a1a1f 0%, #0f0f14 100%)',
    glow: '#C0C0C0',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="21" r="12" stroke="#C0C0C0" strokeWidth="2"/>
        <circle cx="18" cy="21" r="8" stroke="#C0C0C0" strokeWidth="1" opacity="0.4"/>
        <path d="M15 10V6M21 10V6" stroke="#C0C0C0" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 6h12" stroke="#C0C0C0" strokeWidth="2" strokeLinecap="round"/>
        <path d="M15.5 18.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5h-2.5v2.5h5" stroke="#C0C0C0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="18" cy="9" r="1.5" fill="#C0C0C0" opacity="0.6"/>
      </svg>
    ),
    tier: 3,
  },
  ORO: {
    gradient: 'linear-gradient(135deg, #2a2000 0%, #1a1400 100%)',
    glow: '#FFD700',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <defs>
          <linearGradient id="oro-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700"/>
            <stop offset="100%" stopColor="#FFA500"/>
          </linearGradient>
        </defs>
        <circle cx="18" cy="21" r="12" stroke="url(#oro-grad)" strokeWidth="2"/>
        <circle cx="18" cy="21" r="8" stroke="#FFD700" strokeWidth="1" opacity="0.35"/>
        <path d="M15 10V6M21 10V6" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 6h12" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
        <path d="M18 17v8M15 17h6" stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="18" cy="9" r="2" fill="#FFD700" opacity="0.6"/>
        <path d="M10 21h3M25 21h-3" stroke="#FFD700" strokeWidth="1" opacity="0.3" strokeLinecap="round"/>
      </svg>
    ),
    tier: 4,
  },
  PLATINO: {
    gradient: 'linear-gradient(135deg, #1c1c20 0%, #12121a 100%)',
    glow: '#E8E8F0',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <defs>
          <linearGradient id="plat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8E8F0"/>
            <stop offset="100%" stopColor="#9090B0"/>
          </linearGradient>
        </defs>
        <path d="M18 4l3.5 7.5 8.2 1.2-5.9 5.8 1.4 8.1L18 23l-7.2 3.6 1.4-8.1L6.3 12.7l8.2-1.2z" stroke="url(#plat-grad)" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M18 8l2 4.5 5 .7-3.5 3.5.8 5L18 19.5l-4.3 2.2.8-5L11 13.2l5-.7z" fill="#E8E8F0" opacity="0.12"/>
        <circle cx="18" cy="15" r="2" fill="url(#plat-grad)" opacity="0.6"/>
      </svg>
    ),
    tier: 5,
  },
  DIAMANTE: {
    gradient: 'linear-gradient(135deg, #001a1f 0%, #00121a 100%)',
    glow: '#00D9F5',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <defs>
          <linearGradient id="dia-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D9F5"/>
            <stop offset="100%" stopColor="#0090B0"/>
          </linearGradient>
        </defs>
        <path d="M10 8h16l6 9L18 32 4 17z" stroke="url(#dia-grad)" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M4 17h28M10 8l3 9M26 8l-3 9M10 8l-6 9M26 8l6 9" stroke="#00D9F5" strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
        <path d="M18 17l-8 15M18 17l8 15" stroke="#00D9F5" strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
        <circle cx="18" cy="14" r="2" fill="#00D9F5" opacity="0.5"/>
      </svg>
    ),
    tier: 6,
  },
  LEYENDA: {
    gradient: 'linear-gradient(135deg, #1f1500 0%, #140e00 100%)',
    glow: '#FFB800',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <defs>
          <linearGradient id="ley-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700"/>
            <stop offset="100%" stopColor="#FF8C00"/>
          </linearGradient>
        </defs>
        <path d="M5 16c0-4.5 3-7 7-7h12c4 0 7 2.5 7 7 0 3-1.5 5-4 7L18 32l-9-9c-2.5-2-4-4-4-7z" stroke="url(#ley-grad)" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M10 10h16" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="8" cy="8.5" r="2" fill="#FFD700"/>
        <circle cx="28" cy="8.5" r="2" fill="#FFD700"/>
        <circle cx="18" cy="6" r="2" fill="#FFD700"/>
        <path d="M18 19l-2.5-6 2.5-3 2.5 3z" fill="#FFD700" opacity="0.7"/>
        <path d="M14 22l4-3 4 3" stroke="#FFD700" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    tier: 7,
  },
}

export default function MedallasPage() {
  const medals = Object.values(MEDALS)

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', color: 'white', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Hero */}
      <div style={{ position: 'relative', textAlign: 'center', padding: '80px 24px 60px', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(255,183,0,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Crown icon */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', background: 'rgba(255,183,0,0.08)', border: '1px solid rgba(255,183,0,0.2)', borderRadius: '20px', marginBottom: '24px' }}>
          <svg width="38" height="38" viewBox="0 0 36 36" fill="none">
            <defs>
              <linearGradient id="crown" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700"/>
                <stop offset="100%" stopColor="#FF8C00"/>
              </linearGradient>
            </defs>
            <path d="M5 16c0-4.5 3-7 7-7h12c4 0 7 2.5 7 7 0 3-1.5 5-4 7L18 32l-9-9c-2.5-2-4-4-4-7z" stroke="url(#crown)" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M10 10h16" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="8" cy="8.5" r="2.2" fill="#FFD700"/>
            <circle cx="28" cy="8.5" r="2.2" fill="#FFD700"/>
            <circle cx="18" cy="6" r="2.2" fill="#FFD700"/>
          </svg>
        </div>

        <div style={{ display: 'inline-block', background: 'rgba(255,183,0,0.08)', border: '1px solid rgba(255,183,0,0.2)', borderRadius: '6px', padding: '5px 14px', marginBottom: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,183,0,0.8)' }}>Sistema de recompensas</span>
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '16px', lineHeight: 1.1 }}>
          El esfuerzo<br />
          <span style={{ background: 'linear-gradient(90deg, #FFD700, #FF8C00, #FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>se reconoce.</span>
        </h1>

        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.7 }}>
          No se trata de números en una pantalla. Se trata de disciplina real, constancia y resultados que la IA puede medir.
        </p>
      </div>

      {/* Philosophy card */}
      <div style={{ maxWidth: '640px', margin: '0 auto 56px', padding: '0 24px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(255,183,0,0.05) 0%, rgba(180,79,255,0.05) 100%)', border: '1px solid rgba(255,183,0,0.15)', borderRadius: '20px', padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,183,0,0.5), transparent)' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.3px', color: 'rgba(255,183,0,0.9)' }}>
            Mérito relativo, no absoluto
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, margin: 0 }}>
            Quien tiene más camino por recorrer consigue las medallas con umbrales ajustados.{' '}
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Perder 5kg cuando te faltan 25 tiene más mérito que perder 5kg cuando solo te faltan 6.</strong>{' '}
            La disciplina diaria vale tanto como el resultado en la báscula.
          </p>
        </div>
      </div>

      {/* Medals grid */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px 80px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', textTransform: 'uppercase' }}>Todas las medallas</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>{medals.length} niveles</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {medals.map((medal, i) => {
            const cfg = MEDAL_CONFIG[medal.id as keyof typeof MEDAL_CONFIG]
            return (
              <div key={medal.id} style={{
                background: cfg.gradient,
                border: `1px solid ${cfg.glow}22`,
                borderRadius: '20px',
                padding: '24px 28px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}>
                {/* Top glow bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${cfg.glow}60, transparent)` }} />

                {/* Tier number watermark */}
                <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '80px', fontWeight: 900, color: `${cfg.glow}06`, letterSpacing: '-4px', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
                  {String(cfg.tier).padStart(2, '0')}
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative' }}>
                  {/* Medal icon */}
                  <div style={{
                    width: '64px', height: '64px', flexShrink: 0,
                    background: `${cfg.glow}10`,
                    border: `1px solid ${cfg.glow}25`,
                    borderRadius: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 20px ${cfg.glow}15`,
                  }}>
                    {cfg.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '19px', fontWeight: 800, margin: 0, letterSpacing: '-0.4px', color: cfg.glow }}>
                        {medal.name}
                      </h3>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
                        color: `${cfg.glow}80`,
                        background: `${cfg.glow}10`,
                        border: `1px solid ${cfg.glow}20`,
                        padding: '3px 9px', borderRadius: '4px',
                        textTransform: 'uppercase',
                      }}>
                        {medal.rarity}
                      </span>
                    </div>

                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', lineHeight: 1.6 }}>
                      {medal.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: cfg.glow, flexShrink: 0, marginTop: '7px', opacity: 0.6 }} />
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', margin: 0, lineHeight: 1.6 }}>
                        {medal.requirement}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: '18px', height: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${((i + 1) / medals.length) * 100}%`, background: `linear-gradient(90deg, ${cfg.glow}40, ${cfg.glow})`, borderRadius: '2px' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '48px', padding: '36px 32px', background: 'linear-gradient(135deg, rgba(255,183,0,0.04) 0%, rgba(180,79,255,0.04) 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,183,0,0.3), rgba(180,79,255,0.3), transparent)' }} />
          <p style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.6px', color: 'white', marginBottom: '8px' }}>
            Nobody can stop you.
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', marginBottom: '24px', lineHeight: 1.6 }}>
            Las medallas las otorga la IA automáticamente.<br />No se piden. Se ganan.
          </p>
          <a href="/dashboard" style={{ display: 'inline-block', padding: '14px 32px', background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#07080F', textDecoration: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '14px', letterSpacing: '-0.2px' }}>
            Ver mi progreso →
          </a>
        </div>
      </div>
    </div>
  )
}
