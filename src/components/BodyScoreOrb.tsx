'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere, Stars } from '@react-three/drei'
import * as THREE from 'three'

const RANK_COLORS: Record<string, { primary: string; secondary: string; emissive: string }> = {
  BRONCE:   { primary: '#CD7F32', secondary: '#8B4513', emissive: '#5a2e00' },
  PLATA:    { primary: '#C0C0C0', secondary: '#888888', emissive: '#303030' },
  ORO:      { primary: '#FFD700', secondary: '#FFA500', emissive: '#664400' },
  PLATINO:  { primary: '#E5E4E2', secondary: '#B0C4DE', emissive: '#203050' },
  DIAMANTE: { primary: '#00D9F5', secondary: '#0099CC', emissive: '#003344' },
  LEYENDA:  { primary: '#B44FFF', secondary: '#7B2FBE', emissive: '#3a006e' },
}

function OrbMesh({ rank, score }: { rank: string; score: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const colors = RANK_COLORS[rank] ?? RANK_COLORS['BRONCE']
  const intensity = 0.4 + (score / 100) * 0.6

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    meshRef.current.rotation.y = t * 0.25
    meshRef.current.rotation.z = Math.sin(t * 0.4) * 0.08
    meshRef.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.025)
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.2
    }
  })

  const ringGeometry = useMemo(() => new THREE.TorusGeometry(1.35, 0.025, 8, 80), [])

  return (
    <group>
      {/* Main sphere */}
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={colors.primary}
          emissive={colors.emissive}
          emissiveIntensity={intensity}
          roughness={0.15}
          metalness={0.8}
          distort={0.25}
          speed={1.5}
          transparent
          opacity={0.95}
        />
      </Sphere>

      {/* Orbit ring */}
      <mesh ref={ringRef} geometry={ringGeometry}>
        <meshBasicMaterial color={colors.secondary} transparent opacity={0.5} />
      </mesh>

      {/* Inner core glow */}
      <Sphere args={[0.6, 32, 32]}>
        <meshBasicMaterial color={colors.primary} transparent opacity={0.15} />
      </Sphere>
    </group>
  )
}

function Particles({ rank }: { rank: string }) {
  const colors = RANK_COLORS[rank] ?? RANK_COLORS['BRONCE']
  const count = 60
  const ref = useRef<THREE.Points>(null)

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 1.6 + Math.random() * 0.8
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return [pos]
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.15
    ref.current.rotation.x = state.clock.elapsedTime * 0.07
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={colors.primary} size={0.04} transparent opacity={0.7} sizeAttenuation />
    </points>
  )
}

export default function BodyScoreOrb({ score, rank }: { score: number; rank: string }) {
  const normalizedRank = rank?.toUpperCase() ?? 'BRONCE'
  const colors = RANK_COLORS[normalizedRank] ?? RANK_COLORS['BRONCE']

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', maxWidth: '280px', margin: '0 auto' }}>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        frameloop="always"
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[3, 3, 3]} intensity={1.5} color={colors.primary} />
        <pointLight position={[-3, -2, -2]} intensity={0.8} color={colors.secondary} />
        <Stars radius={8} depth={3} count={300} factor={1} fade speed={0.5} />
        <OrbMesh rank={normalizedRank} score={score} />
        <Particles rank={normalizedRank} />
      </Canvas>

      {/* Score overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontSize: '52px', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1,
          color: 'white',
          textShadow: `0 0 20px ${colors.primary}, 0 0 40px ${colors.primary}80`,
        }}>
          {score}
        </div>
        <div style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '2.5px',
          textTransform: 'uppercase',
          color: colors.primary,
          textShadow: `0 0 12px ${colors.primary}`,
          marginTop: '4px',
        }}>
          {rank}
        </div>
      </div>
    </div>
  )
}
