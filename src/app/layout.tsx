import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AngelAI — Tu transformación, guiada por inteligencia',
  description: 'Planes de nutrición personalizados con IA. Análisis corporal, dieta adaptada y seguimiento cada 15 días.',
  keywords: 'dieta IA, nutrición inteligente, plan nutricional, definición muscular',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
