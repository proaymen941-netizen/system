# نظام إدارة الحضور

نظام متكامل لإدارة حضور وانصراف الموظفين مع واجهة عربية RTL.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Wouter + TanStack Query + Tailwind CSS + shadcn/ui
- Font: Cairo (Arabic)

## Where things live

- `artifacts/api-server/src/routes/` — Express API routes
- `artifacts/attendance/src/pages/` — React frontend pages
- `artifacts/attendance/src/context/AuthContext.tsx` — Auth state management (uses fetch directly, not hooks, to avoid duplicate React issues)
- `artifacts/attendance/src/components/Layout.tsx` — Sidebar layout
- `lib/db/src/schema/` — Drizzle ORM schema (employees, attendance, leaves, overtime, announcements)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — Generated React Query hooks from Orval

## Architecture decisions

- Auth uses custom SHA256 + HMAC token (base64 encoded, no JWT library)
- AuthContext uses direct fetch (not generated hooks) to avoid duplicate React instance errors in monorepo
- All pages use generated hooks from `@workspace/api-client-react`
- RTL is set globally via `html { direction: rtl }` in index.css
- Geolocation required for check-in/check-out

## Product

- Employee login with role-based access (admin/manager/employee)
- Check-in/checkout with geolocation
- Leave management with approval workflow
- Overtime tracking with approval workflow
- Manager dashboard with real-time attendance stats
- Announcements board
- Daily and monthly attendance reports

## User preferences

- Arabic (RTL) interface throughout
- Navy/teal color scheme (sidebar is dark navy, accent is sky blue)
- Cairo font for all Arabic text

## Seed Accounts

| Username | Password | Role |
|---|---|---|
| admin | admin123 | مسؤول |
| manager1 | manager123 | مدير |
| emp001 | emp123 | موظف |
| emp002 | emp123 | موظف |
| emp003 | emp123 | موظف |

## Gotchas

- Do not use generated hooks in AuthContext (causes duplicate React instance error)
- Always run codegen after changing openapi.yaml: `pnpm --filter @workspace/api-spec run codegen`
- `pnpm --filter @workspace/db run push` to apply schema changes to dev DB

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
