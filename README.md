# Express Tasks API

A production-hardened, multi-tenant REST API built with **Node.js**, **Express 5**, **TypeScript**, and **PostgreSQL (Neon)**.

## Key Features & Architecture
- **Strict TypeScript (`NodeNext`, `verbatimModuleSyntax`)**: Layered architecture separating routes, Zod validation middleware, controllers, services, and database access.
- **Stateless JWT Authentication**: User registration and login with salted `bcrypt` password hashing and signed JWT access tokens.
- **Multi-Tenant Data Isolation**: Every task query is scoped to the authenticated user's `user_id`; cross-user access attempts intentionally return `404 Not Found` to prevent resource enumeration.
- **Runtime Validation & Error Normalization**: Request bodies, params, and startup environment variables are validated with **Zod**; PostgreSQL `SQLSTATE` errors are normalized into consistent JSON responses.
- **Production Security Hardening**: Configured with `helmet` security headers, restricted `cors` origins, tiered `express-rate-limit` brute-force protection, and a database-backed `/health` endpoint.
- **Automated Integration Testing**: Full test suite using **Vitest** and **Supertest** against an isolated test database covering health checks, auth flows, CRUD validation, and cross-user isolation.

## Tech Stack
- **Runtime & Framework**: Node.js, Express 5, TypeScript
- **Database**: PostgreSQL (`pg` connection pool with parameterized queries)
- **Validation & Security**: Zod, `jsonwebtoken`, `bcrypt`, `helmet`, `cors`, `express-rate-limit`
- **Testing**: Vitest, Supertest

## API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Server & PostgreSQL connectivity health check |
| `POST` | `/api/auth/register` | Public | Register a new user and receive a JWT |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive a JWT |
| `GET` | `/api/tasks` | Bearer | List all tasks belonging to the authenticated user |
| `GET` | `/api/tasks/:id` | Bearer | Fetch a single task by ID (scoped to user) |
| `POST` | `/api/tasks` | Bearer | Create a new task |
| `PATCH` | `/api/tasks/:id` | Bearer | Update task title or completion status |
| `DELETE` | `/api/tasks/:id` | Bearer | Delete a task |

## Local Setup

1. **Clone & install dependencies**
   ```bash
   git clone https://github.com/kyle-dowling/express-tasks-api.git
   cd express-tasks-api
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` (and `.env.test` for integration tests) and fill in your PostgreSQL connection string and a 32+ character `JWT_SECRET`.

3. **Run database schema**
   Create the `users` and `tasks` tables in your PostgreSQL instance.

4. **Start development server or run tests**
   ```bash
   npm run dev      # Start dev server with watch mode
   npm test         # Run Vitest + Supertest integration suite
   npm run build    # Compile TypeScript to dist/
   ```
