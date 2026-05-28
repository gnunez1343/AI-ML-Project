# Dori.ai

> AI-powered clinical documentation assistant for therapists. Reduce admin overhead. Focus on care.

## Repository layout

```
AI-ML-Project/
├── frontend/        # Next.js 14 (App Router) + Tailwind + TypeScript strict
├── backend/         # FastAPI + Python 3.13 + uvicorn
├── package.json     # Root monorepo scripts (concurrently)
├── .env.example     # Copy to .env and fill in values
│
│   # Legacy ML research (BERT sentiment analysis — untouched)
├── task.ipynb
├── Model_loading_and_prediction_on_new_utterances.ipynb
└── requirements.txt
```

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Bun | ≥ 1.1 | https://bun.sh |
| Python | ≥ 3.13 | https://python.org |
| pip | latest | bundled with Python |

## Quick start

```bash
# 1. Clone
git clone https://github.com/gnunez1343/AI-ML-Project.git
cd AI-ML-Project

# 2. Copy env
cp .env.example .env

# 3. Install root deps (concurrently)
bun install

# 4. Install frontend deps
cd frontend && bun install && cd ..

# 5. Install backend deps
pip install -r backend/requirements.txt

# 6. Start both servers
bun dev
```

- **Frontend** → http://localhost:3000
- **Backend API** → http://localhost:8000
- **API docs (Swagger)** → http://localhost:8000/docs
- **Health check** → http://localhost:8000/api/health

## Running individually

```bash
bun run dev:frontend   # Next.js only → localhost:3000
bun run dev:backend    # FastAPI only → localhost:8000
```

## Frontend

- **Framework:** Next.js 14 App Router
- **Styling:** Tailwind CSS with Dori.ai design tokens
- **Typography:** Inter (next/font), JetBrains Mono
- **Icons:** Lucide React (stroke-width 1.5)
- **Type safety:** TypeScript strict mode

### Design tokens

All design tokens are defined in `frontend/tailwind.config.ts`:

| Token | Value | Usage |
|-------|-------|-------|
| `sage-900` | `#2D6A4F` | Primary brand, CTA buttons |
| `sage-600` | `#52B788` | Accent, avatars |
| `warm-50` | `#F8F7F4` | Page background |
| `warm-200` | `#E5E0DA` | Borders |
| `ink-900` | `#1A1A1A` | Primary text |
| `ink-600` | `#6B6B6B` | Secondary text |

### UI components

Located in `frontend/src/components/ui/`:

| Component | Variants |
|-----------|---------|
| `Button` | primary, secondary, ghost, danger · sm/md/lg · isLoading |
| `Input` | default, error · label, helperText, errorText |
| `Card` | `Card.Header`, `Card.Body`, `Card.Footer` slots |
| `Badge` | success, warning, error, info, neutral |
| `Avatar` | initials-based · sm (32px) / md (40px) / lg (48px) |

## Backend

- **Framework:** FastAPI
- **Server:** uvicorn (dev with `--reload`)
- **Port:** 8000
- **CORS:** configured for `localhost:3000`

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Root — service info |
| GET | `/docs` | Swagger UI |
| GET | `/api/health` | Health check |

## TypeScript

Run the type checker independently:

```bash
cd frontend && bun run type-check
```

Strict mode is enforced (`"strict": true` in `tsconfig.json`). Zero type errors required.

## Notes

- No Docker in this phase — local dev only.
- No database yet — SQLite will be added in the auth PR.
- The legacy ML notebooks (`task.ipynb`, `Model_loading_...ipynb`) are independent of the web stack and remain unchanged.
