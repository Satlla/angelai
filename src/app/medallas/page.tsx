import { MEDALS } from '@/lib/medals'

export const metadata = { title: 'Medallas — AngelAI', description: 'Descubre qué medallas puedes conseguir en AngelAI y qué representa cada una.' }

export default function MedallasPage() {
  const rarityOrder = ['Común', 'Poco común', 'Raro', 'Muy raro', 'Épico', 'Legendario']
  const medals = Object.values(MEDALS)

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', color: 'white', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '80px 24px 48px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
        <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-1.2px', marginBottom: '16px', lineHeight: 1.1 }}>
          Las medallas de<br />
          <span style={{ background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AngelAI</span>
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
          No se trata solo de números. Se trata de disciplina, consistencia y resultados reales. Aquí el esfuerzo se reconoce.
        </p>
      </div>

      {/* Philosophy */}
      <div style={{ maxWidth: '640px', margin: '0 auto 64px', padding: '0 24px' }}>
        <div style={{ background: 'rgba(180,79,255,0.08)', border: '1px solid rgba(180,79,255,0.2)', borderRadius: '20px', padding: '28px 32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.4px' }}>
            La filosofía del mérito relativo
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, margin: 0 }}>
            En AngelAI entendemos que <strong style={{ color: 'rgba(255,255,255,0.8)' }}>no es lo mismo perder 1kg que perder 20kg</strong>.
            Por eso el sistema de medallas tiene en cuenta tu <em>recorrido</em> — cuánto te faltaba por conseguir al empezar.
            Quien tiene más camino por recorrer, alcanza las medallas con requisitos ligeramente ajustados.
            La disciplina diaria vale tanto como los resultados en la báscula.
          </p>
        </div>
      </div>

      {/* Medals */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '32px' }}>
          Todas las medallas
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {medals.map((medal, i) => (
            <div key={medal.id} style={{
              background: '#0C0D16',
              border: `1px solid ${medal.color}22`,
              borderRadius: '20px',
              padding: '24px 28px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Glow */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: `linear-gradient(90deg, transparent, ${medal.color}80, transparent)`,
              }} />

              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {/* Emoji */}
                <div style={{
                  width: '56px', height: '56px', flexShrink: 0,
                  background: `${medal.color}15`,
                  border: `1px solid ${medal.color}30`,
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px',
                }}>
                  {medal.emoji}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px', color: medal.color }}>
                      {medal.name}
                    </h3>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
                      color: 'rgba(255,255,255,0.35)',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '3px 8px', borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}>
                      {medal.rarity}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', marginBottom: '12px', lineHeight: 1.6 }}>
                    {medal.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: medal.color, flexShrink: 0, marginTop: '6px' }} />
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.6 }}>
                      <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Cómo conseguirla:</strong> {medal.requirement}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress indicator for rarity */}
              <div style={{ marginTop: '16px', height: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px' }}>
                <div style={{
                  height: '100%',
                  width: `${((i + 1) / medals.length) * 100}%`,
                  background: `linear-gradient(90deg, ${medal.color}60, ${medal.color})`,
                  borderRadius: '2px',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>
                  Nivel {i + 1} / {medals.length}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '48px', padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px', lineHeight: 1.6 }}>
            Las medallas se ganan con disciplina diaria.<br />
            La IA monitoriza tu progreso y las otorga automáticamente.
          </p>
          <a href="/dashboard" style={{ display: 'inline-block', padding: '14px 28px', background: 'linear-gradient(135deg,#B44FFF,#8B2FE0)', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px' }}>
            Ver mi dashboard →
          </a>
        </div>
      </div>
    </div>
  )
}
