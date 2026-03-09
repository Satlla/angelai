'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const QUESTIONS = [
  {
    key: 'dietScore',
    type: 'slider',
    label: '¿Cuánto has cumplido con tu dieta hoy?',
    emoji: '🥗',
    min: 0,
    max: 100,
    unit: '%',
    color: '#B44FFF',
  },
  {
    key: 'stressLevel',
    type: 'slider',
    label: '¿Cómo ha sido tu nivel de estrés?',
    emoji: '🧠',
    min: 1,
    max: 5,
    unit: '/5',
    color: '#FF6B6B',
    labels: ['Muy bajo', 'Bajo', 'Moderado', 'Alto', 'Muy alto'],
  },
  {
    key: 'trainedToday',
    type: 'bool',
    label: '¿Has entrenado hoy?',
    emoji: '💪',
    color: '#00D9F5',
  },
  {
    key: 'sleptWell',
    type: 'bool',
    label: '¿Has dormido bien?',
    emoji: '😴',
    color: '#B44FFF',
  },
  {
    key: 'waterOk',
    type: 'bool',
    label: '¿Has bebido suficiente agua?',
    emoji: '💧',
    color: '#00D9F5',
  },
]

export default function DailyClient() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number | boolean>>({
    dietScore: 80,
    stressLevel: 2,
    trainedToday: false,
    sleptWell: true,
    waterOk: true,
  })
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(0)

  const totalSteps = QUESTIONS.length + 1 // +1 for notes
  const progress = ((step + 1) / (totalSteps + 1)) * 100

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...answers, notes }),
      })
      if (res.ok) {
        // Calcular puntuación de disciplina local
        const d = answers.dietScore as number
        const t = answers.trainedToday ? 20 : 0
        const s = answers.sleptWell ? 15 : 0
        const w = answers.waterOk ? 10 : 0
        const st = Math.max(0, (5 - (answers.stressLevel as number)) * 3)
        const calculated = Math.min(100, Math.round(d * 0.55 + t + s + w + st))
        setScore(calculated)
        setDone(true)
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    const level = score >= 85 ? 'ÉLITE' : score >= 70 ? 'BUENO' : score >= 50 ? 'REGULAR' : 'BAJO'
    const color = score >= 85 ? '#00D9F5' : score >= 70 ? '#B44FFF' : score >= 50 ? '#FFB800' : '#FF6B6B'
    const message = score >= 85
      ? '¡Día perfecto! La constancia te lleva a la cima.'
      : score >= 70
      ? 'Buen día. Cada esfuerzo cuenta.'
      : score >= 50
      ? 'Día regular. Mañana lo recuperas.'
      : 'Hoy fue difícil. No te rindas.'

    return (
      <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: '380px', width: '100%', textAlign: 'center' }}>

          {/* Score ring */}
          <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 32px' }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle
                cx="80" cy="80" r="68"
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 68}`}
                strokeDashoffset={`${2 * Math.PI * 68 * (1 - score / 100)}`}
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dashoffset 1.2s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, color, letterSpacing: '-2px' }}>{score}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '1px' }}>DISCIPLINA</div>
            </div>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 700, color, letterSpacing: '2px', marginBottom: '12px' }}>{level}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '12px' }}>{message}</h2>

          {/* Resumen */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
            {[
              { label: 'Dieta', value: `${answers.dietScore}%`, color: '#B44FFF' },
              { label: 'Entrenamiento', value: answers.trainedToday ? 'Sí ✓' : 'No ✗', color: answers.trainedToday ? '#00D9F5' : 'rgba(255,255,255,0.25)' },
              { label: 'Sueño', value: answers.sleptWell ? 'Bien ✓' : 'Mal ✗', color: answers.sleptWell ? '#00D9F5' : 'rgba(255,255,255,0.25)' },
              { label: 'Hidratación', value: answers.waterOk ? 'Ok ✓' : 'Mejorable ✗', color: answers.waterOk ? '#00D9F5' : 'rgba(255,255,255,0.25)' },
              { label: 'Estrés', value: `${answers.stressLevel}/5`, color: (answers.stressLevel as number) <= 2 ? '#00D9F5' : '#FFB800' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: item.color }}>{item.value as string}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            style={{ width: '100%', padding: '16px', background: '#B44FFF', border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px' }}
          >
            Ver mi dashboard →
          </button>

          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '16px' }}>
            La IA usará estos datos en tu próxima revisión quincenal
          </p>
        </div>
      </div>
    )
  }

  const q = step < QUESTIONS.length ? QUESTIONS[step] : null
  const isLastQuestion = step === QUESTIONS.length - 1
  const isNotesStep = step === QUESTIONS.length

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', flexDirection: 'column' }}>

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #B44FFF, #00D9F5)', width: `${progress}%`, transition: 'width 0.4s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      {/* Header */}
      <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto', padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          ANGEL<span style={{ background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
        </span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
          {step + 1} / {totalSteps}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: '480px', width: '100%', margin: '0 auto', padding: '48px 24px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

        {q && (
          <div key={step} style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: '40px', marginBottom: '24px' }}>{q.emoji}</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.6px', marginBottom: '40px', lineHeight: 1.3 }}>
              {q.label}
            </h2>

            {q.type === 'slider' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 900, color: q.color, letterSpacing: '-3px', lineHeight: 1 }}>
                    {answers[q.key] as number}
                    <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{q.unit}</span>
                  </span>
                  {q.labels && (
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                      {q.labels[(answers[q.key] as number) - 1]}
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative', height: '52px', display: 'flex', alignItems: 'center' }}>
                  {/* Track */}
                  <div style={{ position: 'absolute', left: 0, right: 0, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${q.color}88, ${q.color})`,
                      width: `${((answers[q.key] as number) - (q.min ?? 0)) / ((q.max ?? 100) - (q.min ?? 0)) * 100}%`,
                      transition: 'width 0.1s ease',
                      borderRadius: '3px',
                    }} />
                  </div>
                  <input
                    type="range"
                    min={q.min}
                    max={q.max}
                    value={answers[q.key] as number}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.key]: Number(e.target.value) }))}
                    style={{
                      position: 'absolute', left: 0, right: 0, width: '100%',
                      opacity: 0, height: '52px', cursor: 'pointer',
                    }}
                  />
                  {/* Thumb visual */}
                  <div style={{
                    position: 'absolute',
                    left: `calc(${((answers[q.key] as number) - (q.min ?? 0)) / ((q.max ?? 100) - (q.min ?? 0)) * 100}% - 14px)`,
                    width: '28px', height: '28px',
                    background: q.color,
                    borderRadius: '50%',
                    boxShadow: `0 0 20px ${q.color}60`,
                    transition: 'left 0.1s ease',
                    pointerEvents: 'none',
                  }} />
                </div>

                {q.key === 'dietScore' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    {[0, 25, 50, 75, 100].map(v => (
                      <span key={v} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>{v}%</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {q.type === 'bool' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[true, false].map(val => (
                  <button
                    key={String(val)}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.key]: val }))}
                    style={{
                      padding: '28px 20px',
                      borderRadius: '16px',
                      border: answers[q.key] === val ? `2px solid ${q.color}` : '2px solid rgba(255,255,255,0.06)',
                      background: answers[q.key] === val ? `${q.color}18` : 'rgba(255,255,255,0.02)',
                      color: answers[q.key] === val ? 'white' : 'rgba(255,255,255,0.45)',
                      fontSize: '28px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '36px' }}>{val ? '✓' : '✗'}</span>
                    <span style={{ fontSize: '15px', fontWeight: 700 }}>{val ? 'Sí' : 'No'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isNotesStep && (
          <div key="notes" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: '40px', marginBottom: '24px' }}>📝</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.6px', marginBottom: '12px' }}>
              ¿Algo más que quieras comentar?
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', marginBottom: '28px' }}>
              Opcional. La IA lo tendrá en cuenta en tu revisión.
            </p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: comí fuera en una cena de trabajo, o estoy con agujetas..."
              rows={4}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
                color: 'white', padding: '16px', fontSize: '15px',
                fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.6,
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Navigation */}
        <div style={{ paddingTop: '40px' }}>
          <button
            onClick={() => {
              if (isNotesStep) {
                handleSubmit()
              } else {
                setStep(s => s + 1)
              }
            }}
            disabled={submitting}
            style={{
              width: '100%', padding: '18px',
              background: 'linear-gradient(135deg, #B44FFF, #8B2FE0)',
              border: 'none', borderRadius: '16px',
              color: 'white', fontSize: '16px', fontWeight: 700,
              cursor: 'pointer', letterSpacing: '-0.2px',
              boxShadow: '0 4px 24px rgba(180,79,255,0.35)',
            }}
          >
            {isNotesStep ? (submitting ? 'Guardando...' : 'Enviar resumen del día') : 'Siguiente →'}
          </button>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{ width: '100%', marginTop: '12px', padding: '14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '14px', cursor: 'pointer' }}
            >
              ← Atrás
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
