# FLOWLY Backend Foundation — V2.25

This phase creates the backend skeleton only. It intentionally does **not** migrate the frontend demo data into PostgreSQL yet.

## Included
- Node.js + Express API foundation
- `/api/v1` versioned routing
- Environment configuration via `.env`
- Helmet, CORS, JSON limits, request IDs
- Central 404 and error handling
- Cookie/Bearer JWT authentication foundation
- Owner/Admin role middleware
- PostgreSQL connection layer prepared but schema is deferred to the next database-design phase
- Health, Auth, Current Business and Intelligence endpoints
- Demo auth mode so the API can be exercised before the database exists

## Local start
1. `cd backend`
2. Copy `.env.example` to `.env`
3. `npm install`
4. `npm run check`
5. `npm run dev`

API: `http://localhost:8787/api/v1`

### Demo login (development only)
- owner@flowly.demo / flowly-demo
- admin@flowly.demo / flowly-demo

Never use these demo credentials in production. Set `AUTH_MODE` away from `demo` when database authentication is implemented.

## Endpoints
- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/businesses/me`
- `GET /api/v1/intelligence/overview?department=spa`

## Next phase
Design PostgreSQL schema and migrations for users, businesses, memberships/roles, customers, leads, bookings/requests, projects/tasks, activity history and AI insights. Then replace demo auth/data with repositories backed by PostgreSQL.

## V2.28 Authentication & Roles
Run `npm run check:auth`. Public `*-admin-demo.html` showroom pages intentionally remain public. Operational pages `dashboard.html`, `customers.html`, and `booking.html` use `/api/v1/auth/me` and redirect to `login.html` when unauthenticated.
