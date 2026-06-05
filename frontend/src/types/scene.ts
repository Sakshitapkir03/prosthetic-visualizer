// TypeScript mirror of agent/schema.py — keep in sync

export type Limb = 'arm' | 'leg'
export type Side = 'left' | 'right'
export type Level =
  | 'transradial'
  | 'transhumeral'
  | 'partial_hand'
  | 'transtibial'
  | 'transfemoral'
  | 'partial_foot'

export type Device =
  | 'blade'
  | 'microprocessor_knee'
  | 'myoelectric'
  | 'body_powered'
  | 'dynamic_foot'
  | 'passive'

export interface SceneAction {
  limb: Limb
  side: Side
  level: Level
  device?: Device
  notes?: string | null
}

export interface SelectedPart {
  partId: string
  label: string
  action: SceneAction | null
}
