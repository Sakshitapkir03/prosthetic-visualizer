# Prosthetic Visualizer — Build Plan

## What we're building

A clinician-facing 3D web tool for prosthetic consultations. A doctor selects a body
region on a generic 3D human model and a prosthetic device; the model updates live so
the patient can see the result. An LLM agent lets the clinician drive the scene in plain
language and explains device options to the patient via RAG-grounded notes.

**This is a visualization and shared-decision tool, NOT a medical device.**
Always frame output with "confirm with your prosthetist / clinician."

---

## Architecture overview

```
Browser (React + React Three Fiber)
  │
  │  plain-language command
  ▼
FastAPI agent service  ──► Ollama (local LLM)
  │                          │
  │  JSON scene action        │ RAG: small prosthetics
  │◄─────────────────────────┘     knowledge base
  │
  ▼
Frontend executes action → 3D model updates
```

- **Frontend**: React + React Three Fiber, Vite, Tailwind. Clickable body regions,
  per-limb prosthesis level + device selection, drag-to-rotate, zoom.
- **Agent service**: FastAPI endpoint. Takes a natural-language command, returns a
  strict JSON scene action. Backed by a local open LLM via Ollama.
- **Knowledge (RAG)**: Small curated prosthetics knowledge base. Retrieval grounds
  the patient-facing "device notes" so they are factual and citable.
- **Evaluation**: Offline eval harness with a golden test set that prints real metrics.

---

## Locked product decisions

- No file/photo upload in v1. Generic 3D body only.
- The LLM outputs ONLY a JSON action matching the shared schema. The frontend executes
  it. The LLM never controls the renderer directly.
- Everything must be free / self-hostable: Ollama, Hugging Face open weights,
  Hugging Face Spaces ZeroGPU free tier, Vercel / GitHub Pages.
- Do NOT train or fine-tune an LLM from scratch. Pretrained open models + RAG only.
  LoRA only if explicitly requested.

---

## Tech stack

| Layer       | Technology                                              |
|-------------|---------------------------------------------------------|
| Frontend    | React, React Three Fiber, Vite, Tailwind, TypeScript   |
| Agent API   | Python 3.12, FastAPI, Pydantic, Uvicorn                |
| LLM backend | Ollama (Llama / Qwen / Mistral — self-hosted)           |
| RAG         | Hugging Face sentence-transformers, FAISS or Chroma     |
| Spaces UI   | Gradio (for Hugging Face Spaces deploy)                 |
| Tests       | pytest                                                  |
| Lint        | ruff                                                    |

---

## Coding conventions

- TypeScript on the frontend; type every component's props.
- Python: type hints everywhere; Pydantic models for the action schema and all API I/O.
- Small, single-purpose modules. No file over ~300 lines; split when it grows.
- The JSON action schema lives in ONE source of truth (`agent/schema.py`), which exports
  a JSON Schema the frontend imports. Never define it twice.

---

## Build steps (ordered)

### Step 1 — Data contract (`agent/schema.py`) ← current step

Define the JSON "scene action" that the LLM produces, the frontend consumes, and the
eval checks. Single source of truth: a Pydantic model that also exports a JSON Schema.

**Fields:**

| Field   | Python type                                                                                   | Allowed values                                                                              |
|---------|-----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| `limb`  | `Literal["arm", "leg"]`                                                                       | `arm`, `leg`                                                                                |
| `side`  | `Literal["left", "right"]`                                                                    | `left`, `right`                                                                             |
| `level` | `Literal["transradial","transhumeral","transtibial","transfemoral","partial_foot","partial_hand"]` | Six standard amputation levels                                                          |
| `device`| `Literal["blade","microprocessor_knee","myoelectric","body_powered","dynamic_foot","passive"]`| Six device categories                                                                       |
| `notes` | `str \| None`                                                                                 | RAG-generated patient-facing explanation, or `null`                                         |

**Cross-field validation (Pydantic model_validator):**
- `level` must be compatible with `limb` (e.g. `transtibial` is leg-only).
- `device` must be compatible with `level` (e.g. `blade` is transtibial / partial_foot only).

