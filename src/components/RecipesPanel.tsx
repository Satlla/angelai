'use client'
import { useState } from 'react'

type Recipe = { name: string; emoji: string; calories: number; protein: number; carbs: number; fat: number; time: string; ingredients: string[]; steps: string[]; tip: string }

const MEALS = [
  { key: 'desayuno', label: 'Desayuno', emoji: '🌅' },
  { key: 'almuerzo', label: 'Almuerzo', emoji: '☀️' },
  { key: 'merienda', label: 'Merienda', emoji: '🍎' },
  { key: 'cena', label: 'Cena', emoji: '🌙' },
]

export default function RecipesPanel() {
  const [meal, setMeal] = useState('almuerzo')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  async function generate() {
    setLoading(true)
    setRecipes([])
    setOpenIdx(null)
    try {
      const res = await fetch(`/api/recipes?meal=${meal}`)
      const data = await res.json()
      setRecipes(data.recipes || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '20px' }}>🥗</span>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Recetas sugeridas</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>Ajustadas a tus macros del plan</p>
        </div>
      </div>

      {/* Meal selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {MEALS.map(m => (
          <button key={m.key} onClick={() => setMeal(m.key)} style={{ flex: 1, padding: '8px 4px', borderRadius: '10px', border: `1px solid ${meal === m.key ? '#B44FFF' : 'rgba(255,255,255,0.08)'}`, background: meal === m.key ? 'rgba(180,79,255,0.12)' : 'transparent', color: meal === m.key ? '#B44FFF' : 'rgba(255,255,255,0.35)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <button onClick={generate} disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? 'rgba(180,79,255,0.1)' : '#B44FFF', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, fontSize: '14px', cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', marginBottom: recipes.length > 0 ? '16px' : '0' }}>
        {loading ? 'Generando recetas...' : '✨ Generar recetas'}
      </button>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <div style={{ width: '28px', height: '28px', border: '2px solid rgba(180,79,255,0.3)', borderTopColor: '#B44FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {recipes.map((r, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', marginBottom: '8px', overflow: 'hidden' }}>
          <div onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{r.emoji || '🍽️'}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{r.name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                  {r.calories}kcal · {r.protein}g prot · ⏱ {r.time}
                </div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: openIdx === i ? 'rotate(180deg)' : 'none', transition: '0.2s', opacity: 0.35, flexShrink: 0 }}>
              <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {openIdx === i && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Macros */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', margin: '12px 0' }}>
                {[{ l: 'Kcal', v: r.calories }, { l: 'Prot', v: `${r.protein}g` }, { l: 'HC', v: `${r.carbs}g` }, { l: 'Grasas', v: `${r.fat}g` }].map(m => (
                  <div key={m.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '7px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{m.v}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{m.l}</div>
                  </div>
                ))}
              </div>
              {/* Ingredients */}
              <p style={{ fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 600, marginBottom: '6px', marginTop: '12px' }}>Ingredientes</p>
              {r.ingredients?.map((ing, j) => (
                <div key={j} style={{ display: 'flex', gap: '8px', marginBottom: '4px', alignItems: 'flex-start' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#B44FFF', marginTop: '7px', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{ing}</span>
                </div>
              ))}
              {/* Steps */}
              <p style={{ fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 600, marginBottom: '6px', marginTop: '12px' }}>Preparación</p>
              {r.steps?.map((step, j) => (
                <div key={j} style={{ display: 'flex', gap: '10px', marginBottom: '6px', alignItems: 'flex-start' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(180,79,255,0.15)', border: '1px solid rgba(180,79,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#B44FFF', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>{j + 1}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
              {r.tip && (
                <div style={{ background: 'rgba(180,79,255,0.06)', border: '1px solid rgba(180,79,255,0.12)', borderRadius: '8px', padding: '10px', marginTop: '10px' }}>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>💡 {r.tip}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
