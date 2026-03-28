# Observable Decisions — Technical Documentation

A full-stack decision management platform for recording, tracking, and sharing architectural and business decisions. Built with a React SPA frontend and a Python FastAPI backend, deployed on GCP.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Storage Architecture](#storage-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Running Locally](#running-locally)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)

---

## Tech Stack

### Frontend

| Library / Tool | Version | Purpose |
|---|---|---|
| **React** | ^19.1 | UI component framework |
| **React Router DOM** | ^7.6 | Client-side routing for the SPA |
| **TypeScript** | ^5 | Static typing |
| **Vite** | ^6.3 | Dev server and production bundler |
| **Tailwind CSS** | ^4 | Utility-first CSS framework |
| **Firebase** | ^11.0 | Firebase Authentication SDK |
| **Zod** | ^4.3 | Runtime schema validation for Decision/Option types |
| **React Markdown** | ^10.1 | Renders Markdown content |
| **remark-gfm** | ^4.0 | GitHub Flavored Markdown support |
| **rehype-sanitize** | ^6.0 | Sanitises rendered Markdown HTML to prevent XSS |
| **Lucide React** | ^0.577 | Icon library |
| **date-fns** | ^4.1 | Date formatting |
| **nanoid** | ^5.1 | Compact unique IDs for Options |
| **Fuse.js** | ^7.1 | Client-side fuzzy search |
| **clsx** / **tailwind-merge** | ^2.1 / ^3.5 | Conditional and merged CSS class names |

### Backend

| Library / Tool | Version | Purpose |
|---|---|---|
| **FastAPI** | >=0.135 | Async Python web framework |
| **Pydantic** | >=2.12 | Request/response model validation and serialisation |
| **Uvicorn** | >=0.42 | ASGI server |
| **firebase-admin** | >=6.0 | Verifies Firebase ID tokens on incoming requests |
| **google-cloud-storage** | >=2.0 | GCS client for persisting decision records |
| **python-dotenv** | >=1.2 | Loads `.env` files for local development |
| **pytest** / **pytest-asyncio** / **httpx** | dev | Testing |

**Python version**: >=3.12 · **Package manager**: [uv](https://github.com/astral-sh/uv)

### Infrastructure & Deployment

| Service / Tool | Purpose |
|---|---|
| **Firebase Hosting** | Hosts the frontend SPA with built-in CDN |
| **Cloud Run** | Hosts the containerised FastAPI backend (Docker) |
| **Google Cloud Storage** | Persists decision records as JSON objects |
| **Artifact Registry** | Stores Docker images for Cloud Run |
| **Firebase Authentication** | Manages user identity (Google + GitHub OAuth) |
| **Workload Identity Federation** | Keyless authentication from GitHub Actions to GCP |
| **Terraform** | Provisions all GCP infrastructure |
| **GitHub Actions** | CI/CD pipelines for frontend, backend, and infrastructure |

---

## Project Structure

```
observable-decisions/
├── app/                              # Frontend — React SPA
│   ├── src/
│   │   ├── main.tsx                  # App entry point
│   │   ├── App.tsx                   # Route definitions and auth gating
│   │   ├── components/               # Reusable UI components
│   │   │   ├── decision-form.tsx     # Create/edit form
│   │   │   ├── decision-list.tsx     # Searchable, filterable list
│   │   │   ├── markdown-field.tsx    # Markdown editor with live preview
│   │   │   ├── nav.tsx               # Sidebar navigation
│   │   │   ├── options-editor.tsx    # Inline editor for options (pros/cons)
│   │   │   ├── share-button.tsx      # Share dialog component
│   │   │   ├── status-badge.tsx      # Coloured status indicator
│   │   │   └── tag-input.tsx         # Tag input with autocomplete
│   │   ├── pages/                    # Route-level page components
│   │   │   ├── DecisionsPage.tsx
│   │   │   ├── DecisionDetailPage.tsx
│   │   │   ├── EditDecisionPage.tsx
│   │   │   ├── NewDecisionPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── SignInPage.tsx
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx         # Shell layout with sidebar
│   │   └── lib/
│   │       ├── decisions/schema.ts   # Zod schemas (Decision, Option, Status)
│   │       ├── firebase.ts           # Firebase app and auth instance
│   │       ├── auth.ts               # Sign-in/out helpers (Firebase Auth)
│   │       ├── auth-context.tsx      # React context for auth state
│   │       ├── api.ts                # Typed fetch wrappers for all endpoints
│   │       └── utils.ts              # General utilities
│   ├── firebase.json                 # Firebase Hosting config + Cloud Run rewrite
│   ├── .firebaserc                   # Firebase project binding
│   └── package.json
│
├── api/                              # Backend — Python FastAPI
│   ├── main.py                       # App factory, auth dependency, route definitions
│   ├── models.py                     # Pydantic models
│   ├── storage/
│   │   ├── __init__.py               # Re-exports GCSBackend
│   │   ├── base.py                   # Abstract StorageBackend interface
│   │   └── gcs.py                    # Google Cloud Storage implementation
│   ├── tests/
│   │   ├── conftest.py               # Pytest fixtures, in-memory MemoryBackend
│   │   ├── test_routes.py            # Route integration tests
│   │   ├── test_models.py            # Pydantic model validation tests
│   │   └── test_storage_azure.py     # Legacy Azure backend unit tests
│   ├── Dockerfile
│   ├── .dockerignore
│   └── pyproject.toml
│
├── infra/                            # Terraform — GCP infrastructure
│   ├── main.tf                       # Provider config, GCS state backend
│   ├── variables.tf
│   ├── terraform.tfvars
│   ├── compute.tf                    # Artifact Registry + Cloud Run
│   ├── storage.tf                    # GCS decisions bucket
│   ├── identity.tf                   # Service accounts + Workload Identity Federation
│   └── outputs.tf
│
└── .github/workflows/
    ├── backend.yml                   # Test + build Docker image + deploy to Cloud Run
    ├── frontend.yml                  # Build + deploy to Firebase Hosting
    └── infra.yml                     # Terraform apply
```

---

## Data Model

### Decision

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (21-char hex) |
| `title` | string | Decision title (required) |
| `status` | enum | `proposed`, `accepted`, `rejected`, `deprecated`, `superseded` |
| `date` | string | Date of the decision (YYYY-MM-DD) |
| `deciders` | string[] | People involved |
| `tags` | string[] | Organisational tags |
| `context` | string | Background and motivation (Markdown) |
| `decision` | string | The decision itself (Markdown) |
| `consequences` | string | Expected outcomes (Markdown) |
| `options` | Option[] | Evaluated alternatives |
| `supersededBy` | string? | ID of the superseding decision |
| `sharedWith` | string[] | Emails the decision is shared with |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |
| `createdBy` | string | Email of the creator |

### Option

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier |
| `title` | string | Option name (required) |
| `description` | string | Detailed description |
| `pros` | string[] | Advantages |
| `cons` | string[] | Disadvantages |
| `chosen` | boolean | Whether this option was selected |

### DecisionMeta

A lightweight projection of Decision used for list views — omits `context`, `decision`, `consequences`, and `options`.

---

## API Reference

Base path: `/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/decisions` | List all decisions for the authenticated user (`DecisionMeta[]`) |
| `POST` | `/api/decisions` | Create a new decision |
| `GET` | `/api/decisions/{id}` | Get a single decision by ID |
| `PUT` | `/api/decisions/{id}` | Merge-update an existing decision |
| `DELETE` | `/api/decisions/{id}` | Delete a decision (204) |
| `POST` | `/api/decisions/{id}/share` | Generate a 7-day signed GCS URL |

All endpoints require an `Authorization: Bearer <firebase-id-token>` header. In production the frontend obtains this token from the Firebase SDK and attaches it automatically. Locally, when `FIREBASE_PROJECT_ID` is not set, the `X-User-Email` header is accepted as a fallback.

---

## Authentication

Authentication is provided by **Firebase Authentication**.

### Supported Providers

| Provider | Firebase SDK call |
|---|---|
| Google | `signInWithPopup(auth, new GoogleAuthProvider())` |
| GitHub | `signInWithPopup(auth, new GithubAuthProvider())` |

### Auth Flow

1. Unauthenticated users are redirected to `/signin` by the `RequireAuth` wrapper in `App.tsx`
2. User clicks a provider button; `signInWithPopup` handles the OAuth popup
3. Firebase SDK returns a `User` object; `onAuthStateChanged` updates the React auth context
4. On every API call the frontend calls `auth.currentUser.getIdToken()` and sends the result as `Authorization: Bearer <token>`
5. The backend's `_get_current_user` FastAPI dependency verifies the token with the Firebase Admin SDK and returns the user's email

### Route Protection

Handled entirely in the React app via the `RequireAuth` component — no server-side route restrictions. All `/api/**` traffic to the backend requires a valid Firebase ID token.

---

## Storage Architecture

The backend uses a **pluggable storage abstraction** defined in `api/storage/base.py`:

```python
class StorageBackend(abc.ABC):
    async def list(prefix: str) -> list[DecisionMeta]
    async def get(prefix: str, decision_id: str) -> Decision
    async def put(prefix: str, decision_id: str, data: Decision) -> None
    async def delete(prefix: str, decision_id: str) -> None
    async def share(prefix: str, decision_id: str, email: str | None) -> str
```

### Implementations

| Backend | Location | Usage |
|---|---|---|
| `GCSBackend` | `api/storage/gcs.py` | Production — JSON objects in Google Cloud Storage |
| `MemoryBackend` | `api/tests/conftest.py` | Testing — in-memory dict, no credentials required |

### Object Layout

Decisions are stored as individual JSON files with per-user isolation:

```
{bucket}/
  users/
    alice@example.com/
      abc123.json
      def456.json
    bob@example.com/
      ghi789.json
```

### Signed URLs (Share Feature)

The `share` endpoint generates a 7-day signed GCS URL using Application Default Credentials from the Cloud Run metadata server. Requires the Cloud Run service account to have `roles/iam.serviceAccountTokenCreator` on itself (provisioned by Terraform).

---

## Frontend Architecture

### Routing

Defined in `src/App.tsx` using React Router v7:

| Path | Component | Auth Required |
|---|---|---|
| `/signin` | `SignInPage` | No |
| `/` | Redirects to `/decisions` | Yes |
| `/decisions` | `DecisionsPage` | Yes |
| `/decisions/new` | `NewDecisionPage` | Yes |
| `/decisions/:id` | `DecisionDetailPage` | Yes |
| `/decisions/:id/edit` | `EditDecisionPage` | Yes |
| `/settings` | `SettingsPage` | Yes |

### API Proxying

`firebase.json` rewrites `/api/**` requests to the `observable-api` Cloud Run service in `us-east4`. This means the frontend always calls same-origin `/api/…` URLs — no hardcoded Cloud Run URLs in the frontend code.

### Auth Context

`src/lib/auth-context.tsx` wraps `onAuthStateChanged` from Firebase and exposes `{ user: User | null, loading: boolean }` via React context. All components that need the current user call `useAuth()`.

---

## Running Locally

### Backend

```bash
cd api
uv sync
```

Create `api/.env`:
```
GCS_BUCKET_NAME=your-bucket-name
# Optional — omit to use X-User-Email header fallback instead of Firebase token verification
FIREBASE_PROJECT_ID=observable-decisions
```

```bash
uv run uvicorn main:app --reload   # http://localhost:8000
```

### Frontend

Create `app/.env` (values from Firebase Console → Project Settings → Your apps):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=observable-decisions.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=observable-decisions
VITE_FIREBASE_STORAGE_BUCKET=observable-decisions.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

```bash
cd app
npm install
npm run dev     # http://localhost:5173
```

---

## Testing

```bash
cd api
uv run pytest tests/ -v --tb=short
```

Tests use an in-memory `MemoryBackend` — no GCP credentials required. The suite covers:

- **`test_routes.py`** — integration tests for all API endpoints via httpx `AsyncClient`
- **`test_models.py`** — Pydantic model validation
- **`test_storage_azure.py`** — unit tests for the legacy Azure Blob backend (kept for reference)

---

## Deployment

### Initial Setup (one-time)

1. **Create the Terraform state bucket:**
   ```bash
   gcloud storage buckets create gs://observable-decisions-tfstate \
     --location=us-east4 --project=observable-decisions
   ```

2. **Provision GCP infrastructure:**
   ```bash
   cd infra
   terraform init
   terraform apply
   ```

3. **Capture Terraform outputs** — these go into GitHub Actions secrets:
   ```bash
   terraform output workload_identity_provider   # → GCP_WORKLOAD_IDENTITY_PROVIDER
   terraform output github_actions_service_account  # → GCP_SERVICE_ACCOUNT
   ```

4. **Set GitHub Actions secrets:**

   | Secret | Source |
   |---|---|
   | `GCP_WORKLOAD_IDENTITY_PROVIDER` | `terraform output workload_identity_provider` |
   | `GCP_SERVICE_ACCOUNT` | `terraform output github_actions_service_account` |
   | `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings |
   | `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
   | `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings |
   | `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings |

5. **Enable Firebase Auth providers** (Firebase Console → Authentication → Sign-in method):
   - Google — enable, no extra config needed
   - GitHub — enable, provide Client ID + Secret from a GitHub OAuth App (callback URL: `https://observable-decisions.firebaseapp.com/__/auth/handler`)

### Backend — Cloud Run

Triggered on push to `main` when `api/**` changes.

1. Runs unit tests — deploy is blocked if any test fails
2. Authenticates to GCP via Workload Identity Federation (no stored credentials)
3. Builds the Docker image and pushes to Artifact Registry with both `:<sha>` and `:latest` tags
4. Deploys the `:<sha>` image to Cloud Run via `google-github-actions/deploy-cloudrun`

Workflow: `.github/workflows/backend.yml`

### Frontend — Firebase Hosting

Triggered on push to `main` when `app/**` changes.

1. Authenticates to GCP via Workload Identity Federation
2. Builds the Vite SPA with Firebase config injected from GitHub Actions secrets
3. Deploys `dist/` to Firebase Hosting via `firebase deploy --only hosting`

The `firebase.json` rewrite rule proxies `/api/**` to Cloud Run, so the frontend always uses same-origin API calls.

Workflow: `.github/workflows/frontend.yml`

### Infrastructure — Terraform

Triggered on push to `main` when `infra/**` changes, or manually via `workflow_dispatch`.

1. Authenticates to GCP via Workload Identity Federation
2. Runs `terraform init` (GCS backend)
3. Runs `terraform apply -auto-approve`

Workflow: `.github/workflows/infra.yml`

---

## Environment Variables

### Backend (Cloud Run / local)

| Variable | Required | Default | Description |
|---|---|---|---|
| `GCS_BUCKET_NAME` | Yes | — | GCS bucket for decision storage |
| `FIREBASE_PROJECT_ID` | No | — | Firebase project ID for token verification; omit to use `X-User-Email` fallback |
| `API_CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed CORS origins |

### Frontend (build-time)

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | GCP/Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
