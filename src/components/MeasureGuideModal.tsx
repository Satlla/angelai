'use client'
import { useState, useEffect } from 'react'

export type MeasureKey = 'waist' | 'hips' | 'chest' | 'arms' | 'thighs' | 'calves' | 'shoulders'

const GUIDES: {
  key: MeasureKey
  label: string
  color: string
  where: string
  tip: string
  steps: string[]
  svg: () => React.JSX.Element
}[] = [
  {
    key: 'waist',
    label: 'Cintura',
    color: '#B44FFF',
    where: 'Parte más estrecha del abdomen (sobre el ombligo)',
    tip: 'La medida más importante para ver pérdida de grasa abdominal.',
    steps: [
      'Ponte de pie erguido, relaja el abdomen',
      'Busca el punto más estrecho entre costillas y caderas',
      'Pasa la cinta horizontalmente a esa altura',
      'La cinta justa, sin apretar — mide al exhalar',
    ],
    svg: WaistSVG,
  },
  {
    key: 'hips',
    label: 'Cadera',
    color: '#00D9F5',
    where: 'Parte más ancha de los glúteos',
    tip: 'Refleja cambios en grasa corporal de la zona glútea.',
    steps: [
      'Ponte de pie con los pies juntos',
      'Localiza la parte más prominente de glúteos y caderas',
      'Pasa la cinta horizontalmente alrededor',
      'Mira de perfil para asegurarte de que está nivelada',
    ],
    svg: HipsSVG,
  },
  {
    key: 'chest',
    label: 'Pecho',
    color: '#FFD700',
    where: 'A la altura de los pezones, rodeando pecho y espalda',
    tip: 'Muestra el progreso de pectorales y espalda.',
    steps: [
      'Levanta los brazos, pasa la cinta y bájalos',
      'La cinta pasa por la línea de los pezones',
      'Respira normal y mide al exhalar',
      'La cinta horizontal y justa, sin apretar',
    ],
    svg: ChestSVG,
  },
  {
    key: 'arms',
    label: 'Brazos',
    color: '#FF6B6B',
    where: 'Punto más ancho del bíceps (mitad entre hombro y codo)',
    tip: 'Mide siempre igual: relajado o flexionado, elige uno y mantenlo.',
    steps: [
      'Flexiona el brazo dominante a 90°',
      'Localiza el punto más ancho del bíceps',
      'Mide contrayendo el músculo',
      'Anota si mides relajado o flexionado para ser consistente',
    ],
    svg: ArmsSVG,
  },
  {
    key: 'thighs',
    label: 'Muslos',
    color: '#7B6FFF',
    where: 'Parte más ancha del muslo, justo debajo del glúteo',
    tip: 'Indicador clave de ganancia muscular en pierna y pérdida de grasa.',
    steps: [
      'Ponte de pie con el peso repartido en ambas piernas',
      'Localiza justo debajo del pliegue glúteo',
      'Pasa la cinta horizontalmente alrededor del muslo',
      'Mide el mismo muslo siempre (el dominante)',
    ],
    svg: ThighsSVG,
  },
  {
    key: 'calves',
    label: 'Pantorrilla',
    color: '#4CAF50',
    where: 'Parte más ancha de la pantorrilla',
    tip: 'Refleja el desarrollo del gemelo. Cambia lentamente.',
    steps: [
      'Siéntate con la pierna relajada a 90°',
      'Localiza el punto más ancho de la pantorrilla',
      'Pasa la cinta horizontalmente alrededor',
      'Sin apretar — solo en contacto con la piel',
    ],
    svg: CalvesSVG,
  },
  {
    key: 'shoulders',
    label: 'Hombros',
    color: '#FF9800',
    where: 'Rodeando hombros y parte superior del pecho/espalda',
    tip: 'Muestra el desarrollo del deltoides y la amplitud de espalda.',
    steps: [
      'Ponte de pie erguido, brazos a los lados',
      'La cinta pasa por la parte más ancha de ambos hombros',
      'Rodea la cinta por delante del pecho y por detrás',
      'Mide al exhalar con postura natural',
    ],
    svg: ShouldersSVG,
  },
]

// ─── SVG Components ─────────────────────────────────────────────────────────

function BodyBase({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <circle cx="100" cy="20" r="16" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
      <path d="M100 36 C74 36 56 56 56 82 C56 102 62 114 70 124 C56 136 46 156 44 178 C42 200 52 232 58 252 L142 252 C148 232 158 200 156 178 C154 156 144 136 130 124 C138 114 144 102 144 82 C144 56 126 36 100 36Z" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
      {children}
    </>
  )
}

