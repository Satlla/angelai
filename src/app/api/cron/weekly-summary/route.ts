import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: true, reason: 'No RESEND_API_KEY' })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  // Users who have weeklyEmailEnabled = true and have at least 7 daily logs
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const usersWithActivity = await prisma.user.findMany({
    where: {
      preferences: { weeklyEmailEnabled: true },
      dailyLogs: { some: { date: { gte: sevenDaysAgo } } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      dailyLogs: {
        where: { date: { gte: sevenDaysAgo } },
        select: { dietScore: true, date: true },
        orderBy: { date: 'desc' },
      },
      checkIns: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      },
    },
  })

  let sent = 0
  let failed = 0

  for (const user of usersWithActivity) {
    try {
      const logs = user.dailyLogs
      if (logs.length < 7) continue

      const daysLogged = logs.length
      const avgDietScore = Math.round(logs.reduce((s, l) => s + l.dietScore, 0) / logs.length)

      const lastCheckIn = user.checkIns[0]
      let daysToNextCheckIn = 15
      if (lastCheckIn) {
        const nextDate = new Date(lastCheckIn.createdAt)
        nextDate.setDate(nextDate.getDate() + 15)
        daysToNextCheckIn = Math.max(0, Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      }

      const disciplineScore = Math.round((daysLogged / 7) * 50 + (avgDietScore / 100) * 50)
      const name = user.name || 'campeón'

      const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu resumen semanal - AngelAI</title>
</head>
<body style="margin:0;padding:0;background:#07080F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;margin:0;">
        ANGEL<span style="background:linear-gradient(90deg,#B44FFF,#00D9F5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">AI</span>
      </h1>
      <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:6px 0 0;">Resumen semanal</p>
    </div>

    <!-- Greeting -->
    <div style="background:#0C0D16;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="font-size:20px;font-weight:700;color:white;margin:0 0 12px;">
        ¡Llevas ${daysLogged} días registrando, ${name}! 💪
      </p>
      <p style="font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7;margin:0;">
        Esta semana has demostrado una consistencia increíble. Cada día que registras es un paso hacia tu objetivo.
      </p>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      <div style="background:#0C0D16;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:18px;">
        <p style="font-size:10px;letter-spacing:1.5px;color:rgba(255,255,255,0.28);text-transform:uppercase;font-weight:600;margin:0 0 8px;">% Dieta cumplida</p>
        <p style="font-size:32px;font-weight:800;color:#00D9F5;margin:0;letter-spacing:-1px;">${avgDietScore}%</p>
      </div>
      <div style="background:#0C0D16;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:18px;">
        <p style="font-size:10px;letter-spacing:1.5px;color:rgba(255,255,255,0.28);text-transform:uppercase;font-weight:600;margin:0 0 8px;">Disciplina</p>
        <p style="font-size:32px;font-weight:800;color:#B44FFF;margin:0;letter-spacing:-1px;">${disciplineScore}</p>
      </div>
    </div>

    <div style="background:#0C0D16;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:18px;margin-bottom:24px;">
      <p style="font-size:10px;letter-spacing:1.5px;color:rgba(255,255,255,0.28);text-transform:uppercase;font-weight:600;margin:0 0 8px;">Próxima revisión</p>
      ${daysToNextCheckIn === 0
        ? '<p style="font-size:18px;font-weight:700;color:#FFD700;margin:0;">¡Tu check-in está disponible!</p>'
        : `<p style="font-size:18px;font-weight:700;color:white;margin:0;">En <strong style="color:#B44FFF;">${daysToNextCheckIn} días</strong></p>`
      }
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://angelai.app'}/dashboard"
        style="display:inline-block;background:linear-gradient(135deg,#B44FFF,#00D9F5);color:white;font-weight:700;font-size:15px;padding:16px 32px;border-radius:12px;text-decoration:none;letter-spacing:-0.2px;">
        Ver mi progreso →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">
      <p style="font-size:12px;color:rgba(255,255,255,0.2);line-height:1.7;margin:0;">
        Recibes este email porque tienes los resúmenes semanales activados.<br>
        Puedes desactivarlos en <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://angelai.app'}/settings" style="color:rgba(255,255,255,0.35);">Ajustes</a>.
      </p>
    </div>
  </div>
</body>
</html>`

      await resend.emails.send({
        from: 'AngelAI <noreply@angelai.app>',
        to: user.email,
        subject: `¡Llevas ${daysLogged} días registrando! Tu resumen semanal 💪`,
        html,
      })
      sent++
    } catch (err) {
      console.error(`Failed to send weekly email to ${user.email}:`, err)
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: usersWithActivity.length })
}
