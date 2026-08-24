# Mini D-Mart Security Policy & Audit Report

This document outlines the security architecture, threat mitigations, audit findings, hardening fixes, and documented limitations implemented across the **Mini D-Mart** application.

---

## 1. Security Review & Hardening Summary

| Area | Status | Implementation Details |
| :--- | :--- | :--- |
| **Authentication & Session Management** | ✅ Hardened | JWTs are delivered via **`httpOnly` cookies** (`maxAge: 7d`, `SameSite: Lax`, `Secure` in production) with dual-layer `Authorization: Bearer` support. |
| **Role-Based Access Control (RBAC)** | ✅ Hardened | All mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) enforce both `authenticate` and `requireRole(...)` middleware. Unauthorized actions return `403 Forbidden`. |
| **Email Enumeration Prevention** | ✅ Hardened | The login endpoint returns identical generic error messages (`"Invalid email or password."`) regardless of whether the email exists in the database or the password was incorrect. |
| **NoSQL Injection Defense** | ✅ Hardened | Input sanitization is applied globally to sanitize all user inputs (`req.body`, `req.query`, `req.params`) against `$` and `.` operator injections. |
| **HTTP Headers & CORS** | ✅ Hardened | `helmet` is enabled with security headers. `cors` is strictly restricted to `process.env.CLIENT_URL` with explicit HTTP methods and headers whitelist with `credentials: true`. |
| **Rate Limiting & DoS Protection** | ✅ Hardened | `express-rate-limit` enforces strict limits on authentication endpoints (`20 req / 15 min`) and general API traffic (`200 req / 15 min`). Request bodies are limited to `10kb`. |
| **Error Handling & Information Disclosure**| ✅ Hardened | Global error handler suppresses internal stack traces in `production` and outputs sanitized, generic error responses for 500 errors. |
| **Password Hashing** | ✅ Hardened | All user passwords (including admin-provisioned staff accounts) are hashed using **`bcryptjs` with 12 salt rounds**. |
| **Audit Logging** | ✅ Hardened | Dedicated asynchronous `AuditLoggerService` records authentication attempts (both successes & failures with IP/User-Agent) and critical business transactions (`ORDER_CREATED`, `STATUS_TRANSITION`, `RETURN_APPROVED`). |

---

## 2. Known Architectural Trade-offs & Security Implications

### Dual-Layer Token Storage (`httpOnly` Cookie + `localStorage` Bearer Token)

* **Current Architecture**:
  JWT authentication tokens are issued in both an `httpOnly` cookie and returned in the JSON payload for client-side persistence in `localStorage` (attached via Axios request interceptor as `Authorization: Bearer <token>`).

* **Why this Decision Was Made**:
  1. **Cross-Domain & Cross-Port Resilience**: Modern browsers increasingly partition or block third-party cookies across different domains/ports (e.g. frontend on `localhost:5173` calling backend on `localhost:5000`, or a Vercel-hosted frontend calling a separate Railway/AWS API subdomain).
  2. **Preventing Session Dropouts**: Providing dual-layer authentication prevents unhandled 401 session invalidations if a client browser or privacy extension restricts cross-origin cookie headers.

* **Security Trade-off**:
  - **XSS Exposure Risk**: Storing a JWT in `localStorage` makes the access token accessible to client-side JavaScript, re-introducing the risk of token exfiltration if a Cross-Site Scripting (XSS) vulnerability exists. A pure `httpOnly` cookie setup protects against script-based token theft.

* **Production Mitigation Roadmap**:
  In a high-security production deployment, this trade-off should be migrated to:
  1. **In-Memory Access Tokens + `httpOnly` Refresh Cookie**:
     - Store a short-lived access token (5–15 min lifetime) strictly in JavaScript memory (`React state / context`), never writing it to `localStorage`.
     - Issue a long-lived (7-day) refresh token stored exclusively inside a secure, `httpOnly`, `SameSite=Strict` cookie.
     - Implement silent token renewal via `POST /api/auth/refresh` on page reloads and before token expiration.
  2. **Strict Content Security Policy (CSP)**:
     - Enforce a strict CSP header via Helmet (`default-src 'self'; script-src 'self'`) to eliminate untrusted script execution.
  3. **Same-Origin Reverse Proxy / Custom Domain**:
     - Route frontend and API through a unified origin (e.g. `shop.dmart.com` and `shop.dmart.com/api` via Nginx / Cloudflare), eliminating the cross-domain cookie restrictions entirely.

---

## 3. Mutating Routes RBAC Matrix

| Route | Method | Required Role |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public |
| `/api/auth/otp/request` | `POST` | Public |
| `/api/auth/otp/verify` | `POST` | Public |
| `/api/auth/logout` | `POST` | Authenticated |
| `/api/cart/*` | `POST`, `PUT`, `DELETE` | Authenticated (`customer`, `staff`, `manager`, `admin`) |
| `/api/payments/razorpay/order` | `POST` | Authenticated Customer |
| `/api/payments/razorpay/verify` | `POST` | Authenticated Customer |
| `/api/orders/:id/cancel` | `PATCH` | Authenticated Customer (Order Owner) |
| `/api/orders/:id/status` | `PATCH` | `store_staff`, `store_manager`, `admin` |
| `/api/returns` | `POST` | Authenticated Customer |
| `/api/returns/:id/approve` | `PATCH` | `store_manager`, `admin` |
| `/api/returns/:id/reject` | `PATCH` | `store_manager`, `admin` |
| `/api/returns/:id/refund` | `POST` | `store_manager`, `admin` |
| `/api/products/:id/stock` | `PATCH` | `store_manager`, `admin` |
| `/api/stores` | `POST`, `PATCH` | `admin` |
| `/api/categories` | `POST`, `PATCH` | `admin` |
| `/api/admin/staff` | `POST`, `GET`, `PATCH` | `admin` |

---

## 4. Reporting a Vulnerability

To report a security vulnerability or concern, please open a private GitHub advisory or reach out directly to the repository maintainers.