function TapeMeasure({ path, color, label, labelY }: { path: string; color: string; label: string; labelY: number }) {
  return (
    <>
      <path d={path} stroke={color} strokeWidth="3" strokeLinecap="round" fill="none"/>
      <rect x="72" y={labelY} width="56" height="20" rx="10" fill={`${color}25`} stroke={`${color}70`} strokeWidth="1"/>
      <text x="100" y={labelY + 14} textAnchor="middle" fill={color} fontSize="10" fontWeight="700" fontFamily="system-ui">{label}</text>
    </>
  )
}

function WaistSVG() {
  return (
    <svg viewBox="0 0 200 280" fill="none" style={{ width: '100%', maxWidth: '180px' }}>
      <BodyBase>
        <line x1="38" y1="160" x2="162" y2="160" stroke="rgba(180,79,255,0.2)" strokeWidth="1" strokeDasharray="4 3"/>
        <path d="M50 160 Q75 150 100 149 Q125 150 150 160 Q125 170 100 171 Q75 170 50 160Z" stroke="#B44FFF" strokeWidth="2.5" fill="rgba(180,79,255,0.08)" strokeLinecap="round"/>
        <TapeMeasure path="" color="#B44FFF" label="CINTURA" labelY={174}/>
      </BodyBase>
    </svg>
  )
}

function HipsSVG() {
  return (
    <svg viewBox="0 0 200 280" fill="none" style={{ width: '100%', maxWidth: '180px' }}>
      <BodyBase>
        <line x1="30" y1="192" x2="170" y2="192" stroke="rgba(0,217,245,0.2)" strokeWidth="1" strokeDasharray="4 3"/>
        <path d="M44 192 Q72 178 100 177 Q128 178 156 192 Q128 206 100 207 Q72 206 44 192Z" stroke="#00D9F5" strokeWidth="2.5" fill="rgba(0,217,245,0.08)" strokeLinecap="round"/>
        <TapeMeasure path="" color="#00D9F5" label="CADERA" labelY={210}/>
      </BodyBase>
    </svg>
  )
}

function ChestSVG() {
  return (
    <svg viewBox="0 0 200 280" fill="none" style={{ width: '100%', maxWidth: '180px' }}>
      {/* Arms slightly out */}
      <path d="M56 90 C40 100 32 116 30 130 L46 134 C48 122 54 110 66 102Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      <path d="M144 90 C160 100 168 116 170 130 L154 134 C152 122 146 110 134 102Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      <BodyBase>
        <line x1="28" y1="122" x2="172" y2="122" stroke="rgba(255,215,0,0.2)" strokeWidth="1" strokeDasharray="4 3"/>
        <path d="M46 122 Q73 112 100 111 Q127 112 154 122 Q127 132 100 133 Q73 132 46 122Z" stroke="#FFD700" strokeWidth="2.5" fill="rgba(255,215,0,0.08)" strokeLinecap="round"/>
        <TapeMeasure path="" color="#FFD700" label="PECHO" labelY={136}/>
      </BodyBase>
    </svg>
  )
}

function ArmsSVG() {
  return (
    <svg viewBox="0 0 200 280" fill="none" style={{ width: '100%', maxWidth: '180px' }}>
      {/* Flexed arm */}
      <path d="M30 80 C26 95 28 115 36 130 C44 145 56 152 68 152 L80 152 C68 148 58 140 52 126 C46 112 46 92 52 78Z" fill="rgba(255,107,107,0.1)" stroke="rgba(255,107,107,0.25)" strokeWidth="1.5"/>
      <path d="M68 152 C60 165 58 185 68 200 C78 214 95 220 108 218 L106 206 C92 208 80 202 72 190 C64 178 66 163 72 152Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      {/* Bicep tape */}
      <path d="M30 115 Q49 104 68 103 Q87 104 96 115 Q87 126 68 127 Q49 126 30 115Z" stroke="#FF6B6B" strokeWidth="2.5" fill="rgba(255,107,107,0.1)" strokeLinecap="round"/>
      <rect x="40" y="132" width="52" height="20" rx="10" fill="rgba(255,107,107,0.15)" stroke="rgba(255,107,107,0.5)" strokeWidth="1"/>
      <text x="66" y="146" textAnchor="middle" fill="#FF6B6B" fontSize="10" fontWeight="700" fontFamily="system-ui">BÍCEPS</text>
      {/* 90° elbow line */}
      <line x1="68" y1="152" x2="108" y2="152" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3"/>
      <text x="114" y="156" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="system-ui">90°</text>
    </svg>
  )
}

