# Mini D-Mart Security Policy & Audit Report

This document outlines the security architecture, threat mitigations, audit findings, hardening fixes, and documented limitations implemented across the **Mini D-Mart** application.

---

## 1. Security Review & Hardening Summary

| Area | Status | Implementation Details |
| :--- | :--- | :--- |
| **Authentication & Session Management** | ✅ Hardened | JWTs are delivered and managed strictly via **`httpOnly` cookies** (`SameSite`, `Secure` in production). `localStorage` token storage has been completely eliminated from the frontend to mitigate XSS-based token exfiltration. |
| **Role-Based Access Control (RBAC)** | ✅ Hardened | All mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) enforce both `authenticate` and `requireRole(...)` middleware. Unauthorized actions return `403 Forbidden`. |
| **Email Enumeration Prevention** | ✅ Hardened | The login endpoint returns identical generic error messages (`"Invalid email or password."`) regardless of whether the email exists in the database or the password was incorrect. |
| **NoSQL Injection Defense** | ✅ Hardened | `express-mongo-sanitize` is applied globally to sanitize all user inputs (`req.body`, `req.query`, `req.params`) against `$` and `.` operator injections. |
| **HTTP Headers & CORS** | ✅ Hardened | `helmet` is enabled with security headers. `cors` is strictly restricted to `process.env.CLIENT_URL` with explicit HTTP methods and headers whitelist. |
| **Rate Limiting & DoS Protection** | ✅ Hardened | `express-rate-limit` enforces strict limits on authentication endpoints (`20 req / 15 min`) and general API traffic (`200 req / 15 min`). Request bodies are limited to `10kb`. |
| **Error Handling & Information Disclosure**| ✅ Hardened | Global error handler suppresses internal stack traces in `production` and outputs sanitized, generic error responses for 500 errors. |
| **Password Hashing** | ✅ Hardened | All user passwords (including admin-provisioned staff accounts) are hashed using **`bcryptjs` with 12 salt rounds**. |
| **Audit Logging** | ✅ Hardened | Dedicated asynchronous `AuditLoggerService` records authentication attempts (both successes & failures with IP/User-Agent) and critical business transactions (`ORDER_CREATED`, `STATUS_TRANSITION`, `RETURN_APPROVED`). |

---

## 2. Mutating Routes RBAC Matrix

| Route | Method | Required Role |
| :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public (Customer default) |
| `/api/auth/login` | `POST` | Public |
| `/api/auth/logout` | `POST` | Authenticated |
| `/api/cart/*` | `POST`, `PUT`, `DELETE` | Authenticated (`customer`, `staff`, `manager`, `admin`) |
| `/api/orders/checkout` | `POST` | Authenticated Customer |
| `/api/orders/:id/cancel` | `PATCH` | Authenticated Customer (Order Owner) |
| `/api/orders/:id/status` | `PATCH` | `store_staff`, `store_manager`, `admin` |
| `/api/returns` | `POST` | Authenticated Customer |
| `/api/returns/:id/approve` | `PATCH` | `store_manager`, `admin` |
| `/api/returns/:id/reject` | `PATCH` | `store_manager`, `admin` |
| `/api/products/:id/stock` | `PATCH` | `store_manager`, `admin` |
| `/api/products/seed` | `POST` | `admin` (in production) |
| `/api/stores` | `POST`, `PATCH` | `admin` |
| `/api/categories` | `POST`, `PATCH` | `admin` |
| `/api/admin/users` | `POST`, `PATCH` | `admin` |

---

## 3. Deliberately Noted Limitations & Future Considerations

The following design decisions are documented as **known limitations**, not defects:

1. **No Email Verification / OTP Workflow**:
   - *Current State*: User accounts are activated immediately upon registration without confirming mailbox ownership via SMTP / OTP.
   - *Rationale*: Optimized for rapid local deployment, demo workflows, and offline evaluation without requiring third-party email provider credentials (SendGrid, AWS SES).
   - *Roadmap*: Future releases will add a tokenized email verification loop before enabling customer order checkout.

2. **Self-Contained In-Memory / Single DB Transactions**:
   - *Current State*: Stock race condition guards use atomic conditional updates (`$inc` with `$gte` check) with compensation rollbacks.
   - *Rationale*: Fully compatible with standalone MongoDB instances without requiring a multi-node replica set cluster.

---

## 4. Reporting a Vulnerability

To report a security vulnerability or concern, please open a private GitHub advisory or reach out directly to the repository maintainers.
