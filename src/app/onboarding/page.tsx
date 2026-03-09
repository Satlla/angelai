'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MeasureGuideModal, { MeasureHelpButton } from '@/components/MeasureGuideModal'

const ANALYSIS_STEPS = [
  { label: 'Calculando TDEE y metabolismo basal', delay: 1500 },
  { label: 'Analizando composición corporal', delay: 4000 },
  { label: 'Calculando macros óptimos', delay: 7000 },
  { label: 'Diseñando plan de nutrición', delay: 11000 },
  { label: 'Creando rutina de entrenamiento', delay: 16000 },
  { label: 'Generando lista de la compra', delay: 21000 },
  { label: 'Ajustando detalles personalizados', delay: 26000 },
]

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
  { key: 'thighs', label: 'Muslos', placeholder: '55', unit: 'cm' },
  { key: 'calves', label: 'Pantorrilla', placeholder: '36', unit: 'cm' },
  { key: 'shoulders', label: 'Hombros', placeholder: '110', unit: 'cm' },
]

const ACTIVITY_LEVELS = [
  { value: 'sedentario', label: 'Sedentario', desc: 'Trabajo de oficina, sin ejercicio' },
  { value: 'ligero', label: 'Ligero', desc: '1–2 días de ejercicio/semana' },
  { value: 'moderado', label: 'Moderado', desc: '3–4 días de ejercicio/semana' },
  { value: 'activo', label: 'Activo', desc: '5–6 días de ejercicio/semana' },
  { value: 'atletico', label: 'Atlético', desc: 'Doble sesión o deporte competitivo' },
]