function ThighsSVG() {
  return (
    <svg viewBox="0 0 200 280" fill="none" style={{ width: '100%', maxWidth: '180px' }}>
      {/* Left leg */}
      <path d="M60 140 C52 155 48 185 50 215 C52 235 60 255 70 265 L90 265 C86 252 82 232 82 210 C82 188 84 162 80 140Z" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
      {/* Right leg */}
      <path d="M120 140 C128 155 132 185 130 215 C128 235 120 255 110 265 L90 265 C94 252 98 232 98 210 C98 188 96 162 100 140Z" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
      {/* Hip area */}
      <path d="M60 140 Q90 128 120 140" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      {/* Thigh tape on left leg */}
      <path d="M50 160 Q65 151 80 150 Q95 151 100 160 Q95 169 80 170 Q65 169 50 160Z" stroke="#7B6FFF" strokeWidth="2.5" fill="rgba(123,111,255,0.1)" strokeLinecap="round"/>
      <rect x="44" y="175" width="52" height="20" rx="10" fill="rgba(123,111,255,0.15)" stroke="rgba(123,111,255,0.5)" strokeWidth="1"/>
      <text x="70" y="189" textAnchor="middle" fill="#7B6FFF" fontSize="10" fontWeight="700" fontFamily="system-ui">MUSLO</text>
    </svg>
  )
}

function CalvesSVG() {
  return (
    <svg viewBox="0 0 200 280" fill="none" style={{ width: '100%', maxWidth: '180px' }}>
      {/* Lower leg */}
      <path d="M72 100 C64 120 60 155 62 190 C64 215 70 240 78 260 L108 260 C116 240 122 215 122 190 C122 155 120 120 114 100Z" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
      {/* Calf bulge */}
      <path d="M64 170 C58 178 58 195 64 204 C70 212 82 216 90 215 C98 214 108 210 112 204 C118 196 118 179 112 170 C106 162 94 158 86 158 C78 158 68 162 64 170Z" fill="rgba(76,175,80,0.08)" stroke="rgba(76,175,80,0.2)" strokeWidth="1"/>
      {/* Calf tape */}
      <path d="M62 186 Q76 177 90 176 Q104 177 118 186 Q104 195 90 196 Q76 195 62 186Z" stroke="#4CAF50" strokeWidth="2.5" fill="rgba(76,175,80,0.1)" strokeLinecap="round"/>
      <rect x="62" y="200" width="60" height="20" rx="10" fill="rgba(76,175,80,0.15)" stroke="rgba(76,175,80,0.5)" strokeWidth="1"/>
      <text x="92" y="214" textAnchor="middle" fill="#4CAF50" fontSize="10" fontWeight="700" fontFamily="system-ui">PANTORRILLA</text>
    </svg>
  )
}

function ShouldersSVG() {
  return (
    <svg viewBox="0 0 200 280" fill="none" style={{ width: '100%', maxWidth: '180px' }}>
      {/* Wide shoulders + arms */}
      <path d="M36 75 C28 85 26 100 30 112 L54 108 C52 100 54 90 60 84Z" fill="rgba(255,152,0,0.08)" stroke="rgba(255,152,0,0.2)" strokeWidth="1.5"/>
      <path d="M164 75 C172 85 174 100 170 112 L146 108 C148 100 146 90 140 84Z" fill="rgba(255,152,0,0.08)" stroke="rgba(255,152,0,0.2)" strokeWidth="1.5"/>
      <BodyBase>
        <path d="M30 90 Q65 74 100 72 Q135 74 170 90 Q135 106 100 108 Q65 106 30 90Z" stroke="#FF9800" strokeWidth="2.5" fill="rgba(255,152,0,0.08)" strokeLinecap="round"/>
        <TapeMeasure path="" color="#FF9800" label="HOMBROS" labelY={112}/>
      </BodyBase>
    </svg>
  )
}

// ─── Modal Component ─────────────────────────────────────────────────────────

