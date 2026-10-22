# Phase B.1 Execution Plan: Master Profile Hierarchy & Data Model Refactor (Backend)

**Document Version:** 1.0
**Status:** DRAFT — Ready for User Review
**Target Release:** Phase B.1 (Backend Only)
**Dependencies:** Alembic `0002_phase_a_auth_and_billing`, Sentry error monitoring (PR-5 active)

---

## 1. Objective and Scope

### 1.1 Context
In Phase A, JobLume AI established production-grade authentication, session security, structured logging, error monitoring via Sentry, and database baseline schemas. However, resumes remain stored as monolithic, disconnected documents (`resumes.json_data`). This flat document model forces users to re-enter career data for every new resume, risks silent overwrites during AI tailoring, and lacks an immutable historical audit trail.

### 1.2 Objective
Phase B introduces the PRD-mandated three-tier data hierarchy (§4.2, §4.3, §4.10):
```
        ┌──────────────────────────────────────────────────┐
        │        Master Profile (Source of Truth)          │
        │      Canonical career repository per user        │
        └────────────────────────┬─────────────────────────┘
                                 │
                                 ▼ 1-to-many (views)
        ┌──────────────────────────────────────────────────┐
        │         Resume View (resumes_v2)                 │
        │   Style, template, selection & content overrides │
        └────────────────────────┬─────────────────────────┘
                                 │
                                 ▼ 1-to-many (snapshots)
        ┌──────────────────────────────────────────────────┐
        │      Resume Version (resume_versions)            │
        │    Immutable historical snapshots (AI & manual)  │
        └──────────────────────────────────────────────────┘
```

### 1.3 Scope Boundaries

#### Included in Phase B.1 (Backend Only):
- **Database Schema**: Alembic migration `0003_master_profile_hierarchy` adding `master_profiles`, `resumes_v2`, and `resume_versions` tables with strict constraints, indexes, and UUID keys.
- **Data Migration**: Idempotent migration script converting existing `resumes.json_data` into canonical `master_profiles`, corresponding `resumes_v2` views, and initial baseline `resume_versions` (Version 1).
- **Service Layer**:
  - `MasterProfileService`: CRUD, normalization, JSON validation, item ID minting.
  - `ResumeViewService`: View configuration (section order/visibility/entry selection), content overrides management, and full view resolution engine.
  - `ResumeVersionService`: Snapshot creation, version immutability enforcement, version restoration, and tier-based retention pruning (20 for Free, unlimited for Premium).
- **API Surface**: New `/api/v2/*` router covering Profile, Resumes, Overrides, and Versions.
- **Automated Tests**: Unit and integration test suite asserting data resolution, idempotency, retention rules, and zero regression on legacy `/resume/*` endpoints.

#### Explicitly Deferred (Phase B.2+):
- **Frontend UI Changes**: The Master Profile editor, React multi-view editor, and inline override UI belong to Phase B.2.
- **Serverless PDF Rendering**: Chromium/Puppeteer serverless microservice belongs to Phase B.3.
- **Old Route Deprecation**: `/resume/*` routes remain active and unchanged until the frontend transitions in Phase B.2.

---

## 2. Data Model & Schema (DDL)

All new tables use `UUID` primary keys with PostgreSQL `gen_random_uuid()`. Foreign keys referencing `users(id)` use `VARCHAR(36)` to match the existing `users.id` type in `0001_initial_baseline`.

