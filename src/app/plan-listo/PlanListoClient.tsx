'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type DietPlan = {
  calories: number
  protein: number
  carbs: number
  fat: number
  diet: Record<string, unknown>
  training: {
    dias: number
    tipo: string
    rutina: Array<{ dia: string; nombre: string; ejercicios: Array<{ nombre: string; series: number; reps: string }> }>
  }
  mealCalories: Record<string, number>
  supplements?: string[]
  tips?: string[]
  shoppingList?: unknown[]
  analysis?: string
  bodyScore?: number
  rank?: string
}

type Msg = { role: 'user' | 'assistant'; content: string }

export default function PlanListoClient({
  checkInId,
  sex,
  name,
  plan: initialPlan,
}: {
  checkInId: string
  sex: string
  name: string | null
  plan: DietPlan
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingPatch, setPendingPatch] = useState<{ diet?: unknown; training?: unknown; mealCalories?: Record<string, number> } | null>(null)
  const [plan, setPlan] = useState(initialPlan)

  const comodo = sex === 'mujer' ? 'cómoda' : 'cómodo'
  const greeting = name ? `¡Hola ${name.split(' ')[0]}!` : '¡Hola!'

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setLoading(true)

    const newHistory = [...messages, { role: 'user' as const, content: userMsg }]
    setMessages(newHistory)

    try {
      const res = await fetch('/api/plan-refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          checkInId,
          history: messages,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages([...newHistory, { role: 'assistant', content: data.error || 'Error al procesar tu petición.' }])
        return
      }

      setMessages([...newHistory, { role: 'assistant', content: data.reply }])

      if (data.possible !== false && (data.diet || data.training)) {
        const patch: { diet?: unknown; training?: unknown; mealCalories?: Record<string, number> } = {}
        if (data.diet) { patch.diet = data.diet; setPlan(p => ({ ...p, diet: data.diet })) }
        if (data.training) { patch.training = data.training; setPlan(p => ({ ...p, training: data.training })) }
        if (data.mealCalories) { patch.mealCalories = data.mealCalories; setPlan(p => ({ ...p, mealCalories: data.mealCalories })) }
        setPendingPatch(prev => ({ ...prev, ...patch }))
      }
    } catch {
      setMessages([...newHistory, { role: 'assistant', content: 'Error de conexión. Inténtalo de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  async function saveAndContinue() {
    if (!pendingPatch) { router.push('/dashboard'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/plan-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkInId, patch: pendingPatch }),
      })
      if (res.ok) router.push('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const mealLabels: Record<string, string> = {
    antesDesayuno: 'Antes del desayuno',
    desayuno: 'Desayuno',
    mediaManana: 'Media mañana',
    almuerzo: 'Almuerzo',
    comida: 'Comida',
    merienda: 'Merienda',
    cena: 'Cena',
    antesDeCormir: 'Antes de dormir',
  }

  const mealKeys = Object.keys(plan.diet || {}).filter(k => mealLabels[k])

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ padding: '40px 20px 24px', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(180,79,255,0.2), rgba(0,217,245,0.2))',
          border: '1px solid rgba(180,79,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M6 14.5L12 20.5L22 9" stroke="url(#g)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B44FFF"/>
                <stop offset="100%" stopColor="#00D9F5"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '8px' }}>
          ¡Tu plan está listo!
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Revísalo y dime si quieres cambiar algo antes de empezar
        </p>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px' }}>

        {/* Macros summary */}
        <div style={{
          background: '#0C0D16', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', padding: '20px', marginBottom: '12px',
        }}>
          <p style={{ fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '16px' }}>
            Macros diarios
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { label: 'Kcal', value: plan.calories },
              { label: 'Prot', value: `${plan.protein}g` },
              { label: 'Carbs', value: `${plan.carbs}g` },
              { label: 'Grasa', value: `${plan.fat}g` },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>{m.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.5px', marginTop: '3px' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Meals summary */}
        <div style={{
          background: '#0C0D16', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', padding: '20px', marginBottom: '12px',
        }}>
          <p style={{ fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '14px' }}>
            Plan de nutrición — {mealKeys.length} comidas
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mealKeys.map(key => {
              const kcal = plan.mealCalories?.[key]
              const meal = plan.diet[key] as { opcionA?: string[] } | string[] | undefined
              const preview = Array.isArray(meal)
                ? meal[0]
                : (meal as { opcionA?: string[] })?.opcionA?.[0] || ''
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{mealLabels[key]}</span>
                    {preview && (
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {preview}
                      </p>
                    )}
                  </div>
                  {kcal && (
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, flexShrink: 0 }}>{kcal} kcal</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Training summary */}
        {plan.training && (
          <div style={{
            background: '#0C0D16', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', padding: '20px', marginBottom: '24px',
          }}>
            <p style={{ fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '14px' }}>
              Entrenamiento — {plan.training.dias} días/semana
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {plan.training.rutina?.slice(0, 4).map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: 'rgba(180,79,255,0.1)', border: '1px solid rgba(180,79,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 800, color: '#B44FFF', flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{d.nombre || d.dia}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{d.ejercicios?.length} ejercicios</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{d.dia}</span>
                </div>
              ))}
              {plan.training.rutina?.length > 4 && (
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '4px' }}>
                  +{plan.training.rutina.length - 4} días más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Chat section */}
        <div style={{
          background: 'rgba(180,79,255,0.04)', border: '1px solid rgba(180,79,255,0.12)',
          borderRadius: '16px', overflow: 'hidden', marginBottom: '16px',
        }}>
          <div style={{ padding: '16px 18px 0' }}>
            <p style={{ fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(180,79,255,0.6)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px' }}>
              Personaliza tu plan
            </p>
          </div>

          {/* Initial greeting bubble */}
          <div style={{ padding: '0 16px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px 14px 14px 4px', padding: '12px 14px', marginBottom: '10px',
            }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                {greeting} Tu plan está generado. ¿Quieres cambiar algo de la dieta o del entrenamiento? Puedes pedirme lo que necesites hasta que te sientas <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{comodo}</strong>: sin huevos en el desayuno, más pasta, cambiar un ejercicio, lo que sea.
              </p>
            </div>
          </div>

          {/* Conversation */}
          {messages.length > 0 && (
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' ? 'rgba(180,79,255,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(180,79,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    fontSize: '13px', lineHeight: 1.55,
                    color: msg.role === 'user' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.65)',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: '14px 14px 14px 4px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', gap: '5px', alignItems: 'center',
                  }}>
                    {[0, 150, 300].map(delay => (
                      <div key={delay} style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: 'rgba(180,79,255,0.6)',
                        animation: `bounce 1.2s ${delay}ms infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px 16px', display: 'flex', gap: '8px' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Ej: quiero más opciones sin huevos, ponme salmón en la cena, cambia la máquina de pecho por fondos..."
              rows={2}
              disabled={loading}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                color: 'white', padding: '10px 12px', fontSize: '13px',
                fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: '40px', height: '40px', flexShrink: 0, alignSelf: 'flex-end',
                borderRadius: '10px',
                background: loading || !input.trim() ? 'rgba(180,79,255,0.08)' : 'rgba(180,79,255,0.25)',
                border: '1px solid rgba(180,79,255,0.3)', color: '#B44FFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="8" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pendingPatch && (
            <button
              onClick={saveAndContinue}
              disabled={saving}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '15px' }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios y continuar →'}
            </button>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              width: '100%', padding: '16px', fontSize: '14px', fontWeight: 600,
              background: pendingPatch ? 'transparent' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${pendingPatch ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '14px', color: pendingPatch ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {pendingPatch ? 'Descartar cambios e ir al dashboard' : 'El plan está perfecto, ir al dashboard →'}
          </button>
        </div>

      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
