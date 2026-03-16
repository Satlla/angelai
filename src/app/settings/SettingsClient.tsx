'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'


const ACTIVITY_OPTIONS = [
  { value: 'sedentario', label: 'Sedentario', desc: 'Oficina, sin ejercicio' },
  { value: 'ligero', label: 'Ligero', desc: '1–2 días/sem' },
  { value: 'moderado', label: 'Moderado', desc: '3–4 días/sem' },
  { value: 'activo', label: 'Activo', desc: '5–6 días/sem' },
  { value: 'atletico', label: 'Atlético', desc: 'Doble sesión' },
]

type MeasurementsData = {
  weight: number | null
  waist: number | null
  hips: number | null
  chest: number | null
  arms: number | null
  bicepFlexed: number | null
  thighs: number | null
  calves: number | null
  shoulders: number | null
}

export default function SettingsClient({
  email, profilePhotoUrl: initialPhotoUrl, defaultName, defaultAge, defaultSex,
  height: initialHeight, activityLevel: initialActivityLevel,
  dietNotes: initialDietNotes,
  weeklyEmailEnabled: initialWeeklyEmail,
  dailyReminderEnabled: initialDailyReminder,
  measurements: initialMeasurements,
  hasCheckIn,
}: {
  email: string
  profilePhotoUrl: string | null
  defaultName: string
  defaultAge: string
  defaultSex: string
  height: number | null
  activityLevel: string | null
  dietNotes: string
  weeklyEmailEnabled: boolean
  dailyReminderEnabled: boolean
  measurements: MeasurementsData
  hasCheckIn: boolean
}) {
  const [name, setName] = useState(defaultName)
  const [age, setAge] = useState(defaultAge)
  const [sex, setSex] = useState(defaultSex)
  const [height, setHeight] = useState(initialHeight ? String(initialHeight) : '')
  const [activityLevel, setActivityLevel] = useState(initialActivityLevel || '')
  const [dietNotes, setDietNotes] = useState(initialDietNotes)
  const [weeklyEmailEnabled, setWeeklyEmailEnabled] = useState(initialWeeklyEmail)
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(initialDailyReminder)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [profilePhoto, setProfilePhoto] = useState<string | null>(initialPhotoUrl)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [lm, setLm] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Medidas corporales
  const [mWeight,      setMWeight]      = useState(initialMeasurements.weight      != null ? String(initialMeasurements.weight)      : '')
  const [mWaist,       setMWaist]       = useState(initialMeasurements.waist       != null ? String(initialMeasurements.waist)       : '')
  const [mHips,        setMHips]        = useState(initialMeasurements.hips        != null ? String(initialMeasurements.hips)        : '')
  const [mChest,       setMChest]       = useState(initialMeasurements.chest       != null ? String(initialMeasurements.chest)       : '')
  const [mArms,        setMArms]        = useState(initialMeasurements.arms        != null ? String(initialMeasurements.arms)        : '')
  const [mBicepFlexed, setMBicepFlexed] = useState(initialMeasurements.bicepFlexed != null ? String(initialMeasurements.bicepFlexed) : '')
  const [mThighs,      setMThighs]      = useState(initialMeasurements.thighs      != null ? String(initialMeasurements.thighs)      : '')
  const [mCalves,      setMCalves]      = useState(initialMeasurements.calves      != null ? String(initialMeasurements.calves)      : '')
  const [mShoulders,   setMShoulders]   = useState(initialMeasurements.shoulders   != null ? String(initialMeasurements.shoulders)   : '')
  const [mSaving,      setMSaving]      = useState(false)
  const [mSaved,       setMSaved]       = useState(false)
  const [mError,       setMError]       = useState('')

  useEffect(() => {
    setLm(localStorage.getItem('angelai_theme') === 'light')
  }, [])

  const bg = lm ? '#F5F5F7' : '#07080F'
  const cardBg = lm ? '#ffffff' : '#0C0D16'
  const cardBorder = lm ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'
  const text = lm ? '#1a1a2e' : 'white'
  const textMuted = lm ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)'
  const textFaint = lm ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.35)'
  const inputBg = lm ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'
  const inputBorder = lm ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)'
  const headerBg = lm ? 'rgba(245,245,247,0.96)' : 'rgba(7,8,15,0.94)'
  const headerBorder = lm ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    const form = new FormData()
    form.append('photo', file)
    try {
      const res = await fetch('/api/profile/photo', { method: 'POST', body: form })
      if (res.ok) {
        const data = await res.json()
        setProfilePhoto(data.url)
      }
    } finally {
      setPhotoUploading(false)
      e.target.value = ''
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const [profileRes, prefsRes] = await Promise.all([
        fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, ...(age ? { age: parseInt(age) } : {}), ...(sex ? { sex } : {}) }),
        }),
        fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dietNotes,
            weeklyEmailEnabled,
            dailyReminderEnabled,
            ...(height ? { height: parseFloat(height) } : {}),
            ...(activityLevel ? { activityLevel } : {}),
          }),
        }),
      ])

      if (!profileRes.ok) throw new Error()
      if (!prefsRes.ok) throw new Error()

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveMeasurements(e: React.FormEvent) {
    e.preventDefault()
    if (!hasCheckIn) return
    setMSaving(true)
    setMError('')
    setMSaved(false)
    const payload: Record<string, number | null> = {
      ...(mWeight      ? { weight:      parseFloat(mWeight) }      : {}),
      waist:       mWaist       ? parseFloat(mWaist)       : null,
      hips:        mHips        ? parseFloat(mHips)        : null,
      chest:       mChest       ? parseFloat(mChest)       : null,
      arms:        mArms        ? parseFloat(mArms)        : null,
      bicepFlexed: mBicepFlexed ? parseFloat(mBicepFlexed) : null,
      thighs:      mThighs      ? parseFloat(mThighs)      : null,
      calves:      mCalves      ? parseFloat(mCalves)      : null,
      shoulders:   mShoulders   ? parseFloat(mShoulders)   : null,
    }
    try {
      const res = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      setMSaved(true)
      setTimeout(() => setMSaved(false), 3000)
    } catch {
      setMError('Error al guardar medidas. Inténtalo de nuevo.')
    } finally {
      setMSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: headerBg, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${headerBorder}`,
      }}>
        <div style={{
          maxWidth: '480px', margin: '0 auto', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <button
            onClick={() => router.back()}
            style={{
              background: lm ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: textMuted, flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px', color: text }}>Mi perfil</h1>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 20px 48px' }}>

        {/* Foto de perfil */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', gap: '12px' }}>
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: lm ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', border: '2px dashed rgba(180,79,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden', padding: 0, position: 'relative',
            }}
          >
            {profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profilePhoto} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '24px', fontWeight: 800, color: textFaint, letterSpacing: '-1px' }}>
                {(name || email).slice(0, 2).toUpperCase()}
              </span>
            )}
            {photoUploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="10" cy="10" r="8" fill="none" stroke="white" strokeWidth="2" strokeDasharray="40" strokeDashoffset="15" strokeLinecap="round"/>
                </svg>
              </div>
            )}
          </button>
          <p style={{ fontSize: '12px', color: textFaint, margin: 0 }}>
            Toca para cambiar foto
          </p>
          <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
        </div>

        {/* Email — solo lectura */}
        <div style={{
          background: cardBg, border: `1px solid ${cardBorder}`,
          borderRadius: '14px', padding: '16px 18px', marginBottom: '24px',
        }}>
          <p style={{ fontSize: '11px', color: textFaint, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
            Email
          </p>
          <p style={{ fontSize: '15px', color: textMuted }}>{email}</p>
        </div>

        {/* Nombre */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: textFaint, fontWeight: 500, display: 'block', marginBottom: '8px' }}>
            Nombre
          </label>
          <input
            type="text" placeholder="Tu nombre" value={name}
            onChange={e => setName(e.target.value)}
            className="input-field" style={{ fontSize: '16px', background: inputBg, border: `1px solid ${inputBorder}`, color: text }}
          />
        </div>

        {/* Edad */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: textFaint, fontWeight: 500, display: 'block', marginBottom: '8px' }}>
            Edad
          </label>
          <div className="input-with-unit" style={{ maxWidth: '140px' }}>
            <input
              type="number" placeholder="28" value={age}
              onChange={e => setAge(e.target.value)}
              className="input-field" style={{ fontSize: '16px', background: inputBg, border: `1px solid ${inputBorder}`, color: text }}
              min="15" max="99"
            />
            <span className="input-unit" style={{ color: textMuted }}>años</span>
          </div>
        </div>

        {/* Sexo */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ fontSize: '12px', color: textFaint, fontWeight: 500, display: 'block', marginBottom: '8px' }}>
            Sexo
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['mujer', 'hombre'].map(s => (
              <button key={s} type="button" onClick={() => setSex(s)}
                className={`toggle-btn ${sex === s ? 'active' : ''}`}
                style={{
                  textTransform: 'capitalize',
                  border: `1px solid ${sex === s ? 'rgba(180,79,255,0.5)' : cardBorder}`,
                  background: sex === s ? 'rgba(180,79,255,0.15)' : 'transparent',
                  color: sex === s ? (lm ? '#8B2FD6' : 'white') : textMuted,
                }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Altura */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: textFaint, fontWeight: 500, display: 'block', marginBottom: '8px' }}>
            Altura
          </label>
          <div className="input-with-unit" style={{ maxWidth: '140px' }}>
            <input
              type="number" placeholder="175" value={height}
              onChange={e => setHeight(e.target.value)}
              className="input-field" style={{ fontSize: '16px', background: inputBg, border: `1px solid ${inputBorder}`, color: text }}
              min="100" max="250" step="0.1"
            />
            <span className="input-unit" style={{ color: textMuted }}>cm</span>
          </div>
        </div>

        {/* Nivel de actividad */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ fontSize: '12px', color: textFaint, fontWeight: 500, display: 'block', marginBottom: '10px' }}>
            Nivel de actividad
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ACTIVITY_OPTIONS.map(opt => (
              <button
                key={opt.value} type="button"
                onClick={() => setActivityLevel(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 500, fontFamily: 'inherit', textAlign: 'left' as const,
                  background: activityLevel === opt.value ? 'rgba(180,79,255,0.12)' : inputBg,
                  border: `1px solid ${activityLevel === opt.value ? 'rgba(180,79,255,0.4)' : inputBorder}`,
                  color: activityLevel === opt.value ? '#B44FFF' : textMuted,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{opt.label}</span>
                <span style={{ fontSize: '12px', color: textFaint, fontWeight: 400 }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preferencias de dieta */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', color: textFaint, fontWeight: 500, display: 'block', marginBottom: '8px' }}>
            Preferencias / intolerancias alimentarias
          </label>
          <textarea
            value={dietNotes}
            onChange={e => setDietNotes(e.target.value)}
            placeholder="Ej: intolerante a la lactosa, no como cerdo, alérgico a los frutos secos..."
            rows={3}
            style={{
              width: '100%', background: inputBg,
              border: `1px solid ${inputBorder}`, borderRadius: '12px',
              color: text, padding: '14px 16px', fontSize: '15px',
              fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.5,
            }}
          />
        </div>

        {/* Medidas corporales */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '12px', color: textFaint, fontWeight: 500, marginBottom: '14px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Medidas corporales
          </p>
          {!hasCheckIn ? (
            <div style={{ background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: textMuted }}>
              Completa tu primer check-in para poder editar medidas.
            </div>
          ) : (
            <form onSubmit={handleSaveMeasurements} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Peso */}
                <div>
                  <label style={{ fontSize: '11px', color: textFaint, fontWeight: 500, display: 'block', marginBottom: '6px' }}>Peso</label>
                  <div className="input-with-unit" style={{ maxWidth: '140px' }}>
                    <input type="number" placeholder="70" value={mWeight} onChange={e => setMWeight(e.target.value)}
                      className="input-field" style={{ fontSize: '16px', background: inputBg, border: `1px solid ${inputBorder}`, color: text }}
                      min="30" max="300" step="0.1" />
                    <span className="input-unit" style={{ color: textMuted }}>kg</span>
                  </div>
                </div>

                <div style={{ height: '1px', background: cardBorder }} />

                {/* Grid 2 cols */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {([
                    ['Cintura',           mWaist,       setMWaist],
                    ['Cadera',            mHips,        setMHips],
                    ['Pecho',             mChest,       setMChest],
                    ['Muslo',             mThighs,      setMThighs],
                    ['Gemelo',            mCalves,      setMCalves],
                    ['Hombros',           mShoulders,   setMShoulders],
                  ] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
                    <div key={label}>
                      <label style={{ fontSize: '11px', color: textFaint, fontWeight: 500, display: 'block', marginBottom: '6px' }}>{label}</label>
                      <div className="input-with-unit">
                        <input type="number" placeholder="—" value={val} onChange={e => setter(e.target.value)}
                          className="input-field" style={{ fontSize: '15px', background: inputBg, border: `1px solid ${inputBorder}`, color: text }}
                          min="10" max="250" step="0.5" />
                        <span className="input-unit" style={{ color: textMuted }}>cm</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ height: '1px', background: cardBorder }} />

                {/* Bíceps */}
                <div>
                  <p style={{ fontSize: '11px', color: textFaint, fontWeight: 500, marginBottom: '10px' }}>Bíceps</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: textFaint, fontWeight: 400, display: 'block', marginBottom: '6px' }}>En reposo</label>
                      <div className="input-with-unit">
                        <input type="number" placeholder="—" value={mArms} onChange={e => setMArms(e.target.value)}
                          className="input-field" style={{ fontSize: '15px', background: inputBg, border: `1px solid ${inputBorder}`, color: text }}
                          min="10" max="100" step="0.5" />
                        <span className="input-unit" style={{ color: textMuted }}>cm</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: textFaint, fontWeight: 400, display: 'block', marginBottom: '6px' }}>Haciendo fuerza</label>
                      <div className="input-with-unit">
                        <input type="number" placeholder="—" value={mBicepFlexed} onChange={e => setMBicepFlexed(e.target.value)}
                          className="input-field" style={{ fontSize: '15px', background: inputBg, border: `1px solid ${inputBorder}`, color: text }}
                          min="10" max="100" step="0.5" />
                        <span className="input-unit" style={{ color: textMuted }}>cm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {mError && <p style={{ color: '#FF6B6B', fontSize: '13px', margin: '10px 0 0', textAlign: 'center' }}>{mError}</p>}

              <button type="submit" disabled={mSaving}
                style={{
                  marginTop: '12px', width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                  background: mSaved ? '#4CAF50' : 'rgba(180,79,255,0.15)',
                  color: mSaved ? 'white' : '#B44FFF',
                  fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                  border: `1px solid ${mSaved ? '#4CAF50' : 'rgba(180,79,255,0.3)'}`,
                }}>
                {mSaving ? 'Guardando...' : mSaved ? '¡Medidas guardadas!' : 'Guardar medidas'}
              </button>
            </form>
          )}
        </div>

        {/* Notificaciones */}
        <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '12px', color: textFaint, fontWeight: 500, marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Notificaciones
          </p>

          {/* Toggle email semanal */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: inputBg, border: `1px solid ${cardBorder}`,
            borderRadius: '12px', padding: '14px 16px',
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: textMuted, marginBottom: '2px' }}>
                Resumen semanal por email
              </p>
              <p style={{ fontSize: '12px', color: textFaint }}>
                Cada lunes recibes un resumen de tu semana
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWeeklyEmailEnabled(!weeklyEmailEnabled)}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                background: weeklyEmailEnabled ? '#B44FFF' : lm ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
                cursor: 'pointer', position: 'relative', flexShrink: 0,
                transition: 'background 0.2s ease',
              }}
            >
              <span style={{
                position: 'absolute', top: '2px',
                left: weeklyEmailEnabled ? '22px' : '2px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: 'white', transition: 'left 0.2s ease',
              }} />
            </button>
          </div>

          {/* Toggle recordatorio diario */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: inputBg, border: `1px solid ${cardBorder}`,
            borderRadius: '12px', padding: '14px 16px',
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: textMuted, marginBottom: '2px' }}>
                Recordatorio diario
              </p>
              <p style={{ fontSize: '12px', color: textFaint }}>
                Aviso en la app a partir de las 22:00 si no has registrado el día
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDailyReminderEnabled(!dailyReminderEnabled)}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                background: dailyReminderEnabled ? '#B44FFF' : lm ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
                cursor: 'pointer', position: 'relative', flexShrink: 0,
                transition: 'background 0.2s ease',
              }}
            >
              <span style={{
                position: 'absolute', top: '2px',
                left: dailyReminderEnabled ? '22px' : '2px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: 'white', transition: 'left 0.2s ease',
              }} />
            </button>
          </div>
        </div>

        {error && (
          <p style={{ color: '#FF6B6B', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>
        )}

        <button
          type="submit" className="btn-primary"
          style={{ width: '100%', padding: '16px', fontSize: '15px' }}
          disabled={saving}
        >
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>

        {/* Invitar */}
        <a
          href="/invite"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(180,79,255,0.05)', border: '1px solid rgba(180,79,255,0.2)',
            borderRadius: '12px', padding: '14px 16px', marginTop: '12px', marginBottom: '20px',
            textDecoration: 'none',
          }}
        >
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(180,79,255,0.9)', marginBottom: '2px' }}>
              ✉️ Invitar a alguien especial
            </p>
            <p style={{ fontSize: '12px', color: textFaint }}>
              Tienes 1 invitación disponible
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="rgba(180,79,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>

        {/* Disclaimer legal */}
        <div style={{
          marginTop: '40px', padding: '16px 18px',
          background: inputBg, border: `1px solid ${cardBorder}`,
          borderRadius: '12px',
        }}>
          <p style={{ fontSize: '11px', color: textFaint, lineHeight: 1.7 }}>
            <strong style={{ color: textMuted }}>Aviso legal:</strong> Los planes generados por AngelAI son orientativos y se basan en inteligencia artificial. No sustituyen el consejo de un dietista-nutricionista o médico colegiado. Consulta a un profesional de la salud antes de realizar cambios significativos en tu dieta o entrenamiento.
          </p>
        </div>
      </form>
    </div>
  )
}
