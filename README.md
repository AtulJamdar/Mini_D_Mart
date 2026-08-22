# Mini D-Mart Monorepo

Mini D-Mart is a full-stack MERN application for retail store operations and e-commerce shopping.

## Architecture

- **Root**: NPM Workspaces monorepo
- **Backend**: Node.js (ESM), Express 5.2.1, Mongoose 9.9.3, JWT, Rate Limiting, Helmet
- **Frontend**: React 19.2.8, Vite 8.x, React Router 8.3.0 (SPA Declarative mode), Tailwind CSS 4.3.3 (`@tailwindcss/vite`)

## System Requirements

- **Node.js**: `>=24.0.0` (Active LTS pinned in engines)
- **NPM**: `>=10.0.0`

## Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env` in both packages:
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Servers
```bash
# Run both backend and frontend concurrently
npm run dev

# Or run separately
npm run dev:backend
npm run dev:frontend
```
