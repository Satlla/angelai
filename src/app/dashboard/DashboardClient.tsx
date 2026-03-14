'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

const BodyScoreOrb = dynamic(() => import('@/components/BodyScoreOrb'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', aspectRatio: '1', maxWidth: '280px', margin: '0 auto' }} />,
})

const ProgressChart3D = dynamic(() => import('@/components/ProgressChart3D'), {
  ssr: false,
  loading: () => <div style={{ height: '280px', borderRadius: '16px', background: '#070810' }} />,
})

const MacrosTracker = dynamic(() => import('@/components/MacrosTracker'), { ssr: false })
const FoodAnalyzer = dynamic(() => import('@/components/FoodAnalyzer'), { ssr: false })
const RecipesPanel = dynamic(() => import('@/components/RecipesPanel'), { ssr: false })

const BADGE_INFO: Record<string, { label: string }> = {
  primer_paso:    { label: 'Primer paso' },
  sin_rendirse:   { label: 'Sin rendirse' },
  constancia:     { label: 'Constancia de hierro' },
  primer_kilo:    { label: 'Primer kilo' },
  transformacion: { label: 'Transformación' },
}

const RANK_COLORS: Record<string, string> = {
  BRONCE: '#CD7F32', PLATA: '#C0C0C0', ORO: '#FFD700',
  PLATINO: '#E5E4E2', DIAMANTE: '#00D9F5', LEYENDA: '#B44FFF',
}

type CheckIn = {
  id: string; createdAt: string; weight: number; bodyScore: number | null;
  rank: string | null; analysis: string | null; dietPlan: string | null;
  goal: string; waist?: number | null; hips?: number | null;
  chest?: number | null; arms?: number | null;
  customizationUsed?: boolean;
  frontPhotoUrl?: string | null; sidePhotoUrl?: string | null;
}

type Tab = 'overview' | 'diet' | 'shopping' | 'progress' | 'training' | 'history' | 'coach' | 'macros' | 'recipes'

type DailyLogEntry = { date: string; disciplineScore: number | null; trainedToday: boolean }

// ── Streak helpers ──────────────────────────────────────────────────────────
function calcStreak(logs: DailyLogEntry[]): number {
  if (!logs.length) return 0
  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const lastDate = new Date(sorted[0].date); lastDate.setHours(0, 0, 0, 0)
  if (lastDate < yesterday) return 0
  let streak = 0
  let check = lastDate.getTime() === today.getTime() ? today : yesterday
  for (const log of sorted) {
    const d = new Date(log.date); d.setHours(0, 0, 0, 0)
    if (d.getTime() === check.getTime()) {
      streak++
      check = new Date(check); check.setDate(check.getDate() - 1)
    } else break
  }
  return streak
}

function weeksToSummer(): number {
  const summer = new Date(new Date().getFullYear(), 5, 21) // June 21
  const diff = summer.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)))
}

function daysSinceLastLog(logs: DailyLogEntry[]): number {
  if (!logs.length) return 999
  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const last = new Date(sorted[0].date); last.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - last.getTime()) / 86400000)
}

const AGGRESSIVE_MSGS = [
  (d: number, w: number) => `Llevas ${d} días sin aparecer. ¿Qué está pasando? ${w > 0 ? `Quedan ${w} semanas para verano.` : ''}`,
  (d: number, w: number) => `${d} días desaparecido. Mientras tú descansas, otros entrenan. ${w > 0 ? `${w} semanas para verano. Espabila.` : 'Espabila.'}`,
  (d: number, w: number) => `¿${d} días sin registrar? El cuerpo no se transforma solo. ${w > 0 ? `Te quedan ${w} semanas. Mueve el culo.` : 'Mueve el culo.'}`,
]

function getMotivationalMsg(days: number, streak: number): { text: string; emoji: string; color: string; bg: string } {
  const w = weeksToSummer()
  if (days === 0 && streak >= 7) return { text: `🔥 ${streak} días de racha. Eso es disciplina real. No la rompas.`, emoji: '🔥', color: '#FFB800', bg: 'rgba(255,184,0,0.08)' }
  if (days === 0 && streak >= 3) return { text: `💪 ${streak} días seguidos. Vas bien. Sigue.`, emoji: '💪', color: '#4CAF50', bg: 'rgba(76,175,80,0.08)' }
  if (days === 1) return { text: `Ayer no registraste. ¿Qué pasó? Hoy sin excusas.${w > 0 ? ` Quedan ${w} semanas para verano.` : ''}`, emoji: '⚠️', color: '#FFB800', bg: 'rgba(255,184,0,0.08)' }
  if (days >= 2) {
    const msg = AGGRESSIVE_MSGS[days % AGGRESSIVE_MSGS.length](days, w)
    return { text: msg, emoji: '🚨', color: '#FF6B6B', bg: 'rgba(255,107,107,0.08)' }
  }
  return { text: '', emoji: '', color: '', bg: '' }
}

type ShoppingItem = {
  item: string;
  weeklyGrams: number;
  category: string;
}

type DietPlan = {
  calories: number; protein: number; carbs: number; fat: number; tdee?: number;
  bodyScore: number; rank: string; analysis: string; progressSummary?: string;
  diet: {
    antesDesayuno: string[];
    desayuno: { opcionA: string[]; opcionB: string[]; opcionC: string[] };
    mediaManana: { opcionA: string[]; opcionB: string[]; opcionC: string[] };
    comida?: { opcionA: string[]; opcionB: string[]; opcionC: string[] };
    almuerzo?: { opcionA: string[]; opcionB: string[]; opcionC: string[] };
    merienda: { opcionA: string[]; opcionB?: string[]; opcionC?: string[] };
    cena: { opcionA: string[]; opcionB: string[]; opcionC: string[] };
    antesDeCormir: string[];
    [key: string]: { opcionA?: string[]; opcionB?: string[]; opcionC?: string[] } | string[] | undefined;
  };
  mealCalories: Record<string, number>;
  training: {
    dias: number; tipo: string;
    rutina: Array<{ dia: string; nombre: string; ejercicios: Array<{ nombre: string; series: number; reps: string; descanso: string }> }>;
  };
  supplements: string[]; tips: string[]; weeklyPlan: string;
  cheatDay: string; dietVarietyNotes: string;
  shoppingList: ShoppingItem[];
  lastCustomization?: string; badges?: string[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit?: string;
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#111220',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
        {payload[0].value}<span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '3px' }}>{unit}</span>
      </p>
    </div>
  )
}

type UserPreferences = {
  trainingDays: number | null
  cardioTime: string | null
  equipment: string | null
  likedExercises: string[]
  dislikedExercises: string[]
  trainingNotes: string | null
  dietNotes: string | null
}

