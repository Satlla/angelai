'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'


const ACTIVITY_OPTIONS = [
  { value: 'sedentario', label: 'Sedentario', desc: 'Oficina, sin ejercicio' },
  { value: 'ligero', label: 'Ligero', desc: '1–2 días/sem' },
  { value: 'moderado', label: 'Moderado', desc: '3–4 días/sem' },
  { value: 'activo', label: 'Activo', desc: '5–6 días/sem' },
  { value: 'atletico', label: 'Atlético', desc: 'Doble sesión' },
]

export default function SettingsClient({
  email, defaultName, defaultAge, defaultSex,
  height: initialHeight, activityLevel: initialActivityLevel,
  dietNotes: initialDietNotes,
  weeklyEmailEnabled: initialWeeklyEmail,
}: {
  email: string
  defaultName: string
  defaultAge: string
  defaultSex: string
  height: number | null
  activityLevel: string | null
  dietNotes: string
  weeklyEmailEnabled: boolean
}) {
  const [name, setName] = useState(defaultName)
  const [age, setAge] = useState(defaultAge)
  const [sex, setSex] = useState(defaultSex)
  const [height, setHeight] = useState(initialHeight ? String(initialHeight) : '')
  const [activityLevel, setActivityLevel] = useState(initialActivityLevel || '')
  const [dietNotes, setDietNotes] = useState(initialDietNotes)
  const [weeklyEmailEnabled, setWeeklyEmailEnabled] = useState(initialWeeklyEmail)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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
          body: JSON.stringify({ name, age, sex }),
        }),
        fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dietNotes,
            weeklyEmailEnabled,
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

  return (
    <div style={{ minHeight: '100vh', background: '#07080F' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(7,8,15,0.94)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          maxWidth: '480px', margin: '0 auto', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.6)', flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px' }}>Mi perfil</h1>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 20px 48px' }}>

        {/* Email — solo lectura */}
        <div style={{
          background: '#0C0D16', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px', padding: '16px 18px', marginBottom: '24px',
        }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
            Email
          </p>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)' }}>{email}</p>
        </div>

        {/* Nombre */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
            Nombre
          </label>
          <input
            type="text" placeholder="Tu nombre" value={name}
            onChange={e => setName(e.target.value)}
            className="input-field" style={{ fontSize: '16px' }}
          />
        </div>

        {/* Edad */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
            Edad
          </label>
          <div className="input-with-unit" style={{ maxWidth: '140px' }}>
            <input
              type="number" placeholder="28" value={age}
              onChange={e => setAge(e.target.value)}
              className="input-field" style={{ fontSize: '16px' }}
              min="15" max="99"
            />
            <span className="input-unit">años</span>
          </div>
        </div>

        {/* Sexo */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
            Sexo
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['mujer', 'hombre'].map(s => (
              <button key={s} type="button" onClick={() => setSex(s)}
                className={`toggle-btn ${sex === s ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Altura */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
            Altura
          </label>
          <div className="input-with-unit" style={{ maxWidth: '140px' }}>
            <input
              type="number" placeholder="175" value={height}
              onChange={e => setHeight(e.target.value)}
              className="input-field" style={{ fontSize: '16px' }}
              min="100" max="250" step="0.1"
            />
            <span className="input-unit">cm</span>
          </div>
        </div>

        {/* Nivel de actividad */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, display: 'block', marginBottom: '10px' }}>
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
                  background: activityLevel === opt.value ? 'rgba(180,79,255,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${activityLevel === opt.value ? 'rgba(180,79,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  color: activityLevel === opt.value ? '#B44FFF' : 'rgba(255,255,255,0.55)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{opt.label}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontWeight: 400 }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preferencias de dieta */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
            Preferencias / intolerancias alimentarias
          </label>
          <textarea
            value={dietNotes}
            onChange={e => setDietNotes(e.target.value)}
            placeholder="Ej: intolerante a la lactosa, no como cerdo, alérgico a los frutos secos..."
            rows={3}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              color: 'white', padding: '14px 16px', fontSize: '15px',
              fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.5,
            }}
          />
        </div>

        {/* Toggle email semanal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', padding: '14px 16px', marginBottom: '32px',
        }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.75)', marginBottom: '2px' }}>
              Resumen semanal por email
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
              Cada lunes recibes un resumen de tu semana
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWeeklyEmailEnabled(!weeklyEmailEnabled)}
            style={{
              width: '44px', height: '24px', borderRadius: '12px', border: 'none',
              background: weeklyEmailEnabled ? '#B44FFF' : 'rgba(255,255,255,0.12)',
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

        {/* Disclaimer legal */}
        <div style={{
          marginTop: '40px', padding: '16px 18px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
        }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', lineHeight: 1.7 }}>
            <strong style={{ color: 'rgba(255,255,255,0.3)' }}>Aviso legal:</strong> Los planes generados por AngelAI son orientativos y se basan en inteligencia artificial. No sustituyen el consejo de un dietista-nutricionista o médico colegiado. Consulta a un profesional de la salud antes de realizar cambios significativos en tu dieta o entrenamiento.
          </p>
        </div>
      </form>
    </div>
  )
}
