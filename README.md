# Mini D-Mart — Quick-Commerce Monorepo

Mini D-Mart is a full-stack, hyper-local grocery and quick-commerce platform supporting store pickup slots, home deliveries, return/exchange fulfillment workflows, and multi-tier role-based access control.

---

## 1. Monorepo Architecture

- **Backend (`/backend`)**: Express 5.2.1, Mongoose 9.9.3, JWT (httpOnly cookie session), RBAC, Helmet, NoSQL Sanitization, Rate Limiting, Jest + Supertest test suite.
- **Frontend (`/frontend`)**: React 19.2.8, Vite 8.0, React Router 8.3 (SPA declarative mode), Tailwind CSS v4, Vitest + @testing-library/react test suite.

---

## 2. Test Suites & Edge Cases Covered

The test suites validate core business invariants, security controls, and race condition defenses.

### 2.1 Backend Tests (`npm test --workspace=backend`)
- **Authentication & Email Enumeration**:
  - `POST /api/auth/register`: Successfully registers user, hashes password (12 bcrypt rounds), and sets secure `httpOnly` cookie.
  - `POST /api/auth/login`: Issues session token upon valid credentials.
  - **Zero Email Leakage**: Rejects non-existent accounts and wrong passwords with identical generic `"Invalid email or password."` messages.
- **Role-Based Access Control (RBAC)**:
  - Blocks `store_staff` from accessing `/api/admin/*` routes with `403 Forbidden`.
  - Blocks `customer` from creating store branches (`POST /api/stores`) with `403 Forbidden`.
  - Grants `admin` full access to administrative control routes.
- **Stock Validation & Race Conditions**:
  - `POST /api/cart/items`: Rejects adding requested quantity that exceeds currently available product stock.
  - `POST /api/orders/checkout`: Atomic inventory guard checks stock at checkout execution time; rejects order with descriptive error if stock drops concurrently.
- **Order State Machine Transitions**:
  - Valid status progression: `PLACED` &rarr; `CONFIRMED` &rarr; `PREPARING` &rarr; (`READY_FOR_PICKUP` | `OUT_FOR_DELIVERY`) &rarr; `COMPLETED`.
  - Rejects illegal skips (e.g. `PLACED` &rarr; `COMPLETED`) with `400 Bad Request`.
  - Rejects cancellation attempts once order enters `PREPARING` or later.
  - Automatically restores inventory and increments available pickup slots on cancellation.
- **Return & Exchange Eligibility Engine**:
  - Rejects return/exchange request if order is not completed (`PLACED`, `CONFIRMED`, `PREPARING`).
  - Rejects return request for non-returnable grocery products (`isReturnable: false`).
  - Rejects return request if elapsed time exceeds `product.returnWindowHours`.
  - Rejects duplicate return submissions for the same order item.
- **Pickup Slot Capacity**:
  - Rejects checkout booking when pickup slot is at capacity (`bookedCount >= maxOrders`).

### 2.2 Frontend Component Tests (`npm test --workspace=frontend`)
- **Cart Quantity Stepper**:
  - Decrement stepper button disabled at lower boundary (`qty <= 1`).
  - Increment stepper button disabled when quantity reaches `availableStock`.
  - Triggers quantity recalculation on step actions.
- **Protected Route Guards**:
  - Redirects unauthenticated visitors to `/login`.
  - Renders private route children for authenticated users.
- **Empty & Error UI States**:
  - Friendly empty state displays when order queue or return queue is empty.
  - High-visibility alert banners render correctly on error messages.

---

## 3. Running the Application & Tests

```bash
# Install dependencies
npm install

# Run backend tests (Jest + Supertest)
npm test --workspace=backend

# Run frontend tests (Vitest + Testing Library)
npm test --workspace=frontend

# Start development servers
npm run dev
```
