# Inventory Management System

A complete **Inventory Management System** with **4 components**:
- 🌐 **Web Application** (React frontend)
- 📡 **Backend API** (Node.js/Express server)  
- 🖥️ **Desktop Application** (Electron)
- 🗄️ **Database** (PostgreSQL with Prisma)

## 🚀 Features

### Backend
- ✅ **Strong Authentication**: JWT access + refresh tokens with rotation
- ✅ **Role-Based Access Control**: 5 roles with strict creation matrix
- ✅ **Password Security**: Argon2id hashing with strong policy enforcement
- ✅ **Audit Logging**: Immutable audit trail for all user operations
- ✅ **Bootstrap Mode**: Secure first-owner creation
- ✅ **Validation**: Zod schemas for all inputs
- ✅ **Rate Limiting**: Protection against brute force attacks
- ✅ **Clean Architecture**: Service layer pattern with dependency injection

### Roles & Permissions

| Role | Can Create | Permissions |
|------|-----------|-------------|
| **owner_ultimate_super_admin** | All roles | Full access - create/edit/delete anyone, view audit logs |
| **admin** | cashier, inventory_manager | Manage cashiers and inventory managers only |
| **cashier** | None | View own profile only |
| **inventory_manager** | None | View own profile only |
| **guest** | None | View-only access (own profile + public org info) |

### Role Creation Matrix

```
owner → owner, admin, cashier, inventory_manager, guest
admin → cashier, inventory_manager
cashier → (none)
inventory_manager → (none)
guest → (none)
```

## 📋 Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** 15+
- **npm** or **yarn**
- **Docker** (optional, for containerized PostgreSQL)

## 🛠️ Quick Start

### **1. Backend Server**
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Server runs on http://localhost:4000
```

### **2. Web Application**
```bash
# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### **3. Desktop Application**
```bash
# Install electron dependencies
cd electron
npm install

# Run desktop app
npm run dev

# Or use the ready-made executable
cd portable-dist
.\Inventory Management System.bat
```

### **4. Database Setup**
```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

## 📁 **Project Structure**

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed directory organization and Git strategy.

### **Components:**
- **Backend**: Node.js/Express API server
- **Frontend**: React web application
- **Desktop**: Electron desktop app
- **Database**: PostgreSQL with Prisma ORM
```

### 2. Database Setup

#### Option A: Docker (Recommended)
```bash
npm run docker:up
```

This starts PostgreSQL on `localhost:5432` and Adminer on `localhost:8080`.

#### Option B: Local PostgreSQL
Create a database and update `.env`:
```bash
createdb user_management
```

### 3. Environment Configuration

The `.env` file is already configured for local development:
```env
DATABASE_URL="postgresql://userapp:userapp123@localhost:5432/user_management?schema=public"
PORT=4000
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production-min-32-chars-abc123xyz
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars-xyz789abc
BOOTSTRAP_ENABLED=true
BOOTSTRAP_TOKEN=bootstrap-secret-token-change-me-in-production
```

### 4. Run Migrations

```bash
npm run db:migrate
```

### 5. Seed Database (Optional)

```bash
npm run db:seed
```

This creates 5 demo users:

| Username | Password | Role |
|----------|----------|------|
| `owner` | `Owner@123456` | owner_ultimate_super_admin |
| `admin` | `Admin@123456` | admin |
| `cashier` | `Cashier@123456` | cashier |
| `inventory_mgr` | `Inventory@123456` | inventory_manager |
| `guest_user` | `Guest@123456` | guest |

### 6. Start Server

```bash
npm run dev:server
```

Server runs on: **http://localhost:4000**

## 📡 API Endpoints

Base URL: `http://localhost:4000/api/v1`

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Bootstrap first owner | No (bootstrap token) |
| POST | `/auth/login` | Login with email/username + password | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout and invalidate refresh token | Yes |
| POST | `/auth/change-password` | Change password (requires current) | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |

### Users

| Method | Endpoint | Description | Auth Required | RBAC |
|--------|----------|-------------|---------------|------|
| GET | `/users` | List users with filters | Yes | owner, admin |
| GET | `/users/stats` | Get user statistics | Yes | owner, admin |
| GET | `/users/:id` | Get user by ID | Yes | RBAC enforced |
| POST | `/users` | Create new user | Yes | Role matrix enforced |
| PUT | `/users/:id` | Update user | Yes | RBAC enforced |
| PATCH | `/users/:id/status` | Activate/deactivate user | Yes | owner only |
| DELETE | `/users/:id` | Delete user (soft delete) | Yes | owner only |

