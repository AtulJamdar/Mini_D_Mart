# Architectural Decision Records (ADRs) & Industry Benchmarks

This document records the foundational architectural decisions, domain constraints, and business logic rationale implemented in **Mini D-Mart**, referencing battle-tested patterns in quick-commerce leaders such as **BigBasket, Blinkit, and Zepto**.

---

## 1. Return & Exchange Eligibility Engine

### Context
In hyper-local grocery and quick-commerce, processing unrestricted returns causes significant shrinkage, inventory write-offs of perishables, and customer dispute overhead.

### Decision & Implementation
1. **Order Completion Anchor**: Return/exchange requests are strictly rejected until the order transitions to `COMPLETED` (customer has physically received goods).
2. **Category Returnability Policy (`isReturnable`)**: Highly perishable items (fresh whole milk, eggs, loose produce) are flagged `isReturnable: false` at the catalog level.
3. **Dynamic Return Window (`returnWindowHours`)**:
   - Packaged staples & electronics: `24h` to `48h` return window.
   - Non-perishable groceries: `24h` return window calculated from `order.completionTimestamp`.
4. **Resolution Workflows**:
   - **Return & Refund**: Upon store manager approval, the returned product quantity is atomically restored to stock (`$inc: { stock: qty }`).
   - **Exchange Replacement**: Atomically checks and decrements replacement inventory and automatically provisions a linked replacement order (`Order` with zero balance).

### Industry Benchmark
Mirrors **BigBasket & Blinkit return policies**, where perishable daily essentials are non-returnable post-delivery, while non-perishable packaged items have a strict 24–48 hour dispute window requiring evidence photos.

---

## 2. Pickup Slot Capacity & Race Condition Guards

### Context
When multiple customers checkout simultaneously for high-demand pickup slots (e.g. 6:00 PM – 8:00 PM evening rush), unbounded bookings cause physical store congestion and counter delays.

### Decision & Implementation
1. **Pre-allocated Capacity Caps**: Each pickup slot enforces `maxOrders` and tracks `bookedCount`.
2. **Frontend Early Rejection**: Full slots (`bookedCount >= maxOrders`) are rendered disabled with visual capacity badges.
3. **Atomic DB Check at Checkout**: Checkout uses an atomic MongoDB conditional check:
   ```js
   PickupSlot.findOneAndUpdate(
     { _id: slotId, bookedCount: { $lt: slot.maxOrders } },
     { $inc: { bookedCount: 1 } }
   );
   ```
4. **Restitution on Cancellation**: If an order is cancelled or checkout fails during stock decrement, the slot reservation is automatically decremented (`$inc: { bookedCount: -1 }`).

### Industry Benchmark
Mirrors **D-Mart Ready & Walmart Click & Collect slot booking engines**, ensuring physical retail counters never exceed hourly fulfillment throughput.

---

## 3. Order Cancellation Cutoff State Machine

### Context
Allowing customers to cancel orders after warehouse staff have picked, bagged, or dispatched goods leads to spoiled refrigerated items and wasted packaging costs.

### Decision & Implementation
1. **Strict Cutoff Rule**: Customers are permitted to self-cancel orders **only** when the order is in `PLACED` or `CONFIRMED` status.
2. **Transition Barrier**: Once the store staff moves the order to `PREPARING`, customer self-cancellation is strictly disabled.
3. **Automatic Restitution**: Cancelling during `PLACED`/`CONFIRMED` atomically restores decremented stock to the catalog and releases the reserved pickup slot.

```text
[PLACED] ----(Cancel Allowed: Restock)----+
   |                                      |
   v                                      v
[CONFIRMED] -(Cancel Allowed: Restock)-> [CANCELLED]
   |
   v (Cutoff Point: Packing Begins)
[PREPARING] -(Cancel Prohibited)-+
   |                             |
   v                             v
[READY_FOR_PICKUP / OUT_FOR_DELIVERY] -> [COMPLETED]
```

### Industry Benchmark
Mirrors **Zepto & Blinkit cancellation policies**, which disable order cancellation immediately once the store picker begins packing the bag.

---

## 4. Multi-Tier Role-Based Access Control (RBAC) Split

### Context
Operational integrity requires separating customer shopping from physical floor fulfillment and financial inventory adjustments.

### Decision & Implementation
- **`customer`**: Shopping, live cart mutations, checkout, order history, self-cancellation before prep, return submissions.
- **`store_staff`**: Ground operations: fulfilling slot-grouped pickup orders, dispatching delivery drivers, advancing state machine (`Mark Ready`, `Mark Picked Up`, `Mark Delivered`), inspecting returns.
- **`store_manager`**: Store-level authority: inline inventory replenishment, low-stock threshold alerts, one-click return/exchange approval & rejection.
- **`admin`**: Headquarters oversight: multi-store branch provisioning, staff account creation (12-round bcrypt hashes), category taxonomy, cross-store global inventory, and audit trail inspection.

### Security Implementation
- Pure **`httpOnly` cookie JWT tokens** (zero `localStorage` storage).
- `requireRole(...roles)` middleware enforcing least-privilege access across all API endpoints.