```sql
-- ====================================================================
-- 1. Master Profiles Table (Canonical Single Source of Truth per User)
-- ====================================================================
CREATE TABLE master_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL,
    personal_info JSONB NOT NULL DEFAULT '{
        "fullName": "",
        "email": "",
        "phone": "",
        "location": "",
        "website": "",
        "linkedin": "",
        "github": "",
        "portfolio": "",
        "photo_url": null
    }'::jsonb,
    summary TEXT NOT NULL DEFAULT '',
    experience JSONB NOT NULL DEFAULT '[]'::jsonb,
    education JSONB NOT NULL DEFAULT '[]'::jsonb,
    projects JSONB NOT NULL DEFAULT '[]'::jsonb,
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    languages JSONB NOT NULL DEFAULT '[]'::jsonb,
    awards JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_master_profiles_user UNIQUE (user_id),
    CONSTRAINT fk_master_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_master_profiles_user_id ON master_profiles(user_id);

-- ====================================================================
-- 2. Resumes Table (Views over Master Profile)
-- ====================================================================
CREATE TABLE resumes_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL,
    master_profile_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled Resume',
    template_id VARCHAR(100) NOT NULL DEFAULT 'modern-professional',
    primary_color VARCHAR(30) NOT NULL DEFAULT '#4F46E5',
    font_family VARCHAR(50) NOT NULL DEFAULT 'Inter',
    section_order JSONB NOT NULL DEFAULT '["personal","summary","experience","education","skills","projects","certifications"]'::jsonb,
    section_visibility JSONB NOT NULL DEFAULT '{
        "personal": true,
        "summary": true,
        "experience": true,
        "education": true,
        "skills": true,
        "projects": true,
        "certifications": true
    }'::jsonb,
    selected_entry_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
    target_job_title VARCHAR(255),
    target_company VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_resumes_v2_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_resumes_v2_master FOREIGN KEY (master_profile_id) REFERENCES master_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_resumes_v2_user_id ON resumes_v2(user_id);
CREATE INDEX idx_resumes_v2_master_id ON resumes_v2(master_profile_id);

-- ====================================================================
-- 3. Resume Versions Table (Immutable Snapshots)
-- ====================================================================
CREATE TABLE resume_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    label VARCHAR(255) NOT NULL DEFAULT 'Manual Save',
    change_source VARCHAR(50) NOT NULL DEFAULT 'manual', -- manual, ai_tailor, ai_refine, migration
    snapshot_data JSONB NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_resume_version_number UNIQUE (resume_id, version_number),
    CONSTRAINT fk_resume_versions_resume FOREIGN KEY (resume_id) REFERENCES resumes_v2(id) ON DELETE CASCADE
);

CREATE INDEX idx_resume_versions_resume_id ON resume_versions(resume_id, version_number DESC);

-- ====================================================================
-- 4. Foreign Key Link on Applications Table (Optional Future Link)
-- ====================================================================
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_version_id UUID;
ALTER TABLE applications ADD CONSTRAINT fk_applications_resume_version
    FOREIGN KEY (resume_version_id) REFERENCES resume_versions(id) ON DELETE SET NULL;
```

---

## 3. Architecture & Core Decisions

### 3.1 Migration Strategy & Conflict Resolution
- **Cardinality**: **One Master Profile per user** (canonical).
- **Multi-Resume Resolution Rule**:
  When a user owns multiple legacy resumes in `resumes`:
  1. Resumes are sorted by `updated_at DESC`.
  2. The most recently updated resume is selected as the **Base Document** for the initial `master_profiles` row.
  3. Older resumes are scanned for unrepresented items:
     - *Experience*: Compared by `(company, title, start_date)`. If an experience item from an older resume is not found in the Base Document, it is appended to `experience`.
     - *Education*: Compared by `(institution, degree)`. If not present, appended to `education`.
     - *Projects / Skills*: Appended if distinct.
  4. Each legacy resume in `resumes` generates one `resumes_v2` row referencing this `master_profiles` record.
  5. Any text variations in older resumes (e.g., customized bullet points for a specific application) are extracted into `content_overrides` for that specific view.
  6. An initial `resume_versions` row (Version 1, `change_source='migration'`) is created for each view, preserving an exact 1:1 frozen snapshot of the legacy resume as it existed before migration.

### 3.2 Master Profile Schema Decisions
- **Personal Info**: Stored in `personal_info` JSONB. Includes `photo_url: Optional[str]` per approved PRD Decision Q3.
- **Section Arrays**: `experience`, `education`, `projects`, `certifications`, `languages`, `awards` are stored as JSONB arrays of objects.
- **Item Identity**: Every item in each section array is required to have a unique string `id` (UUIDv4). If legacy data has items without IDs, the migration script automatically mints UUIDs.
- **Inline Tagging on Bullets**:
  Experience bullets support either plain strings or structured objects:
  ```json
  [
    {
      "id": "b1a2c3d4",
      "text": "Architected low-latency caching layer reducing p99 latency by 45%.",
      "tags": ["performance", "backend", "redis"]
    }
  ]
  ```
  For Phase B.1, tags are stored inline in JSONB (no separate relational join table required).
