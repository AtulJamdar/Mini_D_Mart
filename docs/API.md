# Mini D-Mart API Reference

All API responses follow the standard JSON envelope structure:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "message": "Descriptive status message"
}
```

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a user, issues `httpOnly` cookie. Body: `{ name, email, password, phone }`. |
| `POST` | `/api/auth/login` | Public | Authenticates user. Generic error on failure. Body: `{ email, password }`. |
| `GET` | `/api/auth/me` | Logged In | Returns current session user profile from token cookie. |
| `POST` | `/api/auth/logout` | Logged In | Clears the `token` authentication cookie. |

---

## 2. Cart Management (`/api/cart`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | Customer | Retrieves user cart with live-recalculated subtotal, 5% tax, and delivery fee. |
| `POST` | `/api/cart/items` | Customer | Adds/increments item after stock check. Body: `{ productId, qty }`. |
| `PUT` | `/api/cart/items/:productId` | Customer | Updates item quantity. Rejects if `qty > stock`. Body: `{ qty }`. |
| `DELETE`| `/api/cart/items/:productId` | Customer | Removes a specific item from cart. |
| `DELETE`| `/api/cart` | Customer | Clears all items from cart. |

---

## 3. Order Management (`/api/orders`)

| Method | Endpoint | Auth / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders/checkout` | Customer | Atomic checkout. Decrements stock, reserves slot. Body: `{ fulfillmentType: 'pickup'\|'delivery', storeId, pickupSlotId?, address? }`. |
| `GET` | `/api/orders` | Logged In | Paginated order list (own orders for customer; all store orders for staff/manager). Query: `?status=&page=&limit=`. |
| `GET` | `/api/orders/:id` | Logged In | Full order detail with status history timeline and pickup/delivery info. |
| `PATCH` | `/api/orders/:id/cancel` | Customer (Owner)| Cancels order if in `PLACED`/`CONFIRMED`. Restores stock and slot count. |
| `PATCH` | `/api/orders/:id/status` | Staff/Manager/Admin| Transitions status via State Machine. Body: `{ status, note? }`. |

---

## 4. Return & Exchange Subsystem (`/api/returns`)

| Method | Endpoint | Auth / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/returns` | Customer | Submits return or exchange request. Body: `{ orderId, itemId, type: 'return'\|'exchange', reason, evidenceUrls[] }`. |
| `GET` | `/api/returns` | Logged In | Queries own requests for customers; store review queue for staff/managers. |
| `GET` | `/api/returns/eligibility/:orderId/:itemId` | Logged In | Checks if an order item is within return window and returnable. |
| `PATCH` | `/api/returns/:id/approve` | Manager / Admin | Approves request. **Return**: Restocks product stock. **Exchange**: Decrements replacement stock and creates linked replacement order. |
| `PATCH` | `/api/returns/:id/reject` | Manager / Admin | Rejects return request with manager notes. Body: `{ reason }`. |

---

## 5. Catalog & Inventory (`/api/products`, `/api/categories`, `/api/stores`)

| Method | Endpoint | Auth / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | Lists products. Query: `?category=&search=&storeId=`. |
| `PATCH` | `/api/products/:id/stock` | Manager / Admin | Inline stock adjustment. Body: `{ stock: number }`. |
| `POST` | `/api/products/seed` | Admin (in Prod) | Seeds flagship store, categories, slot times, and sample catalog. |
| `GET` | `/api/categories` | Public | Lists all product categories. |
| `POST` | `/api/categories` | Admin | Creates a new category. Body: `{ name, description?, imageUrl? }`. |
| `PATCH` | `/api/categories/:id` | Admin | Updates category or toggles `isActive`. |
| `GET` | `/api/stores` | Public | Lists active retail supermarket stores. |
| `POST` | `/api/stores` | Admin | Creates a store branch. Body: `{ name, address, geo }`. |
| `PATCH` | `/api/stores/:id` | Admin | Updates store details or open/closed status. |
| `GET` | `/api/stores/:storeId/slots` | Public | Lists time slots with `availableSlots` and `isFull` flags. |
| `GET` | `/api/stores/:storeId/analytics`| Staff/Manager/Admin | Returns today's sales, active orders, low-stock count, and pending returns. |

---

## 6. Administration (`/api/admin`)

| Method | Endpoint | Auth / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/overview` | Admin | System-wide counts (Revenue, Stores, Users, Products, Audits). |
| `GET` | `/api/admin/users` | Admin | Filterable directory of users. Query: `?role=&search=&page=`. |
| `POST` | `/api/admin/users` | Admin | Creates staff/manager account with 12-round bcrypt hash. |
| `PATCH` | `/api/admin/users/:id` | Admin | Updates role, active status, or assigned store. |
| `GET` | `/api/admin/audit-logs` | Admin | Query security audit events. Query: `?userId=&action=&resource=&from=&to=`. |
