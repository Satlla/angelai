export const metadata = { title: 'Política de Privacidad — AngelAI' }

export default function Privacidad() {
  return <LegalPage title="Política de Privacidad" lastUpdate="1 de enero de 2025">
    <Section title="1. Responsable del tratamiento">
      <p><strong>AngelAI S.L.</strong><br/>CIF: B-87654321<br/>Calle de Serrano, 45, Planta 3ª<br/>28001 Madrid, España<br/>Email: privacidad@angelai.app</p>
    </Section>
    <Section title="2. Datos que recopilamos">
      <p>Recopilamos los siguientes datos personales:</p>
      <ul>
        <li><strong>Identificación:</strong> dirección de correo electrónico.</li>
        <li><strong>Datos biométricos:</strong> peso, altura, medidas corporales, edad y sexo, proporcionados voluntariamente para la generación de planes nutricionales.</li>
        <li><strong>Imágenes corporales:</strong> fotografías frontales y laterales, proporcionadas opcionalmente para el análisis de composición corporal.</li>
        <li><strong>Datos de seguimiento:</strong> respuestas a los cuestionarios diarios de disciplina (cumplimiento de dieta, entrenamiento, sueño, hidratación y nivel de estrés).</li>
        <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador y datos de sesión.</li>
      </ul>
    </Section>
    <Section title="3. Finalidad y base jurídica">
      <ul>
        <li>Generar planes nutricionales y de entrenamiento personalizados mediante inteligencia artificial (ejecución de contrato, art. 6.1.b RGPD).</li>
        <li>Análisis de composición corporal mediante fotografías (consentimiento explícito, art. 9.2.a RGPD).</li>
        <li>Seguimiento del progreso y disciplina diaria (ejecución de contrato).</li>
        <li>Envío de comunicaciones relacionadas con el servicio, incluidos recordatorios y cuestionarios diarios (interés legítimo, art. 6.1.f RGPD).</li>
      </ul>
    </Section>
    <Section title="4. Conservación de datos">
      <p>Los datos se conservarán durante el tiempo que el usuario mantenga una cuenta activa. Las fotografías corporales se eliminan automáticamente a los <strong>30 días</strong> desde su carga. El usuario puede solicitar la eliminación en cualquier momento.</p>
    </Section>
    <Section title="5. Destinatarios">
      <p>Los datos se comparten exclusivamente con:</p>
      <ul>
        <li><strong>Anthropic, Inc.</strong> (API de inteligencia artificial) — para el procesamiento de datos biométricos y generación de planes. Anthropic no almacena los datos enviados a su API con carácter permanente.</li>
        <li><strong>Supabase, Inc.</strong> / <strong>Vercel, Inc.</strong> — infraestructura de base de datos y alojamiento.</li>
        <li><strong>Resend, Inc.</strong> — envío de comunicaciones por correo electrónico.</li>
      </ul>
      <p>No vendemos ni cedemos datos a terceros con fines comerciales.</p>
    </Section>
    <Section title="6. Derechos del usuario">
      <p>Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, portabilidad y limitación escribiendo a <strong>privacidad@angelai.app</strong>. También puede reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
    </Section>
    <Section title="7. Seguridad">
      <p>Aplicamos medidas técnicas y organizativas para proteger sus datos: cifrado en tránsito (TLS), autenticación mediante JWT, y acceso restringido a los datos de usuario.</p>
    </Section>
  </LegalPage>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '12px', letterSpacing: '-0.3px' }}>{title}</h2>
      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

function LegalPage({ title, lastUpdate, children }: { title: string; lastUpdate: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#07080F', color: 'white', fontFamily: "'Inter',-apple-system,sans-serif" }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <a href="/" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '40px' }}>
          ← AngelAI
        </a>
        <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(180,79,255,0.6)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px' }}>Legal</p>
        <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1.2px', marginBottom: '8px' }}>{title}</h1>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginBottom: '48px' }}>Última actualización: {lastUpdate}</p>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '40px' }}>
          {children}
        </div>
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <a href="/legal/privacidad" style={{ fontSize: '12px', color: 'rgba(180,79,255,0.5)', textDecoration: 'none' }}>Privacidad</a>
          <a href="/legal/cookies" style={{ fontSize: '12px', color: 'rgba(180,79,255,0.5)', textDecoration: 'none' }}>Cookies</a>
          <a href="/legal/terminos" style={{ fontSize: '12px', color: 'rgba(180,79,255,0.5)', textDecoration: 'none' }}>Términos</a>
        </div>
      </div>
    </div>
  )
}
