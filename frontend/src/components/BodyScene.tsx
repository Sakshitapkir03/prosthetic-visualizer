import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { HumanBody } from './HumanBody'
import type { SelectedPart } from '../types/scene'

interface Props {
  onPartSelect: (part: SelectedPart | null) => void
  onPartHover: (id: string | null) => void
  selectedPart: string | null
  hoveredPart: string | null
}

export function BodyScene({ onPartSelect, onPartHover, selectedPart, hoveredPart }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 1.0, 3.4], fov: 45 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}        // retina support without forcing 2× on low-end GPUs
    >
      {/* Scene background — very dark navy to match reference */}
      <color attach="background" args={['#050d12']} />

      {/* Minimal ambient so the wireframe reads against black */}
      <ambientLight intensity={0.04} />

      <Suspense fallback={null}>
        <HumanBody
          onPartSelect={onPartSelect}
          onPartHover={onPartHover}
          selectedPart={selectedPart}
          hoveredPart={hoveredPart}
        />
      </Suspense>

      {/* Drag-to-rotate, scroll-to-zoom; pan disabled (clinician tool, not map) */}
      <OrbitControls
        enablePan={false}
        minDistance={1.8}
        maxDistance={7}
        target={[0, 0.93, 0]}  // camera orbits around body centre-of-mass
      />

      {/* Bloom gives the wireframe its holographic glow.
          luminanceThreshold: only pixels brighter than this glow.
          mipmapBlur: smoother, more physically accurate spread. */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.02}
          intensity={2.2}
          radius={0.92}
          levels={8}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  )
}
