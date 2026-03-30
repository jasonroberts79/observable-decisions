---
name: project-conventions
description: Project-specific architecture conventions and context for Observable Decisions — loaded automatically to inform Claude's work
user-invocable: false
---

## Observable Decisions — Project Context

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 (frontend) / Python 3.12 FastAPI + pytest (backend) / Terraform (GCP infra)

**Directories:**
- `app/` — React SPA, deployed to Firebase Hosting
- `api/` — FastAPI backend, deployed to GCP Cloud Run via Docker
- `infra/` — Terraform, auto-applied to prod on merge to `main`

**Package managers:** `npm` for frontend, `uv` for Python (never pip directly)

**Auth flow:**
- Firebase Authentication (Google + GitHub OAuth)
- Frontend gets a Firebase ID token from the SDK and sends `Authorization: Bearer <token>`
- Backend verifies with `firebase_auth.verify_id_token()` in `api/main.py:_get_current_user()`
- Locally (no `FIREBASE_PROJECT_ID`): pass `X-User-Email` header instead

**Data model (Decision):**
- Zod schema: `app/src/lib/decisions/schema.ts` — source of truth for frontend types
- Pydantic models: `api/models.py` — source of truth for API request/response shapes
- All JSON is camelCase; Python uses `model_dump(by_alias=True)` throughout
- Decision IDs are 21-char hex strings (`uuid.uuid4().hex[:21]`)

**Storage:**
- GCS stores decisions as JSON at `users/{email}/{decision_id}.json`
- `StorageBackend` abstract interface: `api/storage/base.py`
- GCS implementation: `api/storage/gcs.py`
- Tests use in-memory `MemoryBackend` from `api/tests/conftest.py`
- Share links = signed GCS URLs, 7-day expiry

**Frontend conventions:**
- `app/src/components/` — reusable components
- `app/src/pages/` — route-level page components
- `app/src/lib/api.ts` — typed fetch wrappers for all API endpoints
- Tailwind CSS v4 (PostCSS plugin); no separate config file, uses CSS `@import`
- `clsx` + `tailwind-merge` for conditional classes

**API conventions:**
- All routes prefixed `/api/`
- `create_app(storage=...)` factory pattern — pass a `StorageBackend` for testing
- Per-user blob prefix: `users/{email}/`

**Never do:**
- Manually edit `uv.lock` or `package-lock.json`
- Commit `.env` or `.env.local`
- Use `pip` instead of `uv run` or `uv sync`
- Create the module-level `app` instance outside of `create_app()` (except the conditional at the bottom of `main.py`)
