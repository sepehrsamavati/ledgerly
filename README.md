# Ledgerly

Ledgerly is a privacy-friendly shared money ledger designed to operate in both **client-only mode** (completely in-browser with local persistence) and optional **backend mode** (with a Fastify/TypeScript backend server).

---

## High-Level Architecture Diagram

```text
                ┌──────────────────────┐
                │      Ledgerly Core   │
                │     (@ledgerly/core) │
                │ Types                │
                │ Validation           │
                │ Calculations         │
                │ Currency / Money     │
                │ Settlement           │
                └──────────┬───────────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
      ┌──────▼──────┐             ┌──────▼──────┐
      │     Web     │             │    Server   │
      │(@ledgerly/web)            │(@ledgerly/server)
      │ React/Vite  │             │ Fastify     │
      │ Browser UI  │             │ Node API    │
      └──────┬──────┘             └──────┬──────┘
             │                           │
      ┌──────▼───────────────────────────▼──────┐
      │            LedgerRepository             │
      │          (@ledgerly/storage)            │
      └──────┬───────────────────────────┬──────┘
             │                           │
      ┌──────▼──────┐             ┌──────▼──────┐
      │  IndexedDB  │             │ Server HTTP │
      │ Storage     │             │ Persistence │
      └─────────────┘             └─────────────┘
```

---

## Monorepo Structure

```text
ledgerly/
├── apps/
│   ├── web/                     # React + Vite + MUI Web App
│   │   ├── src/
│   │   │   ├── components/      # UI Layout & Page Components
│   │   │   ├── config/          # Environment / Config Layer
│   │   │   ├── context/         # Repository Context
│   │   │   ├── i18n/            # JSON-based Localization (en, fa)
│   │   │   ├── pages/           # Route Views (/ , /groups, /settings)
│   │   │   └── theme/           # MUI LTR/RTL Dynamic Theme
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── server/                  # Fastify / Node Backend App
│       ├── src/
│       │   ├── app/             # Fastify application setup
│       │   ├── controllers/     # HTTP Request controllers
│       │   ├── infrastructure/  # Server Configuration
│       │   ├── routes/          # API Route handlers
│       │   └── services/        # Backend Ledger services
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── core/                    # Shared Domain & Ledger Engine
│   │   ├── src/
│   │   │   ├── domain/          # Entities (Money, Currency, Ledger, Transaction)
│   │   │   ├── calculations/    # Split, Balance & Settlement Algorithms
│   │   │   ├── validation/      # Shared Domain Validation Schemas
│   │   │   ├── serialization/   # BigInt JSON Serialization
│   │   │   └── index.ts
│   │   ├── test/                # Core Domain Unit Tests
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── storage/                 # Storage Abstraction & Adapters
│       ├── src/
│       │   ├── repository/      # LedgerRepository Interface
│       │   ├── local/           # IndexedDB & InMemory Repository Adapters
│       │   └── server/          # Server HTTP Client Repository Adapter
│       ├── test/                # Storage Adapter Tests
│       ├── tsconfig.json
│       └── package.json
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Package Responsibilities

* **`@ledgerly/core`**: The single source of truth for domain logic, types, monetary representations (exact integer minor units), split calculations, balance simplification, settlement algorithms, and validation rules. It has zero DOM or Node HTTP dependencies and runs anywhere.
* **`@ledgerly/storage`**: Provides the abstract `LedgerRepository` interface and concrete adapters (`IndexedDBRepository` for browser persistence, `InMemoryRepository` for server/testing, `ServerHttpRepository` for client-to-server sync).
* **`@ledgerly/server`**: Fastify REST backend providing server endpoints (`/api/ledgers/:id`) without duplicating core domain logic or calculations.
* **`@ledgerly/web`**: React 19 frontend application built with Vite and MUI, featuring full LTR/RTL support, JSON i18n, and dynamic base-path routing.

---

## Operating Modes

### 1. Client-Only Mode
* Works entirely in the browser with no backend server required.
* Uses `IndexedDBRepository` as the primary persistence layer.
* Data remains local to the user's browser across page refreshes.
* Supports importing and exporting ledger JSON files.

### 2. Backend Mode
* Optional Fastify server provides shared data persistence over HTTP API.
* Frontend can be pointed to the backend by configuring `VITE_APP_MODE=backend` and `VITE_API_BASE_URL`.
* Uses `ServerHttpRepository` to interact with backend endpoints seamlessly through the exact same `LedgerRepository` interface.

---

## Arbitrary Base-Path Deployment

Ledgerly supports deployment under arbitrary URL paths (e.g. `https://example.com/ledgerly/` or `https://example.com/apps/ledgerly/`):

1. **Vite Base Path**: Configured via `VITE_BASE_PATH` in `vite.config.ts` (defaults to `./` for relative asset loading).
2. **React Router Basename**: Configured dynamically in `<BrowserRouter basename={config.basePath}>`.
3. **API Base URL**: Configured dynamically via `VITE_API_BASE_URL` without assuming `/api` or fixed domain roots.

---

## Getting Started

### Prerequisites
* Node.js v20 or higher
* npm v10 or higher

### Installation
```bash
npm install
```

### Running Applications

* **Web App (Dev Server)**
  ```bash
  npm run dev:web
  ```

* **Backend Server (Dev)**
  ```bash
  npm run dev:server
  ```

* **Run All Workspaces**
  ```bash
  npm run dev
  ```

### Build, Typecheck, and Test

* **Build All Packages**
  ```bash
  npm run build
  ```

* **Run Typechecks**
  ```bash
  npm run typecheck
  ```

* **Run Tests**
  ```bash
  npm run test
  ```
