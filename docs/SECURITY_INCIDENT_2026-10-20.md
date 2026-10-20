# Security Incident Report — 2026-10-20

**Incident Reference:** SEC-2026-10-20-01
**Severity:** High (Resolved)
**Status:** Remediated & Verified
**Date:** October 20, 2026

---

## 1. Executive Summary

During the pre-push security audit for Milestone M1 of the JobLume AI SaaS migration, two separate hardcoded credentials were identified in the repository git history:
1. An active OpenRouter API key (`[REDACTED_OPENROUTER_KEY]`) committed to `backend/.render.yaml`.
2. A plaintext administrative password (`[REDACTED_ADMIN_PASSWORD]`) committed to `backend/scripts/seed_admin.py` and executed on container startup via `backend/Dockerfile`.

Both credentials were systematically revoked, rotated across all associated services, scrubbed from git history across all commits and refs, and replaced by robust architectural controls. The remote repository has been force-pushed with leases, verified clean, and redeployed successfully.

---

## 2. Incidents & Exposure Details

### Incident A: OpenRouter API Key in `.render.yaml`
- **Location:** `backend/.render.yaml` under `OPENROUTER_API_KEY.value`.
- **Nature of Exposure:** Active third-party LLM API key committed directly in Infrastructure-as-Code service configuration.
- **Risk:** Unauthorized token usage, API quota exhaustion, and unauthorized inference costs.

### Incident B: Plaintext Administrator Password in `seed_admin.py`
- **Location:** `backend/scripts/seed_admin.py` under `ADMIN_PASSWORD = "..."`.
- **Nature of Exposure:** Plaintext administrator credential embedded in database bootstrap script, combined with automatic execution during Docker container initialization (`CMD` in `Dockerfile`).
- **Risk:** Unauthorized administrative access on live deployments; risk to external accounts where password reuse occurred.

---

## 3. Timeline of Detection and Response

- **2026-10-20 17:30 UTC:** Automated secret scanning identified the hardcoded OpenRouter key and plaintext admin password during Milestone M1 audit.
- **2026-10-20 17:45 UTC:** OpenRouter API key revoked via OpenRouter dashboard. Billing logs inspected: zero anomalous spend occurred.
- **2026-10-20 17:50 UTC:** Admin password rotated on live deployment and on 4 independent third-party services where password reuse existed.
- **2026-10-20 18:00 UTC:** Confirmed zero forks exist on the GitHub remote (`HippomasAKiB1/Joblume-AI`).
- **2026-10-20 18:15 UTC:** `git-filter-repo` executed locally with two-way redaction:
  - OpenRouter key ending in `...2ad83` $\rightarrow$ `REDACTED_OPENROUTER_KEY`
  - Admin password $\rightarrow$ `REDACTED_ADMIN_PASSWORD`
- **2026-10-20 18:25 UTC:** Configuration fixes applied:
  - `backend/.render.yaml` set to `sync: false` for `OPENROUTER_API_KEY`.
  - `backend/scripts/seed_admin.py` rewritten to read `ADMIN_PASSWORD` from environment and fail loudly in production if unset.
  - `backend/Dockerfile` decoupled by removing automatic execution of `seed_admin.py` from `CMD`.
- **2026-10-20 18:50 UTC:** Force push with lease executed (`git push origin main --force-with-lease`).
- **2026-10-20 18:51 UTC:** Remote verification completed: `git log -S` and regex grep for both credentials returned 0 matches across all branches and commits.
- **2026-10-20 18:58 UTC:** Live Render redeploy confirmed green at `https://joblume-ai.onrender.com`.

---

## 4. Root Cause Analysis

1. **Lack of Pre-Commit Secret Screening:** Development began without pre-commit hooks configured to inspect staged files for API tokens or credential assignments.
2. **Configuration Coupling in Docker Startup:** Database seeding was coupled to container boot, causing every container deployment and restart loop to overwrite credentials with hardcoded values.
3. **Improper IaC Secret Ingestion:** `.render.yaml` was configured with raw values instead of dashboard-managed secret references (`sync: false`).

---

## 5. Preventive Controls Implemented

1. **Pre-Commit Security Hooks (`.pre-commit-config.yaml`):**
   - Integrated **Gitleaks** (`v8.24.0`) to scan for private keys, AWS tokens, GitHub PATs, and general secrets.
   - Added custom regex Pygrep hooks targeting LLM tokens (`sk-[o]r-v1-*`), Stripe keys (`sk_live_*`, `sk_test_*`), and credential assignments (`ADMIN_PASSWORD`, `PASSWORD`, `SECRET_KEY`).
2. **Render Secret Isolation:**
   - Secrets are now strictly managed through Render's environment dashboard with `sync: false` in `.render.yaml`.
3. **Decoupled Admin Provisioning:**
   - Admin account creation is converted into an explicit, one-time manual administrative operation (`scripts/seed_admin.py`), preventing automated password resets during deploys.
