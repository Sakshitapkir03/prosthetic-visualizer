import type { ThreeEvent } from '@react-three/fiber'
import type { SceneAction, SelectedPart } from '../types/scene'

// ── Segment definitions ──────────────────────────────────────────────────────

type GeomType = 'sphere' | 'cylinder' | 'box'

interface SegmentDef {
  id: string
  label: string
  geomType: GeomType
  // args map directly to Three.js geometry constructors:
  // sphere:   [radius, widthSegs, heightSegs]
  // cylinder: [radiusTop, radiusBottom, height, radialSegs, heightSegs]
  // box:      [width, height, depth, widthSegs, heightSegs, depthSegs]
  geomArgs: number[]
  position: [number, number, number]
  rotation?: [number, number, number]
  action: SceneAction | null   // null = non-prosthetic (head, torso…)
}

// Body spans Y=0 (feet) → Y=1.86 (top of head), in Three.js units ≈ metres.
// High segment counts give the holographic mesh-web texture.
const SEGMENTS: SegmentDef[] = [
  // ── Head / spine ──────────────────────────────────────────────────────────
  { id: 'head',  label: 'Head',  geomType: 'sphere',   geomArgs: [0.13, 20, 16],          position: [0, 1.73, 0],          action: null },
  { id: 'neck',  label: 'Neck',  geomType: 'cylinder', geomArgs: [0.05, 0.05, 0.09, 12, 3], position: [0, 1.60, 0],         action: null },
  { id: 'torso', label: 'Torso', geomType: 'box',      geomArgs: [0.42, 0.55, 0.20, 5, 6, 3], position: [0, 1.31, 0],      action: null },
  { id: 'hips',  label: 'Hips',  geomType: 'box',      geomArgs: [0.40, 0.18, 0.20, 5, 3, 3], position: [0, 1.01, 0],      action: null },

  // ── Left arm ──────────────────────────────────────────────────────────────
  {
    id: 'leftUpperArm', label: 'Left Upper Arm',
    geomType: 'cylinder', geomArgs: [0.053, 0.048, 0.29, 14, 5],
    position: [-0.27, 1.30, 0], rotation: [0, 0, 0.22],
    action: { limb: 'arm', side: 'left', level: 'transhumeral' },
  },
  {
    id: 'leftLowerArm', label: 'Left Forearm',
    geomType: 'cylinder', geomArgs: [0.043, 0.037, 0.26, 14, 5],
    position: [-0.32, 1.01, 0], rotation: [0, 0, 0.15],
    action: { limb: 'arm', side: 'left', level: 'transradial' },
  },
  {
    id: 'leftHand', label: 'Left Hand',
    geomType: 'box', geomArgs: [0.08, 0.13, 0.04, 4, 5, 2],
    position: [-0.36, 0.83, 0],
    action: { limb: 'arm', side: 'left', level: 'partial_hand' },
  },

  // ── Right arm ─────────────────────────────────────────────────────────────
  {
    id: 'rightUpperArm', label: 'Right Upper Arm',
    geomType: 'cylinder', geomArgs: [0.053, 0.048, 0.29, 14, 5],
    position: [0.27, 1.30, 0], rotation: [0, 0, -0.22],
    action: { limb: 'arm', side: 'right', level: 'transhumeral' },
  },
  {
    id: 'rightLowerArm', label: 'Right Forearm',
    geomType: 'cylinder', geomArgs: [0.043, 0.037, 0.26, 14, 5],
    position: [0.32, 1.01, 0], rotation: [0, 0, -0.15],
    action: { limb: 'arm', side: 'right', level: 'transradial' },
  },
  {
    id: 'rightHand', label: 'Right Hand',
    geomType: 'box', geomArgs: [0.08, 0.13, 0.04, 4, 5, 2],
    position: [0.36, 0.83, 0],
    action: { limb: 'arm', side: 'right', level: 'partial_hand' },
  },

  // ── Left leg ──────────────────────────────────────────────────────────────
  {
    id: 'leftUpperLeg', label: 'Left Thigh',
    geomType: 'cylinder', geomArgs: [0.082, 0.072, 0.38, 16, 5],
    position: [-0.12, 0.73, 0],
    action: { limb: 'leg', side: 'left', level: 'transfemoral' },
  },
  {
    id: 'leftLowerLeg', label: 'Left Shin',
    geomType: 'cylinder', geomArgs: [0.058, 0.042, 0.35, 14, 5],
    position: [-0.12, 0.37, 0],
    action: { limb: 'leg', side: 'left', level: 'transtibial' },
  },
  {
    id: 'leftFoot', label: 'Left Foot',
    geomType: 'box', geomArgs: [0.10, 0.07, 0.22, 4, 3, 5],
    position: [-0.12, 0.035, 0.06],
    action: { limb: 'leg', side: 'left', level: 'partial_foot' },
  },

  // ── Right leg ─────────────────────────────────────────────────────────────
  {
    id: 'rightUpperLeg', label: 'Right Thigh',
    geomType: 'cylinder', geomArgs: [0.082, 0.072, 0.38, 16, 5],
    position: [0.12, 0.73, 0],
    action: { limb: 'leg', side: 'right', level: 'transfemoral' },
  },
  {
    id: 'rightLowerLeg', label: 'Right Shin',
    geomType: 'cylinder', geomArgs: [0.058, 0.042, 0.35, 14, 5],
    position: [0.12, 0.37, 0],
    action: { limb: 'leg', side: 'right', level: 'transtibial' },
  },
  {
    id: 'rightFoot', label: 'Right Foot',
    geomType: 'box', geomArgs: [0.10, 0.07, 0.22, 4, 3, 5],
    position: [0.12, 0.035, 0.06],
    action: { limb: 'leg', side: 'right', level: 'partial_foot' },
  },
]