export default function DashboardClient({ user, checkIns, badges, daysLeft, preferences: initialPrefs, dailyReminderEnabled, hasLoggedToday, dailyLogs: initialDailyLogs }: {
  user: { id: string; email: string; name: string | null; profilePhotoUrl?: string | null }
  checkIns: CheckIn[]
  badges: { badge: string; earnedAt: string }[]
  daysLeft: number
  preferences: UserPreferences
  dailyReminderEnabled: boolean
  hasLoggedToday: boolean
  dailyLogs: DailyLogEntry[]
}) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [prefs, setPrefs] = useState<UserPreferences>(initialPrefs)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
    const key = `shopping_${checkIns[0]?.id}_w${weekNum}`
    try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} }
  })
  const [blockedDays, setBlockedDays] = useState<number | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const blocked = searchParams.get('checkin_blocked')
    if (blocked) setBlockedDays(parseInt(blocked))
  }, [searchParams])
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [editPrefs, setEditPrefs] = useState<UserPreferences>(initialPrefs)
  const [swappingExercise, setSwappingExercise] = useState<string | null>(null)
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustText, setAdjustText] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)
  const [adjustError, setAdjustError] = useState('')
  const [adjustDone, setAdjustDone] = useState(false)
  const [adjustMessages, setAdjustMessages] = useState<Array<{role: 'user'|'assistant', content: string}>>([])
  const [pendingDietPlan, setDietPlan] = useState<object | null>(null)
  const [swapInput, setSwapInput] = useState('')
  const [lightMode, setLightMode] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user.profilePhotoUrl ?? null)
  const [showDailyReminder, setShowDailyReminder] = useState(false)
  const [coachMessages, setCoachMessages] = useState<Array<{role: 'user'|'assistant'; content: string}>>([])
  const [coachInput, setCoachInput] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [showJarvis, setShowJarvis] = useState(false)
  const [jarvisGreeting, setJarvisGreeting] = useState(false)
  const [doneExercises, setDoneExercises] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(`ex_${checkIns[0]?.id}`) || '{}') } catch { return {} }
  })
  const photoInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const streak = calcStreak(initialDailyLogs)
  const daysSince = daysSinceLastLog(initialDailyLogs)
  const motivMsg = getMotivationalMsg(daysSince, streak)

  useEffect(() => {
    const saved = localStorage.getItem('angelai_theme')
    if (saved === 'light') setLightMode(true)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', lightMode ? 'light' : 'dark')
    localStorage.setItem('angelai_theme', lightMode ? 'light' : 'dark')
  }, [lightMode])

  useEffect(() => {
    // Dr. Jarvis greeting — show once per day unless permanently dismissed
    if (!localStorage.getItem('jarvis_no_molestar')) {
      const greetKey = `jarvis_greeted_${new Date().toDateString()}`
      if (!localStorage.getItem(greetKey)) {
        setTimeout(() => setJarvisGreeting(true), 1500)
        localStorage.setItem(greetKey, '1')
      }
    }
  }, [])

  useEffect(() => {
    if (!dailyReminderEnabled) return
    const dismissedKey = `reminder_dismissed_${new Date().toDateString()}`
    if (localStorage.getItem(dismissedKey)) return
    if (daysSince >= 1) {
      setShowDailyReminder(true)
    } else if (!hasLoggedToday && new Date().getHours() >= 22) {
      setShowDailyReminder(true)
    }
  }, [dailyReminderEnabled, hasLoggedToday, daysSince])

  async function savePreferences(updated: UserPreferences) {
    setPrefsSaving(true)
    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      setPrefs(updated)
    } finally {
      setPrefsSaving(false)
    }
  }

  async function addDislikedExercise(name: string) {
    const updated = {
      ...prefs,
      dislikedExercises: [...(prefs.dislikedExercises || []).filter(e => e !== name), name],
    }
    await savePreferences(updated)
    setSwappingExercise(null)
    setSwapInput('')
  }

  async function addLikedExercise(name: string) {
    const updated = {
      ...prefs,
      likedExercises: [...(prefs.likedExercises || []).filter(e => e !== name), name],
    }
    await savePreferences(updated)
  }

  const latest = checkIns[0]
  const prev = checkIns[1]
  const dietData: DietPlan | null = (() => { try { return latest.dietPlan ? JSON.parse(latest.dietPlan) as DietPlan : null } catch { return null } })()
  const score = latest.bodyScore || 0
  const rank = latest.rank || 'BRONCE'
  const rankColor = RANK_COLORS[rank] || '#B44FFF'
  const weightDiff = prev ? (latest.weight - prev.weight).toFixed(1) : null

  // Chart data: oldest → newest
  const chartData = [...checkIns].reverse().map(c => ({
    date: new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    Peso: c.weight,
    Score: c.bodyScore || 0,
  }))

  // 3D progress data
  const progress3DData = [...checkIns].reverse().map(c => ({
    date: new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    score: c.bodyScore || 0,
    weight: c.weight,
    rank: c.rank || 'BRONCE',
  }))

  function toggleShoppingItem(itemName: string) {
    const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
    const key = `shopping_${latest.id}_w${weekNum}`
    setCheckedItems(prev => {
      const updated = { ...prev, [itemName]: !prev[itemName] }
      try { localStorage.setItem(key, JSON.stringify(updated)) } catch { /* noop */ }
      return updated
    })
  }

  function clearShoppingList() {
    const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
    const key = `shopping_${latest.id}_w${weekNum}`
    try { localStorage.removeItem(key) } catch { /* noop */ }
    setCheckedItems({})
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('photo', file)
    const res = await fetch('/api/profile/photo', { method: 'POST', body: form })
    if (res.ok) {
      const data = await res.json()
      setProfilePhoto(data.url)
    }
    e.target.value = ''
  }

  function shareJarvisMessage(content: string) {
    const text = content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/_\((.*?)\)_/g, '$1')
    const shareText = `Dr. Jarvis (AngelAI) me dice:\n\n"${text}"\n\n💪 angelai.app`
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareText).then(() => alert('¡Copiado! Pégalo donde quieras 😄'))
    }
  }

  async function sendCoachMessage() {
    if (!coachInput.trim() || coachLoading) return
    const userMsg = coachInput.trim()
    setCoachInput('')
    setCoachLoading(true)
    const newHistory = [...coachMessages, { role: 'user' as const, content: userMsg }]
    setCoachMessages(newHistory)
    try {
      const res = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: coachMessages }),
      })
      const data = await res.json()
      setCoachMessages([...newHistory, { role: 'assistant', content: data.reply || 'Error al responder.' }])
    } catch {
      setCoachMessages([...newHistory, { role: 'assistant', content: 'Error de conexión.' }])
    } finally {
      setCoachLoading(false)
    }
  }

  function toggleExerciseDone(key: string) {
    setDoneExercises(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem(`ex_${checkIns[0]?.id}`, JSON.stringify(updated)) } catch { /* */ }
      return updated
    })
  }

  async function sendAdjustMessage() {
    if (!adjustText.trim() || adjustLoading) return
    const userMsg = adjustText.trim()
    setAdjustText('')
    setAdjustLoading(true)
    setAdjustError('')

    const newHistory = [...adjustMessages, { role: 'user' as const, content: userMsg }]
    setAdjustMessages(newHistory)

    try {
      const res = await fetch('/api/diet-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          checkInId: checkIns[0]?.id,
          history: adjustMessages,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setAdjustError(data.error || 'Error al procesar tu peticion.')
        setAdjustMessages(adjustMessages)
        return
      }

      setAdjustMessages([...newHistory, { role: 'assistant', content: data.reply }])
      if (data.diet) setDietPlan(data.diet)
    } catch {
      setAdjustError('Error de conexion. Intentalo de nuevo.')
      setAdjustMessages(adjustMessages)
    } finally {
      setAdjustLoading(false)
    }
  }

  async function downloadDietPDF() {
    if (!dietData) return
    setPdfLoading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const checkInData = checkIns[0]
      let y = 0

      // ── Helper: check page break ──
      const checkPage = (needed = 12) => {
        if (y > 260 - needed) { doc.addPage(); y = 20 }
      }

      // ── Helper: section heading ──
      const sectionTitle = (title: string) => {
        checkPage(16)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(123, 63, 228)
        doc.text(title, 20, y)
        y += 1
        doc.setDrawColor(123, 63, 228)
        doc.setLineWidth(0.4)
        doc.line(20, y + 1, pageW - 20, y + 1)
        y += 6
      }

      // ── Helper: body text ──
      const bodyText = (text: string, indent = 20, size = 9) => {
        checkPage()
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(size)
        doc.setTextColor(40, 40, 40)
        const lines = doc.splitTextToSize(text, pageW - 40)
        doc.text(lines, indent, y)
        y += (lines as string[]).length * (size * 0.42) + 2
      }

      // ── Helper: bullet item ──
      const bulletItem = (text: string, indent = 24) => {
        checkPage()
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(40, 40, 40)
        const lines = doc.splitTextToSize(`• ${text}`, pageW - 40 - (indent - 20))
        doc.text(lines, indent, y)
        y += (lines as string[]).length * 4.5 + 1.5
      }

      // ── Helper: sub-label ──
      const subLabel = (text: string) => {
        checkPage()
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 120)
        doc.text(text, 26, y)
        y += 5
      }

      // ═══════════════════════════════════════════
      // HEADER (purple gradient bar, 40mm)
      // ═══════════════════════════════════════════
      doc.setFillColor(123, 63, 228)
      doc.rect(0, 0, pageW, 40, 'F')

      // Logo
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(255, 255, 255)
      doc.text('ANGEL', 20, 20)
      const angelW = doc.getTextWidth('ANGEL')
      doc.setTextColor(200, 240, 255)
      doc.text('AI', 20 + angelW, 20)

      // Subtitle
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(220, 200, 255)
      doc.text('Plan de Nutrición Personalizado', 20, 29)

      // Date (right-aligned)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.text(
        new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        pageW - 20, 29, { align: 'right' }
      )

      y = 50

      // ═══════════════════════════════════════════
      // PROFILE ROW
      // ═══════════════════════════════════════════
      const profileItems = [
        { label: 'Peso', value: `${checkInData.weight} kg` },
        { label: 'Body Score', value: `${score}` },
        { label: 'Rango', value: rank },
      ]
      profileItems.forEach((item, i) => {
        const x = 20 + i * 58
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(120, 120, 140)
        doc.text(item.label.toUpperCase(), x, y)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(30, 30, 30)
        doc.text(item.value, x, y + 8)
      })
      y += 18

      // Divider
      doc.setDrawColor(220, 220, 230)
      doc.setLineWidth(0.3)
      doc.line(20, y, pageW - 20, y)
      y += 8

      // ═══════════════════════════════════════════
      // ANALYSIS
      // ═══════════════════════════════════════════
      if (dietData.analysis) {
        sectionTitle('VALORACIÓN PERSONALIZADA')
        bodyText(dietData.analysis)
        y += 4
      }

      // ═══════════════════════════════════════════
      // MACROS BOX (2-column grid)
      // ═══════════════════════════════════════════
      checkPage(40)
      sectionTitle('MACROS DIARIOS')
      const macroItems = [
        { label: 'Calorías', value: `${dietData.calories} kcal` },
        { label: 'Proteína', value: `${dietData.protein} g` },
        { label: 'Carbohidratos', value: `${dietData.carbs} g` },
        { label: 'Grasas', value: `${dietData.fat} g` },
        { label: 'TDEE', value: dietData.tdee ? `${dietData.tdee} kcal` : '—' },
      ]
      const colW = (pageW - 40) / 2
      macroItems.forEach((m, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const mx = 20 + col * colW
        const my = y + row * 14
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(120, 120, 140)
        doc.text(m.label, mx, my)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(30, 30, 30)
        doc.text(m.value, mx, my + 7)
      })
      y += Math.ceil(macroItems.length / 2) * 14 + 6

      doc.setDrawColor(220, 220, 230)
      doc.setLineWidth(0.3)
      doc.line(20, y, pageW - 20, y)
      y += 8

      // ═══════════════════════════════════════════
      // MEAL PLAN
      // ═══════════════════════════════════════════
      if (dietData.diet) {
        checkPage(20)
        sectionTitle('PLAN DE NUTRICIÓN')

        const mealCalories: Record<string, number> = dietData.mealCalories || {}

        const meals: { key: string; title: string; simple?: boolean }[] = [
          { key: 'antesDesayuno', title: 'Antes del Desayuno', simple: true },
          { key: 'desayuno', title: 'Desayuno' },
          { key: 'mediaManana', title: 'Media Mañana' },
          { key: 'comida', title: 'Comida' },
          { key: 'merienda', title: 'Merienda' },
          { key: 'cena', title: 'Cena' },
          { key: 'antesDeCormir', title: 'Antes de Dormir', simple: true },
        ]

        meals.forEach(meal => {
          // For antesDesayuno: get from diet; for comida check both keys
          let data = meal.key === 'comida'
            ? (dietData.diet.comida || dietData.diet.almuerzo)
            : dietData.diet[meal.key]

          if (!data) return

          // Skip empty arrays (antesDesayuno / antesDeCormir)
          if (Array.isArray(data) && data.length === 0) return

          checkPage(20)

          // Meal heading
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(60, 60, 80)
          const kcalStr = mealCalories[meal.key] ? `  — ${mealCalories[meal.key]} kcal` : ''
          doc.text(`${meal.title}${kcalStr}`, 20, y)
          y += 6

          if (meal.simple) {
            // Simple array (antesDesayuno / antesDeCormir)
            const items: string[] = Array.isArray(data) ? data : []
            items.forEach(item => bulletItem(item))
          } else if (!Array.isArray(data)) {
            // opcionA (main)
            const opA: string[] = data.opcionA || []
            opA.forEach(item => bulletItem(item))

            // opcionB
            if (data.opcionB?.length) {
              subLabel('Alternativa B:')
              data.opcionB.forEach(item => bulletItem(item, 28))
            }

            // opcionC
            if (data.opcionC?.length) {
              subLabel('Alternativa C:')
              data.opcionC.forEach(item => bulletItem(item, 28))
            }
          }

          y += 4
        })
      }

      // ═══════════════════════════════════════════
      // TRAINING
      // ═══════════════════════════════════════════
      if (dietData.training) {
        checkPage(20)
        doc.setDrawColor(220, 220, 230)
        doc.setLineWidth(0.3)
        doc.line(20, y, pageW - 20, y)
        y += 8
        sectionTitle('PLAN DE ENTRENAMIENTO')

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 80)
        const trainingMeta = `${dietData.training.tipo || ''}${dietData.training.dias ? ` · ${dietData.training.dias} días/semana` : ''}`
        if (trainingMeta.trim()) {
          bodyText(trainingMeta)
          y += 2
        }

        const rutina: { dia: string; nombre?: string; ejercicios?: { nombre: string; series: number; reps: string; descanso: string }[] }[] = dietData.training.rutina || []
        rutina.forEach(day => {
          checkPage(20)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.setTextColor(123, 63, 228)
          doc.text(`${day.dia}${day.nombre ? ` — ${day.nombre}` : ''}`, 20, y)
          y += 5
          const ejercicios = day.ejercicios || []
          ejercicios.forEach(ex => {
            checkPage()
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8.5)
            doc.setTextColor(40, 40, 40)
            const exLine = `• ${ex.nombre}  ${ex.series}×${ex.reps}  (descanso ${ex.descanso})`
            const lines = doc.splitTextToSize(exLine, pageW - 44)
            doc.text(lines, 24, y)
            y += (lines as string[]).length * 4.5 + 1
          })
          y += 3
        })
      }

      // ═══════════════════════════════════════════
      // SUPPLEMENTS
      // ═══════════════════════════════════════════
      if (dietData.supplements?.length > 0) {
        checkPage(20)
        doc.setDrawColor(220, 220, 230)
        doc.setLineWidth(0.3)
        doc.line(20, y, pageW - 20, y)
        y += 8
        sectionTitle('SUPLEMENTACIÓN')
        dietData.supplements.forEach((s: string) => bulletItem(s))
        y += 4
      }

      // ═══════════════════════════════════════════
      // WEEKLY VARIETY NOTES
      // ═══════════════════════════════════════════
      if (dietData.dietVarietyNotes) {
        checkPage(20)
        sectionTitle('ROTACIÓN DE PROTEÍNAS')
        bodyText(dietData.dietVarietyNotes)
        y += 4
      }

      // ═══════════════════════════════════════════
      // CHEAT DAY
      // ═══════════════════════════════════════════
      if (dietData.cheatDay) {
        checkPage(16)
        sectionTitle('COMIDA LIBRE')
        bodyText(dietData.cheatDay)
        y += 4
      }

      // ═══════════════════════════════════════════
      // TIPS
      // ═══════════════════════════════════════════
      if (dietData.tips?.length > 0) {
        checkPage(20)
        doc.setDrawColor(220, 220, 230)
        doc.setLineWidth(0.3)
        doc.line(20, y, pageW - 20, y)
        y += 8
        sectionTitle('RECOMENDACIONES')
        dietData.tips.forEach((t: string) => {
          checkPage()
          const lines = doc.splitTextToSize(`→ ${t}`, pageW - 40)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(40, 40, 40)
          doc.text(lines, 20, y)
          y += (lines as string[]).length * 4.5 + 3
        })
      }

      // ═══════════════════════════════════════════
      // SHOPPING LIST
      // ═══════════════════════════════════════════
      if (dietData.shoppingList?.length > 0) {
        checkPage(20)
        doc.setDrawColor(220, 220, 230)
        doc.setLineWidth(0.3)
        doc.line(20, y, pageW - 20, y)
        y += 8
        sectionTitle('LISTA DE LA COMPRA (SEMANAL)')

        // Group by category
        const grouped: Record<string, { item: string; weeklyGrams: number }[]> = {}
        dietData.shoppingList.forEach((si: ShoppingItem) => {
          if (!grouped[si.category]) grouped[si.category] = []
          grouped[si.category].push({ item: si.item, weeklyGrams: si.weeklyGrams })
        })

        Object.entries(grouped).forEach(([cat, items]) => {
          checkPage(14)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8.5)
          doc.setTextColor(123, 63, 228)
          doc.text(cat, 20, y)
          y += 5
          items.forEach(si => {
            const gramsStr = si.weeklyGrams ? ` (${si.weeklyGrams}g/semana)` : ''
            bulletItem(`${si.item}${gramsStr}`)
          })
          y += 2
        })
      }

      // ═══════════════════════════════════════════
      // FOOTER on every page
      // ═══════════════════════════════════════════
      const total = doc.getNumberOfPages()
      for (let p = 1; p <= total; p++) {
        doc.setPage(p)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(150, 150, 170)
        doc.text('angelai.app · Plan IA personalizado', pageW / 2, 291, { align: 'center' })
        doc.text(`${p} / ${total}`, pageW - 20, 291, { align: 'right' })
      }

      doc.save(`angelai-plan-${new Date().toISOString().split('T')[0]}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="dashboard-root" style={{ minHeight: '100vh', background: lightMode ? '#F5F5F7' : '#07080F', paddingBottom: '80px', color: lightMode ? '#1a1a2e' : 'white' }}>

      {/* Sticky header wrapper: nav + optional banner */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>

      {/* Top nav */}
      <nav style={{
        background: lightMode ? 'rgba(245,245,247,0.94)' : 'rgba(7,8,15,0.94)', backdropFilter: 'blur(20px)',
        borderBottom: showDailyReminder ? 'none' : `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}`,
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        <div style={{
          maxWidth: '480px', margin: '0 auto', padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Toggle light/dark mode */}
            <button
              onClick={() => setLightMode(!lightMode)}
              title={lightMode ? 'Modo oscuro' : 'Modo claro'}
              style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: lightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: lightMode ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.35)',
              }}
            >
              {lightMode ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1C3.7 1 1 3.7 1 7s2.7 6 6 6c2.5 0 4.6-1.5 5.5-3.7-.5.1-1 .2-1.5.2C7.8 9.5 5.5 7.2 5.5 4.5c0-.5.1-1 .2-1.5C4 3.7 3 5.2 3 7c0 2.2 1.8 4 4 4s4-1.8 4-4a4 4 0 0 0-.3-1.5A6 6 0 0 1 7 1z" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.6 2.6l.7.7M10.7 10.7l.7.7M10.7 3.3l-.7.7M3.3 10.7l-.7.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            {/* Avatar → perfil */}
            <button
              onClick={() => router.push('/settings')}
              title="Mi perfil"
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                border: `2px solid ${lightMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', padding: 0, flexShrink: 0,
              }}
            >
              {profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profilePhoto} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 700, color: lightMode ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)', letterSpacing: '-0.5px' }}>
                  {(user.name || user.email).slice(0, 2).toUpperCase()}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              style={{
                fontSize: '12px', color: lightMode ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.25)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', padding: '4px 0', letterSpacing: '0.2px',
              }}
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Daily reminder banner — inside sticky wrapper, right below nav */}
      {showDailyReminder && (
        <div style={{
          background: daysSince >= 2 ? 'rgba(255,107,107,0.12)' : 'rgba(180,79,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${daysSince >= 2 ? 'rgba(255,107,107,0.25)' : 'rgba(180,79,255,0.25)'}`,
          padding: '8px 20px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '15px', flexShrink: 0 }}>{daysSince >= 2 ? '🚨' : '🌙'}</span>
          <p style={{ fontSize: '12px', fontWeight: 600, color: daysSince >= 2 ? '#FF6B6B' : '#B44FFF', flex: 1, lineHeight: 1.4 }}>
            {daysSince >= 2
              ? `${daysSince} días sin registrar. ¿Qué está pasando?`
              : daysSince === 1 ? 'Ayer no registraste. Hoy sin excusas.'
              : '¿Cómo ha ido el día?'}
          </p>
          <button
            onClick={() => router.push('/daily')}
            style={{ background: daysSince >= 2 ? '#FF6B6B' : '#B44FFF', border: 'none', borderRadius: '6px', color: 'white', fontSize: '11px', fontWeight: 700, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
          >
            Registrar
          </button>
          <button
            onClick={() => {
              const key = `reminder_dismissed_${new Date().toDateString()}`
              localStorage.setItem(key, '1')
              setShowDailyReminder(false)
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: daysSince >= 2 ? 'rgba(255,107,107,0.5)' : 'rgba(180,79,255,0.5)', fontSize: '18px', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}

      </div>{/* end sticky header wrapper */}

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px' }}>

        {activeTab === 'overview' && (<>

        {/* User greeting */}
        <div style={{ padding: '28px 0 24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.8px', color: lightMode ? '#1a1a2e' : 'white' }}>
            Tu progreso
          </h1>
        </div>

        {/* Check-in bloqueado */}
        {blockedDays && blockedDays > 0 && (
          <div style={{
            background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)',
            borderRadius: '14px', padding: '16px 20px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="6.5" stroke="#FF6B6B" strokeWidth="1.3"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="#FF6B6B" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: '13px', color: 'rgba(255,107,107,0.8)', lineHeight: 1.5 }}>
              Próximo check-in disponible en <strong>{blockedDays} día{blockedDays !== 1 ? 's' : ''}</strong>. El cuerpo necesita tiempo para adaptarse.
            </p>
          </div>
        )}

        {/* Check-in CTA */}
        {daysLeft === 0 && (
          <div style={{
            background: 'rgba(180,79,255,0.08)', border: '1px solid rgba(180,79,255,0.25)',
            borderRadius: '14px', padding: '20px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '3px' }}>Revisión disponible</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Tu plan está listo para actualizarse</div>
            </div>
            <button
              className="btn-primary"
              style={{ whiteSpace: 'nowrap', padding: '10px 18px', fontSize: '13px', flexShrink: 0 }}
              onClick={() => router.push('/checkin')}
            >
              Revisar
            </button>
          </div>
        )}

        {/* Body Score Orb */}
        <div style={{
          background: lightMode ? 'white' : '#0C0D16',
          border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: '20px', padding: '8px', marginBottom: '10px', overflow: 'hidden',
        }}>
          <BodyScoreOrb score={score ?? 0} rank={rank ?? 'BRONCE'} />
        </div>

        {/* Stats row — Peso + Revisión */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>

          {/* Peso */}
          <div style={{
            background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '16px', padding: '20px',
          }}>
            <p style={{
              fontSize: '10px', letterSpacing: '1.5px', color: lightMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.28)',
              textTransform: 'uppercase', fontWeight: 600, marginBottom: '10px',
            }}>Peso</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
                {latest.weight}
              </span>
              <span style={{ fontSize: '13px', color: lightMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)', fontWeight: 500 }}>kg</span>
            </div>
            {weightDiff && (
              <p style={{ fontSize: '12px', fontWeight: 600, color: parseFloat(weightDiff) < 0 ? '#00D9F5' : '#FF6B6B' }}>
                {parseFloat(weightDiff) < 0 ? '' : '+'}{weightDiff} kg
              </p>
            )}
          </div>

          {/* Revisión */}
          <div style={{
            background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '16px', padding: '20px',
          }}>
            <p style={{
              fontSize: '10px', letterSpacing: '1.5px', color: lightMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.28)',
              textTransform: 'uppercase', fontWeight: 600, marginBottom: '10px',
            }}>Revisión</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
                {daysLeft === 0 ? '¡Ya!' : daysLeft}
              </span>
              {daysLeft > 0 && (
                <span style={{ fontSize: '13px', color: lightMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)', fontWeight: 500 }}>días</span>
              )}
            </div>
            {daysLeft > 0 && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${((15 - daysLeft) / 15) * 100}%` }} />
              </div>
            )}
          </div>

        </div>

        {/* Streak + motivational */}
        <div style={{ display: 'grid', gridTemplateColumns: streak > 0 ? '1fr 2fr' : '1fr', gap: '10px', marginBottom: '10px' }}>
          {streak > 0 && (
            <div style={{
              background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${streak >= 7 ? 'rgba(255,184,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '16px', padding: '16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', color: streak >= 7 ? '#FFB800' : streak >= 3 ? '#B44FFF' : 'white', lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', fontWeight: 600 }}>días de racha</div>
              <div style={{ fontSize: '18px', marginTop: '6px' }}>{streak >= 14 ? '🔥🔥' : streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '✨'}</div>
            </div>
          )}
          {motivMsg.text && streak >= 7 && (
            <div style={{
              background: motivMsg.bg,
              border: `1px solid ${motivMsg.color}25`,
              borderRadius: '16px', padding: '16px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '24px', flexShrink: 0 }}>{motivMsg.emoji}</span>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, fontWeight: 500 }}>{motivMsg.text}</p>
            </div>
          )}
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div style={{
            background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '16px', padding: '20px', marginBottom: '10px',
          }}>
            <p style={{
              fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)',
              textTransform: 'uppercase', fontWeight: 600, marginBottom: '14px',
            }}>Logros</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {badges.map(b => {
                const info = BADGE_INFO[b.badge] || { label: b.badge }
                return (
                  <div key={b.badge} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
                    color: 'rgba(255,255,255,0.55)', fontWeight: 500,
                  }}>
                    {info.label}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {latest.analysis && (
          <div style={{
            background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '16px', padding: '20px', marginBottom: '24px',
          }}>
            <p style={{
              fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)',
              textTransform: 'uppercase', fontWeight: 600, marginBottom: '14px',
            }}>Análisis IA</p>
            <p style={{ fontSize: '14px', lineHeight: 1.75, color: 'rgba(255,255,255,0.65)' }}>
              {latest.analysis}
            </p>
          </div>
        )}

        {/* Leaderboard + Share row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          {/* Leaderboard link */}
          <div
            onClick={() => router.push('/leaderboard')}
            style={{ background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '16px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '80px' }}
          >
            <span style={{ fontSize: '22px' }}>🏆</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: lightMode ? '#1a1a2e' : 'white' }}>Ranking</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>Ver top semanal</div>
            </div>
          </div>

          {/* Share progress card */}
          <div
            onClick={() => {
              const streak = calcStreak(initialDailyLogs)
              const text = `🏋️ Mi progreso en AngelAI:\n\n📊 Body Score: ${latest.bodyScore || '—'} (${latest.rank || '—'})\n⚖️ Peso: ${latest.weight}kg\n🔥 Racha: ${streak} días\n\nConsigue tu plan personalizado en angelai.app`
              if (navigator.share) navigator.share({ text }).catch(() => {})
              else navigator.clipboard.writeText(text).then(() => alert('¡Copiado!'))
            }}
            style={{ background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '16px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '80px' }}
          >
            <span style={{ fontSize: '22px' }}>📤</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: lightMode ? '#1a1a2e' : 'white' }}>Compartir</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>Mi progreso</div>
            </div>
          </div>
        </div>

        <div className="separator" style={{ marginBottom: '24px' }} />

        </>)}

        {/* ── TAB: OVERVIEW ── */}
        {activeTab === 'overview' && dietData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '16px', padding: '20px',
            }}>
              <p style={{
                fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)',
                textTransform: 'uppercase', fontWeight: 600, marginBottom: '16px',
              }}>Macros diarios</p>
              {[
                { label: 'Calorías', value: `${dietData.calories} kcal` },
                { label: 'Proteína', value: `${dietData.protein}g` },
                { label: 'Carbohidratos', value: `${dietData.carbs}g` },
                { label: 'Grasas', value: `${dietData.fat}g` },
              ].map((m, i, arr) => (
                <div key={m.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingBottom: i < arr.length - 1 ? '13px' : '0',
                  marginBottom: i < arr.length - 1 ? '13px' : '0',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>{m.label}</span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{m.value}</span>
                </div>
              ))}
            </div>

            {dietData.supplements?.length > 0 && (
              <div style={{
                background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '16px', padding: '20px',
              }}>
                <p style={{
                  fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)',
                  textTransform: 'uppercase', fontWeight: 600, marginBottom: '16px',
                }}>Suplementación</p>
                {dietData.supplements.map((s: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: i < dietData.supplements.length - 1 ? '10px' : '0' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#B44FFF', marginTop: '7px', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {/* TDEE info */}
            {dietData.tdee && (
              <div style={{
                background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '16px', padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                    Gasto calórico total
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    Tu TDEE real (Mifflin-St Jeor)
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-1px' }}>{dietData.tdee}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginLeft: '3px' }}>kcal</span>
                  {dietData.calories < dietData.tdee && (
                    <p style={{ fontSize: '11px', color: '#00D9F5', fontWeight: 600, marginTop: '2px' }}>
                      déficit {dietData.tdee - dietData.calories} kcal
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Plan semanal */}
            {dietData.weeklyPlan && (
              <div style={{
                background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '16px', padding: '20px',
              }}>
                <p style={{
                  fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)',
                  textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px',
                }}>Plan semanal</p>
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
                  {dietData.weeklyPlan}
                </p>
              </div>
            )}

            {dietData.tips?.length > 0 && (
              <div style={{
                background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '16px', padding: '20px',
              }}>
                <p style={{
                  fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)',
                  textTransform: 'uppercase', fontWeight: 600, marginBottom: '16px',
                }}>Recomendaciones</p>
                {dietData.tips.map((t: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: i < dietData.tips.length - 1 ? '12px' : '0' }}>
                    <span style={{ fontSize: '12px', color: '#00D9F5', flexShrink: 0, marginTop: '1px', fontWeight: 600 }}>→</span>
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: DIET ── */}
        {activeTab === 'diet' && dietData?.diet && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '16px', overflow: 'hidden',
            }}>
              <div style={{ padding: '20px 20px 0' }}>
                <p style={{
                  fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)',
                  textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px',
                }}>Plan de nutrición</p>
              </div>
              <div style={{ padding: '0 20px 20px' }}>
                {dietData.diet.antesDesayuno && <MealSection title="Antes del desayuno" items={dietData.diet.antesDesayuno} isSimple kcal={dietData.mealCalories?.antesDesayuno} />}
                {dietData.diet.desayuno && <MealSection title="Desayuno" options={dietData.diet.desayuno} kcal={dietData.mealCalories?.desayuno} />}
                {dietData.diet.mediaManana && <MealSection title="Media mañana" options={dietData.diet.mediaManana} kcal={dietData.mealCalories?.mediaManana} />}
                {dietData.diet.almuerzo && <MealSection title="Almuerzo" options={dietData.diet.almuerzo} kcal={dietData.mealCalories?.almuerzo} />}
                {dietData.diet.comida && <MealSection title="Comida" options={dietData.diet.comida} kcal={dietData.mealCalories?.comida} />}
                {dietData.diet.merienda && <MealSection title="Merienda" options={dietData.diet.merienda} kcal={dietData.mealCalories?.merienda} />}
                {dietData.diet.cena && <MealSection title="Cena" options={dietData.diet.cena} kcal={dietData.mealCalories?.cena} />}
                {dietData.diet.antesDeCormir && <MealSection title="Antes de dormir" items={dietData.diet.antesDeCormir} isSimple />}
              </div>
            </div>

            {/* PDF Download */}
            <button
              onClick={downloadDietPDF}
              disabled={pdfLoading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                width: '100%', padding: '15px',
                background: pdfLoading ? 'rgba(255,255,255,0.04)' : 'rgba(0,217,245,0.08)',
                border: `1px solid ${pdfLoading ? 'rgba(255,255,255,0.08)' : 'rgba(0,217,245,0.25)'}`,
                borderRadius: '14px', cursor: pdfLoading ? 'not-allowed' : 'pointer',
                color: pdfLoading ? 'rgba(255,255,255,0.3)' : '#00D9F5',
                fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
            >
              {pdfLoading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
                  </svg>
                  Generando PDF...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Descargar plan en PDF
                </>
              )}
            </button>

            {/* Chat nutricionista */}
            {!checkIns[0]?.customizationUsed && !adjustDone && (
              <div style={{
                background: 'rgba(180,79,255,0.04)',
                border: '1px solid rgba(180,79,255,0.12)',
                borderRadius: '16px',
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div
                  onClick={() => setShowAdjust(!showAdjust)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'rgba(180,79,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="5" r="3" stroke="#B44FFF" strokeWidth="1.3"/>
                        <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#B44FFF" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                        Habla con tu nutricionista
                      </p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                        1 ajuste disponible este ciclo
                      </p>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                    style={{ transform: showAdjust ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <path d="M4 6l4 4 4-4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {showAdjust && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0 16px 16px' }}>

                    {/* Chat history */}
                    {adjustMessages.length > 0 && (
                      <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                        {adjustMessages.map((msg, i) => (
                          <div key={i} style={{
                            display: 'flex',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          }}>
                            <div style={{
                              maxWidth: '85%',
                              padding: '10px 14px',
                              borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                              background: msg.role === 'user' ? 'rgba(180,79,255,0.18)' : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${msg.role === 'user' ? 'rgba(180,79,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                              fontSize: '13px',
                              color: msg.role === 'user' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.65)',
                              lineHeight: 1.55,
                            }}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pending save banner */}
                    {pendingDietPlan && (
                      <div style={{
                        background: 'rgba(0,217,245,0.06)', border: '1px solid rgba(0,217,245,0.2)',
                        borderRadius: '10px', padding: '12px 14px', marginBottom: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                      }}>
                        <p style={{ fontSize: '12px', color: 'rgba(0,217,245,0.8)', margin: 0 }}>
                          Plan modificado listo para guardar
                        </p>
                        <button
                          onClick={async () => {
                            setAdjustLoading(true)
                            try {
                              const res = await fetch('/api/diet-customize', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  customRequest: adjustMessages.filter(m => m.role === 'user').map(m => m.content).join(' | '),
                                  checkInId: checkIns[0]?.id,
                                }),
                              })
                              if (res.ok) { setAdjustDone(true); window.location.reload() }
                            } finally { setAdjustLoading(false) }
                          }}
                          disabled={adjustLoading}
                          style={{
                            padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                            background: 'rgba(0,217,245,0.15)', border: '1px solid rgba(0,217,245,0.35)',
                            color: '#00D9F5', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
                            whiteSpace: 'nowrap', flexShrink: 0,
                          }}
                        >{adjustLoading ? 'Guardando...' : 'Guardar plan'}</button>
                      </div>
                    )}

                    {/* Input area */}
                    <div style={{ paddingTop: adjustMessages.length === 0 ? '12px' : '0', display: 'flex', gap: '8px' }}>
                      <textarea
                        value={adjustText}
                        onChange={e => setAdjustText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey && adjustText.trim()) {
                            e.preventDefault()
                            sendAdjustMessage()
                          }
                        }}
                        placeholder={adjustMessages.length === 0
                          ? 'Ej: No puedo merendar, redistribuye esas calorias. Pon pasta en alguna opcion...'
                          : 'Escribe otro cambio o pide algo diferente...'}
                        rows={2}
                        maxLength={1000}
                        style={{
                          flex: 1, background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                          color: 'white', padding: '10px 12px', fontSize: '13px',
                          fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5,
                        }}
                      />
                      <button
                        onClick={sendAdjustMessage}
                        disabled={adjustLoading || !adjustText.trim()}
                        style={{
                          width: '40px', height: '40px', flexShrink: 0, alignSelf: 'flex-end',
                          borderRadius: '10px', cursor: adjustLoading || !adjustText.trim() ? 'not-allowed' : 'pointer',
                          background: adjustLoading || !adjustText.trim() ? 'rgba(180,79,255,0.08)' : 'rgba(180,79,255,0.25)',
                          border: '1px solid rgba(180,79,255,0.3)', color: '#B44FFF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {adjustLoading ? (
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

                    {adjustError && (
                      <p style={{ fontSize: '12px', color: '#FF6B6B', marginTop: '8px' }}>{adjustError}</p>
                    )}

                    {adjustMessages.length > 0 && !pendingDietPlan && (
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '8px', textAlign: 'center' }}>
                        Puedes seguir refinando el plan o cerrar sin guardar
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: SHOPPING ── */}
        {activeTab === 'shopping' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!dietData?.shoppingList?.length ? (
              <div style={{
                background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '16px', padding: '40px 20px', textAlign: 'center',
              }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ margin: '0 auto 16px', display: 'block' }}>
                  <rect x="6" y="10" width="24" height="20" rx="3" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                  <path d="M13 10V8a5 5 0 0 1 10 0v2" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M13 18h10M13 23h6" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Lista no disponible</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                  Haz un nuevo check-in para generar tu lista de la compra semanal.
                </p>
              </div>
            ) : (() => {
              const categories: Record<string, ShoppingItem[]> = {}
              ;dietData.shoppingList.forEach(item => {
                const cat = item.category || 'Otro'
                if (!categories[cat]) categories[cat] = []
                categories[cat].push(item)
              })
              const totalItems = dietData.shoppingList.length
              const checkedCount = dietData.shoppingList.filter(i => checkedItems[i.item]).length

              return (
                <>
                  {/* Header row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '4px 2px',
                  }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                      {checkedCount} de {totalItems} productos
                    </span>
                    <button
                      onClick={clearShoppingList}
                      style={{
                        fontSize: '12px', color: 'rgba(255,255,255,0.3)', background: 'none',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                        padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Limpiar
                    </button>
                  </div>

                  {/* Categories with checkboxes */}
                  {Object.entries(categories).map(([cat, items]) => (
                    <div key={cat} style={{
                      background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '16px', overflow: 'hidden',
                    }}>
                      <p style={{
                        fontSize: '10px', letterSpacing: '1.5px', fontWeight: 700,
                        textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
                        padding: '14px 18px 0', marginBottom: '8px',
                      }}>{cat}</p>
                      {items.map((item, i) => {
                        const checked = !!checkedItems[item.item]
                        return (
                          <div
                            key={item.item}
                            onClick={() => toggleShoppingItem(item.item)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '14px',
                              padding: '13px 18px',
                              borderTop: '1px solid rgba(255,255,255,0.04)',
                              cursor: 'pointer',
                              transition: 'background 0.1s ease',
                            }}
                          >
                            <div style={{
                              width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                              border: checked ? 'none' : '1.5px solid rgba(255,255,255,0.18)',
                              background: checked ? '#B44FFF' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}>
                              {checked && (
                                <svg width="11" height="9" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <span style={{
                              flex: 1, fontSize: '14px', lineHeight: 1.4,
                              color: checked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.82)',
                              textDecoration: checked ? 'line-through' : 'none',
                              transition: 'all 0.15s ease',
                            }}>
                              {item.item}
                            </span>
                            <span style={{
                              fontSize: '12px', fontWeight: 600,
                              color: checked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.35)',
                              background: 'rgba(255,255,255,0.05)',
                              padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' as const,
                            }}>
                              {item.weeklyGrams >= 1000
                                ? `${(item.weeklyGrams / 1000).toFixed(1)} kg`
                                : `${item.weeklyGrams} g`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </>
              )
            })()}
          </div>
        )}

        {/* ── TAB: PROGRESS ── */}
        {activeTab === 'progress' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* 3D Progress Chart — always visible from day 1 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <p style={{ fontSize: '10px', letterSpacing: '1.5px', color: lightMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.28)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Evolución · Body Score
                </p>
                <div style={{ fontSize: '11px', color: lightMode ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)', background: lightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '3px 10px' }}>
                  {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}
                </div>
              </div>
              <ProgressChart3D points={progress3DData} />
            </div>

            {/* Stats summary */}
            {checkIns.length >= 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '16px', padding: '16px' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '1px', color: lightMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.28)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Peso</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 800 }}>{latest.weight}</span>
                    <span style={{ fontSize: '12px', color: lightMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }}>kg</span>
                  </div>
                  {weightDiff && (
                    <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color: parseFloat(weightDiff) < 0 ? '#00D9F5' : '#FF6B6B' }}>
                      {parseFloat(weightDiff) < 0 ? '' : '+'}{weightDiff} kg
                    </p>
                  )}
                </div>
                <div style={{ background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '16px', padding: '16px' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '1px', color: lightMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.28)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Score</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 800 }}>{score}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: rankColor, background: `${rankColor}18`, padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>{rank}</span>
                  </div>
                  {checkIns.length >= 2 && (() => {
                    const diff = (checkIns[0].bodyScore || 0) - (checkIns[1].bodyScore || 0)
                    return <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color: diff >= 0 ? '#B44FFF' : '#FF6B6B' }}>{diff >= 0 ? '+' : ''}{diff} pts</p>
                  })()}
                </div>
              </div>
            )}

                {/* Measurements mini chart if data exists */}
                {checkIns.some(c => c.waist) && (
                  <div style={{
                    background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '16px', padding: '20px',
                  }}>
                    <p style={{
                      fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)',
                      textTransform: 'uppercase', fontWeight: 600, marginBottom: '20px',
                    }}>Medidas corporales</p>

                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart
                        data={[...checkIns].reverse().map(c => ({
                          date: new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                          Cintura: c.waist || null,
                          Caderas: c.hips || null,
                        }))}
                        margin={{ top: 5, right: 4, bottom: 0, left: -24 }}
                      >
                        <defs>
                          <linearGradient id="waistGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7B6FFF" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#7B6FFF" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} domain={['dataMin - 3', 'dataMax + 3']} />
                        <Tooltip content={<CustomTooltip unit="cm" />} />
                        <Area type="monotone" dataKey="Cintura" stroke="#7B6FFF" strokeWidth={2} fill="url(#waistGrad)" dot={{ fill: '#7B6FFF', r: 3, strokeWidth: 0 }} connectNulls />
                        <Area type="monotone" dataKey="Caderas" stroke="rgba(0,217,245,0.6)" strokeWidth={2} fill="none" dot={{ fill: '#00D9F5', r: 3, strokeWidth: 0 }} connectNulls />
                      </AreaChart>
                    </ResponsiveContainer>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                      {[{ color: '#7B6FFF', label: 'Cintura' }, { color: '#00D9F5', label: 'Caderas' }].map(l => (
                        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '20px', height: '2px', background: l.color, borderRadius: '1px' }} />
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

          </div>
        )}

        {/* ── TAB: TRAINING ── */}
        {activeTab === 'training' && (() => {
          const training = dietData?.training
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Preferencias panel */}
              <div style={{
                background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '16px',
              }}>
                <div
                  onClick={() => { setPrefsOpen(!prefsOpen); setEditPrefs(prefs) }}
                  style={{
                    padding: '18px 20px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'rgba(123,111,255,0.12)', border: '1px solid rgba(123,111,255,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="2.5" stroke="#7B6FFF" strokeWidth="1.3"/>
                        <path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M11.8 4.2l-.7.7M4.2 11.8l-.7.7" stroke="#7B6FFF" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>
                        Mis preferencias
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>
                        {prefs.equipment || 'Gym'} · Cardio {prefs.cardioTime || 'sin definir'} · {prefs.trainingDays || '?'} días/sem
                      </div>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                    style={{ transform: prefsOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease', flexShrink: 0 }}>
                    <path d="M4 6l4 4 4-4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {prefsOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px' }}>

                    {/* Días por semana */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                        Días de entreno / semana
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[2, 3, 4, 5, 6].map(d => (
                          <button key={d} type="button" onClick={() => setEditPrefs(p => ({ ...p, trainingDays: d }))}
                            style={{
                              width: '40px', height: '40px', borderRadius: '10px', border: 'none',
                              background: editPrefs.trainingDays === d ? '#B44FFF' : 'rgba(255,255,255,0.06)',
                              color: editPrefs.trainingDays === d ? 'white' : 'rgba(255,255,255,0.4)',
                              fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                              transition: 'all 0.15s ease',
                            }}>{d}</button>
                        ))}
                      </div>
                    </div>

                    {/* Cardio */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                        ¿Cuándo prefieres el cardio?
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {[
                          { v: 'mañana', l: 'Mañana' },
                          { v: 'tarde', l: 'Tarde' },
                          { v: 'noche', l: 'Noche' },
                          { v: 'separado', l: 'Día separado' },
                          { v: 'ninguno', l: 'Sin cardio' },
                        ].map(opt => (
                          <button key={opt.v} type="button"
                            onClick={() => setEditPrefs(p => ({ ...p, cardioTime: opt.v }))}
                            style={{
                              padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                              fontSize: '13px', fontWeight: 500, fontFamily: 'inherit',
                              background: editPrefs.cardioTime === opt.v ? 'rgba(0,217,245,0.15)' : 'rgba(255,255,255,0.05)',
                              color: editPrefs.cardioTime === opt.v ? '#00D9F5' : 'rgba(255,255,255,0.4)',
                              border: `1px solid ${editPrefs.cardioTime === opt.v ? 'rgba(0,217,245,0.35)' : 'transparent'}`,
                              transition: 'all 0.15s ease',
                            }}>{opt.l}</button>
                        ))}
                      </div>
                    </div>

                    {/* Equipamiento */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                        Equipamiento disponible
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                          { v: 'gym', l: 'Gym completo' },
                          { v: 'casa', l: 'En casa' },
                          { v: 'mixto', l: 'Mixto' },
                        ].map(opt => (
                          <button key={opt.v} type="button"
                            onClick={() => setEditPrefs(p => ({ ...p, equipment: opt.v }))}
                            style={{
                              flex: 1, padding: '10px 8px', borderRadius: '10px', cursor: 'pointer',
                              fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', textAlign: 'center' as const,
                              background: editPrefs.equipment === opt.v ? 'rgba(180,79,255,0.15)' : 'rgba(255,255,255,0.05)',
                              color: editPrefs.equipment === opt.v ? '#B44FFF' : 'rgba(255,255,255,0.4)',
                              border: `1px solid ${editPrefs.equipment === opt.v ? 'rgba(180,79,255,0.4)' : 'transparent'}`,
                              transition: 'all 0.15s ease',
                            }}>{opt.l}</button>
                        ))}
                      </div>
                    </div>

                    {/* Notas libres */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                        Ejercicios favoritos / lesiones / notas
                      </label>
                      <textarea
                        value={editPrefs.trainingNotes || ''}
                        onChange={e => setEditPrefs(p => ({ ...p, trainingNotes: e.target.value }))}
                        placeholder="Ej: me encanta el press de banca, tengo molestias en la rodilla derecha, odio el burpee..."
                        rows={3}
                        style={{
                          width: '100%', background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                          color: 'white', padding: '12px 14px', fontSize: '14px',
                          fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                          lineHeight: 1.5,
                        }}
                      />
                    </div>

                    {/* Ejercicios excluidos */}
                    {prefs.dislikedExercises?.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                          Ejercicios que no quieres
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {prefs.dislikedExercises.map((ex, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)',
                              borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: '#FF6B6B',
                            }}>
                              {ex}
                              <button onClick={() => {
                                const updated = { ...prefs, dislikedExercises: prefs.dislikedExercises.filter(e => e !== ex) }
                                savePreferences(updated)
                              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6B6B', padding: 0, fontSize: '14px', lineHeight: 1 }}>×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={async () => {
                        await savePreferences(editPrefs)
                        setPrefsOpen(false)
                      }}
                      disabled={prefsSaving}
                      className="btn-primary"
                      style={{ width: '100%', padding: '13px', fontSize: '14px' }}
                    >
                      {prefsSaving ? 'Guardando...' : 'Guardar preferencias'}
                    </button>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '10px' }}>
                      Se aplicarán en tu próximo check-in
                    </p>
                  </div>
                )}
              </div>

              {!training ? (
                <div style={{
                  background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '16px', padding: '32px 20px', textAlign: 'center',
                }}>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
                    Haz un check-in para generar tu rutina personalizada.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header rutina */}
                  <div style={{
                    background: lightMode ? 'white' : '#0C0D16', border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '16px', padding: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <p style={{
                        fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.28)',
                        textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px',
                      }}>Tu rutina</p>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                        {training.tipo}
                      </p>
                    </div>
                    <div style={{
                      background: 'rgba(180,79,255,0.1)', border: '1px solid rgba(180,79,255,0.2)',
                      borderRadius: '10px', padding: '10px 14px', textAlign: 'center', flexShrink: 0,
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-1px', color: '#B44FFF' }}>
                        {training.dias}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(180,79,255,0.6)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        días/sem
                      </div>
                    </div>
                  </div>

                  {/* Días */}
                  {training.rutina?.map((dia: { dia: string; nombre: string; ejercicios: { nombre: string; series: number; reps: string }[] }, i: number) => (
                    <TrainingDay
                      key={i} dia={dia} index={i}
                      disliked={prefs.dislikedExercises || []}
                      swappingExercise={swappingExercise}
                      swapInput={swapInput}
                      onSwapOpen={(name) => { setSwappingExercise(name); setSwapInput('') }}
                      onSwapClose={() => setSwappingExercise(null)}
                      onSwapInputChange={setSwapInput}
                      onDislike={addDislikedExercise}
                      onLike={addLikedExercise}
                      doneExercises={doneExercises}
                      onToggleDone={toggleExerciseDone}
                    />
                  ))}
                </>
              )}
            </div>
          )
        })()}

        {/* ── TAB: HISTORY ── */}
        {/* ── TAB: MACROS ── */}
        {activeTab === 'macros' && dietData && (
          <div style={{ paddingTop: '24px', paddingBottom: '100px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '16px', color: 'white' }}>Mis macros hoy</h2>
            <MacrosTracker targets={{ calories: dietData.calories, protein: dietData.protein, carbs: dietData.carbs, fat: dietData.fat }} />
          </div>
        )}
        {activeTab === 'macros' && !dietData && (
          <div style={{ paddingTop: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
            Necesitas tener un plan activo para usar el tracker de macros.
          </div>
        )}

        {/* ── TAB: RECIPES ── */}
        {activeTab === 'recipes' && (
          <div style={{ paddingTop: '24px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', color: 'white' }}>Recetas & Análisis</h2>
            <FoodAnalyzer />
            <RecipesPanel />
          </div>
        )}

        {/* ── TAB: HISTORY ── */}
        {activeTab === 'history' && (
          <div style={{ paddingTop: '24px', paddingBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '16px', color: lightMode ? '#1a1a2e' : 'white' }}>
              Historial de revisiones
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {checkIns.map((c, i) => {
                const plan: DietPlan | null = c.dietPlan ? (() => { try { return JSON.parse(c.dietPlan!) } catch { return null } })() : null
                return (
                  <HistoryCard
                    key={c.id}
                    checkIn={c}
                    plan={plan}
                    prev={checkIns[i + 1] ?? null}
                    isLatest={i === 0}
                    lightMode={lightMode}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* ── TAB: COACH ── */}
        {activeTab === 'coach' && (
          <div style={{ paddingTop: '24px', paddingBottom: '120px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #B44FFF, #7B6FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🤖</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Coach IA</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Pregunta lo que quieras sobre dieta y entreno</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              {coachMessages.length === 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px 14px 14px 4px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>
                    Soy tu coach personal. Pregúntame lo que necesites: si puedes comer pizza el sábado, cómo progresar en sentadilla, qué suplemento tomar... Sin filtros, te digo la verdad.
                  </p>
                </div>
              )}
              {coachMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '88%', padding: '11px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' ? 'rgba(180,79,255,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(180,79,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    fontSize: '14px', lineHeight: 1.6,
                    color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.75)',
                  }}>
                    {msg.role === 'assistant'
                      ? <span dangerouslySetInnerHTML={{ __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/_\((.*?)\)_/g, '<em>$1</em>')
                          .replace(/\n/g, '<br/>') }} />
                      : msg.content}
                  </div>
                  {msg.role === 'assistant' && (
                    <button onClick={() => shareJarvisMessage(msg.content)} style={{ marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 4px', fontFamily: 'inherit' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                      Compartir
                    </button>
                  )}
                </div>
              ))}
              {coachLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '14px 14px 14px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[0, 150, 300].map(d => (
                      <div key={d} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(180,79,255,0.6)', animation: `bounce 1.2s ${d}ms infinite` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            {coachMessages.length === 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {['¿Puedo comer carbos por la noche?', '¿Cómo subo la proteína?', 'Tengo agujetas, ¿entreno?'].map(prompt => (
                  <button key={prompt} onClick={() => { setCoachInput(prompt) }} style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(180,79,255,0.08)', border: '1px solid rgba(180,79,255,0.2)', borderRadius: '20px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <textarea
                value={coachInput}
                onChange={e => setCoachInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCoachMessage() } }}
                placeholder="Pregúntame algo..."
                rows={2}
                disabled={coachLoading}
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5 }}
              />
              <button
                onClick={sendCoachMessage}
                disabled={coachLoading || !coachInput.trim()}
                style={{ width: '44px', height: '44px', alignSelf: 'flex-end', flexShrink: 0, borderRadius: '12px', background: coachLoading || !coachInput.trim() ? 'rgba(180,79,255,0.08)' : '#B44FFF', border: 'none', color: 'white', cursor: coachLoading || !coachInput.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Tab Bar */}
      <div className="tab-bar">
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', padding: '0 2px' }}>
          {([
            { key: 'overview',  label: 'Resumen',  icon: OverviewIcon },
            { key: 'diet',      label: 'Dieta',    icon: DietIcon },
            { key: 'macros',    label: 'Macros',   icon: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
            { key: 'recipes',   label: 'Recetas',  icon: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 3v14M6 10h8M14 3v14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
            { key: 'shopping',  label: 'Compra',   icon: ShoppingIcon },
            { key: 'progress',  label: 'Progreso', icon: ChartIcon },
            { key: 'training',  label: 'Entreno',  icon: TrainingIcon },
            { key: 'history',   label: 'Historial', icon: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 6h12M4 10h8M4 14h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
          ] as { key: Tab; label: string; icon: () => React.JSX.Element }[]).map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer',
                  color: isActive ? '#B44FFF' : 'rgba(255,255,255,0.28)',
                  fontFamily: 'inherit', transition: 'color 0.15s ease',
                }}
              >
                <tab.icon />
                <span style={{ fontSize: '8px', fontWeight: isActive ? 600 : 400, letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Dr. Jarvis floating bubble ── */}

      {/* Greeting speech bubble */}
      {jarvisGreeting && !showJarvis && (
        <div className="jarvis-bubble" style={{
          position: 'fixed', bottom: '100px', right: '16px', zIndex: 300,
          maxWidth: '240px', animation: 'slideUpModal 0.3s ease',
        }}>
          <div style={{
            background: '#1a0a2e', border: '1px solid rgba(180,79,255,0.4)',
            borderRadius: '16px 16px 4px 16px', padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>🤖</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#B44FFF' }}>Dr. Jarvis</span>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: '12px' }}>
              Si necesitas cambiar algo de la dieta o tienes alguna duda con tu entreno, háblame 💪
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setJarvisGreeting(false); setShowJarvis(true) }}
                style={{ flex: 1, background: '#B44FFF', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 700, padding: '7px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Hablar
              </button>
              <button
                onClick={() => { localStorage.setItem('jarvis_no_molestar', '1'); setJarvisGreeting(false) }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', padding: '7px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                No molestar
              </button>
            </div>
          </div>
          {/* Arrow pointing to FAB */}
          <div style={{ position: 'absolute', bottom: '-6px', right: '18px', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(180,79,255,0.4)' }} />
        </div>
      )}

      {/* FAB button */}
      {!showJarvis && (
        <button
          className="jarvis-fab"
          onClick={() => { setJarvisGreeting(false); setShowJarvis(true) }}
          style={{
            position: 'fixed', bottom: '90px', right: '16px', zIndex: 300,
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #B44FFF, #7B2FBE)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(180,79,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
            animation: jarvisGreeting ? 'pulse 2s infinite' : 'none',
          }}
          aria-label="Dr. Jarvis"
        >
          🤖
        </button>
      )}

      {/* Chat overlay */}
      {showJarvis && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setShowJarvis(false) }}>
          <div style={{
            width: '100%', maxWidth: '480px', height: '80vh',
            background: '#0C0D16', borderRadius: '24px 24px 0 0',
            border: '1px solid rgba(180,79,255,0.2)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideUpModal 0.3s ease',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #B44FFF, #7B2FBE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Dr. Jarvis</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Tu asistente de dieta y entreno</div>
              </div>
              <button onClick={() => setShowJarvis(false)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {coachMessages.length === 0 && (
                <div style={{ background: 'rgba(180,79,255,0.06)', border: '1px solid rgba(180,79,255,0.15)', borderRadius: '14px 14px 14px 4px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                    Hola, soy el Dr. Jarvis. Pregúntame lo que necesites sobre tu dieta o entrenamiento. Sin filtros, te digo la verdad.
                  </p>
                </div>
              )}
              {coachMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '88%', padding: '11px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' ? 'rgba(180,79,255,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(180,79,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    fontSize: '14px', lineHeight: 1.6,
                    color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)',
                  }}>
                    {msg.role === 'assistant'
                      ? <span dangerouslySetInnerHTML={{ __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/_\((.*?)\)_/g, '<em>$1</em>')
                          .replace(/\n/g, '<br/>') }} />
                      : msg.content}
                  </div>
                  {msg.role === 'assistant' && (
                    <button onClick={() => shareJarvisMessage(msg.content)} style={{ marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 4px', fontFamily: 'inherit' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                      Compartir
                    </button>
                  )}
                </div>
              ))}
              {coachLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '14px 14px 14px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[0, 150, 300].map(d => (
                      <div key={d} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(180,79,255,0.6)', animation: `bounce 1.2s ${d}ms infinite` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            {coachMessages.length === 0 && (
              <div style={{ padding: '0 16px 10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['¿Puedo comer carbos por la noche?', '¿Cómo subo la proteína?', 'Tengo agujetas, ¿entreno?'].map(prompt => (
                  <button key={prompt} onClick={() => setCoachInput(prompt)} style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(180,79,255,0.08)', border: '1px solid rgba(180,79,255,0.2)', borderRadius: '20px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
              <textarea
                value={coachInput}
                onChange={e => setCoachInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCoachMessage() } }}
                placeholder="Pregunta al Dr. Jarvis..."
                rows={2}
                disabled={coachLoading}
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5 }}
              />
              <button
                onPointerDown={e => { e.preventDefault(); sendCoachMessage() }}
                disabled={coachLoading || !coachInput.trim()}
                style={{ width: '48px', height: '48px', alignSelf: 'flex-end', flexShrink: 0, borderRadius: '12px', background: coachLoading || !coachInput.trim() ? 'rgba(180,79,255,0.08)' : '#B44FFF', border: 'none', color: 'white', cursor: coachLoading || !coachInput.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function HistoryCard({ checkIn, plan, prev, isLatest, lightMode }: {
  checkIn: CheckIn
  plan: DietPlan | null
  prev: CheckIn | null
  isLatest: boolean
  lightMode: boolean
}) {
  const [open, setOpen] = useState(false)
  const weightDiff = prev ? (checkIn.weight - prev.weight) : null

  return (
    <div style={{
      background: lightMode ? '#fff' : '#0C0D16',
      border: `1px solid ${isLatest ? 'rgba(180,79,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '14px', overflow: 'hidden',
    }}>
      {/* Header row */}
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>
              {new Date(checkIn.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {isLatest && (
              <span style={{
                fontSize: '9px', letterSpacing: '1px', fontWeight: 700, color: '#B44FFF',
                textTransform: 'uppercase', background: 'rgba(180,79,255,0.1)',
                padding: '2px 7px', borderRadius: '3px',
              }}>Actual</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: lightMode ? '#1a1a2e' : 'white' }}>{checkIn.weight} kg</span>
            {weightDiff !== null && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: weightDiff < 0 ? '#00D9F5' : '#FF6B6B' }}>
                {weightDiff < 0 ? '' : '+'}{weightDiff.toFixed(1)} kg
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-1px', color: lightMode ? '#1a1a2e' : 'white' }}>
              {checkIn.bodyScore || '—'}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: RANK_COLORS[checkIn.rank || ''] || 'rgba(255,255,255,0.3)' }}>
              {checkIn.rank || '—'}
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.35 }}>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Expanded details */}
      {open && plan && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Photos comparison */}
          {(checkIn.frontPhotoUrl || checkIn.sidePhotoUrl) && (
            <div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '10px' }}>Fotos</p>
              <div style={{ display: 'grid', gridTemplateColumns: checkIn.frontPhotoUrl && checkIn.sidePhotoUrl ? '1fr 1fr' : '1fr', gap: '8px' }}>
                {checkIn.frontPhotoUrl && (
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginBottom: '4px', textAlign: 'center' }}>Frontal</div>
                    <img src={checkIn.frontPhotoUrl} alt="Frontal" style={{ width: '100%', borderRadius: '10px', objectFit: 'cover', aspectRatio: '3/4' }} />
                  </div>
                )}
                {checkIn.sidePhotoUrl && (
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginBottom: '4px', textAlign: 'center' }}>Lateral</div>
                    <img src={checkIn.sidePhotoUrl} alt="Lateral" style={{ width: '100%', borderRadius: '10px', objectFit: 'cover', aspectRatio: '3/4' }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Macros */}
          <div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '10px' }}>Macros</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { label: 'Kcal', value: plan.calories },
                { label: 'Prot', value: `${plan.protein}g` },
                { label: 'HC', value: `${plan.carbs}g` },
                { label: 'Gras', value: `${plan.fat}g` },
              ].map(m => (
                <div key={m.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>{m.value}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress summary */}
          {plan.progressSummary && (
            <div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '6px' }}>Análisis</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{plan.progressSummary}</p>
            </div>
          )}

          {/* Training summary */}
          {plan.training && (
            <div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '6px' }}>Entrenamiento</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
                {plan.training.dias} días/semana · {plan.training.tipo}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                {plan.training.rutina?.map(d => (
                  <span key={d.dia} style={{ fontSize: '11px', background: 'rgba(180,79,255,0.1)', color: '#B44FFF', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {d.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {open && !plan && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.28)' }}>Plan no disponible para esta revisión.</p>
        </div>
      )}
    </div>
  )
}

function TrainingDay({
  dia, index, disliked, swappingExercise, swapInput,
  onSwapOpen, onSwapClose, onSwapInputChange, onDislike, onLike,
  doneExercises, onToggleDone,
}: {
  dia: { dia: string; nombre: string; ejercicios: { nombre: string; series: number; reps: string }[] }
  index: number
  disliked: string[]
  swappingExercise: string | null
  swapInput: string
  onSwapOpen: (name: string) => void
  onSwapClose: () => void
  onSwapInputChange: (v: string) => void
  onDislike: (name: string) => void
  onLike: (name: string) => void
  doneExercises: Record<string, boolean>
  onToggleDone: (key: string) => void
}) {
  const [open, setOpen] = useState(false)
  const colors = ['#B44FFF', '#00D9F5', '#7B6FFF', '#FFD700', '#FF6B6B']
  const color = colors[index % colors.length]
  const doneCount = dia.ejercicios.filter(e => doneExercises[`${index}_${e.nombre}`]).length
  const allDone = doneCount === dia.ejercicios.length

  return (
    <div style={{
      background: '#0C0D16', border: `1px solid rgba(255,255,255,0.06)`,
      borderRadius: '16px', overflow: 'hidden',
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '18px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: `${color}15`, border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 800, color, flexShrink: 0,
          }}>
            {index + 1}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>
              {dia.nombre}
            </div>
            <div style={{ fontSize: '12px', color: allDone ? '#4CAF50' : 'rgba(255,255,255,0.28)' }}>
              {allDone ? '✓ Completado' : `${doneCount}/${dia.ejercicios.length} ejercicios`}
            </div>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease', flexShrink: 0 }}>
          <path d="M4 6l4 4 4-4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {dia.ejercicios.map((ej, i) => {
            const isDisliked = disliked.includes(ej.nombre)
            const isSwapping = swappingExercise === ej.nombre
            return (
              <div key={i} style={{ borderBottom: i < dia.ejercicios.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{
                  padding: '12px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: isDisliked ? '#FF6B6B' : color, flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: '14px',
                      color: isDisliked ? 'rgba(255,107,107,0.6)' : 'rgba(255,255,255,0.75)',
                      textDecoration: isDisliked ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                    }}>
                      {ej.nombre}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600,
                      background: 'rgba(255,255,255,0.06)', borderRadius: '5px',
                      padding: '3px 7px', color: 'rgba(255,255,255,0.45)',
                    }}>
                      {ej.series}×{ej.reps}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleDone(`${index}_${ej.nombre}`) }}
                      title="Marcar como hecho"
                      style={{
                        width: '26px', height: '26px', borderRadius: '6px', border: 'none',
                        background: doneExercises[`${index}_${ej.nombre}`] ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.05)',
                        color: doneExercises[`${index}_${ej.nombre}`] ? '#4CAF50' : 'rgba(255,255,255,0.25)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'inherit', fontSize: '14px', transition: 'all 0.15s ease',
                      }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); isSwapping ? onSwapClose() : onSwapOpen(ej.nombre) }}
                      title="No me gusta este ejercicio"
                      style={{
                        width: '26px', height: '26px', borderRadius: '6px', border: 'none',
                        background: isSwapping ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.05)',
                        color: isSwapping ? '#FF6B6B' : 'rgba(255,255,255,0.3)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'inherit', fontSize: '14px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Swap panel */}
                {isSwapping && (
                  <div style={{
                    padding: '0 20px 14px',
                    background: 'rgba(255,107,107,0.05)',
                    borderTop: '1px solid rgba(255,107,107,0.1)',
                  }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,107,107,0.7)', marginBottom: '10px', paddingTop: '12px' }}>
                      ¿Cuál prefieres en su lugar? (opcional)
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Ej: Sentadilla goblet..."
                        value={swapInput}
                        onChange={e => onSwapInputChange(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{
                          flex: 1, background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                          color: 'white', padding: '8px 12px', fontSize: '13px',
                          fontFamily: 'inherit', outline: 'none',
                        }}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); onDislike(ej.nombre) }}
                        style={{
                          padding: '8px 14px', borderRadius: '8px', border: 'none',
                          background: '#FF6B6B', color: 'white', fontSize: '13px',
                          fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
                      Se aplicará en tu próximo check-in
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MealSection({
  title, options, items, isSimple, kcal,
}: {
  title: string
  options?: Record<string, string[]>
  items?: string[]
  isSimple?: boolean
  kcal?: number
}) {
  const [open, setOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState('opcionA')

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '16px 0', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{title}</span>
          {kcal && (
            <span style={{
              fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '2px 6px',
            }}>{kcal} kcal</span>
          )}
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease', color: 'rgba(255,255,255,0.25)' }}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open && (
        <div style={{ paddingBottom: '16px' }}>
          {isSimple && items && items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.55)' }}>
              <span style={{ color: '#B44FFF', flexShrink: 0, marginTop: '1px' }}>•</span>
              <span>{item}</span>
            </div>
          ))}
          {!isSimple && options && (
            <>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {Object.keys(options).map(key => (
                  <button
                    key={key}
                    onClick={() => setSelectedOption(key)}
                    style={{
                      padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 500, fontFamily: 'inherit',
                      background: selectedOption === key ? 'rgba(180,79,255,0.15)' : 'transparent',
                      border: `1px solid ${selectedOption === key ? 'rgba(180,79,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: selectedOption === key ? '#B44FFF' : 'rgba(255,255,255,0.35)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {key.replace('opcion', 'Opción ').replace('A', ' A').replace('B', ' B').replace('C', ' C').trim()}
                  </button>
                ))}
              </div>
              {options[selectedOption]?.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                  <span style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0, marginTop: '1px' }}>•</span>
                  <span>{item}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
      <svg width="24" height="28" viewBox="0 0 36 42" fill="none">
        <defs>
          <linearGradient id="dashLogo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B44FFF" />
            <stop offset="100%" stopColor="#00D9F5" />
          </linearGradient>
        </defs>
        <polygon points="18,2 34,11 34,31 18,40 2,31 2,11" fill="rgba(180,79,255,0.08)" stroke="url(#dashLogo)" strokeWidth="1.5" />
        <line x1="11" y1="30" x2="15" y2="14" stroke="url(#dashLogo)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="25" y1="30" x2="21" y2="14" stroke="url(#dashLogo)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12.5" y1="23" x2="23.5" y2="23" stroke="url(#dashLogo)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px' }}>
        <span style={{ color: 'white' }}>ANGEL</span>
        <span style={{ background: 'linear-gradient(90deg,#B44FFF,#00D9F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
      </span>
    </div>
  )
}

function OverviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function DietIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 2v16M4 8c0-3 3-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 8v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 15l4-5 3 3 4-6 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 18h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function TrainingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 10h2M15 10h2M5 10a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="3" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 7v6M13 7v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShoppingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 4h1.5l2 8h9l1.5-6H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor"/>
      <circle cx="14.5" cy="15.5" r="1" fill="currentColor"/>
    </svg>
  )
}

function CoachIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 4h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8l-4 3V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 9h6M7 7h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}
