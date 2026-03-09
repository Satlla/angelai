import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

// Cron diario a las 21:00 UTC = 22:00 España
// Envía cuestionario diario a todos los usuarios activos (con al menos 1 check-in)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Obtener todos los usuarios con al menos 1 check-in
  const users = await prisma.user.findMany({
    where: {
      checkIns: { some: {} },
    },
    select: {
      id: true,
      email: true,
      name: true,
      currentMedal: true,
      checkIns: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { bodyScore: true, goal: true, weight: true },
      },
      dailyLogs: {
        orderBy: { date: 'desc' },
        take: 7,
        select: { dietScore: true, disciplineScore: true },
      },
    },
  })

  if (!process.env.RESEND_API_KEY || users.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'AngelAI <hola@angelai.app>'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dieta.itineramio.com'

  const results = await Promise.allSettled(
    users.map(user => {
      const name = user.name || user.email.split('@')[0]
      const lastScore = user.checkIns[0]?.bodyScore || 0
      const avgDiet = user.dailyLogs.length > 0
        ? Math.round(user.dailyLogs.reduce((a, l) => a + (l.dietScore || 0), 0) / user.dailyLogs.length)
        : null
      const medal = user.currentMedal

      return resend.emails.send({
        from: fromEmail,
        to: user.email,
        subject: `¿Cómo fue tu día, ${name}? — Resumen diario AngelAI`,
        html: buildDailyEmailHTML({ name, appUrl, lastScore, avgDiet, medal }),
      })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: users.length })
}

function buildDailyEmailHTML({ name, appUrl, lastScore, avgDiet, medal }: {
  name: string
  appUrl: string
  lastScore: number
  avgDiet: number | null
  medal: string | null | undefined
}) {
  const medalEmoji: Record<string, string> = {
    INICIO: '🌱', BRONCE: '🥉', PLATA: '🥈', ORO: '🥇', PLATINO: '💎', DIAMANTE: '🔮', LEYENDA: '👑'
  }
  const medalBadge = medal ? `${medalEmoji[medal] || ''} ${medal}` : null

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resumen diario AngelAI</title>
</head>
<body style="margin:0;padding:0;background:#07080F;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07080F;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo + medal -->
          <tr>
            <td style="padding-bottom:28px;display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">ANGEL<span style="color:#B44FFF">AI</span></span>
              ${medalBadge ? `<span style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.5);float:right;">${medalBadge}</span>` : ''}
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0C0D16;border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:36px 32px;">

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;letter-spacing:-0.6px;">
                Hola ${name} 👋
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.45);line-height:1.65;">
                Son las 22:00. ¿Cómo fue tu día? Completa tu resumen diario en 30 segundos — la IA lo usará para analizar tu disciplina y progreso.
              </p>

              ${avgDiet !== null ? `
              <!-- Avg diet last 7 days -->
              <div style="background:rgba(180,79,255,0.08);border:1px solid rgba(180,79,255,0.15);border-radius:12px;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:1px;text-transform:uppercase;font-weight:600;">Cumplimiento dieta últimos 7 días</p>
                <p style="margin:0;font-size:24px;font-weight:900;color:#B44FFF;">${avgDiet}%</p>
              </div>` : ''}

              ${lastScore ? `
              <!-- Body score -->
              <div style="display:flex;gap:12px;margin-bottom:28px;">
                <div style="flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px 14px;">
                  <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:1px;font-weight:600;">Body Score</p>
                  <p style="margin:0;font-size:22px;font-weight:900;color:#00D9F5;">${lastScore}</p>
                </div>
              </div>` : ''}

              <!-- CTA -->
              <a href="${appUrl}/daily"
                style="display:block;text-align:center;background:linear-gradient(135deg,#B44FFF,#8B2FE0);color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 28px;border-radius:14px;letter-spacing:-0.2px;">
                Completar mi resumen del día →
              </a>

              <p style="margin:20px 0 0;font-size:12px;color:rgba(255,255,255,0.2);text-align:center;line-height:1.6;">
                Solo 30 segundos · La disciplina diaria marca la diferencia
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;font-size:12px;color:rgba(255,255,255,0.15);">
              AngelAI · Tu entrenador y nutricionista con IA<br>
              <a href="${appUrl}" style="color:rgba(180,79,255,0.5);text-decoration:none;">dieta.itineramio.com</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()
}