// ── Geometry helper ───────────────────────────────────────────────────────────
// R3F geometry elements must be direct children of <mesh>, so we render them
// via a component rather than a variable.

function Geom({ type, args }: { type: GeomType; args: number[] }) {
  if (type === 'sphere')
    return <sphereGeometry args={args as [number, number, number]} />
  if (type === 'cylinder')
    return <cylinderGeometry args={args as [number, number, number, number, number]} />
  return <boxGeometry args={args as [number, number, number, number, number, number]} />
}

// ── Single body segment ───────────────────────────────────────────────────────

interface SegmentProps {
  seg: SegmentDef
  isSelected: boolean
  isHovered: boolean
  onSelect: (part: SelectedPart) => void
  onHover: (id: string | null) => void
}

function BodySegment({ seg, isSelected, isHovered, onSelect, onHover }: SegmentProps) {
  const canInteract = seg.action !== null

  // Colour transitions: teal → bright teal on hover → gold on select
  const color = isSelected ? '#ffd666' : isHovered ? '#60ffee' : '#00e5cc'
  const fillOpacity = isSelected ? 0.14 : isHovered ? 0.09 : 0.03

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (!canInteract) return
    e.stopPropagation()
    onSelect({ partId: seg.id, label: seg.label, action: seg.action })
  }

  function handleOver(e: ThreeEvent<PointerEvent>) {
    if (!canInteract) return
    e.stopPropagation()
    onHover(seg.id)
    document.body.style.cursor = 'pointer'
  }

  function handleOut() {
    if (!canInteract) return
    onHover(null)
    document.body.style.cursor = ''
  }

  return (
    <group position={seg.position} rotation={seg.rotation ?? [0, 0, 0]}>
      {/* Transparent fill — the actual click target */}
      <mesh onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
        <Geom type={seg.geomType} args={seg.geomArgs} />
        <meshBasicMaterial color={color} transparent opacity={fillOpacity} />
      </mesh>

      {/* Wireframe — purely visual, no pointer events */}
      <mesh>
        <Geom type={seg.geomType} args={seg.geomArgs} />
        <meshBasicMaterial wireframe color={color} />
      </mesh>
    </group>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

interface HumanBodyProps {
  onPartSelect: (part: SelectedPart | null) => void
  onPartHover: (id: string | null) => void
  selectedPart: string | null
  hoveredPart: string | null
}

export function HumanBody({ onPartSelect, onPartHover, selectedPart, hoveredPart }: HumanBodyProps) {
  return (
    // Slight Y offset so the body reads as floating — feet near bottom of view
    <group position={[0, -0.05, 0]}>
      {SEGMENTS.map(seg => (
        <BodySegment
          key={seg.id}
          seg={seg}
          isSelected={selectedPart === seg.id}
          isHovered={hoveredPart === seg.id}
          onSelect={onPartSelect}
          onHover={onPartHover}
        />
      ))}
    </group>
  )
}
