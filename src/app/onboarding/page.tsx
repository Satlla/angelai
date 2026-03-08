'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const GOALS = [
  { value: 'definicion', label: '🔥 Definición', desc: 'Bajar grasa manteniendo músculo' },
  { value: 'perdida', label: '📉 Perder peso', desc: 'Reducción de peso significativa' },
  { value: 'volumen', label: '💪 Volumen', desc: 'Ganar masa muscular' },
  { value: 'mantenimiento', label: '⚖️ Mantenimiento', desc: 'Mantener peso actual' },
]

const STEPS = ['Objetivo', 'Medidas', 'Fotos', 'Analizando']

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('definicion')
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
      if (type === 'front') { setFrontPhoto(file); setFrontPreview(e.target?.result as string) }
      else { setSidePhoto(file); setSidePreview(e.target?.result as string) }
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setStep(3)

    try {
      const fd = new FormData()
      fd.append('weight', form.weight)
      fd.append('height', form.height)
      if (form.waist) fd.append('waist', form.waist)
      if (form.hips) fd.append('hips', form.hips)
      if (form.chest) fd.append('chest', form.chest)
      if (form.arms) fd.append('arms', form.arms)
      fd.append('goal', goal)
      if (frontPhoto) fd.append('frontPhoto', frontPhoto)
      if (sidePhoto) fd.append('sidePhoto', sidePhoto)

      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Error en el análisis')

      router.push('/dashboard')
    } catch {
      setError('Error al analizar. Inténtalo de nuevo.')
      setLoading(false)
      setStep(2)
    }
  }

  const inputStyle = {
    background: 'rgba(13,15,26,0.9)', border: '1px solid rgba(180,79,255,0.3)',
    borderRadius: '10px', color: 'white', padding: '13px 16px', fontSize: '16px',
    width: '100%', outline: 'none',
  }

  const labelStyle = { fontSize: '13px', color: 'rgba(160,160,176,0.7)', marginBottom: '6px', display: 'block' }

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
        <svg width="30" height="35" viewBox="0 0 36 42">
          <defs>
            <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B44FFF"/><stop offset="100%" stopColor="#00D9F5"/>
            </linearGradient>
          </defs>
          <polygon points="18,2 34,11 34,31 18,40 2,31 2,11" fill="rgba(180,79,255,0.1)" stroke="url(#hg)" strokeWidth="1.5"/>
          <line x1="11" y1="30" x2="15" y2="14" stroke="url(#hg)" strokeWidth="3" strokeLinecap="round"/>
          <line x1="25" y1="30" x2="21" y2="14" stroke="url(#hg)" strokeWidth="3" strokeLinecap="round"/>
          <line x1="12.5" y1="23" x2="23.5" y2="23" stroke="url(#hg)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: '20px', fontWeight: 900 }}>
          <span style={{ color: 'white' }}>ANGEL</span>
          <span style={{ background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
        </span>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', alignItems: 'center' }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, transition: 'all 0.3s',
              background: i <= step ? 'linear-gradient(135deg,#B44FFF,#00D9F5)' : 'rgba(180,79,255,0.1)',
              color: i <= step ? 'white' : 'rgba(160,160,176,0.4)',
              border: i === step ? '2px solid transparent' : '1px solid rgba(180,79,255,0.2)',
            }}>{i + 1}</div>
            {i < STEPS.length - 1 && <div style={{ width: '40px', height: '1px', background: i < step ? 'linear-gradient(90deg,#B44FFF,#00D9F5)' : 'rgba(180,79,255,0.2)' }} />}
          </div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '520px' }}>

        {/* STEP 0 — Objetivo */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px', textAlign: 'center' }}>¿Cuál es tu objetivo?</h2>
            <p style={{ color: 'rgba(160,160,176,0.6)', textAlign: 'center', marginBottom: '32px', fontSize: '15px' }}>
              La IA diseñará tu plan basándose en esto
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
              {GOALS.map(g => (
                <div key={g.value} onClick={() => setGoal(g.value)} style={{
                  background: goal === g.value ? 'rgba(180,79,255,0.15)' : 'rgba(13,15,26,0.8)',
                  border: `1px solid ${goal === g.value ? '#B44FFF' : 'rgba(180,79,255,0.2)'}`,
                  borderRadius: '12px', padding: '20px 16px', cursor: 'pointer',
                  textAlign: 'center', transition: 'all 0.2s',
                  boxShadow: goal === g.value ? '0 0 20px rgba(180,79,255,0.2)' : 'none',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{g.label.split(' ')[0]}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{g.label.split(' ').slice(1).join(' ')}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(160,160,176,0.5)' }}>{g.desc}</div>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '15px' }} onClick={() => setStep(1)}>
              Continuar →
            </button>
          </div>
        )}

        {/* STEP 1 — Medidas */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px', textAlign: 'center' }}>Tus medidas</h2>
            <p style={{ color: 'rgba(160,160,176,0.6)', textAlign: 'center', marginBottom: '32px', fontSize: '15px' }}>
              Cuanto más completes, más precisa será tu dieta
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { key: 'weight', label: 'Peso (kg) *', placeholder: '53', required: true },
                { key: 'height', label: 'Altura (cm) *', placeholder: '160', required: true },
                { key: 'waist', label: 'Cintura (cm)', placeholder: '60' },
                { key: 'hips', label: 'Caderas (cm)', placeholder: '90' },
                { key: 'chest', label: 'Pecho (cm)', placeholder: '90' },
                { key: 'arms', label: 'Brazos (cm)', placeholder: '28' },
              ].map(f => (
                <div key={f.key}>
                  <label style={labelStyle}>{f.label}</label>
                  <input
                    type="number" step="0.1" placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep(0)} style={{ flex: 1, padding: '14px', background: 'rgba(180,79,255,0.1)', border: '1px solid rgba(180,79,255,0.3)', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                ← Atrás
              </button>
              <button className="btn-primary" style={{ flex: 2, padding: '14px' }}
                disabled={!form.weight || !form.height}
                onClick={() => setStep(2)}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Fotos */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px', textAlign: 'center' }}>Tus fotos</h2>
            <p style={{ color: 'rgba(160,160,176,0.6)', textAlign: 'center', marginBottom: '8px', fontSize: '15px' }}>
              Opcionales pero mejoran el análisis enormemente
            </p>
            <div style={{ background: 'rgba(0,217,245,0.05)', border: '1px solid rgba(0,217,245,0.15)', borderRadius: '10px', padding: '14px', marginBottom: '28px', fontSize: '12px', color: 'rgba(160,160,176,0.6)', lineHeight: 1.7 }}>
              🔒 Las fotos se eliminan automáticamente en 30 días. Solo se usan para el análisis de IA.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
              {/* Frontal */}
              <div>
                <label style={labelStyle}>Foto frontal</label>
                <div onClick={() => frontRef.current?.click()} style={{
                  border: `2px dashed ${frontPreview ? '#B44FFF' : 'rgba(180,79,255,0.3)'}`,
                  borderRadius: '12px', height: '180px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative',
                  background: frontPreview ? 'transparent' : 'rgba(13,15,26,0.8)',
                }}>
                  {frontPreview
                    ? <img src={frontPreview} alt="Frontal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ textAlign: 'center', color: 'rgba(160,160,176,0.4)' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📷</div>
                        <div style={{ fontSize: '12px' }}>Foto frontal</div>
                      </div>
                  }
                </div>
                <input ref={frontRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0], 'front')} />
              </div>

              {/* Lateral */}
              <div>
                <label style={labelStyle}>Foto lateral</label>
                <div onClick={() => sideRef.current?.click()} style={{
                  border: `2px dashed ${sidePreview ? '#B44FFF' : 'rgba(180,79,255,0.3)'}`,
                  borderRadius: '12px', height: '180px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                  background: sidePreview ? 'transparent' : 'rgba(13,15,26,0.8)',
                }}>
                  {sidePreview
                    ? <img src={sidePreview} alt="Lateral" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ textAlign: 'center', color: 'rgba(160,160,176,0.4)' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📷</div>
                        <div style={{ fontSize: '12px' }}>Foto lateral</div>
                      </div>
                  }
                </div>
                <input ref={sideRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0], 'side')} />
              </div>
            </div>

            {error && <p style={{ color: '#ff6b6b', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', background: 'rgba(180,79,255,0.1)', border: '1px solid rgba(180,79,255,0.3)', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                ← Atrás
              </button>
              <button className="btn-primary" style={{ flex: 2, padding: '14px' }} onClick={handleSubmit}>
                Analizar con IA ✨
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Analizando */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ marginBottom: '32px' }}>
              <svg width="80" height="80" viewBox="0 0 80 80" style={{ animation: 'spin 2s linear infinite' }}>
                <defs>
                  <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B44FFF"/>
                    <stop offset="100%" stopColor="#00D9F5"/>
                  </linearGradient>
                </defs>
                <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(180,79,255,0.1)" strokeWidth="6"/>
                <circle cx="40" cy="40" r="35" fill="none" stroke="url(#spinGrad)" strokeWidth="6"
                  strokeLinecap="round" strokeDasharray="220" strokeDashoffset="160"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>Analizando tu cuerpo...</h2>
            <p style={{ color: 'rgba(160,160,176,0.6)', lineHeight: 1.8 }}>
              La IA está procesando tus datos y fotos.<br/>
              Generando tu plan personalizado.<br/>
              Esto puede tardar 20-30 segundos.
            </p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </div>
  )
}
