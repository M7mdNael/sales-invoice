# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Email**: Resend SDK (OTP verification)
- **Build**: esbuild

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API backend
│   └── mobile/             # Expo React Native mobile app (Sales Invoice App)
├── lib/                    # Shared libraries
│   └── db/                 # Drizzle ORM schema + DB connection
├── pnpm-workspace.yaml     # pnpm workspace config
├── tsconfig.base.json      # Shared TS options
└── package.json            # Root package
```

## Mobile App — Sales Invoice App (`artifacts/mobile`)

Cloud-synced Sales & Sales Return invoicing system built with Expo React Native.

### Features
- **OTP Email Verification**: 6-digit code sent via Resend at signup
- **Multi-Employee Model**: One shared email per company; each device registers its own name. First device = admin. All employees share invoices/returns/companies/products via cloud sync
- **Employee Identity**: Device UUID stored in AsyncStorage as `employeeId`; sent to server on registration to upsert the employee record
- **Team Screen**: Lists all team members with invoice/return activity counts, admin badge, "You" badge. Admin can remove non-admin members
- **Products**: Add, edit, delete products with name and price (JOD)
- **Companies**: Company management (cloud-synced)
- **Sales Invoices**: Create/edit invoices with customer name, products, auto-total in JOD (INV-0001…); synced to cloud
- **Sales Returns**: Standalone returns tied to company (RET-0001…); synced to cloud
- **Creator Tracking**: Each invoice/return stores `creatorEmail` + `creatorName` (shown in list view)
- **Trash / Restore**: Soft-delete with restore; permanent delete
- **Invoice List / Return List**: Show creator name for workspace-shared items
- **Reports**: Total Sales, Total Returns, Net Revenue in JOD
- **PDF Export & Share**: Generate HTML→PDF via expo-print, share via expo-sharing
- **Bilingual**: English / Arabic with RTL support
- **Settings**: Profile edit, admin badge, Team Members link, language selector, sign out

### Data Persistence
- **Cloud**: PostgreSQL via Express API (invoices, returns)
- **Local**: AsyncStorage (companies, products, user profile, counters)

### Navigation Structure
- `app/(tabs)/` — Home, Invoices, Returns, Reports tabs
- `app/invoice/create.tsx` — Create/edit sales invoice (modal) — async save
- `app/invoice/[id].tsx` — Invoice details + PDF share + create return
- `app/return/create.tsx` — Create/edit return invoice (modal) — async save
- `app/return/[id].tsx` — Return details + PDF share
- `app/products/index.tsx` — Product management
- `app/companies/index.tsx` — Company management
- `app/settings/index.tsx` — Profile, workspace sync, language, sign out
- `app/trash.tsx` — Soft-deleted invoices and returns
- `app/onboarding.tsx` — 3-step flow: email → OTP → profile (last name required)

### Key Files
- `context/AppContext.tsx` — All invoice/return state; async CRUD; fetchFromServer on login
- `context/UserContext.tsx` — User profile, register, joinWorkspace, refreshWorkspace, logout
- `utils/api.ts` — `getApiBase()`, typed fetch helpers
- `utils/pdf.ts` — PDF HTML generation + expo-print + expo-sharing
- `utils/format.ts` — Currency (JOD) and date formatting
- `constants/colors.ts` — Theme colors

## API Server (`artifacts/api-server`)

Express 5 backend on port 8080. Workflow: "Start Backend API".

### Routes
- `POST /api/verify/send` — Send 6-digit OTP via Resend (requires `RESEND_API_KEY` secret)
- `POST /api/verify/check` — Verify OTP code (in-memory store, 10 min expiry)
- `POST /api/auth/register` — Register/update user, create workspace, return `{workspaceId, inviteCode}`
- `GET  /api/auth/profile?email=` — Fetch user profile + inviteCode
- `GET  /api/workspace?email=` — Get workspace info
- `POST /api/workspace/join` — Join another user's workspace by invite code
- `GET  /api/invoices?email=&deleted=` — List active or trashed invoices for workspace
- `POST /api/invoices` — Create invoice
- `PUT  /api/invoices/:id` — Update invoice
- `DELETE /api/invoices/:id?permanent=` — Soft-delete or permanent delete
- `POST /api/invoices/:id/restore` — Restore soft-deleted invoice
- `GET  /api/returns?email=&deleted=` — List active or trashed returns for workspace
- `POST /api/returns` — Create return
- `PUT  /api/returns/:id` — Update return
- `DELETE /api/returns/:id?permanent=` — Soft-delete or permanent delete
- `POST /api/returns/:id/restore` — Restore soft-deleted return

## Database Schema (`lib/db/src/schema/index.ts`)

- `users` — email (PK), firstName, lastName, phone, workspaceId
- `workspaces` — id (UUID), inviteCode (unique 6-char), ownerEmail
- `employees` — id (device UUID, PK), email (company email), firstName, lastName, isAdmin (bool), createdAt
- `invoices` — id, workspaceId, invoiceNumber, companyId/Name, customerName, date, itemsJson, total, creatorEmail, creatorName, deletedAt
- `returns` — same shape as invoices + originalInvoiceId/Number
- `companies` — id, workspaceId, name, notes, createdAt, updatedAt
- `products` — id, workspaceId, name, price, createdAt, updatedAt

## Workflows

- **Start Backend API** — `pnpm --filter @workspace/api-server run dev` on port 8080
- **artifacts/mobile: expo** — `pnpm --filter @workspace/mobile run dev` on port 18115

## Environment / Secrets

- `DATABASE_URL` — PostgreSQL connection (provisioned)
- `RESEND_API_KEY` — Required for OTP email sending via Resend (must be set by user)

## Development Notes

- API server dev script sets PORT to 8080 by default
- Mobile dev script uses `EXPO_OFFLINE=1` to prevent Expo auth prompt
- `EXPO_PUBLIC_DOMAIN` env var → `https://{domain}` for API base URL; falls back to `http://localhost:80`
- Metro config sets absolute `projectRoot` and `watchFolders` for pnpm monorepo compatibility
- `expo-clipboard` installed for clipboard copy in settings
- `react-native-keyboard-controller` pinned to `^1.18.5`
