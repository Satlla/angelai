'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckIn() {
  const [form, setForm] = useState({ weight: '', waist: '', hips: '', chest: '', arms: '' })
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
      fd.append('height', '160') // se podría guardar del perfil
      if (form.waist) fd.append('waist', form.waist)
      if (form.hips) fd.append('hips', form.hips)
      if (form.chest) fd.append('chest', form.chest)
      if (form.arms) fd.append('arms', form.arms)
      fd.append('goal', 'definicion')
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

  const inputStyle = {
    background: 'rgba(13,15,26,0.9)', border: '1px solid rgba(180,79,255,0.3)',
    borderRadius: '10px', color: 'white', padding: '13px 16px', fontSize: '16px', width: '100%', outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
        <span style={{ fontSize: '20px', fontWeight: 900 }}>
          <span style={{ color: 'white' }}>ANGEL</span>
          <span style={{ background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
        </span>
      </div>

      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(180,79,255,0.1)', border: '1px solid rgba(180,79,255,0.3)',
            borderRadius: '100px', padding: '6px 16px', marginBottom: '16px',
            fontSize: '12px', letterSpacing: '2px', color: '#B44FFF',
          }}>
            🔥 REVISIÓN QUINCENAL
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>¡Es tu momento!</h2>
          <p style={{ color: 'rgba(160,160,176,0.6)', fontSize: '15px' }}>Actualiza tus datos y la IA ajustará tu plan</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            {[
              { key: 'weight', label: 'Peso (kg) *', placeholder: '52', required: true },
              { key: 'waist', label: 'Cintura (cm)', placeholder: '59' },
              { key: 'hips', label: 'Caderas (cm)', placeholder: '89' },
              { key: 'chest', label: 'Pecho (cm)', placeholder: '89' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '13px', color: 'rgba(160,160,176,0.7)', marginBottom: '6px', display: 'block' }}>{f.label}</label>
                <input type="number" step="0.1" placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={inputStyle} required={f.required} />
              </div>
            ))}
          </div>

          {/* Fotos */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(160,160,176,0.7)', marginBottom: '12px' }}>Fotos (opcional, mejoran el análisis)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { type: 'front' as const, ref: frontRef, preview: frontPreview, label: 'Frontal' },
                { type: 'side' as const, ref: sideRef, preview: sidePreview, label: 'Lateral' },
              ].map(p => (
                <div key={p.type}>
                  <div onClick={() => p.ref.current?.click()} style={{
                    border: `2px dashed ${p.preview ? '#B44FFF' : 'rgba(180,79,255,0.25)'}`,
                    borderRadius: '10px', height: '150px', cursor: 'pointer', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(13,15,26,0.8)',
                  }}>
                    {p.preview
                      ? <img src={p.preview} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ textAlign: 'center', color: 'rgba(160,160,176,0.35)' }}>
                          <div style={{ fontSize: '24px', marginBottom: '4px' }}>📷</div>
                          <div style={{ fontSize: '11px' }}>{p.label}</div>
                        </div>
                    }
                  </div>
                  <input ref={p.ref} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0], p.type)} />
                </div>
              ))}
            </div>
          </div>

          {error && <p style={{ color: '#ff6b6b', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px' }} disabled={loading || !form.weight}>
            {loading ? '⏳ Analizando con IA...' : '✨ Actualizar mi plan'}
          </button>
        </form>
      </div>
    </div>
  )
}