const TOTAL_STEPS = 5

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  const [form, setForm] = useState({ weight: '', height: '', waist: '', hips: '', chest: '', arms: '', thighs: '', calves: '', shoulders: '' })
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null)
  const [sidePhoto, setSidePhoto] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [sidePreview, setSidePreview] = useState<string | null>(null)
  const [freeTextContext, setFreeTextContext] = useState('')
  const [currentDiet, setCurrentDiet] = useState('')
  const [currentTraining, setCurrentTraining] = useState('')
  const [showCurrentDiet, setShowCurrentDiet] = useState(false)
  const [showCurrentTraining, setShowCurrentTraining] = useState(false)
  const [measureModal, setMeasureModal] = useState<{ open: boolean; tab: 'waist' | 'hips' | 'chest' | 'arms' | 'thighs' | 'calves' | 'shoulders' }>({ open: false, tab: 'waist' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [doneSteps, setDoneSteps] = useState<number[]>([])
  const router = useRouter()

  useEffect(() => {
    if (!loading) { setDoneSteps([]); return }
    const timers = ANALYSIS_STEPS.map((s, i) =>
      setTimeout(() => setDoneSteps(prev => [...prev, i]), s.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [loading])
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
    setStep(5)

    try {
      const fd = new FormData()
      fd.append('weight', form.weight)
      fd.append('height', form.height)
      if (form.waist) fd.append('waist', form.waist)
      if (form.hips) fd.append('hips', form.hips)
      if (form.chest) fd.append('chest', form.chest)
      if (form.arms) fd.append('arms', form.arms)
      if (form.thighs) fd.append('thighs', form.thighs)
      if (form.calves) fd.append('calves', form.calves)
      if (form.shoulders) fd.append('shoulders', form.shoulders)
      fd.append('goal', goal)
      if (age) fd.append('age', age)
      if (sex) fd.append('sex', sex)
      if (activityLevel) fd.append('activityLevel', activityLevel)
      if (frontPhoto) fd.append('frontPhoto', frontPhoto)
      if (sidePhoto) fd.append('sidePhoto', sidePhoto)
      if (freeTextContext) fd.append('freeTextContext', freeTextContext)
      if (currentDiet) fd.append('currentDiet', currentDiet)
      if (currentTraining) fd.append('currentTraining', currentTraining)

      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Error en el análisis')

      const data = await res.json()
      router.push(`/plan-listo?checkInId=${data.checkInId}`)
    } catch {
      setError('Error al analizar. Inténtalo de nuevo.')
      setLoading(false)
      setStep(4)
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
      {step < 5 && (
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
        padding: step === 5 ? '0' : '40px 24px 32px',
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
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '8px' }}>
                Tus medidas
              </h1>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                Cuanto más completes, más preciso será tu plan.
              </p>
            </div>

            {/* Botón guía */}
            <button
              type="button"
              onClick={() => setMeasureModal({ open: true, tab: 'waist' })}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(180,79,255,0.08)', border: '1px solid rgba(180,79,255,0.25)',
                borderRadius: '10px', padding: '10px 14px', cursor: 'pointer',
                marginBottom: '20px', width: '100%',
                color: 'rgba(180,79,255,0.9)', fontSize: '13px', fontFamily: 'inherit',
                fontWeight: 500,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <rect x="2" y="6" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <line x1="5" y1="4" x2="5" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="11" y1="4" x2="11" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              ¿Cómo medirme correctamente?
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto' }}>
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
              {MEASUREMENTS.map(f => {
                const hasMeasureGuide = ['waist','hips','chest','arms','thighs','calves','shoulders'].includes(f.key)
                return (
                  <div key={f.key}>
                    <label style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.35)',
                      fontWeight: 500,
                      letterSpacing: '0.3px',
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '7px',
                    }}>
                      {f.label}{f.required && <span style={{ color: '#B44FFF', marginLeft: '3px' }}>*</span>}
                      {hasMeasureGuide && (
                        <MeasureHelpButton
                          measureKey={f.key as 'waist'|'hips'|'chest'|'arms'|'thighs'|'calves'|'shoulders'}
                          onClick={key => setMeasureModal({ open: true, tab: key })}
                        />
                      )}
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
                )
              })}
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
                onClick={() => setStep(4)}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Cuéntame más */}
        {step === 4 && (
          <div className="slide-in">
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '8px' }}>
                Cuéntame más
              </h1>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                Opcional pero muy útil. Escribe lo que quieras: horarios, alimentos favoritos o que odias, día de trampa, trabajo, familia, lo que sea.
              </p>
            </div>

            <textarea
              value={freeTextContext}
              onChange={e => setFreeTextContext(e.target.value)}
              placeholder={'Ej: Trabajo de 9 a 18h y no puedo cocinar al mediodía, amo la pasta y el arroz, odio el brócoli, me gustaría que el sábado sea mi día libre para comer pizza con mi familia, tengo 30 minutos máximo para preparar el desayuno...'}
              rows={7}
              maxLength={2000}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                color: 'white',
                padding: '16px',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.6,
                marginBottom: '8px',
              }}
            />
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginBottom: '20px', textAlign: 'right' }}>
              {freeTextContext.length}/2000
            </p>

            {/* Dieta actual */}
            <div style={{ marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setShowCurrentDiet(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: showCurrentDiet ? 'rgba(180,79,255,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${showCurrentDiet ? 'rgba(180,79,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '12px', padding: '12px 16px', cursor: 'pointer',
                  color: showCurrentDiet ? 'rgba(180,79,255,0.9)' : 'rgba(255,255,255,0.4)',
                  fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.18s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <rect x="2" y="2" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                    <line x1="4.5" y1="5.5" x2="10.5" y2="5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="4.5" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="4.5" y1="9.5" x2="8" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  ¿Tienes una dieta actual? Pégala aquí
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showCurrentDiet ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}>
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showCurrentDiet && (
                <div style={{ marginTop: '8px' }}>
                  <textarea
                    value={currentDiet}
                    onChange={e => setCurrentDiet(e.target.value)}
                    placeholder={'Pega tu dieta actual aquí. Puede ser un texto simple, una tabla, macros, comidas... La IA la leerá y la tendrá en cuenta para hacer la adaptación a tu nuevo objetivo.\n\nEj: Desayuno: 80g avena + proteína\nComida: pollo con arroz\nCena: merluza con verduras...'}
                    rows={6}
                    maxLength={3000}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(180,79,255,0.2)', borderRadius: '12px',
                      color: 'white', padding: '14px', fontSize: '14px',
                      fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.6,
                    }}
                  />
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', marginTop: '4px', textAlign: 'right' }}>
                    {currentDiet.length}/3000
                  </p>
                </div>
              )}
            </div>

            {/* Entrenamiento actual */}
            <div style={{ marginBottom: '28px' }}>
              <button
                type="button"
                onClick={() => setShowCurrentTraining(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: showCurrentTraining ? 'rgba(0,217,245,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${showCurrentTraining ? 'rgba(0,217,245,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '12px', padding: '12px 16px', cursor: 'pointer',
                  color: showCurrentTraining ? 'rgba(0,217,245,0.85)' : 'rgba(255,255,255,0.4)',
                  fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.18s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M2 7.5h2M11 7.5h2M4 7.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    <rect x="3.5" y="5" width="1.5" height="5" rx="0.5" fill="currentColor"/>
                    <rect x="10" y="5" width="1.5" height="5" rx="0.5" fill="currentColor"/>
                  </svg>
                  ¿Tienes un entrenamiento actual? Pégalo aquí
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showCurrentTraining ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}>
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showCurrentTraining && (
                <div style={{ marginTop: '8px' }}>
                  <textarea
                    value={currentTraining}
                    onChange={e => setCurrentTraining(e.target.value)}
                    placeholder={'Pega tu rutina de entrenamiento aquí. La IA la usará como referencia para diseñar tu nuevo plan adaptado a tu objetivo.\n\nEj: Lunes: Pecho + Tríceps\n- Press banca 4x8\n- Fondos 3x12\nMartes: Espalda + Bíceps...'}
                    rows={6}
                    maxLength={3000}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(0,217,245,0.15)', borderRadius: '12px',
                      color: 'white', padding: '14px', fontSize: '14px',
                      fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.6,
                    }}
                  />
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', marginTop: '4px', textAlign: 'right' }}>
                    {currentTraining.length}/3000
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p style={{ color: '#FF6B6B', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button className="btn-ghost" onClick={() => setStep(3)}>
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

        {/* STEP 5 — Analizando */}
        {step === 5 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <svg width="36" height="36" viewBox="0 0 56 56" style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }}>
                <defs>
                  <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B44FFF" />
                    <stop offset="100%" stopColor="#00D9F5" />
                  </linearGradient>
                </defs>
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="url(#spinGrad)" strokeWidth="4" strokeLinecap="round" strokeDasharray="138" strokeDashoffset="104" />
              </svg>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '4px' }}>
                  Generando tu plan
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                  La IA está trabajando — puede tardar 30–40 segundos
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {ANALYSIS_STEPS.map((s, i) => {
                const done = doneSteps.includes(i)
                const active = !done && doneSteps.length === i
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: done ? 'rgba(180,79,255,0.06)' : active ? 'rgba(255,255,255,0.03)' : 'transparent',
                    marginBottom: '4px',
                    transition: 'all 0.3s ease',
                  }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done
                        ? 'linear-gradient(135deg, #B44FFF, #00D9F5)'
                        : active
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(255,255,255,0.04)',
                      border: done ? 'none' : `1.5px solid ${active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      transition: 'all 0.4s ease',
                    }}>
                      {done ? (
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                          <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : active ? (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.5)', animation: 'pulse 1s ease-in-out infinite' }} />
                      ) : null}
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: done ? 500 : 400,
                      color: done ? 'rgba(255,255,255,0.85)' : active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                      transition: 'color 0.3s ease',
                    }}>
                      {s.label}
                    </span>
                    {done && (
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(180,79,255,0.7)', fontWeight: 500 }}>
                        listo
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.4; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.2); }
              }
            `}</style>
          </div>
        )}
      </div>

      <MeasureGuideModal
        open={measureModal.open}
        initialTab={measureModal.tab}
        onClose={() => setMeasureModal(m => ({ ...m, open: false }))}
      />
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
