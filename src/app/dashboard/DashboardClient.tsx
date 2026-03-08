'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BADGE_INFO: Record<string, { emoji: string; label: string }> = {
  primer_paso:   { emoji: '🎯', label: 'Primer paso' },
  sin_rendirse:  { emoji: '🔥', label: 'Sin rendirse' },
  constancia:    { emoji: '🏆', label: 'Constancia de hierro' },
  primer_kilo:   { emoji: '📉', label: 'Primer kilo' },
  transformacion:{ emoji: '💪', label: 'Transformación' },
}

const RANK_COLORS: Record<string, string> = {
  BRONCE: '#CD7F32', PLATA: '#C0C0C0', ORO: '#FFD700',
  PLATINO: '#E5E4E2', DIAMANTE: '#00D9F5', LEYENDA: '#B44FFF',
}

type CheckIn = {
  id: string; createdAt: string; weight: number; bodyScore: number | null;
  rank: string | null; analysis: string | null; dietPlan: string | null;
  goal: string; waist?: number | null; hips?: number | null;
  chest?: number | null; arms?: number | null;
}

export default function DashboardClient({ user, checkIns, badges, daysLeft }: {
  user: { id: string; email: string; name: string | null }
  checkIns: CheckIn[]
  badges: { badge: string; earnedAt: string }[]
  daysLeft: number
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'diet' | 'history'>('overview')
  const router = useRouter()
  const latest = checkIns[0]
  const prev = checkIns[1]
  const dietData = latest.dietPlan ? JSON.parse(latest.dietPlan) : null
  const score = latest.bodyScore || 0
  const rank = latest.rank || 'BRONCE'
  const rankColor = RANK_COLORS[rank] || '#B44FFF'
  const scorePercent = (score / 1000) * 100
  const weightDiff = prev ? (latest.weight - prev.weight).toFixed(1) : null

  const cardStyle = {
    background: 'rgba(13,15,26,0.8)', border: '1px solid rgba(180,79,255,0.15)',
    borderRadius: '16px', padding: '24px',
  }

  const tabStyle = (active: boolean) => ({
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
    background: active ? 'linear-gradient(135deg,#B44FFF,#00D9F5)' : 'transparent',
    color: active ? 'white' : 'rgba(160,160,176,0.5)',
    border: active ? 'none' : '1px solid rgba(180,79,255,0.2)',
    transition: 'all 0.2s',
  })

  function DietSection({ title, options }: { title: string; options: Record<string, string[]> }) {
    const [open, setOpen] = useState<string | null>('opcionA')
    return (
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(180,79,255,0.9)', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {title}
        </h4>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {Object.keys(options).map(key => (
            <button key={key} onClick={() => setOpen(key)} style={{
              padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              background: open === key ? 'rgba(180,79,255,0.2)' : 'transparent',
              border: `1px solid ${open === key ? '#B44FFF' : 'rgba(180,79,255,0.2)'}`,
              color: open === key ? '#B44FFF' : 'rgba(160,160,176,0.5)',
            }}>
              {key.replace('opcion', 'Op. ').toUpperCase()}
            </button>
          ))}
        </div>
        {open && options[open] && (
          <div style={{ background: 'rgba(180,79,255,0.05)', borderRadius: '10px', padding: '14px' }}>
            {options[open].map((item: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '6px', fontSize: '14px', color: 'rgba(220,220,240,0.85)' }}>
                <span style={{ color: '#B44FFF', marginTop: '2px', flexShrink: 0 }}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', padding: '0' }}>

      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid rgba(180,79,255,0.1)', position: 'sticky', top: 0,
        background: 'rgba(7,8,15,0.95)', backdropFilter: 'blur(20px)', zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="28" height="33" viewBox="0 0 36 42">
            <defs><linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B44FFF"/><stop offset="100%" stopColor="#00D9F5"/>
            </linearGradient></defs>
            <polygon points="18,2 34,11 34,31 18,40 2,31 2,11" fill="rgba(180,79,255,0.1)" stroke="url(#hg)" strokeWidth="1.5"/>
            <line x1="11" y1="30" x2="15" y2="14" stroke="url(#hg)" strokeWidth="3" strokeLinecap="round"/>
            <line x1="25" y1="30" x2="21" y2="14" stroke="url(#hg)" strokeWidth="3" strokeLinecap="round"/>
            <line x1="12.5" y1="23" x2="23.5" y2="23" stroke="url(#hg)" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '18px', fontWeight: 900 }}>
            <span style={{ color: 'white' }}>ANGEL</span>
            <span style={{ background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(160,160,176,0.5)' }}>{user.email}</span>
          <button
            onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/') }}
            style={{ fontSize: '12px', padding: '6px 14px', background: 'rgba(180,79,255,0.1)', border: '1px solid rgba(180,79,255,0.2)', borderRadius: '6px', color: 'rgba(160,160,176,0.5)', cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '4px' }}>
            Tu panel de transformación
          </h1>
          <p style={{ color: 'rgba(160,160,176,0.5)', fontSize: '14px' }}>
            Último análisis: {new Date(latest.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* STATS TOP */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>

          {/* Body Score */}
          <div style={{ ...cardStyle, textAlign: 'center', gridColumn: 'span 1' }}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(160,160,176,0.5)', marginBottom: '16px', textTransform: 'uppercase' }}>Body Score</p>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B44FFF"/>
                    <stop offset="100%" stopColor="#00D9F5"/>
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(180,79,255,0.1)" strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#sg)" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - scorePercent / 100)}`}
                  transform="rotate(-90 60 60)"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(180,79,255,0.5))', transition: 'stroke-dashoffset 1s ease' }}/>
                <text x="60" y="55" textAnchor="middle" fill="white" fontSize="24" fontWeight="900">{score}</text>
                <text x="60" y="72" textAnchor="middle" fill={rankColor} fontSize="10" fontWeight="700">{rank}</text>
              </svg>
            </div>
          </div>

          {/* Peso */}
          <div style={cardStyle}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(160,160,176,0.5)', marginBottom: '12px', textTransform: 'uppercase' }}>Peso actual</p>
            <p style={{ fontSize: '36px', fontWeight: 900, marginBottom: '4px' }}>{latest.weight}<span style={{ fontSize: '16px', color: 'rgba(160,160,176,0.5)' }}> kg</span></p>
            {weightDiff && (
              <p style={{ fontSize: '14px', color: parseFloat(weightDiff) < 0 ? '#00D9F5' : '#ff6b6b', fontWeight: 600 }}>
                {parseFloat(weightDiff) < 0 ? '▼' : '▲'} {Math.abs(parseFloat(weightDiff))} kg vs anterior
              </p>
            )}
          </div>

          {/* Próximo check-in */}
          <div style={cardStyle}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(160,160,176,0.5)', marginBottom: '12px', textTransform: 'uppercase' }}>Próxima revisión</p>
            <p style={{ fontSize: '36px', fontWeight: 900, marginBottom: '4px' }}>{daysLeft}<span style={{ fontSize: '16px', color: 'rgba(160,160,176,0.5)' }}> días</span></p>
            {daysLeft === 0 && (
              <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px', marginTop: '8px' }}
                onClick={() => router.push('/checkin')}>
                ¡Hacer revisión! →
              </button>
            )}
            {daysLeft > 0 && (
              <div className="progress-bar" style={{ marginTop: '12px' }}>
                <div className="progress-fill" style={{ width: `${((15 - daysLeft) / 15) * 100}%` }} />
              </div>
            )}
          </div>

          {/* Badges */}
          <div style={cardStyle}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(160,160,176,0.5)', marginBottom: '12px', textTransform: 'uppercase' }}>Logros</p>
            {badges.length === 0
              ? <p style={{ color: 'rgba(160,160,176,0.3)', fontSize: '13px' }}>Completa tu primera revisión para ganar logros</p>
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {badges.map(b => {
                    const info = BADGE_INFO[b.badge] || { emoji: '⭐', label: b.badge }
                    return (
                      <div key={b.badge} title={info.label} style={{
                        background: 'rgba(180,79,255,0.1)', border: '1px solid rgba(180,79,255,0.3)',
                        borderRadius: '8px', padding: '6px 10px', fontSize: '18px', cursor: 'default',
                      }}>{info.emoji}</div>
                    )
                  })}
                </div>
            }
          </div>
        </div>

        {/* ANALYSIS */}
        {latest.analysis && (
          <div style={{ ...cardStyle, marginBottom: '24px', borderColor: 'rgba(180,79,255,0.25)' }}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(180,79,255,0.7)', marginBottom: '12px', textTransform: 'uppercase' }}>📊 Análisis de la IA</p>
            <p style={{ lineHeight: 1.8, color: 'rgba(220,220,240,0.85)', fontSize: '15px' }}>{latest.analysis}</p>
          </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button style={tabStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>Resumen</button>
          <button style={tabStyle(activeTab === 'diet')} onClick={() => setActiveTab('diet')}>Mi Dieta</button>
          <button style={tabStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>Historial</button>
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && dietData && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Macros */}
            <div style={cardStyle}>
              <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(160,160,176,0.5)', marginBottom: '16px', textTransform: 'uppercase' }}>Macros diarios</p>
              {[
                { label: 'Calorías', value: `${dietData.calories} kcal`, color: '#B44FFF' },
                { label: 'Proteína', value: `${dietData.protein}g`, color: '#00D9F5' },
                { label: 'Carbohidratos', value: `${dietData.carbs}g`, color: '#7B6FFF' },
                { label: 'Grasas', value: `${dietData.fat}g`, color: '#FFD700' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(160,160,176,0.6)' }}>{m.label}</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>

            {/* Suplementos */}
            {dietData.supplements && (
              <div style={cardStyle}>
                <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(160,160,176,0.5)', marginBottom: '16px', textTransform: 'uppercase' }}>Suplementación</p>
                {dietData.supplements.map((s: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'rgba(220,220,240,0.8)' }}>
                    <span style={{ color: '#B44FFF' }}>✓</span> {s}
                  </div>
                ))}
              </div>
            )}

            {/* Tips */}
            {dietData.tips && (
              <div style={cardStyle}>
                <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(160,160,176,0.5)', marginBottom: '16px', textTransform: 'uppercase' }}>Tips personalizados</p>
                {dietData.tips.map((t: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '13px', color: 'rgba(220,220,240,0.8)', lineHeight: 1.5 }}>
                    <span style={{ color: '#00D9F5', flexShrink: 0 }}>→</span> {t}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: DIETA */}
        {activeTab === 'diet' && dietData?.diet && (
          <div style={cardStyle}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(160,160,176,0.5)', marginBottom: '24px', textTransform: 'uppercase' }}>Tu plan de nutrición personalizado</p>

            {dietData.diet.antesDesayuno && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(180,79,255,0.9)', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  ⏰ Antes del desayuno
                </h4>
                <div style={{ background: 'rgba(180,79,255,0.05)', borderRadius: '10px', padding: '14px' }}>
                  {dietData.diet.antesDesayuno.map((item: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '14px', color: 'rgba(220,220,240,0.85)' }}>
                      <span style={{ color: '#B44FFF' }}>•</span> {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dietData.diet.desayuno && <DietSection title="🥚 Desayuno" options={dietData.diet.desayuno} />}
            {dietData.diet.almuerzo && <DietSection title="🥪 Almuerzo" options={dietData.diet.almuerzo} />}
            {dietData.diet.comida && <DietSection title="🍗 Comida" options={dietData.diet.comida} />}
            {dietData.diet.merienda && <DietSection title="🍎 Merienda" options={dietData.diet.merienda} />}
            {dietData.diet.cena && <DietSection title="🌙 Cena" options={dietData.diet.cena} />}
          </div>
        )}

        {/* TAB: HISTORIAL */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {checkIns.map((c, i) => (
              <div key={c.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'rgba(160,160,176,0.4)', marginBottom: '4px' }}>
                    {new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {i === 0 && <span style={{ marginLeft: '8px', background: 'rgba(180,79,255,0.2)', color: '#B44FFF', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>ÚLTIMO</span>}
                  </p>
                  <p style={{ fontWeight: 700, fontSize: '16px' }}>{c.weight} kg</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(160,160,176,0.4)', marginBottom: '4px' }}>Body Score</p>
                  <p style={{ fontSize: '20px', fontWeight: 900, background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {c.bodyScore || '—'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: RANK_COLORS[c.rank || ''] || '#B44FFF' }}>
                    {c.rank || '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA CHECK-IN */}
        {daysLeft === 0 && (
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(180,79,255,0.1), rgba(0,217,245,0.1))',
              border: '1px solid rgba(180,79,255,0.3)', borderRadius: '16px', padding: '32px',
            }}>
              <p style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>🔥 ¡Es tu momento!</p>
              <p style={{ color: 'rgba(160,160,176,0.6)', marginBottom: '24px' }}>Han pasado 15 días. La IA está lista para actualizar tu plan.</p>
              <button className="btn-primary" style={{ fontSize: '16px', padding: '14px 40px' }}
                onClick={() => router.push('/checkin')}>
                Hacer mi revisión →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
