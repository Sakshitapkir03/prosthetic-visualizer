import { Vector2 } from 'three'
import { type ThreeEvent } from '@react-three/fiber'
import type { SceneAction, SelectedPart } from '../types/scene'

// ── Palette ───────────────────────────────────────────────────────────────────
const C_IDLE   = '#00e5cc'
const C_HOVER  = '#60ffee'
const C_SELECT = '#ffd666'
const C_BODY   = '#007a6e'

// ── Torso lathe profile ───────────────────────────────────────────────────────
const TORSO_PTS = [
  new Vector2(0.174, 0.000),
  new Vector2(0.182, 0.038),
  new Vector2(0.177, 0.078),
  new Vector2(0.163, 0.124),
  new Vector2(0.149, 0.172),
  new Vector2(0.146, 0.205),
  new Vector2(0.155, 0.248),
  new Vector2(0.169, 0.295),
  new Vector2(0.180, 0.344),
  new Vector2(0.189, 0.393),
  new Vector2(0.195, 0.440),
  new Vector2(0.200, 0.490),
  new Vector2(0.212, 0.534),
  new Vector2(0.230, 0.568),
  new Vector2(0.220, 0.597),
  new Vector2(0.188, 0.616),
  new Vector2(0.145, 0.632),
  new Vector2(0.096, 0.647),
  new Vector2(0.058, 0.660),
  new Vector2(0.050, 0.667),
]

// ── Limb profiles — Y from –half_len to +half_len, centred at 0 ──────────────
// Upper arm: bicep bulge near the top (shoulder end = +Y)
const P_UPPER_ARM = [
  new Vector2(0.034, -0.110),
  new Vector2(0.037, -0.065),
  new Vector2(0.043, -0.015),
  new Vector2(0.047, 0.022),  // bicep peak
  new Vector2(0.044, 0.065),
  new Vector2(0.041, 0.110),
]

// Forearm: muscle belly upper-third, tapers to narrow wrist
const P_FOREARM = [
  new Vector2(0.019, -0.120),  // wrist
  new Vector2(0.024, -0.082),
  new Vector2(0.032, -0.038),  // muscle belly
  new Vector2(0.034, 0.005),
  new Vector2(0.032, 0.058),
  new Vector2(0.033, 0.120),   // elbow
]

// Thigh: quad peak upper-quarter, narrows to knee
const P_THIGH = [
  new Vector2(0.045, -0.135),  // knee
  new Vector2(0.052, -0.090),
  new Vector2(0.060, -0.028),
  new Vector2(0.065, 0.020),   // quad peak
  new Vector2(0.066, 0.058),
  new Vector2(0.062, 0.100),
  new Vector2(0.058, 0.135),   // hip
]

// Shin: diamond calf bulge in the upper-third, very narrow ankle
const P_SHIN = [
  new Vector2(0.025, -0.152),  // ankle
  new Vector2(0.029, -0.112),
  new Vector2(0.038, -0.068),
  new Vector2(0.048, -0.018),  // calf peak
  new Vector2(0.050, 0.015),
  new Vector2(0.044, 0.062),
  new Vector2(0.039, 0.108),
  new Vector2(0.041, 0.152),   // knee
]

// ── Material ──────────────────────────────────────────────────────────────────
function WF({ color }: { color: string }) {
  return <meshBasicMaterial wireframe color={color} />
}

// ── Organic limb from profile ─────────────────────────────────────────────────
function LatheLimb({ pts, color }: { pts: Vector2[]; color: string }) {
  return (
    <mesh>
      <latheGeometry args={[pts, 28]} />
      <WF color={color} />
    </mesh>
  )
}