- **Master Profile Versioning**: Handled via `updated_at TIMESTAMPTZ`. Deep snapshotting of Master Profile itself is deferred; resume-level snapshots in `resume_versions` capture point-in-time states.

### 3.3 Resume View & Content Overrides
A Resume View does not duplicate master data. It stores:
1. `section_order`: Array of section keys defining render order.
2. `section_visibility`: Map of `{ section_key: boolean }` controlling whether sections appear.
3. `selected_entry_ids`: Map of `{ section_key: string[] }` controlling which specific entries from Master are included in this view.
4. `content_overrides`: Structured map keyed by `master_entry_id`:

#### Concrete Example of `content_overrides`:
```json
{
  "exp-uuid-101": {
    "title": "Staff Backend Platform Engineer",
    "bullets": {
      "0": "Architected high-throughput message bus handling 250k events/sec across 14 microservices.",
      "2": "Led cloud migration cutting annual infrastructure spend by $120,000."
    }
  },
  "summary": "Platform-focused Staff Engineer with 8+ years specializing in distributed systems and real-time streaming architectures."
}
```

### 3.4 Resume Version Snapshot & Retention
- **Snapshot Contents**: A self-contained, fully resolved JSON document. It combines Master Profile data + selected entry IDs + content overrides + template styling (`primary_color`, `font_family`, `template_id`). It can be rendered or exported years later with zero dependencies on subsequent edits to the Master Profile.
- **Storage**: JSONB column in `resume_versions.snapshot_data`.
- **Retention Policy**:
  - **Free Tier**: Maximum 20 versions per resume view. On saving version $N > 20$, the oldest non-baseline versions are automatically pruned.
  - **Premium Tier**: Unlimited versions.

---

## 4. API Surface (`/api/v2/*`)

All endpoints require JWT authentication (`get_current_user`).

| Method | Endpoint | Description | Request Body | Response Body |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v2/profile` | Fetch user's Master Profile | None | `MasterProfileResponse` |
| `PUT` | `/api/v2/profile` | Update user's Master Profile | `MasterProfileUpdateRequest` | `MasterProfileResponse` |
| `GET` | `/api/v2/resumes` | List all Resume Views for user | None | `list[ResumeViewSummaryResponse]` |
| `POST` | `/api/v2/resumes` | Create new Resume View from Master | `ResumeViewCreateRequest` | `ResumeViewDetailResponse` |
| `GET` | `/api/v2/resumes/{id}` | Get resolved Resume View (Master + overrides) | None | `ResumeViewDetailResponse` |
| `PUT` | `/api/v2/resumes/{id}` | Update styling, section order, visibility | `ResumeViewUpdateRequest` | `ResumeViewDetailResponse` |
| `PUT` | `/api/v2/resumes/{id}/overrides` | Update tailored content overrides | `ContentOverridesUpdateRequest` | `ResumeViewDetailResponse` |
| `DELETE` | `/api/v2/resumes/{id}` | Delete a Resume View and its versions | None | `{"message": "Resume view deleted"}` |
| `GET` | `/api/v2/resumes/{id}/versions` | List historical versions of resume | None | `list[ResumeVersionSummaryResponse]` |
| `POST` | `/api/v2/resumes/{id}/versions` | Create immutable snapshot | `ResumeVersionCreateRequest` | `ResumeVersionDetailResponse` |
| `POST` | `/api/v2/resumes/{id}/versions/{vid}/restore` | Restore view overrides from snapshot | None | `ResumeViewDetailResponse` |

### 4.1 Schema Definitions (Pydantic v2)

#### `MasterProfileResponse`
```python
class MasterProfileResponse(BaseModel):
    id: UUID
    user_id: str
    personal_info: PersonalInfoSchema
    summary: str
    experience: list[ExperienceItemSchema]
    education: list[EducationItemSchema]
    projects: list[ProjectItemSchema]
    skills: list[str | SkillItemSchema]
    certifications: list[CertificationItemSchema]
    languages: list[LanguageItemSchema]
    awards: list[AwardItemSchema]
    custom_sections: list[CustomSectionSchema]
    created_at: datetime
    updated_at: datetime
