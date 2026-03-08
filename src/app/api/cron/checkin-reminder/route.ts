import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

// Vercel cron: runs daily at 09:00 UTC
// vercel.json → "crons": [{ "path": "/api/cron/checkin-reminder", "schedule": "0 9 * * *" }]

export async function GET(req: NextRequest) {
  // Protect the cron endpoint
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fifteenDaysAgo = new Date()
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

  // Find users whose last check-in was exactly 15 days ago (±12 h window)
  const windowStart = new Date(fifteenDaysAgo)
  windowStart.setHours(windowStart.getHours() - 12)
  const windowEnd = new Date(fifteenDaysAgo)
  windowEnd.setHours(windowEnd.getHours() + 12)

  const users = await prisma.user.findMany({
    where: {
      checkIns: {
        some: {
          createdAt: { gte: windowStart, lte: windowEnd },
        },
        // Make sure this IS their latest check-in
        none: {
          createdAt: { gt: windowEnd },
        },
      },
    },
    select: { id: true, email: true, name: true },
  })

  if (!process.env.RESEND_API_KEY || users.length === 0) {
    return NextResponse.json({ sent: 0, users: users.map(u => u.email) })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'AngelAI <noreply@angelai.app>'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://angelai.app'

  const results = await Promise.allSettled(
    users.map(user =>
      resend.emails.send({
        from: fromEmail,
        to: user.email,
        subject: '¡Tu revisión quincenal está lista! 💪',
        html: buildEmailHTML(user.name || user.email.split('@')[0], appUrl),
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length

  return NextResponse.json({ sent, total: users.length })
}

function buildEmailHTML(name: string, appUrl: string) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu revisión quincenal</title>
</head>
<body style="margin:0;padding:0;background:#07080F;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07080F;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">ANGEL</span><span style="font-size:20px;font-weight:800;background:linear-gradient(90deg,#B44FFF,#00D9F5);-webkit-background-clip:text;color:#B44FFF;">AI</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0C0D16;border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:36px 32px;">

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="width:52px;height:52px;border-radius:50%;background:rgba(180,79,255,0.12);border:1px solid rgba(180,79,255,0.25);display:inline-flex;align-items:center;justify-content:center;">
                      <span style="font-size:24px;">💪</span>
                    </div>
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;letter-spacing:-0.8px;line-height:1.2;">
                Han pasado 15 días, ${name}
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.45);line-height:1.65;">
                Es momento de tu revisión quincenal. La IA analizará tu evolución y actualizará tu plan de nutrición con los nuevos datos.
              </p>

              <!-- CTA -->
              <a href="${appUrl}/checkin"
                style="display:inline-block;background:#B44FFF;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:12px;letter-spacing:-0.1px;">
                Hacer mi revisión →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;font-size:12px;color:rgba(255,255,255,0.15);">
              AngelAI · Plataforma de nutrición con IA<br>
              <a href="${appUrl}" style="color:rgba(180,79,255,0.5);text-decoration:none;">angelai.app</a>
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
