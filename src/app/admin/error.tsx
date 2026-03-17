'use client'

export default function AdminError({ error }: { error: Error & { digest?: string } }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#07080F', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '40px',
      fontFamily: 'monospace',
    }}>
      <div style={{
        maxWidth: '800px', width: '100%',
        background: '#0C0D16', border: '1px solid rgba(255,107,107,0.3)',
        borderRadius: '16px', padding: '32px',
      }}>
        <h2 style={{ color: '#FF6B6B', fontSize: '18px', marginBottom: '16px' }}>Admin Error</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '12px' }}>
          <strong style={{ color: 'white' }}>Mensaje:</strong> {error.message}
        </p>
        {error.digest && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '12px' }}>
            Digest: {error.digest}
          </p>
        )}
        <pre style={{
          color: 'rgba(255,255,255,0.5)', fontSize: '11px', lineHeight: 1.6,
          background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '16px',
          overflow: 'auto', maxHeight: '400px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>
          {error.stack}
        </pre>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px', padding: '10px 20px', borderRadius: '10px',
            background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.4)',
            color: '#FF6B6B', cursor: 'pointer', fontFamily: 'monospace', fontSize: '13px',
          }}
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
