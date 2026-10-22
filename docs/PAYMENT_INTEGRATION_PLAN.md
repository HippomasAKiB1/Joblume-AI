# Payment Integration Plan & Architecture Decisions

## Status
Payment integration DEFERRED. The Phase A migration already created `subscriptions` + `credit_transactions` tables (in `0002_phase_a_auth_and_billing.py`) — do not remove them. The billing endpoints, Stripe SDK, and webhook handler are NOT implemented yet.

## Critical Constraint — Stripe Unavailable in Bangladesh
Stripe does not support merchants registered in Bangladesh. This rules out the plan's original Stripe assumption. Do not implement Stripe unless the user relocates or forms a US/UK/EU entity.

## Chosen Architecture — Dual Path

### International Customers (Global SaaS Revenue)
Use a Merchant of Record (MoR) platform:
- **Primary:** Paddle (explicitly supports Bangladesh sole proprietorships, handles global VAT/GST, no foreign entity required)
- **Alternative:** Dodo Payments (targets founders outside US/EU)
- **Alternatives:** Polar, Creem (no-company onboarding)

MoR handles payment processing, tax compliance, fraud, and payouts.
**Integration point:** MoR-hosted checkout redirect + webhook handler.

### Domestic Customers (Bangladesh, BDT)
Use a local payment aggregator:
- **Primary:** SSLCommerz (single integration covers bKash, Nagad, Rocket, DBBL Nexus, cards; industry standard for BD SaaS)
- **Alternative:** naafipay SDK (unified subscription support for bKash/Nagad/cards)
- **Fallback:** Direct DBBL Nexus Gateway integration only if SSLCommerz coverage is insufficient

**Integration point:** Local checkout redirect + IPN/webhook handler.

## Existing Schema (from PR-2 migration 0002)
Both tables already exist in Neon (both Main and Staging branches). Do not re-migrate.

### `subscriptions` Table
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'free',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    stripe_customer_id VARCHAR(255) NULL,       -- NOTE: rename to provider_customer_id when MoR is chosen
    stripe_subscription_id VARCHAR(255) NULL,   -- NOTE: rename to provider_subscription_id when MoR is chosen
    ai_credits_balance INTEGER NOT NULL DEFAULT 20,
    current_period_end TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_subscriptions_user UNIQUE(user_id)
);
```

### `credit_transactions` Table (Append-Only Ledger)
```sql
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
```

## Tier Naming
Code and DB use `premium` as the paid tier value — NOT `pro`. Keep it.
When MoR price IDs are created, map them to internal tier `premium`.

## Pending Renames (do when implementing)
- `subscriptions.stripe_customer_id` → `provider_customer_id` (or add a new column, keep old one deprecated)
- `subscriptions.stripe_subscription_id` → `provider_subscription_id`
- All code that references "stripe" internally → "billing_provider"

## Implementation When Resumed (Phase E or later)
1. **Choose MoR Provider:** Paddle recommended for Bangladesh sole proprietorships.
2. **Catalog Setup:** Create products + prices in MoR dashboard.
3. **Checkout Session:** Implement `POST /billing/checkout-session` (MoR-hosted redirect).
4. **Webhook Processing:** Implement `POST /billing/webhook` (signature verification; handle `checkout.completed`, `subscription.renewed`, `subscription.cancelled`).
5. **Ledger Service:** Implement `CreditLedgerService` (already designed in PRD): atomic `SELECT FOR UPDATE` + `INSERT` transaction record + `UPDATE` balance.
6. **Customer Portal:** Implement `POST /billing/portal-session` (MoR customer portal).
7. **Domestic Path:** Parallel `/billing/checkout-domestic` endpoint using SSLCommerz; both paths write to the same `credit_transactions` ledger.
8. **Grandfathering:** Existing `subscription_tier='premium'` users → 12 months complimentary Pro (per PRD Q6 decision).
9. **Environment Gating:** Until MoR KYC is approved, implement in **TEST MODE ONLY**.
10. **Reconciliation Cron:** Add `/billing/reconcile` cron — daily poll of MoR subscription statuses to detect drift.

## Removed from Original Plan
The Phase A PR-4 scope ("Stripe Checkout/Portal/webhooks") is replaced by "MoR integration" above. Stripe references in PRD and `PRD_Adaptation_Plan_v1.md` should be updated to "MoR provider" — but this is documentation debt, low priority.

## Cost Notes (from plan §9)
MoR fees (Paddle ~5% + $0.50, Dodo ~4% + variable) are higher than Stripe's 2.9% + $0.30. Revise unit economics when implementing.
Current plan's "$2.30 COGS per Pro user" assumed Stripe pricing; with MoR it is ~$2.75 per $12 subscription (77% margin vs 80.8% assumed).
