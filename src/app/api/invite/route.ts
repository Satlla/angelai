import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({ email: z.string().email() })

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const pending = await prisma.pendingInvite.findFirst({ where: { inviterUserId: session.userId } })

  return NextResponse.json({
    inviteUsed: !!pending,
    inviteeEmail: pending?.inviteeEmail ?? null,
    inviteeJoined: pending?.usedAt ? true : false,
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  const { email } = parsed.data

  // Check if user has already sent an invite
  const alreadyInvited = await prisma.pendingInvite.findFirst({ where: { inviterUserId: session.userId } })
  if (alreadyInvited) return NextResponse.json({ error: 'Ya has usado tu invitación.' }, { status: 403 })

  const inviter = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } })
  if (!inviter) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Check invitee isn't already registered
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return NextResponse.json({ error: 'Ese email ya tiene una cuenta.' }, { status: 409 })

  // Create invite record + create invitee user in DB so they can log in immediately
  const invite = await prisma.pendingInvite.create({
    data: { inviterUserId: session.userId, inviteeEmail: email.toLowerCase() },
  })
  await prisma.user.create({ data: { email: email.toLowerCase() } })

  // Send premium invite email via Resend
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dieta.itineramio.com'
  const inviterName = inviter.name || inviter.email.split('@')[0]
  void invite // used in email URL below

  await resend.emails.send({
    from: 'AngelAI <noreply@itineramio.com>',
    to: email,
    subject: `${inviterName} te ha reservado un acceso a AngelAI`,
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invitación exclusiva — AngelAI</title>
</head>
<body style="margin:0;padding:0;background:#07080F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="max-width:520px;margin:0 auto;padding:0 0 40px;">

    <!-- Header bar -->
    <div style="background:linear-gradient(135deg,#0d0520 0%,#07080F 100%);border-bottom:1px solid rgba(180,79,255,0.15);padding:28px 40px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <svg width="26" height="30" viewBox="0 0 36 42" fill="none" style="display:inline-block;vertical-align:middle;">
          <defs>
            <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#B44FFF"/>
              <stop offset="100%" stop-color="#00D9F5"/>
            </linearGradient>
          </defs>
          <polygon points="18,2 34,11 34,31 18,40 2,31 2,11" fill="rgba(180,79,255,0.08)" stroke="url(#lg)" stroke-width="1.5"/>
          <line x1="11" y1="30" x2="15" y2="14" stroke="url(#lg)" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="25" y1="30" x2="21" y2="14" stroke="url(#lg)" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="12.5" y1="23" x2="23.5" y2="23" stroke="url(#lg)" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span style="font-size:20px;font-weight:900;letter-spacing:-0.5px;color:white;vertical-align:middle;">ANGEL<span style="background:linear-gradient(90deg,#B44FFF,#00D9F5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">AI</span></span>
      </div>
    </div>

    <!-- Main card -->
    <div style="margin:32px 24px 0;background:#0C0D16;border-radius:24px;overflow:hidden;border:1px solid rgba(180,79,255,0.2);">

      <!-- Gold accent top bar -->
      <div style="height:3px;background:linear-gradient(90deg,#B44FFF,#7B6FFF,#00D9F5);"></div>

      <div style="padding:36px 36px 32px;">

        <!-- Badge -->
        <div style="display:inline-block;background:rgba(180,79,255,0.1);border:1px solid rgba(180,79,255,0.25);border-radius:6px;padding:5px 12px;margin-bottom:24px;">
          <span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#B44FFF;">Acceso Privado</span>
        </div>

        <!-- Main heading -->
        <h1 style="font-size:28px;font-weight:900;color:white;letter-spacing:-0.8px;line-height:1.2;margin:0 0 8px;">
          ${inviterName} cree<br/>que puedes lograrlo.
        </h1>
        <p style="font-size:15px;color:rgba(255,255,255,0.35);margin:0 0 28px;line-height:1.5;">
          Y solo tiene una invitación. La ha usado contigo.
        </p>

        <!-- Separator -->
        <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:28px;"></div>

        <!-- What is AngelAI -->
        <p style="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0 0 16px;">Qué es AngelAI</p>

        <p style="font-size:15px;color:rgba(255,255,255,0.6);line-height:1.75;margin:0 0 24px;">
          AngelAI es una plataforma de <strong style="color:rgba(255,255,255,0.85);">nutrición y entrenamiento personalizado con inteligencia artificial</strong>.
          No es una app de conteo de calorías genérica. Es un sistema que calcula tu metabolismo con precisión científica,
          analiza tu cuerpo, y te da un plan real — con gramos exactos de cada alimento.
        </p>

        <!-- Feature pills -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:28px;">
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 16px;">
            <div style="font-size:18px;margin-bottom:6px;">🧬</div>
            <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.75);margin-bottom:4px;">Macros científicos</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.3);line-height:1.5;">Mifflin-St Jeor. Proteína, carbohidratos y grasa al gramo exacto.</div>
          </div>
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 16px;">
            <div style="font-size:18px;margin-bottom:6px;">📸</div>
            <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.75);margin-bottom:4px;">Análisis corporal IA</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.3);line-height:1.5;">Foto frontal y lateral. La IA detecta grasa y tono muscular.</div>
          </div>
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 16px;">
            <div style="font-size:18px;margin-bottom:6px;">🔄</div>
            <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.75);margin-bottom:4px;">Revisión quincenal</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.3);line-height:1.5;">Cada 15 días la IA cruza datos y ajusta tu plan automáticamente.</div>
          </div>
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 16px;">
            <div style="font-size:18px;margin-bottom:6px;">⚡</div>
            <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.75);margin-bottom:4px;">30 segundos al día</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.3);line-height:1.5;">Cuestionario nocturno. La IA mide tu disciplina real con datos.</div>
          </div>
        </div>

        <!-- Separator -->
        <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:28px;"></div>

        <!-- Exclusivity note -->
        <div style="background:rgba(255,183,0,0.05);border:1px solid rgba(255,183,0,0.15);border-radius:12px;padding:14px 18px;margin-bottom:28px;">
          <p style="font-size:13px;color:rgba(255,183,0,0.7);margin:0;line-height:1.6;">
            <strong style="color:rgba(255,183,0,0.9);">Plataforma en beta privada.</strong>
            AngelAI no está abierta al público. Cada usuario tiene solo 1 invitación.
            Que ${inviterName} la haya usado contigo dice mucho.
          </p>
        </div>

        <!-- CTA Button -->
        <a href="${appUrl}" style="display:block;background:linear-gradient(135deg,#B44FFF 0%,#7B2FFF 100%);color:white;text-decoration:none;text-align:center;padding:18px 24px;border-radius:14px;font-weight:800;font-size:16px;letter-spacing:-0.3px;margin-bottom:16px;">
          Activar mi acceso →
        </a>

        <p style="font-size:11px;color:rgba(255,255,255,0.2);text-align:center;margin:0;">
          Introduce tu email <strong style="color:rgba(255,255,255,0.35);">${email}</strong> al acceder · Sin contraseña · Sin tarjeta
        </p>

      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px;padding:0 24px;">
      <p style="font-size:11px;color:rgba(255,255,255,0.12);line-height:1.8;margin:0;">
        AngelAI — Nobody can stop you.<br/>
        <a href="${appUrl}/legal/privacidad" style="color:rgba(180,79,255,0.3);text-decoration:none;">Privacidad</a> · <a href="${appUrl}/legal/terminos" style="color:rgba(180,79,255,0.3);text-decoration:none;">Términos</a>
      </p>
    </div>

  </div>
</body>
</html>`,
  })

  return NextResponse.json({ ok: true, inviteeEmail: email })
}
