# Leads Rubix CRM — Replit Workspace

A two-artifact pnpm monorepo containing the **leads-rubix-backend** (Express + Mongoose) API and the **leads-rubix-crm-web** (React + Vite + MUI + Redux Toolkit) frontend, integrated and runnable in Replit.

## Artifacts

| Artifact | Path | Local port | Proxy path | Tech |
|---|---|---|---|---|
| `api-server` | `artifacts/api-server` | `8080` | `/api` | Node 20, Express 4, Mongoose 7, JWT |
| `web` | `artifacts/web` | `22333` | `/` | React 19, Vite 7, MUI 7, Redux Toolkit, React Router 7 |

The Replit reverse proxy on port 80 routes `/api/*` to the backend and everything else to the frontend.

## Run commands

Workflows are pre-configured. To restart manually:

```bash
pnpm install                                              # install all workspace deps
pnpm --filter @workspace/api-server run start             # backend only
pnpm --filter @workspace/web run dev                      # frontend only
pnpm run typecheck                                        # full workspace typecheck
```

Open the app at `https://<replit-dev-domain>/login`.

## Environment variables

| Var | Where | Required | Default | Notes |
|---|---|---|---|---|
| `MONGO_URI` | api-server | no (dev) / **yes (prod)** | in-memory MongoDB | Falls back to `mongodb-memory-server` in dev. |
| `JWT_SECRET` | api-server | **yes (prod)** | `dev-only-insecure-secret-change-me` | Server **fails to boot** in production if unset. |
| `JWT_EXPIRES_IN` | api-server | no | `7d` | |
| `FRONTEND_ORIGINS` | api-server | **yes (prod)** | empty (dev: reflects any origin) | Comma-separated allowed CORS origins; required in production. |
| `PORT` | both | injected by runtime | `8080` / `22333` | |
| `BASE_PATH` | web | injected by runtime | `/` | Used as Vite `base` and React Router `basename`. |
| `VITE_API_BASE_URL` | web | no | `''` (same-origin → `/api`) | Override only if hosting API on a different domain. |

## Demo credentials

Seeded after first signup. To recreate:

```bash
curl -X POST http://localhost:80/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Sales Demo","email":"sales@rubixcrm.dev","password":"demo1234","role":"sales"}'
```

(In-memory MongoDB resets every backend restart — set `MONGO_URI` to persist data.)

## Architectural notes

- The frontend lives in `artifacts/web` (the original `artifacts/mockup-sandbox` was a `design`-kind canvas artifact and could not host a normal web preview, so it was migrated to a proper `react-vite` artifact at `/`).
- Auth flow: `POST /api/auth/signup` and `POST /api/auth/login` return `{ user, token }`; the JWT lives in localStorage (`useAuth` hook) and is attached via the axios `axiosInstance` interceptor.
- Backend is unbundled (no esbuild step). Entry: `src/index.js` → connects DB → mounts `src/app.js`.
- Frontend uses path alias `@/` → `src/`.
- The Replit cartographer Vite plugin is intentionally disabled in `artifacts/web/vite.config.ts` because it injects JSX attributes that break TypeScript generic component syntax (`<Component<TypeArg> ...>`).

## Recent changes

- Integrated user-supplied `leads-rubix-backend` and `leads-rubix-crm-web` zips into the monorepo.
- Added in-memory MongoDB fallback (`mongodb-memory-server`) and `/api/healthz`.
- Added permissive-in-dev / strict-in-prod CORS using `FRONTEND_ORIGINS`.
- Made backend fail-fast in production when `JWT_SECRET` or `FRONTEND_ORIGINS` is missing.
- Patched signup payload mismatch — backend now defaults `role` to `'sales'` and accepts `name`.
- Made the User model store lowercase emails and added a `name` field.
- Wired Vite `base` to `BASE_PATH` and React Router `basename` to `import.meta.env.BASE_URL`.
- Added a `/api` Vite dev proxy as a fallback when not behind the Replit proxy.
