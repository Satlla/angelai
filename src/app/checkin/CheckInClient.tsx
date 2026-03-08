'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const MEASUREMENTS = [
  { key: 'weight', label: 'Peso', placeholder: '70', unit: 'kg', required: true },
  { key: 'waist', label: 'Cintura', placeholder: '80', unit: 'cm' },
  { key: 'hips', label: 'Caderas', placeholder: '95', unit: 'cm' },
  { key: 'chest', label: 'Pecho', placeholder: '100', unit: 'cm' },
  { key: 'arms', label: 'Brazos', placeholder: '32', unit: 'cm' },
]

const GOALS = [
  { value: 'definicion', label: 'Definición' },
  { value: 'perdida', label: 'Perder peso' },
  { value: 'volumen', label: 'Volumen' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
]

export default function CheckInClient({
  defaultHeight,
  defaultGoal,
  defaultAge,
  defaultSex,
  defaultActivityLevel,
}: {
  defaultHeight: number
  defaultGoal: string
  defaultAge: number | null
  defaultSex: string | null
  defaultActivityLevel: string | null
}) {
  const [form, setForm] = useState({ weight: '', waist: '', hips: '', chest: '', arms: '' })
  const [goal, setGoal] = useState(defaultGoal)
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null)
  const [sidePhoto, setSidePhoto] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [sidePreview, setSidePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const frontRef = useRef<HTMLInputElement>(null)
  const sideRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handlePhoto(file: File, type: 'front' | 'side') {
    const reader = new FileReader()
    reader.onload = e => {
      if (type === 'front') { setFrontPhoto(file); setFrontPreview(e.target?.result as string) }
      else { setSidePhoto(file); setSidePreview(e.target?.result as string) }
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const fd = new FormData()
      fd.append('weight', form.weight)
      fd.append('height', String(defaultHeight))
      fd.append('goal', goal)
      if (defaultAge) fd.append('age', String(defaultAge))
      if (defaultSex) fd.append('sex', defaultSex)
      if (defaultActivityLevel) fd.append('activityLevel', defaultActivityLevel)
      if (form.waist) fd.append('waist', form.waist)
      if (form.hips) fd.append('hips', form.hips)
      if (form.chest) fd.append('chest', form.chest)
      if (form.arms) fd.append('arms', form.arms)
      if (frontPhoto) fd.append('frontPhoto', frontPhoto)
      if (sidePhoto) fd.append('sidePhoto', sidePhoto)

      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      router.push('/dashboard')
    } catch {
      setError('Error al analizar. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#07080F',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '40px 24px',
      }}>
        <div style={{ marginBottom: '32px' }}>
          <svg width="56" height="56" viewBox="0 0 56 56" style={{ animation: 'spin 1.2s linear infinite' }}>
            <defs>
              <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B44FFF" />
                <stop offset="100%" stopColor="#00D9F5" />
              </linearGradient>
            </defs>
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            <circle cx="28" cy="28" r="22" fill="none" stroke="url(#spinGrad)" strokeWidth="4"
              strokeLinecap="round" strokeDasharray="138" strokeDashoffset="104" />
          </svg>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '12px' }}>
          Actualizando tu plan
        </h2>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, maxWidth: '280px' }}>
          La IA está ajustando tu plan. Esto puede tardar 20–30 segundos.
        </p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07080F' }}>

      <div style={{
        maxWidth: '480px', margin: '0 auto',
        padding: '24px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Logo />
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
          Revisión quincenal
        </span>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 24px 48px' }}>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '8px' }}>
            Actualiza tus datos
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
            La IA ajustará tu plan basándose en tu evolución.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Medidas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
            {MEASUREMENTS.map(f => (
              <div key={f.key}>
                <label style={{
                  fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500,
                  letterSpacing: '0.3px', display: 'block', marginBottom: '7px',
                }}>
                  {f.label}{f.required && <span style={{ color: '#B44FFF', marginLeft: '3px' }}>*</span>}
                </label>
                <div className="input-with-unit">
                  <input
                    type="number" step="0.1" placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="input-field" style={{ fontSize: '16px' }}
                    required={f.required}
                  />
                  <span className="input-unit">{f.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Objetivo (puede cambiar) */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500,
              letterSpacing: '0.3px', display: 'block', marginBottom: '10px',
            }}>
              Objetivo actual
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {GOALS.map(g => (
                <button
                  key={g.value} type="button"
                  onClick={() => setGoal(g.value)}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 500, fontFamily: 'inherit',
                    background: goal === g.value ? 'rgba(180,79,255,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${goal === g.value ? 'rgba(180,79,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: goal === g.value ? '#B44FFF' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info heredada */}
          <div style={{
            display: 'flex', gap: '10px', alignItems: 'flex-start',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '12px 14px', marginBottom: '28px',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="7" cy="7" r="6" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
              <path d="M7 6v4M7 4.5v.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.6 }}>
              Altura ({defaultHeight} cm), edad y nivel de actividad se mantienen de tu perfil anterior.
            </p>
          </div>

          {/* Fotos */}
          <div style={{ marginBottom: '28px' }}>
            <p style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500,
              letterSpacing: '0.3px', marginBottom: '12px',
            }}>
              Fotos corporales <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>(opcionales)</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {([
                { type: 'front' as const, ref: frontRef, preview: frontPreview, label: 'Frontal' },
                { type: 'side' as const, ref: sideRef, preview: sidePreview, label: 'Lateral' },
              ]).map(p => (
                <div key={p.type}>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, marginBottom: '8px' }}>
                    {p.label}
                  </p>
                  <div
                    onClick={() => p.ref.current?.click()}
                    style={{
                      border: `1.5px dashed ${p.preview ? 'rgba(180,79,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '14px', height: '160px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden',
                      background: p.preview ? 'transparent' : 'rgba(255,255,255,0.02)',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    {p.preview ? (
                      <img src={p.preview} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                        <CameraIcon />
                        <div style={{ fontSize: '12px', marginTop: '8px' }}>Añadir foto</div>
                      </div>
                    )}
                  </div>
                  <input ref={p.ref} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0], p.type)} />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ color: '#FF6B6B', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>
          )}

          <button
            type="submit" className="btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '15px' }}
            disabled={!form.weight}
          >
            Analizar ahora
          </button>
        </form>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
      <svg width="24" height="28" viewBox="0 0 36 42" fill="none">
        <defs>
          <linearGradient id="ciLogo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B44FFF" />
            <stop offset="100%" stopColor="#00D9F5" />
          </linearGradient>
        </defs>
        <polygon points="18,2 34,11 34,31 18,40 2,31 2,11" fill="rgba(180,79,255,0.08)" stroke="url(#ciLogo)" strokeWidth="1.5" />
        <line x1="11" y1="30" x2="15" y2="14" stroke="url(#ciLogo)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="25" y1="30" x2="21" y2="14" stroke="url(#ciLogo)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12.5" y1="23" x2="23.5" y2="23" stroke="url(#ciLogo)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px' }}>
        <span style={{ color: 'white' }}>ANGEL</span>
        <span style={{ background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
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
