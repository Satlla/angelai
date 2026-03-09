export const metadata = { title: 'Términos de Uso — AngelAI' }

export default function Terminos() {
  return <LegalPage title="Términos y Condiciones de Uso" lastUpdate="1 de enero de 2025">
    <Section title="1. Identificación del titular">
      <p><strong>AngelAI S.L.</strong>, con CIF B-87654321 y domicilio social en Calle de Serrano, 45, Planta 3ª, 28001 Madrid, España (en adelante, "AngelAI" o "la Empresa").</p>
    </Section>
    <Section title="2. Objeto del servicio">
      <p>AngelAI es una plataforma digital de generación de planes nutricionales y de entrenamiento personalizados mediante inteligencia artificial. El servicio incluye:</p>
      <ul>
        <li>Cálculo del gasto energético total (TDEE) y macronutrientes mediante fórmulas científicas.</li>
        <li>Análisis de composición corporal a partir de fotografías proporcionadas voluntariamente por el usuario.</li>
        <li>Seguimiento diario de disciplina nutricional y de entrenamiento.</li>
        <li>Revisiones y ajustes quincenales del plan mediante inteligencia artificial.</li>
      </ul>
    </Section>
    <Section title="3. AVISO MÉDICO Y EXENCIÓN DE RESPONSABILIDAD">
      <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '12px' }}>
        <p style={{ color: 'rgba(255,150,150,0.9)', fontWeight: 600, marginBottom: '8px' }}>⚠️ IMPORTANTE — LEA DETENIDAMENTE</p>
        <p>Los planes nutricionales y de entrenamiento generados por AngelAI son elaborados por un sistema de inteligencia artificial con carácter <strong>orientativo e informativo</strong>. En ningún caso constituyen consejo médico, diagnóstico clínico ni prescripción dietética profesional.</p>
        <p style={{ marginTop: '8px' }}><strong>AngelAI S.L. queda expresamente exenta de toda responsabilidad</strong> por los daños, perjuicios, lesiones o consecuencias de cualquier tipo que pudieran derivarse del seguimiento, total o parcial, de los planes generados por la plataforma, incluyendo pero no limitado a: pérdidas de salud, descompensaciones nutricionales, lesiones musculares o articulares, o cualquier otra afección física o psicológica.</p>
        <p style={{ marginTop: '8px' }}>El usuario reconoce que:</p>
        <ul>
          <li>Ha consultado o se compromete a consultar con un médico o dietista-nutricionista colegiado antes de iniciar cualquier plan alimentario o de ejercicio.</li>
          <li>Los resultados individuales pueden variar significativamente en función de factores genéticos, metabólicos, médicos y de adherencia.</li>
          <li>La plataforma no está diseñada para personas con patologías crónicas, embarazadas, personas en período de lactancia, menores de 18 años o con trastornos de la conducta alimentaria.</li>
        </ul>
      </div>
    </Section>
    <Section title="4. Acceso y registro">
      <p>El acceso a AngelAI es de carácter privado y restringido. AngelAI S.L. se reserva el derecho de autorizar o denegar el acceso a cualquier dirección de correo electrónico sin necesidad de justificación.</p>
    </Section>
    <Section title="5. Uso aceptable">
      <p>El usuario se compromete a:</p>
      <ul>
        <li>Proporcionar datos veídicos y actualizados.</li>
        <li>No compartir sus credenciales de acceso con terceros.</li>
        <li>No intentar acceder a cuentas ajenas ni manipular el sistema.</li>
        <li>No usar el servicio para fines comerciales sin autorización expresa.</li>
      </ul>
    </Section>
    <Section title="6. Propiedad intelectual">
      <p>Todos los contenidos, diseños, algoritmos y sistemas de AngelAI son propiedad exclusiva de AngelAI S.L. o de sus licenciantes. Queda prohibida su reproducción, distribución o uso comercial sin autorización previa por escrito.</p>
    </Section>
    <Section title="7. Modificaciones del servicio">
      <p>AngelAI S.L. se reserva el derecho de modificar, suspender o cancelar el servicio en cualquier momento, con o sin previo aviso, sin que ello genere derecho a compensación alguna.</p>
    </Section>
    <Section title="8. Ley aplicable y jurisdicción">
      <p>Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de la ciudad de Madrid, con renuncia expresa a cualquier otro fuero.</p>
    </Section>
    <Section title="9. Contacto">
      <p>Para cualquier consulta legal: <strong>legal@angelai.app</strong><br/>AngelAI S.L. · Calle de Serrano, 45, 28001 Madrid, España</p>
    </Section>
  </LegalPage>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>{title}</h2>
      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
        {children}
        <style>{`ul{padding-left:20px;}li{margin-bottom:6px;}`}</style>
      </div>
    </div>
  )
}

function LegalPage({ title, lastUpdate, children }: { title: string; lastUpdate: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#07080F', color: 'white', fontFamily: "'Inter',-apple-system,sans-serif" }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <a href="/" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: '40px', display: 'inline-block' }}>← AngelAI</a>
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
