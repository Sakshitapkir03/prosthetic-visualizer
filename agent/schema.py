from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, model_validator

# ---------------------------------------------------------------------------
# Allowed value types
# ---------------------------------------------------------------------------

Limb = Literal["arm", "leg"]
Side = Literal["left", "right"]
Level = Literal[
    "transradial",   # below-elbow arm
    "transhumeral",  # above-elbow arm
    "partial_hand",  # partial hand
    "transtibial",   # below-knee leg
    "transfemoral",  # above-knee leg
    "partial_foot",  # partial foot
]
Device = Literal[
    "blade",              # carbon-fibre running/sports foot
    "microprocessor_knee",# powered above-knee prosthesis
    "myoelectric",        # electrically-actuated arm prosthesis
    "body_powered",       # cable-harness arm prosthesis
    "dynamic_foot",       # energy-return ESAR foot
    "passive",            # non-articulated cosmetic prosthesis
]

# ---------------------------------------------------------------------------
# Cross-field compatibility tables
# ---------------------------------------------------------------------------

_LIMB_LEVELS: dict[str, set[str]] = {
    "arm": {"transradial", "transhumeral", "partial_hand"},
    "leg": {"transtibial", "transfemoral", "partial_foot"},
}

_LEVEL_DEVICES: dict[str, set[str]] = {
    "transradial":    {"myoelectric", "body_powered", "passive"},
    "transhumeral":   {"myoelectric", "body_powered", "passive"},
    "partial_hand":   {"myoelectric", "body_powered", "passive"},
    "transtibial":    {"blade", "dynamic_foot", "passive"},
    "transfemoral":   {"microprocessor_knee", "dynamic_foot", "passive"},
    "partial_foot":   {"blade", "dynamic_foot", "passive"},
}

# ---------------------------------------------------------------------------
# Scene action — single source of truth for the JSON contract
# ---------------------------------------------------------------------------

class SceneAction(BaseModel):
    limb: Limb
    side: Side
    level: Level
    device: Device
    notes: str | None = None

    @model_validator(mode="after")
    def check_compatibility(self) -> SceneAction:
        if self.level not in _LIMB_LEVELS[self.limb]:
            raise ValueError(
                f"level '{self.level}' is not compatible with limb '{self.limb}'"
            )
        if self.device not in _LEVEL_DEVICES[self.level]:
            raise ValueError(
                f"device '{self.device}' is not compatible with level '{self.level}'"
            )
        return self


def export_schema() -> dict:
    """Return the JSON Schema dict for SceneAction (used by the frontend)."""
    return SceneAction.model_json_schema()
