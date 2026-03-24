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
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mobile/             # Expo React Native mobile app (Sales Invoice App)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Mobile App — Sales Invoice App (`artifacts/mobile`)

Offline Sales & Sales Return invoicing system built with Expo React Native.

### Features
- **Products**: Add, edit, delete products with name and price (JOD)
- **Sales Invoices**: Create invoices with customer name, multiple products, auto-total in JOD (INV-0001...)
- **Sales Returns**: Select existing invoices, enter return quantities (validated against sold qty), create RET-0001...
- **Invoice List**: View all sales invoices with details screen
- **Return List**: View all return invoices with details screen
- **Reports**: Total Sales, Total Returns, Net Revenue in JOD with stats
- **PDF Export & Share**: Generate HTML→PDF via expo-print, share via expo-sharing

### Data Persistence
- AsyncStorage (no internet, no server dependency)
- Stored: products, salesInvoices, returnInvoices, counters

### Navigation Structure
- `app/(tabs)/` — Home, Invoices, Returns, Reports tabs with NativeTabs (iOS 26) / classic Tabs fallback
- `app/invoice/create.tsx` — Create sales invoice (modal)
- `app/invoice/[id].tsx` — Invoice details + PDF share + create return
- `app/return/create.tsx` — Create return invoice (modal), select invoice
- `app/return/[id].tsx` — Return details + PDF share
- `app/products/index.tsx` — Product management (add/edit/delete inline)

### Key Files
- `context/AppContext.tsx` — All app state with AsyncStorage persistence
- `utils/pdf.ts` — PDF HTML generation + expo-print + expo-sharing
- `utils/format.ts` — Currency (JOD) and date formatting
- `constants/colors.ts` — Theme colors (blue #1A73E8, success/danger/warning)
