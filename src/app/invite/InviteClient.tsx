'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type InviteStatus = {
  inviteUsed: boolean
  inviteeEmail: string | null
  inviteeJoined: boolean
}

export default function InviteClient() {
  const [status, setStatus] = useState<InviteStatus | null>(null)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/invite').then(r => r.json()).then(setStatus)
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (res.ok) {
      setSent(true)
      setStatus({ inviteUsed: true, inviteeEmail: email, inviteeJoined: false })
    } else {
      setError(data.error || 'Error al enviar')
    }
    setSending(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07080F' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(7,8,15,0.94)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px' }}>Invitar</h1>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 20px 48px' }}>

        {/* Beta warning */}
        <div style={{ background: 'rgba(255,183,0,0.06)', border: '1px solid rgba(255,183,0,0.2)', borderRadius: '14px', padding: '14px 16px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,183,0,0.9)', marginBottom: '4px' }}>Plataforma en fase de pruebas</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>AngelAI está creciendo despacio, a propósito. Preferimos hacerlo bien antes que rápido. Solo invita a alguien que creas que de verdad puede beneficiarse.</p>
          </div>
        </div>

        {/* Main card */}
        <div style={{ background: '#0C0D16', border: '1px solid rgba(180,79,255,0.2)', borderRadius: '20px', padding: '28px 24px', marginBottom: '20px' }}>

          <div style={{ width: '48px', height: '48px', background: 'rgba(180,79,255,0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>✉️</span>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.6px', color: 'white', marginBottom: '8px' }}>
            Tu invitación, tu legado
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '24px' }}>
            Tienes <strong style={{ color: '#B44FFF' }}>1 invitación</strong>. Solo una. Úsala con alguien que creas que puede transformarse de verdad — un amigo, un familiar, alguien que lo necesite.
          </p>

          {status === null && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Cargando...</div>
          )}

          {status?.inviteUsed ? (
            <div>
              <div style={{ background: 'rgba(0,217,245,0.06)', border: '1px solid rgba(0,217,245,0.15)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{status.inviteeJoined ? '✅' : '⏳'}</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: status.inviteeJoined ? '#00D9F5' : 'rgba(255,255,255,0.6)', marginBottom: '2px' }}>
                    {status.inviteeJoined ? 'Ya se unió' : 'Pendiente de acceso'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{status.inviteeEmail}</p>
                </div>
              </div>
              {!status.inviteeJoined && (
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '10px', textAlign: 'center' }}>
                  Le hemos enviado el enlace de acceso. Cuando se registre, aparecerá como confirmado.
                </p>
              )}
            </div>
          ) : status && !status.inviteUsed ? (
            <form onSubmit={handleSend}>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                Email de tu invitado
              </label>
              <input
                type="email"
                placeholder="su@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="input-field"
                style={{ fontSize: '16px', marginBottom: '12px' }}
              />
              {error && <p style={{ color: '#FF6B6B', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
              {sent && <p style={{ color: '#00D9F5', fontSize: '13px', marginBottom: '12px' }}>¡Invitación enviada! Le hemos mandado el acceso.</p>}
              <button type="submit" disabled={sending} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
                {sending ? 'Enviando...' : 'Enviar invitación →'}
              </button>
            </form>
          ) : null}
        </div>

        {/* Bottom note */}
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', textAlign: 'center', lineHeight: 1.6 }}>
          Las invitaciones son personales e intransferibles. El enlace que recibe tu invitado está vinculado únicamente a su email.
        </p>
      </div>
    </div>
  )
}
