'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Entry = { rank: number; name: string; isMe: boolean; score: number; days: number; medal: string | null }

const MEDAL_EMOJI: Record<string, string> = {
  BRONCE: '🥉', PLATA: '🥈', ORO: '🥇', PLATINO: '💎', DIAMANTE: '💠', LEYENDA: '👑'
}

export default function LeaderboardClient() {
  const router = useRouter()
  const [ranking, setRanking] = useState<Entry[]>([])
  const [myPosition, setMyPosition] = useState<{ score: number; days: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { setRanking(d.ranking || []); setMyPosition(d.myPosition) })
      .finally(() => setLoading(false))
  }, [])

  const topColors = ['#FFD700', '#C0C0C0', '#CD7F32']

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', color: 'white', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '480px', margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>Ranking semanal</h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Top disciplina — últimos 7 días</p>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid rgba(180,79,255,0.3)', borderTopColor: '#B44FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : ranking.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>Sin datos suficientes todavía.</p>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', marginTop: '8px' }}>Registra al menos 3 días esta semana para aparecer.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ranking.map((entry, i) => (
              <div key={i} style={{
                background: entry.isMe ? 'rgba(180,79,255,0.1)' : '#0C0D16',
                border: `1px solid ${entry.isMe ? 'rgba(180,79,255,0.35)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '14px', padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: '14px',
              }}>
                {/* Rank badge */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: i < 3 ? `${topColors[i]}20` : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${i < 3 ? topColors[i] : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: i < 3 ? '16px' : '13px', fontWeight: 700,
                  color: i < 3 ? topColors[i] : 'rgba(255,255,255,0.4)',
                }}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : entry.rank}
                </div>

                {/* Name + medal */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: entry.isMe ? 700 : 500, color: entry.isMe ? '#B44FFF' : 'white' }}>
                      {entry.name}
                    </span>
                    {entry.isMe && <span style={{ fontSize: '10px', color: '#B44FFF', fontWeight: 700, letterSpacing: '1px' }}>TÚ</span>}
                    {entry.medal && <span style={{ fontSize: '13px' }}>{MEDAL_EMOJI[entry.medal] || ''}</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                    {entry.days} días registrados
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: entry.score >= 80 ? '#00D9F5' : entry.score >= 60 ? '#B44FFF' : 'rgba(255,255,255,0.6)' }}>
                    {entry.score}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px' }}>disciplina</div>
                </div>
              </div>
            ))}

            {/* My position if outside top 20 */}
            {myPosition && (
              <div style={{ background: 'rgba(180,79,255,0.05)', border: '1px dashed rgba(180,79,255,0.2)', borderRadius: '14px', padding: '14px 18px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Tu posición (fuera del top 20)</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{myPosition.days} días registrados</div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'rgba(180,79,255,0.7)' }}>{myPosition.score}</div>
              </div>
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.15)', marginTop: '24px', lineHeight: 1.6 }}>
          Ranking anónimo. Se muestran solo iniciales.<br />Mínimo 3 registros esta semana para aparecer.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
