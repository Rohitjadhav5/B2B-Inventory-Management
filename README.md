# B2B Multi-Vendor Inventory and Order Management System

A full-stack MVP built with the MERN stack for a fresher portfolio. Vendors list products; managers browse and purchase via purchase orders.

---

## File Tree

```
B2B Inventory/
├── server/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── orderController.js
│   │   └── productController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── role.js
│   │   └── validate.js
│   ├── models/
│   │   ├── Order.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── orderRoutes.js
│   │   └── productRoutes.js
│   ├── utils/jwt.js
│   ├── validators/
│   │   ├── authValidators.js
│   │   ├── orderValidators.js
│   │   └── productValidators.js
│   ├── .env              (create from .env.example)
│   ├── .env.example
│   ├── package.json
│   ├── seed.js
│   └── server.js
│
└── client/
    ├── src/
    │   ├── api/axios.js
    │   ├── components/
    │   │   ├── FormInput.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── Spinner.jsx
    │   │   ├── StatusBadge.jsx
    │   │   └── Table.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── CartContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── OrderDetail.jsx
    │   │   ├── Register.jsx
    │   │   ├── manager/
    │   │   │   ├── BrowseProducts.jsx
    │   │   │   ├── CreateOrder.jsx
    │   │   │   ├── ManagerDashboard.jsx
    │   │   │   └── MyOrders.jsx
    │   │   └── vendor/
    │   │       ├── VendorDashboard.jsx
    │   │       ├── VendorOrders.jsx
    │   │       └── VendorProducts.jsx
    │   ├── routes/Guards.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── .env
    ├── .env.example
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Environment Variables

### server/.env.example
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/b2b_inventory?replicaSet=rs0
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### client/.env.example
```
VITE_API_URL=http://localhost:5000/api
```

---

## MongoDB Replica Set Requirement

**Transactions require a MongoDB Replica Set.** The orderController.js uses session.withTransaction() for atomic stock deduction and order creation. This will FAIL on a standalone mongod instance.

### Option A - Local Replica Set (recommended for development)

**Step 1:** Stop any running MongoDB instance.

**Step 2:** Create a data directory:
```bash
mkdir C:\data\rs0
```

**Step 3:** Start MongoDB as a replica set member:
```bash
mongod --replSet rs0 --dbpath C:\data\rs0 --port 27017
```

**Step 4:** Initiate the replica set (run once in mongosh):
```js
rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })
```

**Step 5:** Verify with rs.status() — stateStr should be PRIMARY.

**Step 6:** Your MONGO_URI in .env should be:
```
MONGO_URI=mongodb://127.0.0.1:27017/b2b_inventory?replicaSet=rs0
```

### Option B - MongoDB Atlas (cloud)
Use your Atlas connection string directly. Atlas always runs as a replica set.

---

## Setup and Running

### 1. Install dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Configure environment files

```bash
# Server - copy and edit
cp server/.env.example server/.env

# Client - copy and edit
cp client/.env.example client/.env
```

### 3. Seed the database

```bash
cd server
node seed.js
```

### 4. Start both servers (two terminals)

```bash
# Terminal 1 - API server (port 5000)
cd server
npm run dev

# Terminal 2 - Vite dev server (port 5173)
cd client
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Seeded Login Credentials

All passwords: password123

| Email                  | Role    | Company / Store  |
|------------------------|---------|------------------|
| vendor1@example.com    | vendor  | TechSupply Co.   |
| vendor2@example.com    | vendor  | GlobalGoods Ltd. |
| manager1@example.com   | manager | North Store      |
| manager2@example.com   | manager | South Store      |

---

## API Summary

### Auth
| Method | Endpoint           | Access | Description         |
|--------|--------------------|--------|---------------------|
| POST   | /api/auth/register | Public | Register a new user |
| POST   | /api/auth/login    | Public | Login and get JWT   |
| GET    | /api/auth/me       | Any    | Get current user    |

### Products
| Method | Endpoint          | Access  | Description                                       |
|--------|-------------------|---------|---------------------------------------------------|
| GET    | /api/products     | Both    | Vendor: own products. Manager: browse with pagination |
| POST   | /api/products     | Vendor  | Create a product                                  |
| PUT    | /api/products/:id | Vendor  | Update own product                                |
| DELETE | /api/products/:id | Vendor  | Delete own product                                |
| GET    | /api/vendors      | Manager | List all vendors for dropdown                     |

### Orders
| Method | Endpoint                 | Access         | Description                    |
|--------|--------------------------|----------------|--------------------------------|
| POST   | /api/orders              | Manager        | Create purchase order (atomic) |
| GET    | /api/orders              | Both           | Role-filtered, paginated       |
| GET    | /api/orders/:id          | Both           | Order detail with ownership    |
| PATCH  | /api/orders/:id/status   | Vendor         | Advance status forward only    |
| PATCH  | /api/orders/:id/cancel   | Manager/Vendor | Cancel if Pending Delivery     |

### Dashboard
| Method | Endpoint       | Access | Description          |
|--------|----------------|--------|----------------------|
| GET    | /api/dashboard | Both   | Role-specific stats  |

---

## Interview Talking Points

**1. Schema Design and References**

The three schemas (User, Product, Order) use Mongoose ref and populate() for relational data. The Order schema uses embedded subdocuments for items, snapshotting name and unitPrice at order time. This means price changes after ordering do not retroactively alter historical orders — a critical requirement for financial integrity in any e-commerce or procurement system.

**2. populate() Usage**

A central populateOrder() helper chains .populate('manager', ...).populate('vendor', ...).populate('items.product', ...) and is reused across all order query handlers. This avoids repetition and ensures consistent response shapes. Field projection strings like 'name email companyName' prevent leaking password hashes in every API response without extra code.

**3. Transaction Logic and Concurrency**

POST /api/orders and PATCH /api/orders/:id/cancel both use mongoose.startSession() with session.withTransaction(). Inside the transaction, stock is deducted with the filter { _id, stock: { $gte: qty } }. If modifiedCount === 0, another concurrent request already grabbed the last units — the transaction aborts and returns 409. This is the correct pattern for preventing overselling without pessimistic locking.

**4. Role Enforcement**

Roles are stored in the JWT payload (set at login, immutable until re-login). The protect middleware verifies the token; restrictTo('vendor') or restrictTo('manager') gates each route at the HTTP layer before any controller runs. Controllers also verify document ownership (e.g., order.vendor.toString() === req.user.id) to prevent cross-user data access. The frontend RoleRoute only improves UX — the server is the real security boundary.

**5. Zod Validation**

Every request body and query string passes through a validate(schema, target) middleware factory before any business logic runs. Zod's .refine() enforces cross-field rules like "no duplicate productIds in one order." Quantity is validated as .int().min(1). The .safeParse() approach produces structured errors[] in the 400 response, which the React frontend maps to per-field error messages for a professional UX.

**6. What I Would Add Next**

- Rate limiting with express-rate-limit on auth routes to prevent brute-force attacks
- Redis caching for product browse queries with cache invalidation on stock changes
- WebSocket notifications via Socket.io so managers see order status updates in real time
- Unit and integration tests with Jest and Supertest specifically covering the concurrent transaction scenarios
- CI/CD pipeline with GitHub Actions, Docker, and deployment to Railway or Render
- Audit log collection tracking every status change with actor ID, timestamp, and previous state for compliance
