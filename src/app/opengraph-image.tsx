import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'AngelAI — Nobody can stop you.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: '#07080F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px 100px',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: 'absolute',
          top: -100,
          left: '50%',
          width: 900,
          height: 700,
          background: 'radial-gradient(ellipse at center, rgba(180,79,255,0.18) 0%, transparent 65%)',
          transform: 'translateX(-50%)',
        }}
      />

      {/* Logo row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 60 }}>
        <svg width="48" height="56" viewBox="0 0 36 42" fill="none">
          <defs>
            <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B44FFF" />
              <stop offset="100%" stopColor="#00D9F5" />
            </linearGradient>
          </defs>
          <polygon points="18,2 34,11 34,31 18,40 2,31 2,11" fill="rgba(180,79,255,0.12)" stroke="url(#lg)" strokeWidth="1.5" />
          <line x1="11" y1="30" x2="15" y2="14" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="25" y1="30" x2="21" y2="14" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12.5" y1="23" x2="23.5" y2="23" stroke="url(#lg)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>ANGEL</span>
          <span style={{ fontSize: 36, fontWeight: 900, color: '#B44FFF', letterSpacing: '-1px' }}>AI</span>
        </div>
      </div>

      {/* Main headline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 40 }}>
        <span style={{ fontSize: 96, fontWeight: 900, color: 'white', letterSpacing: '-4px', lineHeight: 0.9, textTransform: 'uppercase' }}>
          Nobody can
        </span>
        <span style={{ fontSize: 96, fontWeight: 900, letterSpacing: '-4px', lineHeight: 0.9, textTransform: 'uppercase', color: '#B44FFF' }}>
          stop you.
        </span>
      </div>

      {/* Subtitle */}
      <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.45)', fontWeight: 400, margin: 0, maxWidth: 700, lineHeight: 1.5 }}>
        Nutrición personalizada con IA · Plan de dieta y entrenamiento en minutos
      </p>

      {/* Right side badge */}
      <div
        style={{
          position: 'absolute',
          right: 100,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {[
          { n: 'Mifflin-St Jeor', l: 'TDEE científico' },
          { n: '±5%', l: 'Tolerancia macros' },
          { n: '15 días', l: 'Revisión adaptativa' },
        ].map(item => (
          <div
            key={item.l}
            style={{
              background: 'rgba(180,79,255,0.08)',
              border: '1px solid rgba(180,79,255,0.2)',
              borderRadius: 16,
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 200,
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>{item.n}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>{item.l}</span>
          </div>
        ))}
      </div>
    </div>,
    { ...size }
  )
}