```

#### `ResumeViewDetailResponse`
```python
class ResumeViewDetailResponse(BaseModel):
    id: UUID
    user_id: str
    master_profile_id: UUID
    title: str
    template_id: str
    primary_color: str
    font_family: str
    section_order: list[str]
    section_visibility: dict[str, bool]
    selected_entry_ids: dict[str, list[str]]
    content_overrides: dict[str, Any]
    target_job_title: Optional[str]
    target_company: Optional[str]
    resolved_data: ResolvedResumeDataSchema  # Fully resolved view ready for rendering
    created_at: datetime
    updated_at: datetime
```

---

## 5. Service Layer Design

### 5.1 `MasterProfileService`
- **Location**: `backend/app/services/master_profile_service.py`
- **Responsibilities**:
  - `get_or_create_profile(user_id: str) -> MasterProfile`: Fetches the user's canonical profile or initializes an empty template.
  - `update_profile(user_id: str, data: MasterProfileUpdateRequest) -> MasterProfile`: Validates schema, ensures all array items possess persistent UUID strings, and updates `updated_at`.
  - `normalize_item_ids(data: dict) -> dict`: Ensures all incoming entries have IDs minted if missing.

### 5.2 `ResumeViewService`
- **Location**: `backend/app/services/resume_view_service.py`
- **Responsibilities**:
  - `create_view(user_id: str, req: ResumeViewCreateRequest) -> ResumeV2`: Initializes a new view referencing the user's `master_profile_id`.
  - `update_view_config(view_id: UUID, req: ResumeViewUpdateRequest) -> ResumeV2`: Updates template, colors, typography, section ordering, and entry selections.
  - `apply_overrides(view_id: UUID, overrides: dict) -> ResumeV2`: Merges or updates `content_overrides`.
  - `resolve_view_data(view: ResumeV2, master: MasterProfile) -> dict`: **The Resolution Engine**.
    1. Filters sections by `section_visibility`.
    2. Sorts sections by `section_order`.
    3. Filters items within each section based on `selected_entry_ids` (if empty, defaults to all items).
    4. Merges `content_overrides` on top of matching item IDs and global fields (e.g., tailored summary).
    5. Returns unified `resolved_data` matching the standard resume render contract.

### 5.3 `ResumeVersionService`
- **Location**: `backend/app/services/resume_version_service.py`
- **Responsibilities**:
  - `create_snapshot(view_id: UUID, user: User, label: str, source: str, note: Optional[str]) -> ResumeVersion`:
    1. Resolves view data via `ResumeViewService`.
    2. Calculates next `version_number` via `SELECT COALESCE(MAX(version_number), 0) + 1 FROM resume_versions WHERE resume_id = :view_id`.
    3. Stores resolved data as `snapshot_data`.
    4. Checks user subscription tier (`free` vs `premium`). If `free` and total versions exceed 20, deletes oldest versions where `version_number > 1`.
  - `restore_version(view_id: UUID, version_id: UUID) -> ResumeV2`: Reads `snapshot_data` and restores matching overrides and view settings into `resumes_v2`.

---

## 6. Migration Sequence & Zero-Downtime Deployment

```
Step 1: Deploy Migration 0003
        Create master_profiles, resumes_v2, resume_versions
        (Non-blocking DDL: no locks on legacy resumes table)
                   │
                   ▼
Step 2: Run Data Migration Script
        Idempotent background script converts resumes.json_data
        → master_profiles + resumes_v2 + version_1 snapshots
                   │
                   ▼
