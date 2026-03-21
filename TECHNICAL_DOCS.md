# Observable Decisions — Technical Documentation

A full-stack decision management platform for recording, tracking, and sharing architectural and business decisions. Built with a React SPA frontend and a Python FastAPI backend, deployed on Azure.

---

## Table of Contents

- [Tech Stack](#tech-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Infrastructure & Deployment](#infrastructure--deployment)
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
| **TypeScript** | ^5 | Static typing for the frontend codebase |
| **Vite** | ^6.3 | Dev server and production bundler |
| **Tailwind CSS** | ^4 | Utility-first CSS framework for styling |
| **@tailwindcss/typography** | ^0.5 | Tailwind plugin for prose/markdown content styling |
| **@tailwindcss/postcss** | ^4 | PostCSS integration for Tailwind |
| **Zod** | ^4.3 | Runtime schema validation for Decision/Option types |
| **React Markdown** | ^10.1 | Renders Markdown content (context, decision, consequences fields) |
| **remark-gfm** | ^4.0 | GitHub Flavored Markdown support (tables, task lists, strikethrough) |
| **rehype-sanitize** | ^6.0 | Sanitizes rendered Markdown HTML to prevent XSS |
| **Lucide React** | ^0.577 | Icon library used throughout the UI |
| **date-fns** | ^4.1 | Date formatting and manipulation |
| **nanoid** | ^5.1 | Generates compact unique IDs (used for Options) |
| **Fuse.js** | ^7.1 | Client-side fuzzy search over decisions |
| **clsx** | ^2.1 | Conditional CSS class name construction |
| **tailwind-merge** | ^3.5 | Intelligently merges Tailwind class names to avoid conflicts |
| **@vitejs/plugin-react** | ^4.5 | Vite plugin enabling React Fast Refresh and JSX transform |
| **ESLint** | ^9 | JavaScript/TypeScript linting |

### Backend

| Library / Tool | Version | Purpose |
|---|---|---|
| **FastAPI** | >=0.135 | Async Python web framework for the REST API |
| **Pydantic** | >=2.12 | Data validation and serialization for request/response models |
| **Uvicorn** | >=0.42 | ASGI server for running FastAPI locally |
| **azure-functions** | >=1.24 | Azure Functions Python SDK; wraps FastAPI as an ASGI function app |
| **azure-storage-blob** | >=12.28 | Azure Blob Storage client for persisting decision records |
| **python-dotenv** | >=1.2 | Loads `.env` files into environment variables for local development |
| **pytest** | >=9.0 | Test framework (dev dependency) |
| **pytest-asyncio** | >=1.3 | Async test support for pytest (dev dependency) |
| **httpx** | >=0.28 | Async HTTP client used to test FastAPI routes via `TestClient` (dev dependency) |

**Python version**: >=3.12
**Package manager**: [uv](https://github.com/astral-sh/uv)

### Infrastructure & Deployment

| Service / Tool | Purpose |
|---|---|
| **Azure Static Web Apps** | Hosts the frontend SPA with built-in CDN and auth |
| **Azure Functions** | Hosts the backend API (Python v2 programming model, ASGI) |
| **Azure Blob Storage** | Persists decision records as JSON blobs |
| **GitHub Actions** | CI/CD pipelines for both frontend and backend |

---

## Project Structure

```
observable-decisions/
├── src/                              # Frontend — React SPA
│   ├── main.tsx                      # App entry point (React root, BrowserRouter, AuthProvider)
│   ├── App.tsx                       # Route definitions and auth gating
│   ├── components/                   # Reusable UI components
│   │   ├── decision-form.tsx         # Create/edit form for decisions
│   │   ├── decision-list.tsx         # Searchable, filterable list of decisions
│   │   ├── markdown-field.tsx        # Markdown editor with live preview
│   │   ├── nav.tsx                   # Sidebar navigation
│   │   ├── options-editor.tsx        # Inline editor for decision options (pros/cons)
│   │   ├── share-button.tsx          # Share dialog component
│   │   ├── status-badge.tsx          # Colored status indicator badge
│   │   └── tag-input.tsx             # Tag input with autocomplete
│   ├── pages/                        # Route-level page components
│   │   ├── DecisionsPage.tsx         # Decision list view
│   │   ├── DecisionDetailPage.tsx    # Read-only decision detail
│   │   ├── EditDecisionPage.tsx      # Edit existing decision
│   │   ├── NewDecisionPage.tsx       # Create new decision
│   │   ├── SettingsPage.tsx          # User settings
│   │   └── SignInPage.tsx            # OAuth sign-in page
│   ├── layouts/
│   │   └── AppLayout.tsx             # Shell layout with sidebar navigation
│   └── lib/                          # Shared utilities and logic
│       ├── decisions/
│       │   └── schema.ts             # Zod schemas (Decision, Option, DecisionStatus)
│       ├── auth-context.tsx          # React context provider for auth state
│       ├── auth.ts                   # Auth helpers (Azure SWA /.auth/me integration)
│       ├── api.ts                    # API client (fetch wrappers for all endpoints)
│       └── utils.ts                  # General utilities (cn helper for class merging)
│
├── api/                              # Backend — Python FastAPI
│   ├── main.py                       # FastAPI app factory and route definitions
│   ├── models.py                     # Pydantic models (Decision, Option, request/response types)
│   ├── function_app.py               # Azure Functions ASGI wrapper
│   ├── storage/
│   │   ├── __init__.py               # Re-exports AzureBlobBackend
│   │   ├── base.py                   # Abstract StorageBackend interface
│   │   └── azure_blob.py             # Azure Blob Storage implementation
│   ├── tests/
│   │   ├── conftest.py               # Pytest fixtures, in-memory MemoryBackend
│   │   ├── test_routes.py            # API route integration tests
│   │   ├── test_models.py            # Pydantic model validation tests
│   │   └── test_storage_azure.py     # Azure storage backend tests
│   ├── pyproject.toml                # Python dependencies (managed by uv)
│   └── host.json                     # Azure Functions host configuration
│
├── .github/workflows/                # CI/CD
│   ├── azure-static-web-apps-*.yml   # Frontend deployment pipeline
│   └── deploy-api.yml                # Backend deployment pipeline
│
├── scripts/
│   └── setup-oauth-settings.ps1      # PowerShell script for OAuth provider setup
│
├── index.html                        # HTML shell (Vite entry point)
├── package.json                      # Frontend dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                    # Vite bundler configuration
├── postcss.config.mjs                # PostCSS / Tailwind CSS configuration
├── staticwebapp.config.json          # Azure Static Web Apps routing and auth config
└── .env.example                      # Template for required environment variables
```

---

## Data Model

### Decision

The core entity. Mirrored between frontend (Zod) and backend (Pydantic):

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (21-char hex) |
| `title` | string | Decision title (required, min 1 char) |
| `status` | enum | `proposed`, `accepted`, `rejected`, `deprecated`, `superseded` |
| `date` | string | Date of the decision (YYYY-MM-DD) |
| `deciders` | string[] | People involved in making the decision |
| `tags` | string[] | Organizational tags |
| `context` | string | Background and motivation (Markdown) |
| `decision` | string | The decision itself (Markdown) |
| `consequences` | string | Expected outcomes and impacts (Markdown) |
| `options` | Option[] | Evaluated alternatives |
| `supersededBy` | string? | ID of the decision that supersedes this one |
| `shareToken` | string? | Token for shared access |
| `sharedWith` | string[] | Email addresses the decision is shared with |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |
| `createdBy` | string | Email of the creator |

### Option

A nested object within a Decision, representing one alternative that was evaluated:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier |
| `title` | string | Option name (required) |
| `description` | string | Detailed description |
| `pros` | string[] | Advantages |
| `cons` | string[] | Disadvantages |
| `chosen` | boolean | Whether this option was selected |

### DecisionMeta

A lightweight projection of Decision used for list views (omits `context`, `decision`, `consequences`, `options`, and other heavy fields).

---

## API Reference

Base path: `/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/decisions` | List all decisions for the authenticated user (returns `DecisionMeta[]`) |
| `POST` | `/api/decisions` | Create a new decision (returns the created `Decision`) |
| `GET` | `/api/decisions/{id}` | Get a single decision by ID |
| `PUT` | `/api/decisions/{id}` | Merge-update an existing decision |
| `DELETE` | `/api/decisions/{id}` | Delete a decision (returns 204) |
| `POST` | `/api/decisions/{id}/share` | Generate a shareable URL for a decision |

All endpoints accept an `x-user-email` header to identify the calling user. In production, this is populated by the frontend from the Azure SWA auth session.

---

## Authentication

Authentication is handled by **Azure Static Web Apps built-in auth**, which provides OAuth integration without custom backend code.

### Supported Identity Providers

| Provider | Login Route | Config Setting Names |
|---|---|---|
| Microsoft (Azure AD) | `/.auth/login/aad` | `AAD_CLIENT_ID`, `AAD_CLIENT_SECRET` |
| GitHub | `/.auth/login/github` | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| Google | `/.auth/login/google` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

### Auth Flow

1. Unauthenticated users are redirected to `/signin`
2. User clicks a provider button, which navigates to `/.auth/login/{provider}`
3. Azure SWA handles the OAuth flow and redirects back to `/decisions`
4. The frontend calls `/.auth/me` to retrieve the `ClientPrincipal` (user identity)
5. The user's email is sent to the API via the `x-user-email` header on every request

### Route Protection

Configured in `staticwebapp.config.json`:
- `/signin`, `/.auth/*`, `/assets/*`, `/favicon.ico` — accessible anonymously
- All other routes — require `authenticated` role
- Unauthenticated access returns a 302 redirect to `/signin`

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
| `AzureBlobBackend` | `api/storage/azure_blob.py` | Production — stores decisions as JSON blobs in Azure Blob Storage |
| `MemoryBackend` | `api/tests/conftest.py` | Testing — in-memory dict-based storage for fast, isolated tests |

### Blob Layout

Decisions are stored as individual JSON files with per-user isolation:

```
{container}/
  users/
    alice@example.com/
      abc123.json
      def456.json
    bob@example.com/
      ghi789.json
```

Each blob is a serialized `Decision` object.

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

### Auth Gating

The `RequireAuth` wrapper component checks auth state from `AuthProvider` (React context). If the user is not authenticated, they are redirected to `/signin`.

### API Client

`src/lib/api.ts` provides typed fetch wrappers for each API endpoint. The base URL is configurable via the `VITE_DECISIONS_API_URL` environment variable (defaults to same-origin).

### Schema Validation

Frontend Zod schemas in `src/lib/decisions/schema.ts` mirror the backend Pydantic models, ensuring consistent validation on both sides of the stack.

---

## Running Locally

### Frontend

```bash
npm install
npm run dev          # Starts Vite dev server on http://localhost:3000
```

### Backend

```bash
cd api
uv sync              # Install Python dependencies
uvicorn main:app     # Starts FastAPI on http://localhost:8000
```

Requires `AZURE_STORAGE_CONNECTION_STRING` to be set (or use `.env` file).

### Build Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript compile + Vite production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Testing

### Backend Tests

```bash
cd api
uv run pytest
```

Tests use an in-memory `MemoryBackend` so no Azure credentials are required. The test suite includes:

- **Route tests** (`test_routes.py`) — integration tests exercising all API endpoints via httpx `AsyncClient`
- **Model tests** (`test_models.py`) — Pydantic model validation
- **Storage tests** (`test_storage_azure.py`) — Azure Blob Storage backend tests

---

## Deployment

### Frontend — Azure Static Web Apps

Triggered on push to `main` (ignores changes under `api/`).

1. Runs `npm run build` (TypeScript + Vite → `dist/`)
2. Deploys the `dist/` folder to Azure Static Web Apps
3. Routing is governed by `staticwebapp.config.json`

Workflow: `.github/workflows/azure-static-web-apps-witty-sea-0fab1e70f.yml`

### Backend — Azure Functions

Triggered on push to `main` when `api/**` or the workflow file changes.

1. Installs `uv` and exports dependencies to `requirements.txt`
2. Removes `tests/` directory from the deployment package
3. Deploys to Azure Functions via the official GitHub Action
4. Uses OIDC federated identity for deployment authentication (no stored credentials)

Workflow: `.github/workflows/deploy-api.yml`

The Azure Functions wrapper (`api/function_app.py`) exposes the FastAPI app as an ASGI function with a catch-all route (`/{*route}`), forwarding all HTTP requests to FastAPI.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `AZURE_STORAGE_CONNECTION_STRING` | Yes (backend) | — | Azure Blob Storage connection string |
| `AZURE_STORAGE_CONTAINER` | No | `decisions` | Blob container name |
| `API_CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed CORS origins |
| `VITE_DECISIONS_API_URL` | No | `""` (same-origin) | Backend API base URL for the frontend |
| `AAD_CLIENT_ID` | Yes (auth) | — | Azure AD OAuth client ID |
| `AAD_CLIENT_SECRET` | Yes (auth) | — | Azure AD OAuth client secret |
| `GITHUB_CLIENT_ID` | Yes (auth) | — | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | Yes (auth) | — | GitHub OAuth client secret |
| `GOOGLE_CLIENT_ID` | Yes (auth) | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes (auth) | — | Google OAuth client secret |
