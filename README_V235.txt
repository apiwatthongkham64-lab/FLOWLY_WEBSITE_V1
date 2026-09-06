FLOWLY V2.35 — FIRST LIVE DEPLOYMENT

Base: V2.34 Production Environment Setup
Visual/frontend redesign: none

Added:
- Safe first-live deploy scripts for Windows and Linux
- Docker/Compose preflight and environment validation
- Ordered image build -> DB health -> migration -> API/Web startup
- Automated local smoke tests through Nginx
- Runtime status commands
- Non-destructive rollback commands
- First-live deployment runbook

Important: this package prepares and validates the deployment workflow. It does not claim an external production server has been launched from this environment.