export default function MeasureGuideModal({
  open,
  initialTab,
  onClose,
}: {
  open: boolean
  initialTab?: MeasureKey
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<MeasureKey>(initialTab || 'waist')

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const guide = GUIDES.find(g => g.key === activeTab)!
  const idx = GUIDES.findIndex(g => g.key === activeTab)
  const prev = idx > 0 ? GUIDES[idx - 1] : null
  const next = idx < GUIDES.length - 1 ? GUIDES[idx + 1] : null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px',
          background: '#0E0F1A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '92vh',
          overflowY: 'auto',
          animation: 'slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>
              Cómo medirte
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: '3px 0 0' }}>
              7 medidas · Cada 2–4 semanas
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)', border: 'none',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px',
            }}
          >✕</button>
        </div>

        {/* Tab pills — scrollable */}
        <div style={{
          display: 'flex', gap: '6px', padding: '0 20px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {GUIDES.map((g, i) => (
            <button
              key={g.key}
              onClick={() => setActiveTab(g.key)}
              style={{
                padding: '7px 14px', borderRadius: '20px', border: 'none',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                fontFamily: 'inherit', whiteSpace: 'nowrap' as const, flexShrink: 0,
                background: activeTab === g.key ? g.color : 'rgba(255,255,255,0.06)',
                color: activeTab === g.key ? 'white' : 'rgba(255,255,255,0.38)',
                transition: 'all 0.18s ease',
                position: 'relative',
              }}
            >
              {i + 1}. {g.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '0 20px 28px' }}>

          {/* Illustration */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${guide.color}20`,
            borderRadius: '20px', padding: '20px',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            marginBottom: '16px', minHeight: '180px',
          }}>
            <guide.svg />
          </div>

          {/* Where label */}
          <div style={{
            display: 'flex', gap: '10px', alignItems: 'flex-start',
            background: `${guide.color}10`,
            border: `1px solid ${guide.color}25`,
            borderRadius: '12px', padding: '12px 14px', marginBottom: '16px',
          }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: guide.color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, marginTop: '1px',
            }}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <circle cx="4" cy="3" r="1.2" fill="white"/>
                <path d="M4 5v2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: guide.color, fontWeight: 700, margin: '0 0 2px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Dónde medir
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>
                {guide.where}
              </p>
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '8px' }}>
            {guide.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: `${guide.color}18`, border: `1px solid ${guide.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: guide.color }}>{i + 1}</span>
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.55, margin: '2px 0 0' }}>
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div style={{
            marginTop: '14px', padding: '10px 13px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
            borderLeft: `3px solid ${guide.color}60`,
          }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: 0 }}>
              💡 {guide.tip}
            </p>
          </div>

          {/* Tracker info */}
          <div style={{
            marginTop: '16px', display: 'flex', gap: '8px',
          }}>
            {[
              { label: 'Peso', freq: '1–3×/semana', color: '#00D9F5' },
              { label: 'Medidas', freq: 'Cada 15 días', color: '#B44FFF' },
            ].map(item => (
              <div key={item.label} style={{
                flex: 1, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 12px',
              }}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: '0 0 3px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {item.label}
                </p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: item.color, margin: 0 }}>
                  {item.freq}
                </p>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '8px' }}>
            <button
              onClick={() => prev && setActiveTab(prev.key)}
              disabled={!prev}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '11px 14px', borderRadius: '10px',
                background: prev ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: 'none', cursor: prev ? 'pointer' : 'default',
                color: prev ? 'rgba(255,255,255,0.5)' : 'transparent',
                fontSize: '13px', fontFamily: 'inherit',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {prev?.label}
            </button>
            <button
              onClick={() => next ? setActiveTab(next.key) : onClose()}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '11px 18px', borderRadius: '10px',
                background: next ? guide.color : 'rgba(255,255,255,0.08)',
                border: 'none', cursor: 'pointer',
                color: 'white', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
              }}
            >
              {next ? next.label : '¡Entendido!'}
              {next && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helper trigger button ────────────────────────────────────────────────────

export function MeasureHelpButton({
  measureKey,
  onClick,
}: {
  measureKey: MeasureKey
  onClick: (key: MeasureKey) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(measureKey)}
      title="Ver cómo medirme"
      style={{
        width: '16px', height: '16px', borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.18)',
        background: 'rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.35)',
        cursor: 'pointer', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '9px', fontWeight: 700, fontFamily: 'inherit',
        marginLeft: '5px', verticalAlign: 'middle', flexShrink: 0,
        transition: 'all 0.15s ease',
      }}
    >
      ?
    </button>
  )
}
