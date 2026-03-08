'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const GOALS = [
  { value: 'definicion', label: 'Definición', desc: 'Bajar grasa manteniendo músculo' },
  { value: 'perdida', label: 'Perder peso', desc: 'Reducción de peso significativa' },
  { value: 'volumen', label: 'Volumen', desc: 'Ganar masa muscular' },
  { value: 'mantenimiento', label: 'Mantenimiento', desc: 'Mantener el peso actual' },
]

const MEASUREMENTS = [
  { key: 'weight', label: 'Peso', placeholder: '70', unit: 'kg', required: true },
  { key: 'height', label: 'Altura', placeholder: '175', unit: 'cm', required: true },
  { key: 'waist', label: 'Cintura', placeholder: '80', unit: 'cm' },
  { key: 'hips', label: 'Caderas', placeholder: '95', unit: 'cm' },
  { key: 'chest', label: 'Pecho', placeholder: '100', unit: 'cm' },
  { key: 'arms', label: 'Brazos', placeholder: '32', unit: 'cm' },
]

const ACTIVITY_LEVELS = [
  { value: 'sedentario', label: 'Sedentario', desc: 'Trabajo de oficina, sin ejercicio' },
  { value: 'ligero', label: 'Ligero', desc: '1–2 días de ejercicio/semana' },
  { value: 'moderado', label: 'Moderado', desc: '3–4 días de ejercicio/semana' },
  { value: 'activo', label: 'Activo', desc: '5–6 días de ejercicio/semana' },
  { value: 'atletico', label: 'Atlético', desc: 'Doble sesión o deporte competitivo' },
]

