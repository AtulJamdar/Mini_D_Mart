# Mini D-Mart Architecture & System Design

Mini D-Mart is structured as a decoupled full-stack monorepo following a clean **Layered Service-Oriented Architecture (SOA)** with strict separation of presentation, validation, business logic, persistence, and audit capabilities.

---

## 1. System Architecture Diagram

```text
               +-------------------------------------------------------------+
               |                  React 19 SPA (Vite + Tailwind v4)          |
               |  [ShopPage] [CartPage] [CheckoutPage] [OrdersPage]          |
               |  [StaffPage] [ManagerPage] [AdminPage]                      |
               +------------------------------+------------------------------+
                                              | HTTPS / withCredentials (httpOnly Cookie)
                                              v
+------------------------------------------------------------------------------------------+
|                                    Express 5.2 API Gateway                               |
|  [Helmet Headers] [CORS: CLIENT_URL] [General & Auth Rate Limiters] [NoSQL Sanitizer]   |
+---------------------------------------------+--------------------------------------------+
                                              |
     +----------------------------------------+---------------------------------------+
     |                                        |                                       |
     v                                        v                                       v
[Auth & RBAC Middleware]            [Input Validation Layer]            [Global Error Handler]
- JWT Verification                  - express-validator                 - Zero stack leak in prod
- Role Hierarchy Guard              - Body / Query / Param sanitization - Standard envelope
     |                                        |                                       |
     +----------------------------------------+---------------------------------------+
                                              |
                                              v
+------------------------------------------------------------------------------------------+
|                                      Controller Layer                                    |
| [auth.controller] [cart.controller] [order.controller] [return.controller]               |
| [store.controller] [product.controller] [category.controller] [admin.controller]        |
+---------------------------------------------+--------------------------------------------+
                                              |
                                              v
+------------------------------------------------------------------------------------------+
|                                       Service Layer                                      |
| [cartService.js]            - Live totals, stock limit validation                        |
| [orderService.js]           - State Machine (PLACED->CONFIRMED->PREP->DISPATCH/READY->COMP)
|                             - Atomic stock decrement with rollback compensation          |
| [returnEligibilityService]  - Product returnable policy, time window math, duplicate guard |
| [returnService.js]          - Restock execution & replacement exchange order creation    |
| [auditLogger.service.js]    - Asynchronous audit event stream                            |
+---------------------------------------------+--------------------------------------------+
                                              |
                                              v
+------------------------------------------------------------------------------------------+
|                                     Mongoose 9.9 Data Layer                              |
| [User] [Store] [Category] [Product] [Cart] [Order] [ReturnRequest] [PickupSlot] [AuditLog]|
+---------------------------------------------+--------------------------------------------+
                                              |
                                              v
                                   [MongoDB 7.0+ Database]
```

---

## 2. Component Responsibilities

### 2.1 Backend Layers
1. **Security & Gateway**:
   - `helmet`: Sets secure HTTP headers (`X-Frame-Options`, `X-Content-Type-Options`).
   - `cors`: Restricted strictly to `process.env.CLIENT_URL` with explicit credentials support.
   - `express-mongo-sanitize`: Eliminates `$` and `.` operator NoSQL injection vectors.
   - `express-rate-limit`: Prevents brute force and denial of service.
2. **Middleware Layer**:
   - `middlewares/auth.js`: Verifies JWT from `httpOnly` cookie (or `Authorization: Bearer` fallback).
   - `middlewares/rbac.js`: `requireRole(...roles)` higher-order function enforcing granular permission access.
   - `middlewares/errorHandler.middleware.js`: Formats all errors into `{ success: false, data: null, error, message }` and suppresses stack traces in production.
3. **Controller Layer**:
   - Thin routing controllers that delegate all business logic to dedicated services, ensuring **controllers never exceed single-responsibility limits**.
4. **Service Layer (Core Domain Logic)**:
   - `cartService.js`: Cart mutations and stock boundary checks.
   - `orderService.js`: State machine validation, pickup slot capacity reservation, inventory decrement with compensation rollback.
   - `returnEligibilityService.js`: Strict time-window and returnability policy engine.
   - `returnService.js`: Restocking and replacement exchange workflows.
   - `auditLogger.service.js`: Asynchronous logging of security and operational transactions.

### 2.2 Frontend Layers
1. **Context & State Providers**:
   - `AuthContext.jsx`: User profile bootstrapping via `/api/auth/me` with pure `httpOnly` cookie session persistence (zero `localStorage` JWT storage).
   - `CartContext.jsx`: Client cart synchronization with live stock validations.
2. **Modular Components (`< 300` lines)**:
   - `OrderQueueList.jsx`: Shared pickup (slot-grouped) and delivery queue with fast-track state machine action triggers.
   - `ReturnQueueList.jsx`: Inspection and approval queue for customer returns and exchanges.
   - `InventoryTable.jsx`: Cross-store inventory table with low-stock warnings and inline stock updates.
   - `ReturnRequestModal.jsx`: Interactive modal for customer return/exchange submissions.
   - `ProtectedRoute.jsx` & `RoleRoute.jsx`: Declarative route guards.
