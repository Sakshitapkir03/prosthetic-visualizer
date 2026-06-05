import { useState } from 'react'
import { BodyScene } from './components/BodyScene'
import type { SelectedPart } from './types/scene'

export default function App() {
  const [selected, setSelected] = useState<SelectedPart | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="h-screen w-screen overflow-hidden relative" style={{ background: '#050d12' }}>

      {/* ── Header ── */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 pointer-events-none">
        <h1 style={{ color: '#00e5cc', letterSpacing: '0.3em' }}
            className="text-lg font-light uppercase">
          Prosthetic Visualizer
        </h1>
        <p style={{ color: 'rgba(0,229,204,0.35)' }} className="text-xs tracking-widest uppercase">
          Visualization only — not a medical device
        </p>
      </header>

      {/* ── 3D canvas (full screen) ── */}
      <div className="w-full h-full">
        <BodyScene
          onPartSelect={setSelected}
          onPartHover={setHovered}
          selectedPart={selected?.partId ?? null}
          hoveredPart={hovered}
        />
      </div>

      {/* ── Hover hint ── */}
      {!selected && !hovered && (
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-widest pointer-events-none"
           style={{ color: 'rgba(0,229,204,0.3)' }}>
          Click a limb to explore prosthetic options
        </p>
      )}

      {/* ── Info panel — appears on click ── */}
      {selected && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 rounded-2xl px-8 py-5 min-w-[400px]"
             style={{
               background: 'rgba(5,20,25,0.88)',
               border: '1px solid rgba(0,229,204,0.25)',
               backdropFilter: 'blur(12px)',
             }}>

          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-widest mb-0.5"
                 style={{ color: 'rgba(0,229,204,0.5)' }}>Selected region</p>
              <p className="text-lg font-light" style={{ color: '#00e5cc' }}>
                {selected.label}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-xs uppercase tracking-wider px-3 py-1 rounded-lg cursor-pointer"
              style={{ color: 'rgba(0,229,204,0.4)', border: '1px solid rgba(0,229,204,0.15)' }}
            >
              Clear
            </button>
          </div>

          {selected.action ? (
            <>
              <div className="flex gap-3 mb-4">
                <Pill label="Limb"  value={selected.action.limb} />
                <Pill label="Side"  value={selected.action.side} />
                <Pill label="Level" value={selected.action.level} />
              </div>
              <p className="text-xs" style={{ color: 'rgba(0,229,204,0.35)' }}>
                Device selection and fitting must be confirmed with your prosthetist.
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'rgba(0,229,204,0.4)' }}>
              This region does not have prosthetic options.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2"
         style={{ background: 'rgba(0,229,204,0.07)', border: '1px solid rgba(0,229,204,0.18)' }}>
      <p className="text-[10px] uppercase tracking-wider mb-0.5"
         style={{ color: 'rgba(0,229,204,0.45)' }}>{label}</p>
      <p className="text-sm font-mono" style={{ color: '#00e5cc' }}>{value}</p>
    </div>
  )
}
