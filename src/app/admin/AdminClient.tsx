'use client'
import { useState, useEffect } from 'react'

// ── Event labels ───────────────────────────────────────────────────────────
const EVENT_META: Record<string, { label: string; icon: string; color: string }> = {
  onboarding_step_0_complete: { label: 'Inicio onboarding', icon: '👋', color: '#7B6FFF' },
  onboarding_step_1_complete: { label: 'Datos personales', icon: '📋', color: '#7B6FFF' },
  onboarding_step_2_complete: { label: 'Medidas corporales', icon: '📏', color: '#7B6FFF' },
  onboarding_step_3_complete: { label: 'Objetivo definido', icon: '🎯', color: '#7B6FFF' },
  onboarding_step_4_complete: { label: 'Preferencias listas', icon: '⚙️', color: '#7B6FFF' },
  onboarding_plan_generated:  { label: 'Plan generado ✓', icon: '🎉', color: '#4CAF50' },
  checkin_completed:          { label: 'Check-in completado', icon: '✅', color: '#4CAF50' },
  checkin_started:            { label: 'Check-in iniciado', icon: '📸', color: '#00D9F5' },
  daily_log_saved:            { label: 'Log diario guardado', icon: '📝', color: '#00D9F5' },
  diet_customized:            { label: 'Dieta personalizada', icon: '🥗', color: '#FFB800' },
  plan_accepted:              { label: 'Plan aceptado', icon: '👍', color: '#4CAF50' },
  settings_updated:           { label: 'Ajustes guardados', icon: '🔧', color: '#A8A9AD' },
  badge_earned:               { label: 'Medalla conseguida', icon: '🏅', color: '#FFD700' },
  login:                      { label: 'Inicio de sesión', icon: '🔑', color: '#A8A9AD' },
  signup:                     { label: 'Registro', icon: '🆕', color: '#B44FFF' },
}

function getEventMeta(event: string) {
  if (EVENT_META[event]) return EVENT_META[event]
  // fallback: humanize snake_case
  const label = event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return { label, icon: '•', color: 'rgba(255,255,255,0.4)' }
}

// ── Types ──────────────────────────────────────────────────────────────────
type CheckIn = {
  id: string; createdAt: string; weight: number; bodyScore: number | null
  rank: string | null; goal: string; waist: number | null; hips: number | null
  chest: number | null; arms: number | null; analysis: string | null; dietPlan: string | null
}
type DailyLog = {
  date: string; dietScore: number; trainedToday: boolean
  sleptWell: boolean; waterOk: boolean; disciplineScore: number | null
}
type CoachMsg = { id: string; role: string; content: string; createdAt: string }
type User = {
  id: string; email: string; name: string | null; profilePhotoUrl: string | null
  age: number | null; sex: string | null; createdAt: string
  checkIns: CheckIn[]; badges: { badge: string; earnedAt: string }[]
  preferences: { trainingDays: number | null; equipment: string | null; activityLevel: string | null; weeklyEmailEnabled: boolean; dailyReminderEnabled: boolean } | null
  dailyLogs: DailyLog[]
  coachMessages: CoachMsg[]
}
type AnalyticsStat = { event: string; count: number }
type RecentEvent = { id: string; event: string; userId: string | null; createdAt: string; metadata: string | null }
type Invite = { id: string; token: string; inviterUserId: string; inviteeEmail: string; usedAt: string | null; createdAt: string }

// ── Helpers ────────────────────────────────────────────────────────────────
const RANK_COLORS: Record<string, string> = { Bronce: '#CD7F32', Plata: '#A8A9AD', Oro: '#FFD700', Platino: '#00D9F5', Élite: '#B44FFF' }
function getRankColor(rank: string | null) {
  if (!rank) return '#666'
  for (const [k, c] of Object.entries(RANK_COLORS)) { if (rank.includes(k)) return c }
  return '#666'
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}
function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

// ── Mini SVG line chart ────────────────────────────────────────────────────
function LineChart({ data, color, width = 200, height = 50 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 8) - 4
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - ((v - min) / range) * (height - 8) - 4
        return i === data.length - 1 ? <circle key={i} cx={x} cy={y} r="3" fill={color} /> : null
      })}
    </svg>
  )
}

