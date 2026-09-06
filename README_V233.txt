FLOWLY V2.33 — Final Master QA & Release Candidate

Base: V2.32 Deployment Foundation
Visual baseline: preserved; no redesign in this pass.

Finalization in this release:
- synchronized backend/runtime release version to 2.33.0
- expanded database-design QA from 4 to all 6 migrations
- added holistic Final Master QA across frontend, auth, workflow, AI, security and deployment
- verified all local HTML links/assets/anchors
- verified JavaScript syntax across backend source/scripts
- retained 7 Customer Front demos + 7 Business Admin showroom demos
- retained production deployment guardrails and same-origin API routing

Release state:
- code/configuration release candidate
- requires live Docker/PostgreSQL/domain/HTTPS smoke test before public production launch
