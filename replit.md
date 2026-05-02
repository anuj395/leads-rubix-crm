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

## Role + Industry-based dynamic sidebar

The legacy single-document `sidebar_configs` collection was replaced with a normalized
4-table model managed entirely from the SuperAdmin UI:

| Collection | Purpose | Notable fields |
|---|---|---|
| `industries` | Tenants / verticals | `code` (unique), `name`, `is_active` |
| `roles` | Roles per industry | `industry_id`, `key`, `name`, unique on (industry_id, key) |
| `sidebar_menus` | Master menu catalog (tree) | `key` (unique), `parent_id` self-FK, `icon`, `route`, `module`, `order` |
| `sidebar_permissions` | Visibility per (role × industry × menu) | `is_visible`, `order_override`, unique on (role_id, industry_id, menu_id) |

REST endpoints (all behind `authenticate`; writes also `permit('superAdmin')`):

- `/api/industries`, `/api/roles`, `/api/sidebar-menus`, `/api/sidebar-permissions` — CRUD
- `POST /api/sidebar-permissions/bulk` `{ role_id, industry_id, menu_ids[] }` — overwrite visible perms
- `POST /api/sidebar/resolve` `{ industry_code, role_key }` — compose a flat tree for a user
- Legacy `POST /api/sidebar`, `GET /api/sidebar/:industry_id`, `POST /api/sidebar/user` are kept as compat shims that read/write through the normalized tables

Boot-time migration in `seed.js` is idempotent: when `industries` is empty it parses the legacy
seed JSON (dot-notation keys → parent/child via the `module` field) and populates all 4 tables
(currently 26 menus + 43 perms across 4 roles), then drops the legacy collection.

Cascade rules in services:
- delete industry → deletes its permissions and roles first
- delete role → deletes its permissions first
- delete menu → detaches direct children (`parent_id → null`), deletes its permissions, then the menu

SuperAdmin UI lives under `/configuration/{industries,roles,menus,permissions}` and is wired into
`menuConfig.ts` + `superAdminRouteMap.ts`. The Permissions Matrix page uses cancellation guards
on its async effects so rapid industry/role switching can't apply stale data.

A dev-only superAdmin (`dev@rubixcrm.dev` / `rubix1234`) is re-seeded on every API boot **only
when `NODE_ENV !== 'production'`** to keep the in-memory mongo workflow testable.

## Dynamic Screen Configuration System

Per-screen tables and forms are configured per (industry × role) via 3 normalized collections.
This replaced the legacy single-document `/api/table-configs` and `/api/form-configs` endpoints,
which have been deleted entirely.

| Collection | Purpose | Notable fields |
|---|---|---|
| `screens` | Modules whose UI is configurable | `key` (unique), `name`, `is_active` |
| `screen_fields` | Master field catalog per screen | `screen_id`, `field_key` (unique within screen), `label`, `type`, `is_table_visible`, `is_form_visible`, `is_required`, `sortable`, `order` |
| `screen_permissions` | Per (screen × role × industry × field) toggle | `is_enabled`, unique on (screen_id, role_id, industry_id, field_id) |

REST endpoints (all behind `authenticate`; writes require `permit('superAdmin')`):
- `/api/screens`, `/api/screen-fields`, `/api/screen-permissions` — CRUD
- `POST /api/screen-permissions/bulk` `{ screen_id, role_id, industry_id, field_ids[] }` — overwrite enabled set; validates that the role belongs to the industry and that every field belongs to the screen
- `POST /api/screens/resolve` `{ screen_key, industry_code?, role_key? }` — composes `{ screen, table_headers[], form_fields[] }` for the caller. Non-superAdmins cannot pass an explicit `industry_code` / `role_key`; those are forced to fall back to `req.user`, preventing cross-scope config exposure.

The frontend `useTableConfig(screen, industry_id)` hook is the only consumer in client pages
(ContactsList, TasksList) and feeds DataTable columns directly from the resolve response.

Cascade rules:
- delete screen → deletes its fields and all its permissions
- delete field → deletes its permissions
- delete role → deletes both sidebar and screen permissions for that role
- delete industry → deletes its roles, sidebar permissions, and screen permissions

Boot-time `seedScreens()` runs once on a fresh DB (skipped if `screens` is non-empty). It
creates two screens (`contacts`, `tasks`) with sensible default fields and enables every field
for industry `temp001` × all 4 seeded roles, so the existing client pages keep working.

SuperAdmin UI lives under `/configuration/{screens,screen-fields,screen-permissions}` and is
wired into `menuConfig.ts` + `superAdminRouteMap.ts`. All three pages use cancellation guards
on chained selectors (screen → fields, industry → roles, etc.) so rapid switching can't apply
stale data.

## Recent changes

- Added the Dynamic Screen Configuration System above (3 normalized collections, REST API with
  resolve composer, SuperAdmin UI, cascade deletes through role/industry, FK-aware bulkSet
  validation, IDOR-safe resolve, boot-time seed for contacts/tasks). Removed legacy
  `/api/table-configs`, `/api/form-configs`, and the old HeadersConfig page entirely.
- Added the role+industry sidebar system above (4 collections, REST API, SuperAdmin UI, idempotent
  migration, cascade deletes, race-safe Permissions Matrix).
- Integrated user-supplied `leads-rubix-backend` and `leads-rubix-crm-web` zips into the monorepo.
- Added in-memory MongoDB fallback (`mongodb-memory-server`) and `/api/healthz`.
- Added permissive-in-dev / strict-in-prod CORS using `FRONTEND_ORIGINS`.
- Made backend fail-fast in production when `JWT_SECRET` or `FRONTEND_ORIGINS` is missing.
- Patched signup payload mismatch — backend now defaults `role` to `'sales'` and accepts `name`.
- Made the User model store lowercase emails and added a `name` field.
- Wired Vite `base` to `BASE_PATH` and React Router `basename` to `import.meta.env.BASE_URL`.
- Added a `/api` Vite dev proxy as a fallback when not behind the Replit proxy.
