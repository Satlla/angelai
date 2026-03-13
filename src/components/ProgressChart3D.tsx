'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Line, Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

const RANK_COLOR: Record<string, string> = {
  BRONCE: '#CD7F32', PLATA: '#C0C0C0', ORO: '#FFD700',
  PLATINO: '#E5E4E2', DIAMANTE: '#00D9F5', LEYENDA: '#B44FFF',
}

type DataPoint = { date: string; score: number; weight: number; rank: string }

// ── Floating node at a 3D position ──────────────────────────────────────────
function ScoreNode({ position, color, score, date, isLatest }: {
  position: [number, number, number]
  color: string
  score: number
  date: string
  isLatest: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.06
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(t * 2 + position[0]) * 0.15
      glowRef.current.scale.setScalar(s)
      ;(glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.08 + Math.sin(t * 2) * 0.04
    }
  })

  return (
    <group position={position}>
      {/* Glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[isLatest ? 0.13 : 0.09, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isLatest ? 1.2 : 0.7}
          roughness={0.1}
          metalness={0.6}
        />
      </mesh>
      {/* Vertical beam down to grid */}
      <mesh position={[0, -position[1] / 2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, position[1], 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
      {/* Label */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, 0.28, 0]}
          fontSize={0.14}
          color={color}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {score}
        </Text>
        <Text
          position={[0, 0.13, 0]}
          fontSize={0.08}
          color="rgba(255,255,255,0.4)"
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {date}
        </Text>
      </Billboard>
    </group>
  )
}

// ── Rising particles for single-point state ──────────────────────────────────
function RisingParticles({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null)
  const count = 40

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2
      pos[i * 3 + 1] = Math.random() * 2
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2
      spd[i] = 0.3 + Math.random() * 0.5
    }
    return [pos, spd]
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i] * delta
      if (pos[i * 3 + 1] > 2.5) pos[i * 3 + 1] = 0
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.03} transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

// ── Grid floor ───────────────────────────────────────────────────────────────
function GridFloor({ width }: { width: number }) {
  const lines = useMemo(() => {
    const result: [number, number, number][][] = []
    const steps = 6
    for (let i = 0; i <= steps; i++) {
      const x = -width / 2 + (width / steps) * i
      result.push([[x, 0, -0.5], [x, 0, 0.5]])
    }
    result.push([[-width / 2, 0, -0.5], [width / 2, 0, -0.5]])
    result.push([[-width / 2, 0, 0.5], [width / 2, 0, 0.5]])
    return result
  }, [width])

  return (
    <group position={[0, -0.1, 0]}>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color="rgba(255,255,255,0.08)" lineWidth={0.5} />
      ))}
    </group>
  )
}

// ── Orbiting camera ──────────────────────────────────────────────────────────
function OrbitCamera({ points }: { points: DataPoint[] }) {
  const isSingle = points.length <= 1

  useFrame((state) => {
    const t = state.clock.elapsedTime * (isSingle ? 0.3 : 0.15)
    const radius = isSingle ? 2.5 : 4
    state.camera.position.x = Math.sin(t) * radius
    state.camera.position.z = Math.cos(t) * radius
    state.camera.position.y = 1.8
    state.camera.lookAt(0, 0.6, 0)
  })

  return null
}

// ── Main scene ───────────────────────────────────────────────────────────────
function Scene({ points }: { points: DataPoint[] }) {
  const isSingle = points.length <= 1

  const nodes = useMemo(() => {
    if (!points.length) return []
    const minScore = Math.min(...points.map(p => p.score))
    const maxScore = Math.max(...points.map(p => p.score))
    const scoreRange = maxScore - minScore || 1
    const totalWidth = Math.min(points.length - 1, 1) * 2.5 * (points.length - 1)
    const spread = points.length === 1 ? 0 : Math.min(5, (points.length - 1) * 1.5)

    return points.map((p, i) => {
      const x = points.length === 1 ? 0 : -spread / 2 + (spread / (points.length - 1)) * i
      const y = 0.3 + ((p.score - minScore) / scoreRange) * 1.4
      const color = RANK_COLOR[p.rank?.toUpperCase()] ?? '#B44FFF'
      return { x, y, color, ...p, totalWidth }
    })
  }, [points])

  const linePoints = useMemo(() => {
    if (nodes.length < 2) return []
    return nodes.map(n => new THREE.Vector3(n.x, n.y, 0))
  }, [nodes])

  const tubePoints = useMemo(() => {
    if (linePoints.length < 2) return null
    const curve = new THREE.CatmullRomCurve3(linePoints)
    return curve.getPoints(80)
  }, [linePoints])

  return (
    <>
      <OrbitCamera points={points} />
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 4, 3]} intensity={2} color="#B44FFF" />
      <pointLight position={[-3, 2, -2]} intensity={1} color="#00D9F5" />
      <Stars radius={10} depth={4} count={400} factor={1} fade speed={0.4} />

      {/* Grid */}
      <GridFloor width={nodes.length <= 1 ? 3 : Math.max(4, nodes[nodes.length - 1]?.x - nodes[0]?.x + 2)} />

      {/* Tube connecting points */}
      {tubePoints && tubePoints.length >= 2 && (
        <Line
          points={tubePoints.map(p => [p.x, p.y, p.z] as [number, number, number])}
          color="#B44FFF"
          lineWidth={2}
          transparent
          opacity={0.7}
        />
      )}

      {/* Nodes */}
      {nodes.map((n, i) => (
        <ScoreNode
          key={i}
          position={[n.x, n.y, 0]}
          color={n.color}
          score={n.score}
          date={n.date}
          isLatest={i === nodes.length - 1}
        />
      ))}

      {/* Rising particles for single point */}
      {isSingle && nodes[0] && (
        <RisingParticles color={nodes[0].color} />
      )}
    </>
  )
}

// ── Export ───────────────────────────────────────────────────────────────────
export default function ProgressChart3D({ points }: { points: DataPoint[] }) {
  const isSingle = points.length <= 1
  const primaryColor = points.length
    ? (RANK_COLOR[points[points.length - 1].rank?.toUpperCase()] ?? '#B44FFF')
    : '#B44FFF'

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#070810' }}>
      <Canvas
        camera={{ position: [2.5, 1.8, 2.5], fov: 50 }}
        style={{ height: isSingle ? '260px' : '300px', display: 'block' }}
        gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
        frameloop="always"
        dpr={[1, 1.5]}
      >
        <Scene points={points} />
      </Canvas>

      {/* Overlay label */}
      {isSingle && (
        <div style={{
          position: 'absolute', bottom: '16px', left: 0, right: 0,
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <p style={{
            fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px',
            color: primaryColor,
            textShadow: `0 0 12px ${primaryColor}`,
          }}>
            Aquí empieza tu historia
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
            Cada check-in añade un punto a tu camino
          </p>
        </div>
      )}
    </div>
  )
}
