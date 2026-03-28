# Observable Decisions

A full-stack decision management platform for recording, tracking, and sharing architectural and business decisions in [ADR](https://adr.github.io/) format.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript, hosted on Firebase Hosting |
| Backend | Python FastAPI, containerised and deployed to Cloud Run |
| Storage | Google Cloud Storage (JSON blobs, per-user isolation) |
| Auth | Firebase Authentication (Google + GitHub) |
| IaC | Terraform (GCP provider) |
| CI/CD | GitHub Actions with Workload Identity Federation |

## Project Layout

```
observable-decisions/
├── app/          # React SPA
├── api/          # FastAPI backend
├── infra/        # Terraform
└── .github/      # CI/CD workflows
```

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+ with [uv](https://github.com/astral-sh/uv)
- A Firebase project with Authentication enabled (Google + GitHub providers)

### Frontend

Copy the example env file and fill in your Firebase project config (Project Settings → Your apps → Web app):

```bash
cp app/.env.example app/.env
# edit app/.env
```

```bash
cd app
npm install
npm run dev      # http://localhost:5173
```

### Backend

```bash
cd api
cp .env.example .env
# set GCS_BUCKET_NAME (and optionally FIREBASE_PROJECT_ID) in .env
uv sync
uv run uvicorn main:app --reload   # http://localhost:8000
```

> When `FIREBASE_PROJECT_ID` is not set, the backend falls back to accepting the `X-User-Email` header for local development without Firebase.

### Running tests

```bash
cd api
uv run pytest
```

## Deployment

See [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) for the full deployment guide.
