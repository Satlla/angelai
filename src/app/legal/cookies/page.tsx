export const metadata = { title: 'Política de Cookies — AngelAI' }

export default function Cookies() {
  return <LegalPage title="Política de Cookies" lastUpdate="1 de enero de 2025">
    <Section title="1. ¿Qué son las cookies?">
      <p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. Permiten que el sitio recuerde sus preferencias y garanticen el correcto funcionamiento del servicio.</p>
    </Section>
    <Section title="2. Cookies que utilizamos">
      <table>
        <thead>
          <tr>
            <th>Nombre</th><th>Tipo</th><th>Duración</th><th>Finalidad</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>angelai_session</code></td><td>Técnica esencial</td><td>30 días</td><td>Mantener la sesión autenticada del usuario. Sin esta cookie el servicio no funciona.</td></tr>
        </tbody>
      </table>
    </Section>
    <Section title="3. Cookies de terceros">
      <p>AngelAI no utiliza cookies de terceros con fines publicitarios ni de seguimiento. Los servicios de infraestructura (Vercel) pueden establecer cookies técnicas propias necesarias para el funcionamiento de la red de distribución de contenidos.</p>
    </Section>
    <Section title="4. Gestión de cookies">
      <p>Puede deshabilitar las cookies desde la configuración de su navegador. Tenga en cuenta que deshabilitar la cookie <code>angelai_session</code> impide el acceso al servicio, ya que es estrictamente necesaria para la autenticación.</p>
      <ul>
        <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
        <li><strong>Firefox:</strong> Preferencias → Privacidad → Cookies</li>
        <li><strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos</li>
      </ul>
    </Section>
    <Section title="5. Base jurídica">
      <p>La cookie de sesión se instala en base al interés legítimo (art. 6.1.f RGPD) y la excepción de cookies estrictamente necesarias recogida en la Ley 34/2002 (LSSI). No requiere consentimiento previo al ser esencial para la prestación del servicio solicitado por el usuario.</p>
    </Section>
    <Section title="6. Contacto">
      <p>Para cualquier consulta sobre el uso de cookies: <strong>privacidad@angelai.app</strong></p>
    </Section>
  </LegalPage>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>{title}</h2>
      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
        {children}
        <style>{`
          table { width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; }
          th { text-align:left; padding:10px 12px; background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.6); font-weight:600; border:1px solid rgba(255,255,255,0.06); }
          td { padding:10px 12px; border:1px solid rgba(255,255,255,0.06); vertical-align:top; }
          code { background:rgba(180,79,255,0.1); color:#B44FFF; padding:2px 6px; border-radius:4px; font-size:12px; }
          ul { padding-left:20px; } li { margin-bottom:6px; }
        `}</style>
      </div>
    </div>
  )
}

function LegalPage({ title, lastUpdate, children }: { title: string; lastUpdate: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#07080F', color: 'white', fontFamily: "'Inter',-apple-system,sans-serif" }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <a href="/" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '40px' }}>← AngelAI</a>
        <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(180,79,255,0.6)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px' }}>Legal</p>
        <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1.2px', marginBottom: '8px' }}>{title}</h1>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginBottom: '48px' }}>Última actualización: {lastUpdate}</p>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '40px' }}>{children}</div>
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '24px' }}>
          <a href="/legal/privacidad" style={{ fontSize: '12px', color: 'rgba(180,79,255,0.5)', textDecoration: 'none' }}>Privacidad</a>
          <a href="/legal/cookies" style={{ fontSize: '12px', color: 'rgba(180,79,255,0.5)', textDecoration: 'none' }}>Cookies</a>
          <a href="/legal/terminos" style={{ fontSize: '12px', color: 'rgba(180,79,255,0.5)', textDecoration: 'none' }}>Términos</a>
        </div>
      </div>
    </div>
  )
}
