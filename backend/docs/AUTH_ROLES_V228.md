# FLOWLY V2.28 Authentication & Roles

Roles:
- Owner: full business access, member management, AI/automation approval.
- Admin: business settings + CRM/lead/request/intelligence operations; no member ownership controls.
- Staff: operational read access, lead updates, no business settings/customer edits/AI admin.

Session:
- JWT is issued after login and stored in an HttpOnly SameSite=Lax cookie.
- `/api/v1/auth/me` is the session source of truth for browser clients.
- `/api/v1/auth/logout` clears the session cookie.
- Admin application pages redirect to `login.html` when the session is absent/expired.
- Public department `*-admin-demo.html` pages remain public showroom demos and are intentionally not protected.

Demo accounts (AUTH_MODE=demo):
- owner@flowly.demo / flowly-demo
- admin@flowly.demo / flowly-demo
- staff@flowly.demo / flowly-demo