### Me (Current User)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/me` | Get current user profile | Yes |
| GET | `/me/permissions` | Get current user permissions | Yes |

### Audit

| Method | Endpoint | Description | Auth Required | RBAC |
|--------|----------|-------------|---------------|------|
| GET | `/audit` | List audit logs | Yes | owner only |
| GET | `/audit/stats` | Get audit statistics | Yes | owner only |

## 🔐 Bootstrap Flow

If no users exist in the database:

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "display_name": "System Administrator",
    "password": "SecurePass123!",
    "bootstrap_token": "bootstrap-secret-token-change-me-in-production"
  }'
```

This creates the **first owner** and then disables open registration.

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Test Files

- `src/__tests__/rbac.service.test.ts` - RBAC policy matrix tests
- `src/__tests__/password.test.ts` - Password validation and hashing tests

## 📦 Scripts

```bash
npm run dev:server        # Start development server with hot reload
npm run build            # Build TypeScript to JavaScript
npm start                # Start production server
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with demo users
npm run db:reset         # Reset database (drops all data!)
npm run db:studio        # Open Prisma Studio (DB GUI)
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run lint             # Lint code
npm run format           # Format code with Prettier
npm run docker:up        # Start Docker containers
npm run docker:down      # Stop Docker containers
```

## 🏗️ Project Structure

```
110ct/
├── prisma/
│   └── schema.prisma           # Database schema
├── src/
│   ├── __tests__/              # Unit tests
│   ├── config/                 # Configuration
│   ├── database/               # Database client
│   ├── middleware/             # Express middleware
│   ├── routes/                 # API routes
│   ├── services/               # Business logic
│   │   ├── rbac.service.ts    # RBAC enforcement
│   │   ├── auth.service.ts    # Authentication
│   │   ├── user.service.ts    # User management
│   │   └── audit.service.ts   # Audit logging
│   ├── utils/                  # Utilities
│   ├── validators/             # Zod schemas
│   ├── server.ts              # Express app
│   └── seed.ts                # Database seeder
├── .env                        # Environment variables
├── docker-compose.yml          # Docker services
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 Security Features

- **Argon2id** password hashing with strong parameters
- **JWT** with short-lived access tokens (15min) and refresh tokens (7 days)
- **Refresh token rotation** on every refresh
- **Rate limiting** on auth routes (5 attempts per 15min)
- **Input validation** with Zod
- **SQL injection protection** via Prisma ORM
- **Helmet.js** for security headers
- **Password policy**: min 10 chars, mixed case + digit/symbol
- **Self-demotion prevention**: Cannot deactivate/delete last owner
- **Audit logging** for all sensitive operations

## 🚧 Future Enhancements (Placeholders)

- [ ] 2FA/TOTP support
- [ ] Email service integration
- [ ] Multi-tenancy/organizations
- [ ] SSO/OIDC integration
- [ ] Password reset via email
- [ ] Session management UI
- [ ] Inventory module integration

## 📖 API Examples

### Login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "owner",
    "password": "Owner@123456"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "username": "owner",
    "email": "owner@example.com",
    "role": "owner_ultimate_super_admin",
    ...
  },
  "access_token": "eyJhbGciOiJIUzI1...",
  "refresh_token": "a1b2c3d4..."
}
```

### Create User

```bash
curl -X POST http://localhost:4000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "username": "john_cashier",
    "email": "john@example.com",
    "display_name": "John Doe",
    "password": "SecurePass123!",
    "role": "cashier"
  }'
```

### List Users

```bash
curl -X GET "http://localhost:4000/api/v1/users?role=cashier&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Current User

```bash
curl -X GET http://localhost:4000/api/v1/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🐛 Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running: `docker ps` or `pg_isready`
- Check `.env` DATABASE_URL matches your setup

### Bootstrap Not Working
- Ensure `BOOTSTRAP_ENABLED=true` in `.env`
- Check bootstrap token matches
- Verify database is empty: `npm run db:reset` (⚠️ deletes all data)

### JWT Token Invalid
- Tokens expire (15min for access, 7d for refresh)
- Use `/auth/refresh` to get a new access token

## 📝 License

MIT

## 👥 Contributors

Built with ❤️ by the development team.

---

**Ready for production?** Update secrets in `.env`, set `NODE_ENV=production`, and deploy! 🚀





