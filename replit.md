# Leads Rubix CRM — Replit Workspace

A two-artifact pnpm monorepo containing the **leads-rubix-backend** (Express + Mongoose) API and the **leads-rubix-crm-web** (React + Vite + MUI + Redux Toolkit) frontend, integrated and runnable in Replit.

## Artifacts

| Artifact | Path | Local port | Proxy path | Tech |
|---|---|---|---|---|
| `api-server` | `artifacts/api-server` | `8080` | `/api` | Node 20, Express 4, Mongoose 7, JWT |
| `mockup-sandbox` (web) | `artifacts/mockup-sandbox` | `8081` | `/__mockup` | React 19, Vite 7, MUI 7, Redux Toolkit, React Router 7 |

The Replit reverse proxy on port 80 routes `/api/*` to the backend and `/__mockup/*` to the frontend. The frontend is served under the `/__mockup` base path because its artifact kind is fixed to `design`. Vite's `base` and React Router's `basename` are both wired to the runtime `BASE_PATH` so all URLs resolve correctly.

## Run commands

Workflows are pre-configured. To restart manually:

```bash
pnpm install                                              # install all workspace deps
pnpm --filter @workspace/api-server run start             # backend only
pnpm --filter @workspace/mockup-sandbox run dev           # frontend only
pnpm run typecheck                                        # full workspace typecheck
```

Open the app at `https://<replit-dev-domain>/__mockup/login`.

## Environment variables

| Var | Where | Required | Default | Notes |
|---|---|---|---|---|
| `MONGO_URI` | api-server | no (dev) / **yes (prod)** | in-memory MongoDB | Falls back to `mongodb-memory-server` in dev. |
| `JWT_SECRET` | api-server | **yes (prod)** | `dev-only-insecure-secret-change-me` | Server **fails to boot** in production if unset. |
| `JWT_EXPIRES_IN` | api-server | no | `7d` | |
| `FRONTEND_ORIGINS` | api-server | **yes (prod)** | empty (dev: reflects any origin) | Comma-separated allowed CORS origins; required in production. |
| `PORT` | both | injected by runtime | `8080` / `8081` | |
| `BASE_PATH` | mockup-sandbox | injected by runtime | `/` | Used as Vite `base` and React Router `basename`. |
| `VITE_API_BASE_URL` | mockup-sandbox | no | `''` (same-origin → `/api`) | Override only if hosting API on a different domain. |

## Demo credentials

Seeded after first signup. To recreate:

```bash
curl -X POST http://localhost:80/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Sales Demo","email":"sales@rubixcrm.dev","password":"demo1234","role":"sales"}'
```

(In-memory MongoDB resets every backend restart — set `MONGO_URI` to persist data.)

## Architectural notes

- The frontend was placed in `artifacts/mockup-sandbox` because that artifact's id/kind cannot be changed; the directory keeps that legacy name but contains the full Leads Rubix CRM web app.
- Auth flow: `POST /api/auth/signup` and `POST /api/auth/login` return `{ user, token }`; the JWT lives in localStorage (`useAuth` hook) and is attached via the axios `axiosInstance` interceptor.
- Backend is unbundled (no esbuild step). Entry: `src/index.js` → connects DB → mounts `src/app.js`.
- Frontend uses path alias `@/` → `src/`.

## Recent changes

- Integrated user-supplied `leads-rubix-backend` and `leads-rubix-crm-web` zips into the monorepo.
- Added in-memory MongoDB fallback (`mongodb-memory-server`) and `/api/healthz`.
- Added permissive-in-dev / strict-in-prod CORS using `FRONTEND_ORIGINS`.
- Made backend fail-fast in production when `JWT_SECRET` or `FRONTEND_ORIGINS` is missing.
- Patched signup payload mismatch — backend now defaults `role` to `'sales'` and accepts `name`.
- Made the User model store lowercase emails and added a `name` field.
- Wired Vite `base` to `BASE_PATH` and React Router `basename` to `import.meta.env.BASE_URL`.
- Added a `/api` Vite dev proxy as a fallback when not behind the Replit proxy.
