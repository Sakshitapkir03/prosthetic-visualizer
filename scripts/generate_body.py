"""
Generate a neutral-pose 3D human body mesh using the SMPL neural body model.
Outputs a GLB file consumed by the React Three Fiber frontend.

BEFORE RUNNING:
  1. Register (free) at https://smpl.is.tue.mpg.de/
  2. Download "SMPL for Python" and extract SMPL_NEUTRAL.pkl
  3. Place the file at:  scripts/models/SMPL_NEUTRAL.pkl
  4. Also place smpl_vert_segmentation.json at: scripts/smpl_vert_segmentation.json
     (included in the SMPL download package)

  Then run:
    source .venv/bin/activate
    pip install -r scripts/smpl_requirements.txt
    python scripts/generate_body.py

Output: frontend/public/models/body.glb
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).parent.parent
MODELS_DIR = Path(__file__).parent / "models"
SEG_PATH = Path(__file__).parent / "smpl_vert_segmentation.json"
OUTPUT_PATH = ROOT / "frontend" / "public" / "models" / "body.glb"

# Maps a friendly frontend name → list of SMPL body-part keys in the
# segmentation JSON.  These names become the mesh node names in the GLB
# so the frontend can identify clickable regions.
PART_GROUPS: dict[str, list[str]] = {
    "leftUpperArm":  ["leftArm"],
    "leftLowerArm":  ["leftForeArm"],
    "leftHand":      ["leftHand", "leftHandIndex1"],
    "rightUpperArm": ["rightArm"],
    "rightLowerArm": ["rightForeArm"],
    "rightHand":     ["rightHand", "rightHandIndex1"],
    "leftUpperLeg":  ["leftUpLeg"],
    "leftLowerLeg":  ["leftLeg"],
    "leftFoot":      ["leftFoot", "leftToeBase"],
    "rightUpperLeg": ["rightUpLeg"],
    "rightLowerLeg": ["rightLeg"],
    "rightFoot":     ["rightFoot", "rightToeBase"],
    # Non-prosthetic regions kept as one mesh for visual completeness
    "body_other":    [
        "head", "neck", "spine", "spine1", "spine2",
        "hips", "leftShoulder", "rightShoulder",
    ],
}


def load_smpl(models_dir: Path):
    try:
        import smplx
        import torch
    except ImportError:
        print("ERROR: Run: pip install -r scripts/smpl_requirements.txt")
        sys.exit(1)

    model_file = models_dir / "SMPL_NEUTRAL.pkl"
    if not model_file.exists():
        print(f"ERROR: Model file not found: {model_file}")
        print("Register and download at https://smpl.is.tue.mpg.de/")
        sys.exit(1)

    print("Loading SMPL neural body model…")
    model = smplx.create(str(models_dir), model_type="smpl", gender="neutral")

    print("Running forward pass (neutral pose, mean shape)…")
    with torch.no_grad():
        output = model(
            betas=torch.zeros(1, 10),
            body_pose=torch.zeros(1, 69),
            global_orient=torch.zeros(1, 3),
            transl=torch.zeros(1, 3),
        )

    vertices: np.ndarray = output.vertices.detach().numpy()[0]   # (6890, 3)
    faces: np.ndarray = model.faces.astype(np.int64)             # (13776, 3)
    return vertices, faces


def build_glb(vertices: np.ndarray, faces: np.ndarray, seg: dict[str, list[int]]) -> None:
    try:
        import trimesh
    except ImportError:
        print("ERROR: Run: pip install -r scripts/smpl_requirements.txt")
        sys.exit(1)

    # Translate so feet sit at Y=0 (matches the primitive body in HumanBody.tsx)
    vertices = vertices.copy()
    vertices[:, 1] -= vertices[:, 1].min()

    scene = trimesh.Scene()
    claimed: set[int] = set()

    for group_name, smpl_keys in PART_GROUPS.items():
        vert_indices: list[int] = []
        for key in smpl_keys:
            vert_indices.extend(seg.get(key, []))

        if not vert_indices:
            print(f"  WARNING: no vertices found for '{group_name}' ({smpl_keys})")
            continue

        vert_set = set(vert_indices)
        face_mask = np.array(
            [v0 in vert_set and v1 in vert_set and v2 in vert_set
             for v0, v1, v2 in faces]
        )
        seg_faces = faces[face_mask]

        if len(seg_faces) == 0:
            print(f"  WARNING: no faces for '{group_name}'")
            continue

        mesh = trimesh.Trimesh(vertices=vertices, faces=seg_faces, process=False)
        scene.add_geometry(mesh, geom_name=group_name)
        claimed.update(vert_set)
        print(f"  {group_name}: {len(seg_faces)} faces")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    scene.export(str(OUTPUT_PATH))
    print(f"\nExported → {OUTPUT_PATH}")


def main() -> None:
    if not SEG_PATH.exists():
        print(f"ERROR: Segmentation file not found: {SEG_PATH}")
        print("This file is included in the SMPL download package.")
        sys.exit(1)

    with open(SEG_PATH) as f:
        seg: dict[str, list[int]] = json.load(f)

    vertices, faces = load_smpl(MODELS_DIR)
    build_glb(vertices, faces, seg)


if __name__ == "__main__":
    main()
