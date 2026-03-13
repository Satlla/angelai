import type { Metadata } from 'next'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dieta.itineramio.com'

export const metadata: Metadata = {
  title: 'AngelAI — Nobody can stop you.',
  description: 'Planes de nutrición y entrenamiento personalizados con IA. Análisis corporal, macros exactos y seguimiento quincenal.',
  keywords: 'dieta IA, nutrición inteligente, plan nutricional, definición muscular, entrenamiento personalizado',
  applicationName: 'AngelAI',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'AngelAI',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'AngelAI — Nobody can stop you.',
    description: 'Tu plan de nutrición y entrenamiento con IA. Macros exactos, análisis corporal y revisión quincenal.',
    url: APP_URL,
    siteName: 'AngelAI',
    images: [
      {
        url: `${APP_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'AngelAI — Nobody can stop you.',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AngelAI — Nobody can stop you.',
    description: 'Tu plan de nutrición y entrenamiento con IA. Macros exactos, análisis corporal y revisión quincenal.',
    images: [`${APP_URL}/opengraph-image`],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#B44FFF" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>{children}</body>
    </html>
  )
}
