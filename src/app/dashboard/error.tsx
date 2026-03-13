'use client'
import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error.message, error.digest)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh', background: '#07080F', color: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'monospace',
    }}>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Error en dashboard</p>
      <p style={{ fontSize: '14px', color: '#FF6B6B', maxWidth: '600px', textAlign: 'center', wordBreak: 'break-all' }}>
        {error.message}
      </p>
      {error.digest && (
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>Digest: {error.digest}</p>
      )}
      <button onClick={reset} style={{
        marginTop: '24px', background: '#B44FFF', color: 'white', border: 'none',
        borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px',
      }}>
        Reintentar
      </button>
    </div>
  )
}
