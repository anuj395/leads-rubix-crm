# LeadsRubix Web

Feature-oriented React CRM scaffold built with Vite, TypeScript, Redux Toolkit, React Router, Axios, and MUI.

## Available scripts

- `npm run dev` starts the Vite development server
- `npm run build` runs TypeScript compilation and the production build
- `npm run lint` checks the codebase with ESLint
- `npm run preview` serves the production build locally

## Source structure

```text
src/
  app/
  assets/
  components/
  config/
  features/
  hooks/
  layouts/
  routes/
  services/
  store/
  styles/
  types/
  utils/
  main.tsx
```

## Implemented modules

- `auth`: login page, local session persistence, protected routes
- `leads`: seeded leads list, search, add-lead workflow
- `store`: centralized Redux store and typed hooks
- `services`: axios instance with auth token interceptor and storage helpers
- `styles`: MUI theme plus shared global CSS

## Demo behavior

- The login flow is mocked locally for scaffolding purposes
- Any valid email plus a password with at least 4 characters can sign in
- Leads are stored in Redux state and persist for the active browser session only through auth storage

## Environment variables

This project reads the API base URL and app name from Vite environment variables. Create or edit an env file at the project root (examples provided):

- `.env.development` — used during local development (example already contains `VITE_API_BASE_URL=http://localhost:3001`).
- `.env.production` — used for production builds (`VITE_API_BASE_URL=https://backend.leadsrubix.com`).
- `.env.local` or `.env` — local overrides (not committed).

The app uses `VITE_API_BASE_URL` and automatically normalizes/join it with `/api` at runtime. After changing env files restart the dev server.

Example:

```
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_NAME=LeadsRubix
```

