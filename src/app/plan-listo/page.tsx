'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function PlanListoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkInId = searchParams.get('checkInId')

  useEffect(() => {
    if (!checkInId) { router.push('/dashboard'); return }
    const t = setTimeout(() => router.push('/dashboard'), 3000)
    return () => clearTimeout(t)
  }, [checkInId, router])

  return (
    <div style={{
      minHeight: '100vh', background: '#07080F',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 24px',
    }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>

        {/* Animated check */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(180,79,255,0.2), rgba(0,217,245,0.2))',
          border: '1px solid rgba(180,79,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px',
          animation: 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M8 18.5L15 25.5L28 11" stroke="url(#g)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B44FFF"/>
                <stop offset="100%" stopColor="#00D9F5"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '12px' }}>
          ¡Tu plan está listo!
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, marginBottom: '36px' }}>
          La IA ha generado tu plan personalizado de nutrición y entrenamiento. Revísalo en el dashboard y si quieres ajustar algo lo puedes hacer desde ahí.
        </p>

        <button
          className="btn-primary"
          style={{ width: '100%', padding: '16px', fontSize: '15px' }}
          onClick={() => router.push('/dashboard')}
        >
          Ver mi plan →
        </button>

        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)', marginTop: '20px' }}>
          Redirigiendo automáticamente...
        </p>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
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
