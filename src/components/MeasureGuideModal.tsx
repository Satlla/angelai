'use client'
import { useState, useEffect } from 'react'

export type MeasureKey = 'waist' | 'hips' | 'chest' | 'arms' | 'thighs' | 'calves' | 'shoulders'

const ORDER: MeasureKey[] = ['waist', 'hips', 'chest', 'arms', 'thighs', 'calves', 'shoulders']

interface Band { cx: number; cy: number; rx: number; ry: number; perim: number }

const GUIDES: Record<MeasureKey, { label: string; description: string; color: string; bands: Band[] }> = {
  waist: {
    label: 'Cintura',
    description: 'Coloca el metro 2–3 cm por encima del ombligo, en el punto más estrecho del abdomen. Exhala suavemente y no metas la tripa al medir.',
    color: '#FF6B9D',
    bands: [{ cx: 60, cy: 105, rx: 27, ry: 5, perim: 122 }],
  },
  hips: {
    label: 'Caderas',
    description: 'Rodea el metro por la parte más ancha de caderas y glúteos. Pies juntos y metro paralelo al suelo.',
    color: '#FFB547',
    bands: [{ cx: 60, cy: 130, rx: 36, ry: 5.5, perim: 162 }],
  },
  chest: {
    label: 'Pecho',
    description: 'A la altura de los pezones, en la parte más ancha del pecho. Respira con normalidad sin inflar el pecho.',
    color: '#B44FFF',
    bands: [{ cx: 60, cy: 78, rx: 38, ry: 6, perim: 171 }],
  },
  arms: {
    label: 'Brazos',
    description: 'Flexiona el brazo a 90° y mide en el punto más ancho del bícep con el puño apretado para tensar el músculo.',
    color: '#47C8FF',
    bands: [
      { cx: 10, cy: 97, rx: 8, ry: 4, perim: 40 },
      { cx: 110, cy: 97, rx: 8, ry: 4, perim: 40 },
    ],
  },
  thighs: {
    label: 'Muslos',
    description: 'Justo debajo del pliegue glúteo, en el punto más ancho del muslo. Distribuye el peso en ambas piernas por igual.',
    color: '#4FFF9F',
    bands: [
      { cx: 33, cy: 162, rx: 18, ry: 4.5, perim: 82 },
      { cx: 87, cy: 162, rx: 18, ry: 4.5, perim: 82 },
    ],
  },
  calves: {
    label: 'Pantorrilla',
    description: 'En el punto más ancho de la pantorrilla, en el tercio superior. De pie con ambos pies bien apoyados en el suelo.',
    color: '#FF8C47',
    bands: [
      { cx: 32, cy: 212, rx: 13, ry: 4, perim: 60 },
      { cx: 88, cy: 212, rx: 13, ry: 4, perim: 60 },
    ],
  },
  shoulders: {
    label: 'Hombros',
    description: 'De un extremo al otro de los hombros en línea recta, por la parte más ancha. Brazos relajados a los lados y espalda recta.',
    color: '#00D9F5',
    bands: [{ cx: 60, cy: 51, rx: 48, ry: 6, perim: 215 }],
  },
}