// ── Anatomical hand ───────────────────────────────────────────────────────────
// Palm: two-box trapezoid (wider at knuckles, narrower at wrist).
// Fingers: 4 × 3 phalanges (proximal, middle, distal) with MCP / PIP / DIP
//          knuckle spheres, natural finger spread, and slight relaxed curl.
// Thumb:  2 phalanges (proximal + distal) with IP joint, angled radially.
// mx = +1 for left hand, –1 for right (mirrors all X offsets).
function HandMesh({ isRight, color }: { isRight: boolean; color: string }) {
  const mx = isRight ? -1 : 1
  const knuckleLine = -0.010  // Y of MCP joint row (palm bottom)

  // index, middle, ring, pinky — x for left hand; multiply by mx for right
  const FINGERS = [
    { x: 0.027, sp: mx*0.05,  l1:0.028, l2:0.020, l3:0.015, rm:0.0073, r1:0.0067, r2:0.0058, r3:0.0047 }, // index
    { x: 0.009, sp: mx*0.015, l1:0.033, l2:0.022, l3:0.017, rm:0.0080, r1:0.0074, r2:0.0063, r3:0.0051 }, // middle (longest)
    { x:-0.010, sp:-mx*0.015, l1:0.028, l2:0.020, l3:0.015, rm:0.0073, r1:0.0067, r2:0.0058, r3:0.0047 }, // ring
    { x:-0.027, sp:-mx*0.06,  l1:0.021, l2:0.014, l3:0.011, rm:0.0060, r1:0.0054, r2:0.0047, r3:0.0038 }, // pinky
  ] as const

  return (
    <group>
      {/* Palm — trapezoidal: narrow wrist strip on top, wide knuckle strip below */}
      <mesh position={[0, 0.040, 0]}>
        <boxGeometry args={[0.066, 0.038, 0.018, 4, 3, 2]} />
        <WF color={color} />
      </mesh>
      <mesh position={[0, 0.010, 0]}>
        <boxGeometry args={[0.082, 0.038, 0.020, 5, 3, 2]} />
        <WF color={color} />
      </mesh>

      {/* ── Four fingers ── */}
      {FINGERS.map((f, fi) => (
        <group key={fi} position={[f.x * mx, knuckleLine, 0]} rotation={[0, 0, f.sp]}>

          {/* MCP knuckle */}
          <mesh><sphereGeometry args={[f.rm, 10, 7]} /><WF color={color} /></mesh>

          {/* Proximal phalanx */}
          <mesh position={[0, -(f.rm + f.l1 * 0.5), 0]}>
            <cylinderGeometry args={[f.r1, f.r1 * 0.92, f.l1, 8, 2]} />
            <WF color={color} />
          </mesh>

          {/* PIP joint — very subtle natural curl */}
          <group position={[0, -(f.rm + f.l1), 0]} rotation={[-0.05, 0, 0]}>
            <mesh><sphereGeometry args={[f.r1 * 0.90, 10, 7]} /><WF color={color} /></mesh>

            {/* Middle phalanx */}
            <mesh position={[0, -(f.r1 * 0.90 + f.l2 * 0.5), 0]}>
              <cylinderGeometry args={[f.r2, f.r2 * 0.90, f.l2, 8, 2]} />
              <WF color={color} />
            </mesh>

            {/* DIP joint — minimal additional curl */}
            <group position={[0, -(f.r1 * 0.90 + f.l2), 0]} rotation={[-0.04, 0, 0]}>
              <mesh><sphereGeometry args={[f.r2 * 0.86, 10, 7]} /><WF color={color} /></mesh>

              {/* Distal phalanx */}
              <mesh position={[0, -(f.r2 * 0.86 + f.l3 * 0.5), 0]}>
                <cylinderGeometry args={[f.r3, f.r3 * 0.80, f.l3, 8, 2]} />
                <WF color={color} />
              </mesh>

              {/* Rounded fingertip */}
              <mesh position={[0, -(f.r2 * 0.86 + f.l3), 0]}>
                <sphereGeometry args={[f.r3 * 0.82, 8, 6]} />
                <WF color={color} />
              </mesh>
            </group>
          </group>
        </group>
      ))}

      {/* ── Thumb — radial border, angled ~25° from the palm edge ── */}
      <group position={[mx * 0.042, -0.004, 0]} rotation={[0, 0, mx * 0.42]}>
        {/* CMC / MCP joint */}
        <mesh><sphereGeometry args={[0.0090, 10, 7]} /><WF color={color} /></mesh>

        {/* Proximal phalanx */}
        <mesh position={[0, -0.026, 0]}>
          <cylinderGeometry args={[0.0082, 0.0072, 0.025, 8, 2]} />
          <WF color={color} />
        </mesh>

        {/* IP joint — very slight curl */}
        <group position={[0, -0.039, 0]} rotation={[-0.08, 0, 0]}>
          <mesh><sphereGeometry args={[0.0070, 10, 7]} /><WF color={color} /></mesh>

          {/* Distal phalanx */}
          <mesh position={[0, -0.020, 0]}>
            <cylinderGeometry args={[0.0065, 0.0054, 0.020, 8, 2]} />
            <WF color={color} />
          </mesh>

          {/* Thumb tip */}
          <mesh position={[0, -0.030, 0]}>
            <sphereGeometry args={[0.0058, 8, 6]} />
            <WF color={color} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

// ── Two-part foot: raised heel + flatter toe section ─────────────────────────
function FootMesh({ color }: { color: string }) {
  return (
    <group>
      {/* Heel / arch */}
      <mesh position={[0, 0.006, -0.046]}>
        <boxGeometry args={[0.086, 0.054, 0.098, 4, 3, 4]} />
        <WF color={color} />
      </mesh>
      {/* Ball / toes — flatter */}
      <mesh position={[0, -0.010, 0.070]}>
        <boxGeometry args={[0.080, 0.032, 0.116, 4, 2, 5]} />
        <WF color={color} />
      </mesh>
    </group>
  )
}

// ── Segment type ──────────────────────────────────────────────────────────────
type Visual = 'upper-arm' | 'forearm' | 'hand' | 'thigh' | 'shin' | 'foot'

interface SegDef {
  id: string
  label: string
  action: SceneAction | null
  position: [number, number, number]
  rotation?: [number, number, number]
  visual: Visual
  hitR: number
  hitLen: number
}

const SEGS: SegDef[] = [
  // ── Left arm ──────────────────────────────────────────────────────────────
  { id: 'leftUpperArm',  label: 'Left Upper Arm',
    action: { limb: 'arm', side: 'left',  level: 'transhumeral' },
    position: [-0.272, 1.322, 0], rotation: [0, 0,  0.22],
    visual: 'upper-arm', hitR: 0.068, hitLen: 0.28 },

  { id: 'leftLowerArm',  label: 'Left Forearm',
    action: { limb: 'arm', side: 'left',  level: 'transradial' },
    position: [-0.325, 0.998, 0], rotation: [0, 0,  0.12],
    visual: 'forearm', hitR: 0.056, hitLen: 0.29 },

  { id: 'leftHand',      label: 'Left Hand',
    action: { limb: 'arm', side: 'left',  level: 'partial_hand' },
    position: [-0.358, 0.808, 0], rotation: [0, 0.28, 0],
    visual: 'hand', hitR: 0.058, hitLen: 0.18 },

  // ── Right arm ─────────────────────────────────────────────────────────────
  { id: 'rightUpperArm', label: 'Right Upper Arm',
    action: { limb: 'arm', side: 'right', level: 'transhumeral' },
    position: [ 0.272, 1.322, 0], rotation: [0, 0, -0.22],
    visual: 'upper-arm', hitR: 0.068, hitLen: 0.28 },

  { id: 'rightLowerArm', label: 'Right Forearm',
    action: { limb: 'arm', side: 'right', level: 'transradial' },
    position: [ 0.325, 0.998, 0], rotation: [0, 0, -0.12],
    visual: 'forearm', hitR: 0.056, hitLen: 0.29 },

  { id: 'rightHand',     label: 'Right Hand',
    action: { limb: 'arm', side: 'right', level: 'partial_hand' },
    position: [ 0.358, 0.808, 0], rotation: [0, -0.28, 0],
    visual: 'hand', hitR: 0.058, hitLen: 0.18 },

  // ── Left leg ──────────────────────────────────────────────────────────────
  { id: 'leftUpperLeg',  label: 'Left Thigh',
    action: { limb: 'leg', side: 'left',  level: 'transfemoral' },
    position: [-0.110, 0.692, 0],
    visual: 'thigh', hitR: 0.078, hitLen: 0.37 },

  { id: 'leftLowerLeg',  label: 'Left Shin',
    action: { limb: 'leg', side: 'left',  level: 'transtibial' },
    position: [-0.104, 0.292, 0],
    visual: 'shin', hitR: 0.060, hitLen: 0.37 },

  { id: 'leftFoot',      label: 'Left Foot',
    action: { limb: 'leg', side: 'left',  level: 'partial_foot' },
    position: [-0.096, 0.038, 0.068], rotation: [0.28, 0, 0],
    visual: 'foot', hitR: 0.058, hitLen: 0.20 },

  // ── Right leg ─────────────────────────────────────────────────────────────
  { id: 'rightUpperLeg', label: 'Right Thigh',
    action: { limb: 'leg', side: 'right', level: 'transfemoral' },
    position: [ 0.110, 0.692, 0],
    visual: 'thigh', hitR: 0.078, hitLen: 0.37 },

  { id: 'rightLowerLeg', label: 'Right Shin',
    action: { limb: 'leg', side: 'right', level: 'transtibial' },
    position: [ 0.104, 0.292, 0],
    visual: 'shin', hitR: 0.060, hitLen: 0.37 },

  { id: 'rightFoot',     label: 'Right Foot',
    action: { limb: 'leg', side: 'right', level: 'partial_foot' },
    position: [ 0.096, 0.038, 0.068], rotation: [0.28, 0, 0],
    visual: 'foot', hitR: 0.058, hitLen: 0.20 },
]

// ── Segment visual dispatcher ─────────────────────────────────────────────────
function SegVisual({ id, visual, color }: { id: string; visual: Visual; color: string }) {
  const isRight = id.startsWith('right')
  switch (visual) {
    case 'upper-arm': return <LatheLimb pts={P_UPPER_ARM} color={color} />
    case 'forearm':   return <LatheLimb pts={P_FOREARM}   color={color} />
    case 'thigh':     return <LatheLimb pts={P_THIGH}     color={color} />
    case 'shin':      return <LatheLimb pts={P_SHIN}      color={color} />
    case 'hand':      return <HandMesh  isRight={isRight} color={color} />
    case 'foot':      return <FootMesh  color={color} />
  }
}

// ── Interactive segment ───────────────────────────────────────────────────────
interface SegProps {
  seg: SegDef
  isSelected: boolean
  isHovered: boolean
  onSelect: (p: SelectedPart) => void
  onHover: (id: string | null) => void
}

function Segment({ seg, isSelected, isHovered, onSelect, onHover }: SegProps) {
  const color = isSelected ? C_SELECT : isHovered ? C_HOVER : C_IDLE
  const can = seg.action !== null

  function onClick(e: ThreeEvent<MouseEvent>) {
    if (!can) return; e.stopPropagation()
    onSelect({ partId: seg.id, label: seg.label, action: seg.action })
  }
  function onOver(e: ThreeEvent<PointerEvent>) {
    if (!can) return; e.stopPropagation()
    onHover(seg.id); document.body.style.cursor = 'pointer'
  }
  function onOut() {
    if (!can) return
    onHover(null); document.body.style.cursor = ''
  }

  return (
    <group position={seg.position} rotation={seg.rotation ?? [0, 0, 0]}>
      {/* Invisible hit zone — depthWrite off so it never occludes the visual */}
      <mesh onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
        <capsuleGeometry args={[seg.hitR, seg.hitLen, 4, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <SegVisual id={seg.id} visual={seg.visual} color={color} />
    </group>
  )
}

// ── Static anatomy ────────────────────────────────────────────────────────────
function Head() {
  return (
    <group position={[0, 1.745, 0]}>
      <mesh scale={[1.0, 1.22, 0.94]}>
        <sphereGeometry args={[0.108, 32, 26]} />
        <WF color={C_BODY} />
      </mesh>
      {/* Jaw protrusion */}
      <mesh position={[0, -0.094, 0.012]} scale={[0.82, 0.68, 0.74]}>
        <sphereGeometry args={[0.076, 24, 18]} />
        <WF color={C_BODY} />
      </mesh>
    </group>
  )
}

function Neck() {
  return (
    <mesh position={[0, 1.627, 0]}>
      <cylinderGeometry args={[0.043, 0.057, 0.098, 18, 5]} />
      <WF color={C_BODY} />
    </mesh>
  )
}

function Torso() {
  return (
    <mesh position={[0, 0.882, 0]}>
      <latheGeometry args={[TORSO_PTS, 36]} />
      <WF color={C_BODY} />
    </mesh>
  )
}

// Joint spheres bridging all segment gaps
function Joints() {
  return (
    <>
      <mesh position={[-0.258, 1.452, 0]}><sphereGeometry args={[0.058, 22, 16]} /><WF color={C_BODY} /></mesh>
      <mesh position={[ 0.258, 1.452, 0]}><sphereGeometry args={[0.058, 22, 16]} /><WF color={C_BODY} /></mesh>

      <mesh position={[-0.294, 1.166, 0]}><sphereGeometry args={[0.037, 18, 14]} /><WF color={C_BODY} /></mesh>
      <mesh position={[ 0.294, 1.166, 0]}><sphereGeometry args={[0.037, 18, 14]} /><WF color={C_BODY} /></mesh>

      <mesh position={[-0.334, 0.876, 0]}><sphereGeometry args={[0.030, 16, 12]} /><WF color={C_BODY} /></mesh>
      <mesh position={[ 0.334, 0.876, 0]}><sphereGeometry args={[0.030, 16, 12]} /><WF color={C_BODY} /></mesh>

      <mesh position={[-0.112, 0.856, 0]}><sphereGeometry args={[0.054, 20, 14]} /><WF color={C_BODY} /></mesh>
      <mesh position={[ 0.112, 0.856, 0]}><sphereGeometry args={[0.054, 20, 14]} /><WF color={C_BODY} /></mesh>

      <mesh position={[-0.108, 0.496, 0]}><sphereGeometry args={[0.050, 20, 14]} /><WF color={C_BODY} /></mesh>
      <mesh position={[ 0.108, 0.496, 0]}><sphereGeometry args={[0.050, 20, 14]} /><WF color={C_BODY} /></mesh>

      <mesh position={[-0.098, 0.092, 0]}><sphereGeometry args={[0.034, 16, 12]} /><WF color={C_BODY} /></mesh>
      <mesh position={[ 0.098, 0.092, 0]}><sphereGeometry args={[0.034, 16, 12]} /><WF color={C_BODY} /></mesh>
    </>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
interface HumanBodyProps {
  onPartSelect: (part: SelectedPart | null) => void
  onPartHover: (id: string | null) => void
  selectedPart: string | null
  hoveredPart: string | null
}

export function HumanBody({ onPartSelect, onPartHover, selectedPart, hoveredPart }: HumanBodyProps) {
  return (
    <group position={[0, -0.05, 0]}>
      <Head />
      <Neck />
      <Torso />
      <Joints />
      {SEGS.map(seg => (
        <Segment
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