const TOTAL_STEPS = 4

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  const [form, setForm] = useState({ weight: '', height: '', waist: '', hips: '', chest: '', arms: '' })
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null)
  const [sidePhoto, setSidePhoto] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [sidePreview, setSidePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const frontRef = useRef<HTMLInputElement>(null)
  const sideRef = useRef<HTMLInputElement>(null)

  function handlePhoto(file: File, type: 'front' | 'side') {
    const reader = new FileReader()
    reader.onload = e => {
      if (type === 'front') {
        setFrontPhoto(file)
        setFrontPreview(e.target?.result as string)
      } else {
        setSidePhoto(file)
        setSidePreview(e.target?.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setStep(4)

    try {
      const fd = new FormData()
      fd.append('weight', form.weight)
      fd.append('height', form.height)
      if (form.waist) fd.append('waist', form.waist)
      if (form.hips) fd.append('hips', form.hips)
      if (form.chest) fd.append('chest', form.chest)
      if (form.arms) fd.append('arms', form.arms)
      fd.append('goal', goal)
      if (age) fd.append('age', age)
      if (sex) fd.append('sex', sex)
      if (activityLevel) fd.append('activityLevel', activityLevel)
      if (frontPhoto) fd.append('frontPhoto', frontPhoto)
      if (sidePhoto) fd.append('sidePhoto', sidePhoto)

      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Error en el análisis')

      router.push('/dashboard')
    } catch {
      setError('Error al analizar. Inténtalo de nuevo.')
      setLoading(false)
      setStep(3)
    }
  }

  const progressWidth = step < TOTAL_STEPS ? `${((step + 1) / TOTAL_STEPS) * 100}%` : '100%'

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', flexDirection: 'column' }}>

      {/* Top progress bar */}
      <div className="progress-top">
        <div className="progress-top-fill" style={{ width: step === 4 ? '100%' : progressWidth }} />
      </div>

      {/* Header */}
      {step < 4 && (
        <div style={{
          maxWidth: '480px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 24px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Logo />
          <span style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.25)',
            fontWeight: 500,
          }}>
            {step + 1} de {TOTAL_STEPS}
          </span>
        </div>
      )}

      {/* Content */}
      <div style={{
        flex: 1,
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        padding: '40px 24px 32px',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* STEP 0 — Objetivo */}
        {step === 0 && (
          <div className="slide-in">
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '8px' }}>
                ¿Cuál es tu objetivo?
              </h1>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                Tu plan se adaptará completamente a esto.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
              {GOALS.map(g => (
                <div
                  key={g.value}
                  className={`goal-card ${goal === g.value ? 'selected' : ''}`}
                  onClick={() => setGoal(g.value)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: goal === g.value ? 'white' : 'rgba(255,255,255,0.75)',
                        marginBottom: '3px',
                      }}>
                        {g.label}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.3)',
                      }}>
                        {g.desc}
                      </div>
                    </div>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: goal === g.value ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                      background: goal === g.value ? '#B44FFF' : 'transparent',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.18s ease',
                    }}>
                      {goal === g.value && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '16px' }}
                disabled={!goal}
                onClick={() => setStep(1)}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 1 — Perfil */}
        {step === 1 && (
          <div className="slide-in">
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '8px' }}>
                Tu perfil
              </h1>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                Necesitamos estos datos para calcular tu metabolismo con precisión.
              </p>
            </div>

            {/* Age */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.35)',
                fontWeight: 500,
                letterSpacing: '0.3px',
                display: 'block',
                marginBottom: '7px',
              }}>
                Edad<span style={{ color: '#B44FFF', marginLeft: '3px' }}>*</span>
              </label>
              <div className="input-with-unit" style={{ maxWidth: '160px' }}>
                <input
                  type="number"
                  placeholder="28"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '16px' }}
                  min="15"
                  max="99"
                />
                <span className="input-unit">años</span>
              </div>
            </div>

            {/* Sex */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.35)',
                fontWeight: 500,
                letterSpacing: '0.3px',
                display: 'block',
                marginBottom: '10px',
              }}>
                Sexo<span style={{ color: '#B44FFF', marginLeft: '3px' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`toggle-btn ${sex === 'mujer' ? 'active' : ''}`}
                  onClick={() => setSex('mujer')}
                  type="button"
                >
                  Mujer
                </button>
                <button
                  className={`toggle-btn ${sex === 'hombre' ? 'active' : ''}`}
                  onClick={() => setSex('hombre')}
                  type="button"
                >
                  Hombre
                </button>
              </div>
            </div>

            {/* Activity Level */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.35)',
                fontWeight: 500,
                letterSpacing: '0.3px',
                display: 'block',
                marginBottom: '10px',
              }}>
                Nivel de actividad<span style={{ color: '#B44FFF', marginLeft: '3px' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ACTIVITY_LEVELS.map(a => (
                  <div
                    key={a.value}
                    className={`activity-card ${activityLevel === a.value ? 'selected' : ''}`}
                    onClick={() => setActivityLevel(a.value)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: activityLevel === a.value ? 'white' : 'rgba(255,255,255,0.75)',
                          marginBottom: '2px',
                        }}>
                          {a.label}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.28)',
                        }}>
                          {a.desc}
                        </div>
                      </div>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: activityLevel === a.value ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                        background: activityLevel === a.value ? '#B44FFF' : 'transparent',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.18s ease',
                      }}>
                        {activityLevel === a.value && (
                          <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                            <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button className="btn-ghost" onClick={() => setStep(0)}>
                Atrás
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '16px' }}
                disabled={!age || !sex || !activityLevel}
                onClick={() => setStep(2)}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Medidas */}
        {step === 2 && (
          <div className="slide-in">
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '8px' }}>
                Tus medidas
              </h1>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                Cuanto más completes, más preciso será tu plan.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
              {MEASUREMENTS.map(f => (
                <div key={f.key}>
                  <label style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.35)',
                    fontWeight: 500,
                    letterSpacing: '0.3px',
                    display: 'block',
                    marginBottom: '7px',
                  }}>
                    {f.label}{f.required && <span style={{ color: '#B44FFF', marginLeft: '3px' }}>*</span>}
                  </label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="0.1"
                      placeholder={f.placeholder}
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="input-field"
                      style={{ fontSize: '16px' }}
                    />
                    <span className="input-unit">{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button className="btn-ghost" onClick={() => setStep(1)}>
                Atrás
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '16px' }}
                disabled={!form.weight || !form.height}
                onClick={() => setStep(3)}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Fotos */}
        {step === 3 && (
          <div className="slide-in">
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '8px' }}>
                Fotos corporales
              </h1>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                Opcionales. Mejoran mucho la precisión del análisis.
              </p>
            </div>

            {/* Privacy note */}
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '24px',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.6 }}>
                Las fotos se eliminan automáticamente en 30 días. Solo se usan para el análisis.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
              {/* Frontal */}
              <div>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.35)',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}>
                  Frontal
                </p>
                <div
                  onClick={() => frontRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${frontPreview ? 'rgba(180,79,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '14px',
                    height: '160px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    background: frontPreview ? 'transparent' : 'rgba(255,255,255,0.02)',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  {frontPreview ? (
                    <img src={frontPreview} alt="Frontal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                      <CameraIcon />
                      <div style={{ fontSize: '12px', marginTop: '8px' }}>Añadir foto</div>
                    </div>
                  )}
                </div>
                <input
                  ref={frontRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0], 'front')}
                />
              </div>

              {/* Lateral */}
              <div>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.35)',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}>
                  Lateral
                </p>
                <div
                  onClick={() => sideRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${sidePreview ? 'rgba(180,79,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '14px',
                    height: '160px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    background: sidePreview ? 'transparent' : 'rgba(255,255,255,0.02)',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  {sidePreview ? (
                    <img src={sidePreview} alt="Lateral" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                      <CameraIcon />
                      <div style={{ fontSize: '12px', marginTop: '8px' }}>Añadir foto</div>
                    </div>
                  )}
                </div>
                <input
                  ref={sideRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0], 'side')}
                />
              </div>
            </div>

            {error && (
              <p style={{ color: '#FF6B6B', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button className="btn-ghost" onClick={() => setStep(2)}>
                Atrás
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '16px' }}
                onClick={handleSubmit}
              >
                Analizar ahora
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Analizando */}
        {step === 4 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 0' }}>
            <div style={{ marginBottom: '32px' }}>
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                style={{ animation: 'spin 1.2s linear infinite' }}
              >
                <defs>
                  <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B44FFF" />
                    <stop offset="100%" stopColor="#00D9F5" />
                  </linearGradient>
                </defs>
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="22"
                  fill="none"
                  stroke="url(#spinGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="138"
                  strokeDashoffset="104"
                />
              </svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '12px' }}>
              Analizando tus datos
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, maxWidth: '280px' }}>
              La IA está generando tu plan personalizado. Esto puede tardar 20–30 segundos.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
      <svg width="26" height="30" viewBox="0 0 36 42" fill="none">
        <defs>
          <linearGradient id="onbLogo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B44FFF" />
            <stop offset="100%" stopColor="#00D9F5" />
          </linearGradient>
        </defs>
        <polygon points="18,2 34,11 34,31 18,40 2,31 2,11" fill="rgba(180,79,255,0.08)" stroke="url(#onbLogo)" strokeWidth="1.5" />
        <line x1="11" y1="30" x2="15" y2="14" stroke="url(#onbLogo)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="25" y1="30" x2="21" y2="14" stroke="url(#onbLogo)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12.5" y1="23" x2="23.5" y2="23" stroke="url(#onbLogo)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: '16px', fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
        ANGEL<span style={{ background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
      </span>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto', display: 'block' }}>
      <rect x="2" y="7" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="14" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 7L10.5 4H13.5L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