Step 3: Deploy Backend /api/v2/* Router
        New endpoints live; legacy /resume/* endpoints completely untouched
                   │
                   ▼
Step 4: Run Verification & Parity Checks
        Assert 100% data integrity on Staging & Production
```

### 6.1 Failure Modes & Mitigations
1. **DDL Failure during Step 1**:
   - *Risk*: Index collision or invalid constraint.
   - *Mitigation*: Migration uses standard PostgreSQL DDL executed within Alembic transactional block. If it fails, transaction rolls back automatically with zero impact on live traffic.
2. **Data Parsing Failure during Step 2**:
   - *Risk*: Corrupted JSON in an old legacy resume row crashes migration script.
   - *Mitigation*: Script processes users individually in `try...except` blocks with structured Sentry logging. Fallback parsers handle malformed fields gracefully. Script is 100% idempotent (`ON CONFLICT DO NOTHING`).
3. **Dual-Write Concurrency**:
   - During Phase B.1, existing frontend users continue writing to `/resume/*`. The legacy table remains the active system for the current frontend until Phase B.2. A delta-sync capability will be included in the migration script to sync any new legacy resumes created prior to Phase B.2 cutover.

---

## 7. Backward Compatibility Contract

- **Legacy Route Preservation**: All routes under `/resume/*` (`/resume/create`, `/resume/list`, `/resume/{id}`, `/resume/{id}/export/*`) remain 100% operational, reading and writing to the `resumes` table.
- **ATS Scorer & AI Tailoring**: [ats_scorer.py](file:///e:/AKiB's%20Project%20Book/Joblume-AI/backend/app/services/ats_scorer.py) and [ai_service.py](file:///e:/AKiB's%20Project%20Book/Joblume-AI/backend/app/services/ai_service.py) accept standard dictionary structures. The `resolve_view_data()` output matches the exact dictionary shape required by these services.
- **No Schema Mutations on Legacy Tables**: The legacy `resumes` table is not altered, renamed, or dropped in Phase B.1.

---

## 8. Rollback Plan

If unrecoverable defects appear post-deployment:
1. **Safe Rollback**:
   Execute `alembic downgrade -1` (or to `0002_phase_a_auth_and_billing`).
2. **Impact Analysis**:
   - Drops `resume_versions`, `resumes_v2`, and `master_profiles`.
   - The legacy `resumes` table is completely untouched.
   - Live frontend users experience **zero downtime or data loss**, because the legacy frontend and backend routes never relied on the new tables.
3. **Data Safety**:
   Before running Step 2 in production, take an explicit Neon snapshot / `pg_dump` of the `resumes` table.

---

## 9. Test Plan

To prove Phase B.1 is complete and correct:
1. **Migration Parity Test**:
   - Run data migration script against database with representative legacy resumes.
   - Verify every legacy resume generates a valid `master_profiles` record and `resumes_v2` view.
   - Re-running the script produces identical counts (`assert rows_added == 0`).
2. **Resolution Engine Unit Tests**:
   - Test merging of Master Profile + `selected_entry_ids` + `content_overrides`.
   - Verify section re-ordering and visibility hiding.
   - Verify that modifying a Master Profile field automatically cascades to views that do not override that field.
   - Verify that overriding an entry bullet in a view protects that bullet from being overwritten by Master changes.
3. **Version Snapshot & Retention Tests**:
   - Assert `resume_versions` snapshot is immutable when Master Profile subsequently changes.
   - Assert Free tier user cannot exceed 20 versions (oldest non-baseline version pruned).
   - Assert Premium tier user has unlimited version retention.
4. **Endpoint Integration Tests**:
   - Full CRUD cycle for `/api/v2/profile`.
   - Full CRUD cycle for `/api/v2/resumes` and `/api/v2/resumes/{id}/overrides`.
   - Snapshot creation and restoration via `/api/v2/resumes/{id}/versions`.
5. **Legacy Regression Test**:
   - Run existing test suite (`pytest backend/tests`). All legacy `/resume/*` tests must pass with 100% success.

---

## 10. Open Questions for User Alignment

Before commencing implementation in Session 22, please confirm alignment on the following:

1. **Tag Schema on Bullets**:
   Confirm whether storing tags inline in JSONB (e.g. `{"text": "...", "tags": ["leadership"]}`) is acceptable for B.1, deferring relational tag indexing to a later phase. *(Recommended: Yes)*
2. **Master Profile Conflict Resolution**:
   Confirm that when multiple legacy resumes exist for one user, taking the most recent resume as canonical and appending non-duplicate items from older resumes is the desired default. *(Recommended: Yes)*
3. **Retention Limit Pruning Policy**:
   Confirm that when a Free user exceeds 20 versions, pruning oldest versions (excluding Version 1 baseline) without throwing a blocking error is preferred. *(Recommended: Yes)*