function BodyFigure({ activeKey }: { activeKey: MeasureKey }) {
  const guide = GUIDES[activeKey]
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setTick(0)
    const t = setTimeout(() => setTick(1), 50)
    return () => clearTimeout(t)
  }, [activeKey])

  return (
    <svg viewBox="0 0 120 280" width="110" height="257" style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}>
      <defs>
        {GUIDES[activeKey].bands.map((b, i) => (
          <filter key={i} id={`glow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>

      {/* Body silhouette */}
      <g fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinejoin="round">
        {/* Head */}
        <ellipse cx="60" cy="22" rx="15" ry="18" />
        {/* Neck */}
        <rect x="53" y="38" width="14" height="13" rx="2" />
        {/* Torso */}
        <path d="M12,50 C10,55 18,70 20,78 C22,86 28,95 33,105 C28,115 22,124 22,130 L22,135 L98,135 L98,130 C98,124 92,115 87,105 C92,95 98,86 100,78 C102,70 110,55 108,50 Z" />
        {/* Left arm */}
        <path d="M12,52 L4,52 L2,133 L17,133 L19,56 Z" />
        {/* Right arm */}
        <path d="M108,52 L116,52 L118,133 L103,133 L101,56 Z" />
        {/* Left leg */}
        <path d="M24,135 L21,276 L43,276 L44,135 Z" />
        {/* Right leg */}
        <path d="M96,135 L99,276 L77,276 L76,135 Z" />
      </g>

      {/* Measurement bands */}
      {guide.bands.map((band, i) => {
        const key = `band-${activeKey}-${i}`
        return (
          <g key={key}>
            {/* Glow layer */}
            <ellipse
              cx={band.cx} cy={band.cy} rx={band.rx} ry={band.ry}
              fill="none"
              stroke={guide.color}
              strokeWidth="6"
              opacity="0.25"
              strokeDasharray={band.perim}
              strokeDashoffset={tick === 0 ? band.perim : 0}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            {/* Main band */}
            <ellipse
              cx={band.cx} cy={band.cy} rx={band.rx} ry={band.ry}
              fill="none"
              stroke={guide.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${band.perim * 0.15} ${band.perim * 0.05}`}
              style={{
                filter: `drop-shadow(0 0 4px ${guide.color})`,
                animation: 'rotateBand 3s linear infinite',
                transformOrigin: `${band.cx}px ${band.cy}px`,
              }}
            />
            {/* Solid leading edge */}
            <ellipse
              cx={band.cx} cy={band.cy} rx={band.rx} ry={band.ry}
              fill="none"
              stroke={guide.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={band.perim}
              strokeDashoffset={tick === 0 ? band.perim : 0}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </g>
        )
      })}

      <style>{`
        @keyframes rotateBand {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  )
}

export default function MeasureGuideModal({
  open,
  initialTab,
  onClose,
}: {
  open: boolean
  initialTab: MeasureKey
  onClose: () => void
}) {
  const [active, setActive] = useState<MeasureKey>(initialTab)

  useEffect(() => {
    if (open) setActive(initialTab)
  }, [open, initialTab])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const guide = GUIDES[active]
  const idx = ORDER.indexOf(active)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0E0F1A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '28px 24px 24px',
          width: '100%',
          maxWidth: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0px',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '14px', right: '14px',
            background: 'rgba(255,255,255,0.06)', border: 'none',
            borderRadius: '50%', width: '28px', height: '28px',
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', lineHeight: 1,
          }}
        >×</button>

        {/* Measurement dots */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
          {ORDER.map(k => (
            <button
              key={k}
              onClick={() => setActive(k)}
              style={{
                width: k === active ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                background: k === active ? GUIDES[k].color : 'rgba(255,255,255,0.15)',
                transition: 'all 0.25s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Body figure */}
        <div style={{ marginBottom: '20px' }}>
          <BodyFigure activeKey={active} />
        </div>

        {/* Label */}
        <div style={{
          fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px',
          color: guide.color, textTransform: 'uppercase', marginBottom: '8px',
        }}>
          {guide.label}
        </div>

        {/* Description */}
        <p style={{
          fontSize: '14px', color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.65, textAlign: 'center',
          margin: '0 0 20px',
        }}>
          {guide.description}
        </p>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button
            onClick={() => setActive(ORDER[(idx - 1 + ORDER.length) % ORDER.length])}
            style={{
              flex: 1, padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: '16px',
              fontFamily: 'inherit',
            }}
          >←</button>
          <button
            onClick={() => setActive(ORDER[(idx + 1) % ORDER.length])}
            style={{
              flex: 1, padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: '16px',
              fontFamily: 'inherit',
            }}
          >→</button>
        </div>
      </div>
    </div>
  )
}

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
      onClick={e => { e.preventDefault(); onClick(measureKey) }}
      title={`Cómo medir ${GUIDES[measureKey].label.toLowerCase()}`}
      style={{
        marginLeft: '5px',
        width: '16px', height: '16px',
        borderRadius: '50%',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        verticalAlign: 'middle',
        opacity: 0.55,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '0.55')}
    >
      {/* Lightbulb icon */}
      <svg width="13" height="13" viewBox="0 0 14 16" fill="none">
        <path d="M7 1a4.5 4.5 0 0 1 2.5 8.2V11H4.5V9.2A4.5 4.5 0 0 1 7 1Z" stroke="rgba(255,200,0,0.9)" strokeWidth="1.2" fill="rgba(255,200,0,0.15)"/>
        <path d="M5 11h4v1.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11Z" stroke="rgba(255,200,0,0.7)" strokeWidth="1.2" fill="none"/>
        <line x1="7" y1="2.5" x2="7" y2="4" stroke="rgba(255,220,50,0.8)" strokeWidth="1" strokeLinecap="round"/>
        <line x1="3.5" y1="4" x2="4.5" y2="5" stroke="rgba(255,220,50,0.8)" strokeWidth="1" strokeLinecap="round"/>
        <line x1="10.5" y1="4" x2="9.5" y2="5" stroke="rgba(255,220,50,0.8)" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    </button>
  )
}