// ── Bar chart (registrations) ──────────────────────────────────────────────
function BarChart({ data, color = '#B44FFF', width = 300, height = 60 }: { data: { label: string; value: number }[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = Math.floor((width - data.length * 2) / data.length)
  return (
    <svg width={width} height={height + 16} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / max) * height)
        const x = i * (barW + 2)
        return (
          <g key={i}>
            <rect x={x} y={height - h} width={barW} height={h} rx="2" fill={`${color}60`} />
            {d.value > 0 && <title>{d.label}: {d.value}</title>}
          </g>
        )
      })}
    </svg>
  )
}

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ user, size = 40 }: { user: User; size?: number }) {
  if (user.profilePhotoUrl) return <img src={user.profilePhotoUrl} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #B44FFF, #7B6FFF)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: 'white',
    }}>
      {(user.name?.trim() || user.email || '?')[0].toUpperCase()}
    </div>
  )
}

// ── User status helpers ────────────────────────────────────────────────────
function getUserStatus(user: User): 'active' | 'at-risk' | 'inactive' | 'new' {
  if (daysSince(user.createdAt) < 3) return 'new'
  const lastLog = user.dailyLogs[0]
  if (!lastLog) return 'inactive'
  const d = daysSince(lastLog.date)
  if (d <= 1) return 'active'
  if (d <= 4) return 'at-risk'
  return 'inactive'
}
const STATUS_CONFIG = {
  active: { label: 'Activo', color: '#4CAF50' },
  'at-risk': { label: 'En riesgo', color: '#FFB800' },
  inactive: { label: 'Inactivo', color: '#FF6B6B' },
  new: { label: 'Nuevo', color: '#00D9F5' },
}

function isCycleExpired(user: User) {
  const latest = user.checkIns[0]
  if (!latest) return false
  const next = new Date(latest.createdAt)
  next.setDate(next.getDate() + 15)
  return Date.now() > next.getTime()
}

