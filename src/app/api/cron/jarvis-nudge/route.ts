import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Vercel cron: runs daily at 19:00 UTC (21:00 España)
// vercel.json → { "path": "/api/cron/jarvis-nudge", "schedule": "0 19 * * *" }

const NUDGE_MESSAGES: Record<number, string> = {
  3: `Llevamos **3 días** sin saber nada de ti. Empiezo a sospechar.

¿Qué excusa tenemos hoy? Porque ya conozco el top 3: "es que estaba muy liado", "es que me encontré mal" y el clásico "es que lo iba a hacer pero..."

Regístrate. Ahora. No tienes que escribir una novela, son **30 segundos**.`,

  7: `🐔 Co... co... co...

Una semana. **SIETE DÍAS** sin aparecer por aquí.

Vaya vaya, tenemos gallina en casa. Tu dieta llorando en un rincón, tu plan de entreno acumulando polvo, y tú... ¿dónde? ¿Tomando piña colada en el sofá?

¿Es hoy el día o seguimos así?`,

  14: `**Dos semanas. DOS.**

En 14 días podrías haber entrenado 10 veces, perdido casi 1kg de grasa y ganado músculo real.

Pero elegiste el camino de la gallina (¿te acuerdas de ese mensaje? 🐔).

No te voy a juzgar. Solo te digo que tu cuerpo sigue ahí esperando. Y yo también. Aunque con menos paciencia.`,

  30: `Un mes.

**Treinta días.** Cuatro semanas. He calculado las calorías que has dejado sin registrar, los entrenos que quizás te has saltado... pero no te lo digo porque me da pena.

Mira, si estás leyendo esto es que sigues vivo. Y si sigues vivo, puedes volver. Hoy. Ahora mismo. Sin drama.

Tu cuerpo no sabe que desapareciste un mes. Solo sabe lo que le des **a partir de ahora**.

¿Volvemos? _(PD: la próxima vez mando a buscarte personalmente)_`,
}

const MILESTONE_DAYS = [3, 7, 14, 30]

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all active users (have at least 1 check-in)
  const users = await prisma.user.findMany({
    where: { checkIns: { some: {} } },
    select: {
      id: true,
      dailyLogs: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { date: true },
      },
    },
  })

  const now = new Date()
  let nudgesSent = 0

  for (const user of users) {
    const lastLog = user.dailyLogs[0]
    if (!lastLog) continue

    const daysSince = Math.floor((now.getTime() - lastLog.date.getTime()) / (1000 * 60 * 60 * 24))

    if (!MILESTONE_DAYS.includes(daysSince)) continue

    const message = NUDGE_MESSAGES[daysSince]
    if (!message) continue

    // Avoid duplicate: check if we already sent a nudge in last 20h
    const recentNudge = await prisma.coachMessage.findFirst({
      where: {
        userId: user.id,
        role: 'assistant',
        createdAt: { gte: new Date(now.getTime() - 20 * 60 * 60 * 1000) },
      },
    })
    if (recentNudge) continue

    await prisma.coachMessage.create({
      data: { userId: user.id, role: 'assistant', content: message },
    })
    nudgesSent++
  }

  return NextResponse.json({ nudgesSent, usersChecked: users.length })
}
