import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin_session')?.value
  const adminPassword = process.env.ADMIN_PASSWORD ?? ''
  const expected = adminPassword.slice(0, 8) + '_ok'
  return adminSession === expected
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { email } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

  const normalizedEmail = email.toLowerCase().trim()

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) return NextResponse.json({ error: 'Ese email ya tiene una cuenta.' }, { status: 409 })

  // Create invite + user
  await prisma.pendingInvite.create({
    data: { inviterUserId: 'admin', inviteeEmail: normalizedEmail },
  })
  await prisma.user.create({ data: { email: normalizedEmail } })

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dieta.itineramio.com'

  await resend.emails.send({
    from: 'AngelAI <noreply@itineramio.com>',
    to: normalizedEmail,
    subject: `Tienes acceso a AngelAI`,
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Acceso exclusivo — AngelAI</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px 48px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#1a1a2e;">ANGEL<span style="background:linear-gradient(90deg,#B44FFF,#00D9F5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">AI</span></span>
    </div>
    <div style="background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(0,0,0,0.07);box-shadow:0 4px 32px rgba(0,0,0,0.08);">
      <div style="height:3px;background:linear-gradient(90deg,#B44FFF,#7B6FFF,#00D9F5);"></div>
      <div style="padding:36px 36px 32px;">
        <div style="display:inline-block;background:rgba(180,79,255,0.08);border:1px solid rgba(180,79,255,0.2);border-radius:6px;padding:5px 12px;margin-bottom:24px;">
          <span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#B44FFF;">Acceso Privado</span>
        </div>
        <h1 style="font-size:28px;font-weight:900;color:#1a1a2e;letter-spacing:-0.8px;line-height:1.2;margin:0 0 8px;">
          Tu acceso a AngelAI<br/>está listo.
        </h1>
        <p style="font-size:15px;color:#888;margin:0 0 28px;line-height:1.5;">
          Hemos reservado una plaza para ti en la beta privada.
        </p>
        <div style="height:1px;background:rgba(0,0,0,0.06);margin-bottom:28px;"></div>
        <p style="font-size:15px;color:#555;line-height:1.75;margin:0 0 24px;">
          AngelAI es una plataforma de <strong style="color:#1a1a2e;">nutrición y entrenamiento personalizado con inteligencia artificial</strong>.
          Calcula tu metabolismo con precisión científica, analiza tu cuerpo y te da un plan real — con gramos exactos de cada alimento.
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:28px;">
          <div style="background:#F8F8FA;border:1px solid rgba(0,0,0,0.06);border-radius:12px;padding:14px 16px;">
            <div style="font-size:18px;margin-bottom:6px;">🧬</div>
            <div style="font-size:13px;font-weight:600;color:#1a1a2e;margin-bottom:4px;">Macros científicos</div>
            <div style="font-size:11px;color:#999;line-height:1.5;">Mifflin-St Jeor. Proteína, carbohidratos y grasa al gramo exacto.</div>
          </div>
          <div style="background:#F8F8FA;border:1px solid rgba(0,0,0,0.06);border-radius:12px;padding:14px 16px;">
            <div style="font-size:18px;margin-bottom:6px;">📸</div>
            <div style="font-size:13px;font-weight:600;color:#1a1a2e;margin-bottom:4px;">Análisis corporal IA</div>
            <div style="font-size:11px;color:#999;line-height:1.5;">Foto frontal y lateral. La IA detecta grasa y tono muscular.</div>
          </div>
          <div style="background:#F8F8FA;border:1px solid rgba(0,0,0,0.06);border-radius:12px;padding:14px 16px;">
            <div style="font-size:18px;margin-bottom:6px;">🔄</div>
            <div style="font-size:13px;font-weight:600;color:#1a1a2e;margin-bottom:4px;">Revisión quincenal</div>
            <div style="font-size:11px;color:#999;line-height:1.5;">Cada 15 días la IA cruza datos y ajusta tu plan automáticamente.</div>
          </div>
          <div style="background:#F8F8FA;border:1px solid rgba(0,0,0,0.06);border-radius:12px;padding:14px 16px;">
            <div style="font-size:18px;margin-bottom:6px;">⚡</div>
            <div style="font-size:13px;font-weight:600;color:#1a1a2e;margin-bottom:4px;">30 segundos al día</div>
            <div style="font-size:11px;color:#999;line-height:1.5;">Cuestionario nocturno. La IA mide tu disciplina real con datos.</div>
          </div>
        </div>
        <a href="${appUrl}" style="display:block;background:linear-gradient(135deg,#B44FFF 0%,#7B2FFF 100%);color:white;text-decoration:none;text-align:center;padding:18px 24px;border-radius:14px;font-weight:800;font-size:16px;letter-spacing:-0.3px;margin-bottom:16px;">
          Activar mi acceso →
        </a>
        <p style="font-size:11px;color:#bbb;text-align:center;margin:0;">
          Introduce tu email <strong style="color:#999;">${normalizedEmail}</strong> al acceder · Sin contraseña · Sin tarjeta
        </p>
      </div>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="font-size:11px;color:#bbb;line-height:1.8;margin:0;">
        AngelAI — Nobody can stop you.<br/>
        <a href="${appUrl}/legal/privacidad" style="color:#B44FFF;text-decoration:none;">Privacidad</a> · <a href="${appUrl}/legal/terminos" style="color:#B44FFF;text-decoration:none;">Términos</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  })

  return NextResponse.json({ ok: true })
}
