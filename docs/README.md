# Mini D-Mart — System Documentation & Quickstart

Mini D-Mart is a full-stack, hyper-local quick-commerce and grocery platform built as a clean modular monorepo. It features time-slotted store pickup, home delivery dispatch, automated return/exchange eligibility resolution, inline inventory replenishment, and multi-tier role-based access control (RBAC).

---

## 1. Technology Stack

- **Target Runtime**: Node.js `>=24.0.0` (Active LTS pinned in `engines`)
- **Backend**:
  - `express@5.2.1` with ESM modules (`"type": "module"`)
  - `mongoose@9.9.3` for MongoDB object modeling
  - `jsonwebtoken@9.0.3` (1h short-lived access tokens via secure `httpOnly` cookie)
  - `bcryptjs` (12 salt rounds)
  - `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`, `morgan`
  - **Testing**: Jest + Supertest with in-memory MongoDB
- **Frontend**:
  - `react@19.2.8` & `react-dom@19.2.8`
  - `vite@^8.0.0`
  - `react-router@8.3.0` (declarative SPA library mode)
  - `axios@1.19.0` (configured with `withCredentials: true`)
  - `tailwindcss@4.3.3` with `@tailwindcss/vite` (Tailwind v4 `@theme` design tokens)
  - **Testing**: Vitest + `@testing-library/react` + `@testing-library/jest-dom`

---

## 2. Seeded Test Credentials (By Role)

| Role | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Customer** | `alice@example.com` | `Password123!` | Browse catalog, live cart, checkout (pickup slot / delivery), order history, return/exchange request. |
| **Store Staff** | `staff@example.com` | `StaffPass123!` | Slot-grouped pickup fulfillment queue, delivery dispatch, order status advancement, pending returns review. |
| **Store Manager** | `manager@example.com` | `ManagerPass123!` | All staff views + store KPI widgets, inline stock editing, low-stock alerts, one-click return/exchange approval/rejection. |
| **Administrator** | `admin@example.com` | `AdminPass123!` | Master multi-store management, staff account provisioning, category management, global inventory, security audit logs. |

---

## 3. Local Setup & Execution Guide

### Prerequisites
- Node.js `>=24.0.0`
- MongoDB running locally at `mongodb://127.0.0.1:27017` (or MongoDB Atlas connection URI in `.env`)

### Installation
```bash
# 1. Clone repository
git clone https://github.com/AtulJamdar/Mini_D_Mart.git
cd Mini_D_Mart

# 2. Install monorepo dependencies
npm install

# 3. Configure environment variables (defaults provided)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Running Locally
```bash
# Start both backend (port 5000) and frontend (port 5173) in watch mode:
npm run dev

# Or run individual workspaces:
npm run dev:backend   # Express API server on http://localhost:5000
npm run dev:frontend  # Vite React SPA on http://localhost:5173
```

### Seeding Sample Catalog & Stores
```bash
# Populate flagship store, categories, slot schedules, and products:
curl -X POST http://localhost:5000/api/products/seed
```

---

## 4. Running Automated Test Suites

```bash
# Run backend Jest + Supertest integration tests (16 tests):
npm test --workspace=backend

# Run frontend Vitest + Testing Library component tests (8 tests):
npm test --workspace=frontend

# Verify production build bundle:
npm run build:frontend
```
