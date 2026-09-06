# FLOWLY V2.27 — API ↔ PostgreSQL Integration

## Authentication
Set `AUTH_MODE=database`. Login now reads `users + business_members + businesses`, verifies the built-in scrypt password hash, and issues the existing JWT session cookie.

## Endpoints
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/businesses/me`
- `PATCH /api/v1/businesses/me` (owner/admin)
- `GET|POST /api/v1/customers`
- `PATCH /api/v1/customers/:id`
- `GET|POST /api/v1/leads`
- `PATCH /api/v1/leads/:id`
- `POST /api/v1/service-requests/public` (Customer Front intake)
- `GET /api/v1/service-requests` (authenticated business inbox)

All authenticated queries are scoped by `req.user.businessId` to preserve tenant isolation.

## Local setup order
1. Create PostgreSQL database and set `DATABASE_URL`.
2. Apply migrations `001`, `002`, `003` in order.
3. Set `AUTH_MODE=database` and a strong `JWT_SECRET`.
4. Run `npm run seed:demo` to create a local owner + `flowly-demo` business.
5. Run `npm start`.

The static Customer Front forms keep their browser-local fallback; when the API is reachable they also submit the request to PostgreSQL.
