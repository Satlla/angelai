'use client'
import { useState, useEffect, useCallback } from 'react'

type FoodEntry = { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; meal: string }
type Targets = { calories: number; protein: number; carbs: number; fat: number }

const MEAL_LABELS: Record<string, string> = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', merienda: 'Merienda', cena: 'Cena', otros: 'Otros' }
const MEALS = ['desayuno', 'almuerzo', 'merienda', 'cena', 'otros']

function MacroBar({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? Math.round((consumed / target) * 100) : 0)
  const over = consumed > target
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: over ? '#FF6B6B' : 'rgba(255,255,255,0.7)' }}>
          {consumed} <span style={{ color: 'rgba(255,255,255,0.25)' }}>/ {target}</span>
        </span>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: over ? '#FF6B6B' : color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

export default function MacrosTracker({ targets }: { targets: Targets }) {
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [activeMeal, setActiveMeal] = useState('almuerzo')
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [saving, setSaving] = useState(false)

  const loadEntries = useCallback(() => {
    fetch('/api/food-entries').then(r => r.json()).then(d => setEntries(d.entries || []))
  }, [])

  useEffect(() => { loadEntries() }, [loadEntries])

  const totals = entries.reduce((acc, e) => ({
    calories: acc.calories + e.calories,
    protein: acc.protein + e.protein,
    carbs: acc.carbs + e.carbs,
    fat: acc.fat + e.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  async function addEntry() {
    if (!form.name.trim() || !form.calories) return
    setSaving(true)
    await fetch('/api/food-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, calories: Number(form.calories), protein: Number(form.protein) || 0, carbs: Number(form.carbs) || 0, fat: Number(form.fat) || 0, meal: activeMeal }),
    })
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '' })
    setShowAdd(false)
    setSaving(false)
    loadEntries()
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/food-entries?id=${id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const byMeal = MEALS.map(m => ({ meal: m, items: entries.filter(e => e.meal === m) })).filter(g => g.items.length > 0)

  return (
    <div>
      {/* Macro bars */}
      <div style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', fontWeight: 600 }}>Macros hoy</p>
          <span style={{ fontSize: '18px', fontWeight: 800, color: totals.calories > targets.calories ? '#FF6B6B' : '#B44FFF' }}>{totals.calories} <span style={{ fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.25)' }}>kcal</span></span>
        </div>
        <MacroBar label="Proteína" consumed={Math.round(totals.protein)} target={targets.protein} color="#00D9F5" />
        <MacroBar label="Carbos" consumed={Math.round(totals.carbs)} target={targets.carbs} color="#FFB800" />
        <MacroBar label="Grasas" consumed={Math.round(totals.fat)} target={targets.fat} color="#B44FFF" />
      </div>

      {/* Entries by meal */}
      {byMeal.map(group => (
        <div key={group.meal} style={{ background: '#0C0D16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', marginBottom: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px' }}>{MEAL_LABELS[group.meal]}</span>
          </div>
          {group.items.map(e => (
            <div key={e.id} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{e.name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginTop: '2px' }}>
                  {e.calories}kcal · {e.protein}g prot · {e.carbs}g HC · {e.fat}g grasas
                </div>
              </div>
              <button onClick={() => deleteEntry(e.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,107,107,0.4)', cursor: 'pointer', padding: '4px', fontSize: '16px', lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      ))}

      {/* Add button */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        style={{ width: '100%', padding: '13px', background: 'rgba(180,79,255,0.08)', border: '1px dashed rgba(180,79,255,0.25)', borderRadius: '12px', color: '#B44FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Añadir alimento
      </button>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: '#0C0D16', border: '1px solid rgba(180,79,255,0.2)', borderRadius: '14px', padding: '16px', marginTop: '8px' }}>
          {/* Meal selector */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {MEALS.map(m => (
              <button key={m} onClick={() => setActiveMeal(m)} style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${activeMeal === m ? '#B44FFF' : 'rgba(255,255,255,0.1)'}`, background: activeMeal === m ? 'rgba(180,79,255,0.15)' : 'transparent', color: activeMeal === m ? '#B44FFF' : 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {MEAL_LABELS[m]}
              </button>
            ))}
          </div>
          <input placeholder="Nombre del alimento" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', fontSize: '14px', marginBottom: '8px', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
            {[
              { key: 'calories', label: 'Kcal' },
              { key: 'protein', label: 'Prot(g)' },
              { key: 'carbs', label: 'HC(g)' },
              { key: 'fat', label: 'Grasas(g)' },
            ].map(f => (
              <input key={f.key} type="number" placeholder={f.label} value={form[f.key as keyof typeof form]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                style={{ padding: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', fontSize: '12px', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', textAlign: 'center' }} />
            ))}
          </div>
          <button onClick={addEntry} disabled={saving || !form.name.trim() || !form.calories}
            style={{ width: '100%', padding: '11px', background: saving || !form.name.trim() || !form.calories ? 'rgba(180,79,255,0.15)' : '#B44FFF', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, fontSize: '14px', cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Guardando...' : 'Añadir'}
          </button>
        </div>
      )}
    </div>
  )
}