**Example actions:**
```json
// Below-knee blade, left leg
{"limb":"leg","side":"left","level":"transtibial","device":"blade",
 "notes":"A carbon-fibre blade stores energy during stance and releases it at push-off."}

// Above-elbow myoelectric, right arm
{"limb":"arm","side":"right","level":"transhumeral","device":"myoelectric",
 "notes":"Uses surface electrodes to read muscle signals and actuate the terminal device."}

// Above-knee microprocessor knee, right leg, no notes
{"limb":"leg","side":"right","level":"transfemoral","device":"microprocessor_knee","notes":null}
```

**Deliverable:** `agent/schema.py` + exported `schema.json` the frontend can import.

---

### Step 2 — Project scaffolding

Stand up the two top-level workspaces:

```
prosthetic-visualizer/
├── agent/          # Python / FastAPI
│   ├── schema.py   # ← Step 1
│   ├── main.py     # FastAPI app
│   ├── llm.py      # Ollama wrapper
│   └── rag.py      # retrieval
├── frontend/       # React / Vite
│   ├── src/
│   └── ...
├── eval/           # golden sets + run_eval.py
├── knowledge/      # raw prosthetics docs for RAG
├── PLAN.md         # this file
├── CLAUDE.md       # project rules
└── README.md
```

Deliverable: `pyproject.toml` (or `requirements.txt`), `package.json`, basic FastAPI
health-check endpoint, and Vite scaffold — everything runnable locally.

---

### Step 3 — Rule-based baseline parser

Before touching the LLM, build a simple regex / keyword parser that maps plain-language
commands to scene actions. This becomes the **baseline** the LLM must beat in evals, and
it catches easy cases cheaply.

Example: "show a below-knee blade on the left" → `{limb:leg, side:left, level:transtibial, device:blade}`.

Deliverable: `agent/baseline_parser.py` + `eval/golden_commands.jsonl`.

---

### Step 4 — LLM agent (Ollama)

Wrap Ollama with a structured-output prompt that forces the model to return only valid
JSON matching the schema. Use Pydantic to validate the output; retry once on parse
failure.

Deliverable: `agent/llm.py`, `agent/main.py` `/parse` endpoint, manual smoke-test.

---

### Step 5 — Evaluation harness

Run both the baseline parser and the LLM agent against the same golden command set.
Print a metrics table: task-success rate, latency p50/p95. Never hand-write numbers.

Deliverable: `eval/run_eval.py` that prints a table like:

```
parser   task_success=0.72  p50=2ms   p95=5ms
llm      task_success=0.91  p50=420ms p95=890ms
```

---

### Step 6 — RAG knowledge base

Chunk a small set of curated prosthetics documents, embed with a Hugging Face
sentence-transformer (free, local), store in FAISS or Chroma. The `/parse` endpoint
retrieves the top-k chunks and appends them to the LLM prompt to ground `notes`.

Deliverable: `agent/rag.py`, `knowledge/` docs, faithfulness eval added to `run_eval.py`.

---

### Step 7 — 3D frontend (React Three Fiber)

Clickable generic human model. On click, a panel lets the clinician pick `side`,
`level`, `device`. The selected combination fires a `/parse` command and the returned
action swaps the correct mesh segment + shows `notes`.

Deliverable: working local demo, drag-to-rotate, zoom.

---

### Step 8 — Natural-language chat panel

A text box in the UI sends plain-language commands to the agent service. The returned
action is applied to the 3D scene. Response shows device notes below the model.

Deliverable: end-to-end demo — type "left below-knee blade" → model updates.

---

### Step 9 — Gradio / Hugging Face Spaces deploy

Wrap the agent service in a Gradio interface for the Spaces free tier (ZeroGPU).
Frontend deploys to Vercel or GitHub Pages.

Deliverable: public shareable URL (free).

---

### Step 10 — Polish + final eval pass

Re-run all evals, fix regressions, add README with setup instructions and metric table,
record a short demo video or GIF.

---

## Evaluation requirements

Every AI component ships with measured numbers:

| Component    | Metrics                                                   |
|--------------|-----------------------------------------------------------|
| LLM agent    | task-success rate vs baseline, latency p50/p95            |
| RAG notes    | faithfulness / hallucination rate (LLM-as-judge), recall@k |

Golden sets live in `/eval`. `eval/run_eval.py` computes and prints everything.

---

## Never do

- Never claim medical accuracy or give medical advice.
- Never invent benchmark numbers — always compute from the eval harness.
- Never add a paid API/service without flagging it first.
- Never commit secrets or `.env`.
- Never request, store, or simulate real patient data or images in v1.