// ── Check-in detail row ────────────────────────────────────────────────────
function CheckInRow({ checkIn }: { checkIn: CheckIn }) {
  const [open, setOpen] = useState(false)
  type PlanData = { calories?: number; protein?: number; carbs?: number; fat?: number; training?: { dias?: number; tipo?: string; rutina?: Array<{ dia: string; nombre: string; ejercicios: Array<{ nombre: string; series: number; reps: string }> }> } }
  let diet: PlanData | null = null
  try {
    if (checkIn.dietPlan) diet = JSON.parse(checkIn.dietPlan) as PlanData
  } catch { /* */ }

  const training = diet?.training

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: checkIn.bodyScore && checkIn.bodyScore >= 70 ? '#4CAF50' : checkIn.bodyScore && checkIn.bodyScore >= 50 ? '#FFB800' : '#FF6B6B' }} />
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{fmtDate(checkIn.createdAt)}</span>
          <span style={{ fontSize: '14px', color: 'white', fontWeight: 700 }}>{checkIn.weight}kg</span>
          {checkIn.bodyScore && <span style={{ fontSize: '12px', color: '#B44FFF', fontWeight: 600 }}>{checkIn.bodyScore} pts</span>}
          {checkIn.rank && <span style={{ fontSize: '11px', color: getRankColor(checkIn.rank), fontWeight: 700 }}>{checkIn.rank}</span>}
        </div>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Measurements */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' }}>
            {[['Cintura', checkIn.waist], ['Caderas', checkIn.hips], ['Pecho', checkIn.chest], ['Brazos', checkIn.arms]].map(([l, v]) => v && (
              <div key={String(l)} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>{v}cm</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{l}</div>
              </div>
            ))}
          </div>
          {/* Macros */}
          {diet && (
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
              {diet.calories && <span style={{ fontSize: '13px', color: '#FFB800', fontWeight: 600 }}>{diet.calories} kcal</span>}
              {diet.protein && <span style={{ fontSize: '13px', color: '#00D9F5' }}>P {diet.protein}g</span>}
              {diet.carbs && <span style={{ fontSize: '13px', color: '#7B6FFF' }}>C {diet.carbs}g</span>}
              {diet.fat && <span style={{ fontSize: '13px', color: '#B44FFF' }}>G {diet.fat}g</span>}
            </div>
          )}
          {/* Training plan */}
          {training?.rutina && training.rutina.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Entrenamiento — {training.dias ?? '?'} días/semana
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {training.rutina.map((d, i) => (
                  <div key={i} style={{ background: 'rgba(180,79,255,0.05)', border: '1px solid rgba(180,79,255,0.12)', borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>{d.nombre || d.dia}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                      {d.ejercicios?.slice(0, 4).map(e => e.nombre).join(' · ')}
                      {d.ejercicios?.length > 4 ? ` +${d.ejercicios.length - 4}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Analysis */}
          {checkIn.analysis && (
            <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxHeight: '100px', overflowY: 'auto' }}>
              {checkIn.analysis}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── User detail ────────────────────────────────────────────────────────────
function UserDetail({ user, onBack }: { user: User; onBack: () => void }) {
  const [tab, setTab] = useState<'overview' | 'checkins' | 'logs' | 'chat'>('overview')
  const latest = user.checkIns[0]
  const status = getUserStatus(user)
  const expired = isCycleExpired(user)

  const weightHistory = [...user.checkIns].reverse().map(c => c.weight)
  const scoreHistory = [...user.checkIns].reverse().filter(c => c.bodyScore).map(c => c.bodyScore as number)

  const logStats = user.dailyLogs.length ? {
    avgDiet: (user.dailyLogs.reduce((s, l) => s + l.dietScore, 0) / user.dailyLogs.length).toFixed(1),
    trainedDays: user.dailyLogs.filter(l => l.trainedToday).length,
    sleptWell: user.dailyLogs.filter(l => l.sleptWell).length,
    waterOk: user.dailyLogs.filter(l => l.waterOk).length,
    avgDiscipline: Math.round(user.dailyLogs.reduce((s, l) => s + (l.disciplineScore ?? 0), 0) / user.dailyLogs.length),
  } : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>← Volver</button>
        <Avatar user={user} size={48} />
        <div>
          <div style={{ fontWeight: 800, fontSize: '18px', color: 'white' }}>{user.name ?? '—'}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{user.email}</div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: STATUS_CONFIG[status].color, background: `${STATUS_CONFIG[status].color}15`, border: `1px solid ${STATUS_CONFIG[status].color}40`, borderRadius: '6px', padding: '3px 10px' }}>{STATUS_CONFIG[status].label}</span>
        {latest?.rank && <span style={{ fontSize: '11px', fontWeight: 700, color: getRankColor(latest.rank), background: `${getRankColor(latest.rank)}15`, border: `1px solid ${getRankColor(latest.rank)}40`, borderRadius: '6px', padding: '3px 10px' }}>{latest.rank}</span>}
        {expired && <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF6B6B', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '6px', padding: '3px 10px' }}>Ciclo vencido</span>}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {([
          { key: 'overview', label: 'Resumen' },
          { key: 'checkins', label: `Check-ins (${user.checkIns.length})` },
          { key: 'logs', label: `Logs (${user.dailyLogs.length})` },
          { key: 'chat', label: `Dr. Jarvis 🤖 (${user.coachMessages.length})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid', borderColor: tab === t.key ? 'rgba(180,79,255,0.5)' : 'rgba(255,255,255,0.1)', background: tab === t.key ? 'rgba(180,79,255,0.15)' : 'transparent', color: tab === t.key ? 'white' : 'rgba(255,255,255,0.4)', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Profile */}
          <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Perfil</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {[['Edad', user.age ? `${user.age} años` : '—'], ['Sexo', user.sex ?? '—'], ['Registrado', fmtDate(user.createdAt)], ['Objetivo', latest?.goal ?? '—'], ['Actividad', user.preferences?.activityLevel ?? '—'], ['Equipo', user.preferences?.equipment ?? '—']].map(([l, v]) => (
                <div key={String(l)}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</div>
                  <div style={{ fontSize: '14px', color: 'white', fontWeight: 500, marginTop: '3px' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Evolution charts */}
          {(weightHistory.length >= 2 || scoreHistory.length >= 2) && (
            <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Evolución</div>
              <div style={{ display: 'grid', gridTemplateColumns: weightHistory.length >= 2 && scoreHistory.length >= 2 ? '1fr 1fr' : '1fr', gap: '20px' }}>
                {weightHistory.length >= 2 && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                      Peso — <span style={{ color: '#00D9F5', fontWeight: 700 }}>{weightHistory[weightHistory.length - 1]}kg</span>
                      {weightHistory.length >= 2 && (
                        <span style={{ color: weightHistory[weightHistory.length - 1] < weightHistory[0] ? '#4CAF50' : '#FF6B6B', marginLeft: '6px', fontSize: '11px' }}>
                          {weightHistory[weightHistory.length - 1] < weightHistory[0] ? '↓' : '↑'}{Math.abs(weightHistory[weightHistory.length - 1] - weightHistory[0]).toFixed(1)}kg
                        </span>
                      )}
                    </div>
                    <LineChart data={weightHistory} color="#00D9F5" width={180} height={44} />
                  </div>
                )}
                {scoreHistory.length >= 2 && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                      Puntuación — <span style={{ color: '#B44FFF', fontWeight: 700 }}>{scoreHistory[scoreHistory.length - 1]} pts</span>
                      <span style={{ color: scoreHistory[scoreHistory.length - 1] > scoreHistory[0] ? '#4CAF50' : '#FF6B6B', marginLeft: '6px', fontSize: '11px' }}>
                        {scoreHistory[scoreHistory.length - 1] > scoreHistory[0] ? '↑' : '↓'}{Math.abs(scoreHistory[scoreHistory.length - 1] - scoreHistory[0])} pts
                      </span>
                    </div>
                    <LineChart data={scoreHistory} color="#B44FFF" width={180} height={44} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Latest check-in stats */}
          {latest && (
            <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Último check-in — {fmtDate(latest.createdAt)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[['Peso', `${latest.weight}kg`], ['Puntuación', latest.bodyScore ?? '—'], ['Cintura', latest.waist ? `${latest.waist}cm` : '—'], ['Caderas', latest.hips ? `${latest.hips}cm` : '—'], ['Pecho', latest.chest ? `${latest.chest}cm` : '—'], ['Brazos', latest.arms ? `${latest.arms}cm` : '—']].map(([l, v]) => (
                  <div key={String(l)}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</div>
                    <div style={{ fontSize: '15px', color: 'white', fontWeight: 700, marginTop: '3px' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discipline */}
          {logStats && (
            <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Disciplina (últimos {user.dailyLogs.length} días)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {[['Disc. media', `${logStats.avgDiscipline}%`, '#B44FFF'], ['Dieta media', `${logStats.avgDiet}/5`, '#00D9F5'], ['Entrenos', logStats.trainedDays, '#4CAF50'], ['Buen sueño', logStats.sleptWell, '#7B6FFF'], ['Agua ok', logStats.waterOk, '#FFB800']].map(([l, v, c]) => (
                  <div key={String(l)} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 8px' }}>
                    <div style={{ fontSize: '19px', fontWeight: 800, color: String(c), lineHeight: 1 }}>{v}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {user.badges.length > 0 && (
            <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Medallas ({user.badges.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {user.badges.map(b => <span key={b.badge} style={{ background: 'rgba(180,79,255,0.1)', border: '1px solid rgba(180,79,255,0.3)', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', color: '#B44FFF' }}>{b.badge}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'checkins' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {user.checkIns.length === 0
            ? <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px' }}>Sin check-ins</div>
            : user.checkIns.map(c => <CheckInRow key={c.id} checkIn={c} />)
          }
        </div>
      )}

      {tab === 'logs' && (
        <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
          {user.dailyLogs.length === 0
            ? <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px' }}>Sin logs</div>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Fecha', 'Dieta', 'Entreno', 'Sueño', 'Agua', 'Disc.'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.35)', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {user.dailyLogs.map((l, i) => (
                    <tr key={l.date} style={{ borderBottom: i < user.dailyLogs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.55)' }}>{fmtDateShort(l.date)}</td>
                      <td style={{ padding: '10px 14px', color: 'white', fontWeight: 700 }}>{l.dietScore}/5</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ color: l.trainedToday ? '#4CAF50' : '#FF6B6B' }}>{l.trainedToday ? '✓' : '✗'}</span></td>
                      <td style={{ padding: '10px 14px' }}><span style={{ color: l.sleptWell ? '#4CAF50' : '#FF6B6B' }}>{l.sleptWell ? '✓' : '✗'}</span></td>
                      <td style={{ padding: '10px 14px' }}><span style={{ color: l.waterOk ? '#4CAF50' : '#FF6B6B' }}>{l.waterOk ? '✓' : '✗'}</span></td>
                      <td style={{ padding: '10px 14px', color: '#B44FFF', fontWeight: 700 }}>{l.disciplineScore ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {tab === 'chat' && (
        <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
          {user.coachMessages.length === 0
            ? <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px' }}>Sin conversaciones con Dr. Jarvis</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '16px', maxHeight: '600px', overflowY: 'auto' }}>
                {user.coachMessages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '2px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginBottom: '3px' }}>
                      {msg.role === 'user' ? '👤 Usuario' : '🤖 Dr. Jarvis'} · {new Date(msg.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: msg.role === 'user' ? 'rgba(180,79,255,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${msg.role === 'user' ? 'rgba(180,79,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}

// ── User card ──────────────────────────────────────────────────────────────
function UserCard({ user, onSelect }: { user: User; onSelect: () => void }) {
  const latest = user.checkIns[0]
  const status = getUserStatus(user)
  const expired = isCycleExpired(user)
  const avgDisc = user.dailyLogs.length ? Math.round(user.dailyLogs.reduce((s, l) => s + (l.disciplineScore ?? 0), 0) / user.dailyLogs.length) : null
  const weightHistory = [...user.checkIns].reverse().map(c => c.weight)

  return (
    <div onClick={onSelect} style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '18px', cursor: 'pointer', transition: 'all 0.15s ease', position: 'relative' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(180,79,255,0.4)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
    >
      {/* Status dot */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: '4px', alignItems: 'center' }}>
        {expired && <span style={{ fontSize: '9px', color: '#FF6B6B', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '4px', padding: '2px 5px', fontWeight: 700 }}>Ciclo vencido</span>}
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_CONFIG[status].color, boxShadow: `0 0 6px ${STATUS_CONFIG[status].color}` }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', paddingRight: '80px' }}>
        <Avatar user={user} size={40} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name ?? '—'}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
        {[['Check-ins', user.checkIns.length], ['Puntos', latest?.bodyScore ?? '—'], ['Peso', latest ? `${latest.weight}kg` : '—'], ['Disc.', avgDisc !== null ? `${avgDisc}%` : '—']].map(([l, v]) => (
          <div key={String(l)} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{l}</div>
          </div>
        ))}
      </div>

      {weightHistory.length >= 2 && (
        <div style={{ marginBottom: '8px' }}>
          <LineChart data={weightHistory} color="#00D9F5" width={240} height={30} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>Registro {fmtDateShort(user.createdAt)}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {latest?.rank && <span style={{ fontSize: '9px', fontWeight: 700, color: getRankColor(latest.rank), background: `${getRankColor(latest.rank)}15`, border: `1px solid ${getRankColor(latest.rank)}30`, borderRadius: '3px', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{latest.rank}</span>}
          <span style={{ fontSize: '10px', color: STATUS_CONFIG[status].color }}>{STATUS_CONFIG[status].label}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminClient({ users, analytics, recentEvents, invites }: {
  users: User[]; analytics: AnalyticsStat[]; recentEvents: RecentEvent[]; invites: Invite[]
}) {
  const [view, setView] = useState<'dashboard' | 'users' | 'invites'>('dashboard')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'at-risk' | 'inactive'>('all')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [inviteError, setInviteError] = useState('')
  const [chartWidth, setChartWidth] = useState(600)
  useEffect(() => { setChartWidth(Math.min(800, window.innerWidth - 80)) }, [])

  async function sendAdminInvite() {
    if (!inviteEmail.trim()) return
    setInviteStatus('loading')
    setInviteError('')
    try {
      const res = await fetch('/api/admin/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail.trim() }) })
      const data = await res.json()
      if (!res.ok) { setInviteStatus('error'); setInviteError(data.error ?? 'Error'); return }
      setInviteStatus('ok')
      setInviteEmail('')
      setTimeout(() => setInviteStatus('idle'), 3000)
    } catch { setInviteStatus('error'); setInviteError('Error de red') }
  }

  // ── Global stats ──
  const totalCheckIns = users.reduce((s, u) => s + u.checkIns.length, 0)
  const totalLogs = users.reduce((s, u) => s + u.dailyLogs.length, 0)
  const avgScore = (() => {
    const scored = users.filter(u => u.checkIns[0]?.bodyScore)
    return scored.length ? Math.round(scored.reduce((s, u) => s + (u.checkIns[0].bodyScore as number), 0) / scored.length) : 0
  })()
  const activeToday = users.filter(u => {
    const l = u.dailyLogs[0]
    return l && daysSince(l.date) <= 1
  }).length
  const atRisk = users.filter(u => getUserStatus(u) === 'at-risk').length
  const inactive = users.filter(u => getUserStatus(u) === 'inactive').length
  const cycleExpired = users.filter(isCycleExpired).length

  // ── Registration by day (last 30d) ──
  const now = Date.now()
  const regByDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now - (29 - i) * 86400000)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    return {
      label: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      value: users.filter(u => { const t = new Date(u.createdAt).getTime(); return t >= d.getTime() && t < next.getTime() }).length,
    }
  })

  // ── Filtered users ──
  const filtered = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) || (u.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || getUserStatus(u) === statusFilter
    return matchSearch && matchStatus
  })

  // ── User lookup map for events ──
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  if (selectedUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#07080F', color: 'white', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 20px' }}>
          <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ background: 'linear-gradient(135deg, #B44FFF, #7B6FFF 50%, #00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AngelAI</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: '6px', fontSize: '13px' }}>Admin</span>
          </div>
          <a href="/dashboard" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← App</a>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[['dashboard', 'Dashboard'], ['users', `Usuarios (${users.length})`], ['invites', `Invitaciones (${invites.length})`]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v as typeof view)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid', borderColor: view === v ? 'rgba(180,79,255,0.5)' : 'rgba(255,255,255,0.1)', background: view === v ? 'rgba(180,79,255,0.15)' : 'transparent', color: view === v ? 'white' : 'rgba(255,255,255,0.45)', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>{l}</button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {view === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { label: 'Usuarios', value: users.length, color: '#B44FFF' },
                { label: 'Activos hoy', value: activeToday, color: '#4CAF50' },
                { label: 'En riesgo', value: atRisk, color: '#FFB800' },
                { label: 'Inactivos', value: inactive, color: '#FF6B6B' },
                { label: 'Check-ins totales', value: totalCheckIns, color: '#00D9F5' },
                { label: 'Logs totales', value: totalLogs, color: '#7B6FFF' },
                { label: 'Puntuación media', value: avgScore, color: '#FFD700' },
                { label: 'Ciclos vencidos', value: cycleExpired, color: '#FF6B6B' },
              ].map(s => (
                <div key={s.label} style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Alerts */}
            {(atRisk > 0 || inactive > 0 || cycleExpired > 0) && (
              <div style={{ background: '#0C0D16', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Alertas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {users.filter(u => getUserStatus(u) === 'inactive').slice(0, 5).map(u => (
                    <div key={u.id} onClick={() => setSelectedUser(u)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,107,107,0.05)', border: '1px solid rgba(255,107,107,0.1)' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF6B6B', flexShrink: 0 }} />
                      <Avatar user={u} size={28} />
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', flex: 1 }}>{u.name ?? u.email}</span>
                      <span style={{ fontSize: '11px', color: '#FF6B6B' }}>Sin log {u.dailyLogs[0] ? `desde hace ${daysSince(u.dailyLogs[0].date)} días` : '(nunca)'}</span>
                    </div>
                  ))}
                  {users.filter(u => isCycleExpired(u)).slice(0, 3).map(u => (
                    <div key={u.id + '_exp'} onClick={() => setSelectedUser(u)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.12)' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFB800', flexShrink: 0 }} />
                      <Avatar user={u} size={28} />
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', flex: 1 }}>{u.name ?? u.email}</span>
                      <span style={{ fontSize: '11px', color: '#FFB800' }}>Ciclo vencido</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registration chart */}
            <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Registros últimos 30 días</div>
              <BarChart data={regByDay} color="#B44FFF" width={chartWidth} height={60} />
            </div>

            {/* Activity feed + analytics side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Activity feed */}
              <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Actividad reciente</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {recentEvents.slice(0, 15).map(e => {
                    const u = e.userId ? userMap[e.userId] : null
                    const meta = getEventMeta(e.event)
                    return (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
                        <span style={{ fontSize: '16px', flexShrink: 0, width: 24, textAlign: 'center' }}>{meta.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', color: 'white', fontWeight: 600, lineHeight: 1.2 }}>{meta.label}</div>
                          {u && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>{u.name ?? u.email.split('@')[0]}</div>}
                        </div>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{fmtDateShort(e.createdAt)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Analytics events */}
              <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Eventos analytics</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analytics.map(a => {
                    const maxCount = analytics[0]?.count ?? 1
                    const pct = (a.count / maxCount) * 100
                    const meta = getEventMeta(a.event)
                    return (
                      <div key={a.event}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px' }}>{meta.icon}</span>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', flex: 1 }}>{meta.label}</span>
                          <span style={{ fontSize: '13px', color: meta.color, fontWeight: 700 }}>{a.count}</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}99)`, borderRadius: '2px' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {view === 'users' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o email..." style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', padding: '10px 14px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
              {(['all', 'active', 'at-risk', 'inactive'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid', borderColor: statusFilter === s ? 'rgba(180,79,255,0.5)' : 'rgba(255,255,255,0.1)', background: statusFilter === s ? 'rgba(180,79,255,0.15)' : 'transparent', color: statusFilter === s ? 'white' : 'rgba(255,255,255,0.4)', fontFamily: 'inherit', fontSize: '12px', cursor: 'pointer' }}>
                  {s === 'all' ? 'Todos' : s === 'active' ? 'Activos' : s === 'at-risk' ? 'En riesgo' : 'Inactivos'}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
              {filtered.map(u => <UserCard key={u.id} user={u} onSelect={() => setSelectedUser(u)} />)}
              {filtered.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.25)' }}>No se encontraron usuarios</div>}
            </div>
          </div>
        )}

        {/* ── INVITES ── */}
        {view === 'invites' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Admin invite form */}
            <div style={{ background: '#0C0D16', border: '1px solid rgba(180,79,255,0.25)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Invitar usuario</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendAdminInvite()}
                  placeholder="email@ejemplo.com"
                  style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                />
                <button
                  onClick={sendAdminInvite}
                  disabled={inviteStatus === 'loading' || !inviteEmail.trim()}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: inviteStatus === 'ok' ? '#4CAF50' : '#B44FFF', color: 'white', fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: inviteStatus === 'loading' ? 0.6 : 1 }}
                >
                  {inviteStatus === 'loading' ? 'Enviando...' : inviteStatus === 'ok' ? '¡Enviado!' : 'Invitar'}
                </button>
              </div>
              {inviteStatus === 'error' && <div style={{ marginTop: '8px', fontSize: '13px', color: '#FF6B6B' }}>{inviteError}</div>}
            </div>

            {invites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.25)' }}>No hay invitaciones</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '6px' }}>
                  {[['Total', invites.length, '#B44FFF'], ['Usadas', invites.filter(i => i.usedAt).length, '#4CAF50'], ['Pendientes', invites.filter(i => !i.usedAt).length, '#FFB800']].map(([l, v, c]) => (
                    <div key={String(l)} style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: String(c), letterSpacing: '-1px', lineHeight: 1 }}>{v}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Invitado', 'Invitado por', 'Estado', 'Fecha', 'URL'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.35)', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((inv, i) => {
                        const inviter = userMap[inv.inviterUserId]
                        return (
                          <tr key={inv.id} style={{ borderBottom: i < invites.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                            <td style={{ padding: '11px 16px', color: 'white' }}>{inv.inviteeEmail}</td>
                            <td style={{ padding: '11px 16px' }}>
                              {inviter ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Avatar user={inviter} size={20} />
                                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{inviter.name ?? inviter.email.split('@')[0]}</span>
                                </div>
                              ) : <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>—</span>}
                            </td>
                            <td style={{ padding: '11px 16px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: inv.usedAt ? '#4CAF50' : '#FFB800', background: inv.usedAt ? 'rgba(76,175,80,0.1)' : 'rgba(255,184,0,0.1)', border: `1px solid ${inv.usedAt ? 'rgba(76,175,80,0.3)' : 'rgba(255,184,0,0.3)'}`, borderRadius: '4px', padding: '2px 8px' }}>
                                {inv.usedAt ? 'Usada' : 'Pendiente'}
                              </span>
                            </td>
                            <td style={{ padding: '11px 16px', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{fmtDate(inv.createdAt)}</td>
                            <td style={{ padding: '11px 16px' }}>
                              {!inv.usedAt && (
                                <button
                                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite?token=${inv.token}`)}
                                  style={{ fontSize: '11px', color: '#B44FFF', background: 'rgba(180,79,255,0.1)', border: '1px solid rgba(180,79,255,0.2)', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                  Copiar
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
