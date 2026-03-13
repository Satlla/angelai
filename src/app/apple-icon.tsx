import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: 'linear-gradient(135deg, #0d0520 0%, #07080F 100%)',
        borderRadius: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div style={{
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,79,255,0.2) 0%, transparent 70%)',
        display: 'flex',
      }} />
      <svg width="122" height="122" viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B44FFF" />
            <stop offset="100%" stopColor="#00D9F5" />
          </linearGradient>
          <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B44FFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00D9F5" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="url(#g2)" stroke="url(#g1)" strokeWidth="3" />
        <line x1="32" y1="74" x2="42" y2="30" stroke="url(#g1)" strokeWidth="7" strokeLinecap="round" />
        <line x1="68" y1="74" x2="58" y2="30" stroke="url(#g1)" strokeWidth="7" strokeLinecap="round" />
        <line x1="36" y1="56" x2="64" y2="56" stroke="url(#g1)" strokeWidth="5.5" strokeLinecap="round" />
      </svg>
    </div>,
    { ...size }
  )
}
