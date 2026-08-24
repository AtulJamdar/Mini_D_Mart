# Mini D-Mart Database Schema & Entity Relationships

Mini D-Mart uses **MongoDB 7.0+** with **Mongoose 9.9** schemas. Every collection is strictly typed, validated, indexed for query performance, and linked via entity relationships.

---

## 1. Entity Relationship Diagram (ERD)

```text
[User] (1) ---------------------< (N) [Order] (1) -----------------< (N) [ReturnRequest]
   | (1)                                  | (N)                              | (1)
   |                                      |                                  |
   v (1)                                  v (1)                              v (1)
[Cart] (1) ---< (N) [Product] (N) >------ [Store] (1) -----------< (N) [PickupSlot]
                       | (N)                 | (1)
                       |                     |
                       v (1)                 v (N)
                  [Category]              [AuditLog]
```

---

## 2. Collections & Schema Definitions

### 2.1 `users`
Represents customers, store staff, store managers, and administrators.
- `name` (String, required, trimmed)
- `email` (String, required, unique, lowercase, indexed)
- `passwordHash` (String, required, 12-round bcrypt hash)
- `role` (Enum: `['customer', 'store_staff', 'store_manager', 'admin']`, default: `customer`, indexed)
- `phone` (String, trimmed)
- `isActive` (Boolean, default: `true`)
- `assignedStoreId` (ObjectId &rarr; `Store`, optional)
- `addresses` (Array of subdocuments: `street`, `city`, `state`, `pincode`, `landmark`, `isDefault`)
- `timestamps` (`createdAt`, `updatedAt`)

### 2.2 `stores`
Represents physical retail supermarket branches.
- `name` (String, required, trimmed)
- `address` (Subdocument: `street`, `city`, `state`, `pincode`)
- `geo` (GeoJSON Point: `coordinates: [longitude, latitude]`, 2dsphere index)
- `isActive` (Boolean, default: `true`, indexed)
- `timestamps` (`createdAt`, `updatedAt`)

### 2.3 `categories`
Master product taxonomy catalog.
- `name` (String, required, unique, trimmed, indexed)
- `description` (String, trimmed)
- `imageUrl` (String, trimmed)
- `isActive` (Boolean, default: `true`, indexed)

### 2.4 `products`
Inventory items stocked per store branch.
- `name` (String, required, trimmed, indexed)
- `categoryId` (ObjectId &rarr; `Category`, required, indexed)
- `price` (Number, required, min: 0)
- `stock` (Number, required, min: 0, integer)
- `unit` (String, required, e.g. `'1kg'`, `'500ml'`, `'1 pack'`)
- `isReturnable` (Boolean, default: `true`)
- `returnWindowHours` (Number, default: `24`, min: 0)
- `images` (Array of String URLs)
- `storeId` (ObjectId &rarr; `Store`, required, indexed)
- *Compound Index*: `{ categoryId: 1, storeId: 1 }`, `{ storeId: 1, stock: 1 }`

### 2.5 `carts`
Live customer shopping carts.
- `userId` (ObjectId &rarr; `User`, required, unique, indexed)
- `items` (Array of `{ productId: ObjectId -> Product, qty: Number (min: 1) }`)
- `timestamps` (`createdAt`, `updatedAt`)

### 2.6 `orders`
Customer purchases and lifecycle records.
- `userId` (ObjectId &rarr; `User`, required, indexed)
- `items` (Array of `{ productId: ObjectId -> Product, qty: Number, priceAtOrder: Number }`)
- `status` (Enum: `['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled']`, default: `placed`, indexed)
- `fulfillmentType` (Enum: `['pickup', 'delivery']`, required)
- `storeId` (ObjectId &rarr; `Store`, required, indexed)
- `pickupSlotId` (ObjectId &rarr; `PickupSlot`, optional)
- `address` (Subdocument: `street`, `city`, `state`, `pincode`, optional)
- `subtotal` (Number), `taxAmount` (Number), `deliveryFee` (Number), `totalAmount` (Number)
- `statusHistory` (Array of `{ status, timestamp, actor, actorRole, note }`)
- *Compound Index*: `{ userId: 1, status: 1 }`, `{ storeId: 1, createdAt: -1 }`

### 2.7 `returnrequests`
Post-fulfillment return and exchange requests.
- `orderId` (ObjectId &rarr; `Order`, required, indexed)
- `itemId` (ObjectId &rarr; `Product`, required, indexed)
- `type` (Enum: `['return', 'exchange']`, required)
- `reason` (String, required, trimmed)
- `status` (Enum: `['requested', 'approved', 'rejected', 'completed']`, default: `requested`, indexed)
- `evidenceUrls` (Array of String URLs)
- `resolvedBy` (ObjectId &rarr; `User`, optional)
- `resolvedAt` (Date, optional)
- `resolutionNote` (String, optional)
- *Compound Index*: `{ orderId: 1, itemId: 1 }`

### 2.8 `pickupslots`
Daily time-window slots per store branch.
- `storeId` (ObjectId &rarr; `Store`, required, indexed)
- `startTime` (Date, required)
- `endTime` (Date, required)
- `maxOrders` (Number, required, default: 10)
- `bookedCount` (Number, required, default: 0)
- *Compound Index*: `{ storeId: 1, startTime: 1 }`

### 2.9 `auditlogs`
System security and business event audit trail.
- `userId` (ObjectId &rarr; `User`, optional, indexed)
- `action` (String, required, indexed, e.g. `'AUTH_LOGIN_SUCCESS'`, `'ORDER_CREATED'`, `'ADMIN_UPDATE_USER'`)
- `resource` (String, required, e.g. `'AUTH'`, `'ORDER'`, `'PRODUCT'`, `'USER'`)
- `resourceId` (String, optional, indexed)
- `metadata` (Mixed object with IP, User-Agent, state diffs)
- `createdAt` (Date, default: `Date.now`, indexed)
