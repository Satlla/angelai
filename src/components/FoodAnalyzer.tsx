'use client'
import { useState, useRef } from 'react'

type AnalysisResult = {
  name?: string; calories?: number; protein?: number; carbs?: number; fat?: number;
  assessment: string; fits_diet?: boolean; tip?: string;
}

export default function FoodAnalyzer() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file) return
    setLoading(true)
    setResult(null)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      const base64 = dataUrl.split(',')[1]
      const mimeType = file.type || 'image/jpeg'
      try {
        const res = await fetch('/api/food-analyze', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        })
        const data = await res.json()
        setResult(data)
      } catch {
        setResult({ assessment: 'Error al analizar. Inténtalo de nuevo.' })
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '20px' }}>📸</span>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Analizar foto de comida</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>Saca foto a tu plato y AngelAI lo analiza</p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {!preview && !loading && (
        <button onClick={() => inputRef.current?.click()} style={{ width: '100%', padding: '16px', background: 'rgba(0,217,245,0.06)', border: '1px dashed rgba(0,217,245,0.25)', borderRadius: '12px', color: '#00D9F5', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>📷</span> Sacar foto o subir imagen
        </button>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px' }}>
          {preview && <img src={preview} alt="preview" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', opacity: 0.6 }} />}
          <div style={{ width: '28px', height: '28px', border: '2px solid rgba(0,217,245,0.3)', borderTopColor: '#00D9F5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Analizando con IA...</p>
        </div>
      )}

      {result && !loading && (
        <div>
          {preview && <img src={preview} alt="preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px' }} />}

          {result.name && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>{result.name}</div>
              {result.calories !== undefined && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
                  {[
                    { label: 'Kcal', value: result.calories },
                    { label: 'Prot', value: `${result.protein}g` },
                    { label: 'HC', value: `${result.carbs}g` },
                    { label: 'Grasas', value: `${result.fat}g` },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{m.value}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {result.fits_diet !== undefined && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: result.fits_diet ? 'rgba(0,217,245,0.1)' : 'rgba(255,107,107,0.1)', border: `1px solid ${result.fits_diet ? 'rgba(0,217,245,0.25)' : 'rgba(255,107,107,0.25)'}`, marginBottom: '10px' }}>
                  <span>{result.fits_diet ? '✓' : '✗'}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: result.fits_diet ? '#00D9F5' : '#FF6B6B' }}>{result.fits_diet ? 'Encaja con tu dieta' : 'No encaja con tu dieta'}</span>
                </div>
              )}
            </div>
          )}

          <div style={{ background: 'rgba(180,79,255,0.06)', border: '1px solid rgba(180,79,255,0.15)', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#B44FFF', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>🤖 Dra. AngelAI dice:</span>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{result.assessment}</p>
          </div>

          {result.tip && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>💡 {result.tip}</p>
            </div>
          )}

          <button onClick={() => { setResult(null); setPreview(null) }} style={{ marginTop: '12px', width: '100%', padding: '10px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Analizar otra foto
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
