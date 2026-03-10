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
        background: '#07080F',
        borderRadius: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="132" height="150" viewBox="0 0 36 42" fill="none">
        <defs>
          <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B44FFF" />
            <stop offset="100%" stopColor="#00D9F5" />
          </linearGradient>
        </defs>
        <polygon
          points="18,2 34,11 34,31 18,40 2,31 2,11"
          fill="rgba(180,79,255,0.15)"
          stroke="url(#lg)"
          strokeWidth="1.5"
        />
        <line x1="11" y1="30" x2="15" y2="14" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="25" y1="30" x2="21" y2="14" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12.5" y1="23" x2="23.5" y2="23" stroke="url(#lg)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>,
    { ...size }
  )
}
