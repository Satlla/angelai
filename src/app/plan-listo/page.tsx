'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function PlanListoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkInId = searchParams.get('checkInId')

  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustText, setAdjustText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => {
    if (!checkInId) router.push('/dashboard')
  }, [checkInId, router])

  async function handleAdjust() {
    if (!adjustText.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/diet-customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customRequest: adjustText, checkInId: checkInId || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.limitReached) {
          setLimitReached(true)
          setError('Ya usaste tu ajuste para este ciclo.')
        } else {
          setError(data.error || 'Error al ajustar el plan.')
        }
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#07080F',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 24px',
    }}>
      <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>

        {/* Check icon */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(180,79,255,0.2), rgba(0,217,245,0.2))',
          border: '1px solid rgba(180,79,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M7 16.5L13 22.5L25 10" stroke="url(#planGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="planGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B44FFF"/>
                <stop offset="100%" stopColor="#00D9F5"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '12px' }}>
          Tu plan está listo
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: '40px' }}>
          La IA ha generado tu plan personalizado de nutrición y entrenamiento. ¿Hay algo que quieras ajustar?
        </p>

        {!showAdjust ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '15px' }}
              onClick={() => router.push('/dashboard')}
            >
              Me encanta, al dashboard →
            </button>
            {!limitReached && (
              <button
                onClick={() => setShowAdjust(true)}
                style={{
                  width: '100%', padding: '16px', fontSize: '15px', fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Quiero cambiar algo
              </button>
            )}
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>
              Tienes 1 ajuste disponible por ciclo de 15 días
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'left' }}>
            <label style={{
              fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500,
              display: 'block', marginBottom: '10px',
            }}>
              ¿Qué quieres cambiar?
            </label>
            <textarea
              value={adjustText}
              onChange={e => setAdjustText(e.target.value)}
              placeholder="Ej: No quiero pollo en el desayuno, prefiero avena. Quiero el día de trampa el viernes..."
              rows={4}
              maxLength={500}
              autoFocus
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px',
                color: 'white', padding: '14px 16px', fontSize: '15px',
                fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5,
                marginBottom: '16px',
              }}
            />

            {error && (
              <p style={{ color: '#FF6B6B', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowAdjust(false); setError('') }}
                style={{
                  flex: 1, padding: '14px', fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ flex: 2, padding: '14px', fontSize: '14px' }}
                disabled={loading || !adjustText.trim()}
                onClick={handleAdjust}
              >
                {loading ? 'Ajustando...' : 'Aplicar ajuste'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '12px', textAlign: 'center' }}>
              Solo puedes usar 1 ajuste por ciclo de 15 días
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlanListo() {
  return (
    <Suspense>
      <PlanListoContent />
    </Suspense>
  )
}
